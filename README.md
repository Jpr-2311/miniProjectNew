# Edge Vibration Anomaly Detection

Real-time vibration monitoring with an ESP32, an MPU6050 accelerometer and an autoencoder.
The device streams 3-axis acceleration, a Python service scores each window by reconstruction error, and two
dashboards show live status. When a window is anomalous, the dashboard plays an alarm and the device's buzzer sounds.

Semester 6 mini project by Jithin P R, with dashboard contributions from JoanneKoshy.

## How it works

```text
MPU6050 ──I²C──> ESP32 ──USB serial (ax,ay,az at ~50 Hz)──> Flask service ──> React dashboards
                   ^                                          │  autoencoder (Keras)
                   └──────── HTTP GET /api/alert ─────────────┘  buzzer on/off
```

1. **Collect a baseline.** `ml/save_data.py` reads normal-operation samples from the serial port into `baseline_data.csv`.
2. **Train.** `ml/train_model.py` cuts the baseline into 100-sample windows, normalizes them and trains a dense
   autoencoder (300 → 128 → 64 → 128 → 300). It saves `autoencoder_model.h5`, `mean.npy` and `std.npy`.
3. **Detect.** `backend/server.py` reads the live stream, reconstructs each window and computes the mean squared error.
   Above the threshold (`0.26`) the status is `danger`; above 80 % of it, `warning`.
4. **Alert.** The worker dashboard polls `/api/sensor` every second and plays an alarm on danger. The supervisor
   dashboard polls `/api/analytics` for the error history. The ESP32 polls `/api/alert` and drives its buzzer.

## Tech stack

| Part | Tools |
| --- | --- |
| Device | ESP32, MPU6050, Arduino (C++), `MPU6050`, `WiFi`, `HTTPClient` |
| Model | Python, TensorFlow / Keras, NumPy, pandas |
| Service | Flask, Flask-CORS, pySerial |
| Dashboards | React 19, Vite, Chart.js, Recharts |

## Repository layout

```text
mini_esp32/mini_esp32.ino   ESP32 firmware: sensor read, serial output, buzzer control
mini_esp32/secrets.example.h  template for the git-ignored secrets.h (Wi-Fi, server URL)
ml/                         baseline collection, training, offline detection
backend/server.py           Flask service: /api/sensor, /api/analytics, /api/alert
backend/*.h5, *.npy         trained model and normalization values
frontend/                   React dashboards (worker and supervisor views)
```

## Run it

### 1. Firmware
Copy `mini_esp32/secrets.example.h` to `mini_esp32/secrets.h` and set your Wi-Fi name, password and the server
address there. `secrets.h` is git-ignored; never commit it.
Then open `mini_esp32/mini_esp32.ino` in the Arduino IDE with ESP32 board support and the `MPU6050` library, and flash it.
Wiring: MPU6050 SDA → GPIO 21, SCL → GPIO 22; buzzer → GPIO 23.

### 2. Python service
```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install flask flask-cors pyserial numpy pandas tensorflow
```
Set the serial port in `backend/server.py` (default `COM7`), then start the service from `backend/`:
```bash
python server.py                   # http://localhost:5000
```
For the ESP32 to reach `/api/alert`, the service must listen on an address on the same network, for example
`flask --app server run --host 0.0.0.0 --port 5000`.

### 3. Dashboards
```bash
cd frontend
npm install
npm run dev
```

### Retrain on your own baseline
From `ml/`, set the serial port in `save_data.py`, record normal operation, then:
```bash
python train_model.py
```
Copy the new `autoencoder_model.h5`, `mean.npy` and `std.npy` into `backend/`.

## API

| Endpoint | Returns |
| --- | --- |
| `GET /api/sensor` | Latest window's reconstruction error, status (`safe` / `warning` / `danger`), threshold, buzzer flag |
| `GET /api/analytics` | Error history (last 50), average, maximum, anomaly count, threshold |
| `GET /api/alert` | `true` or `false`, for the ESP32 buzzer |

## Known limits

- The serial port, threshold and dashboard URLs (`http://localhost:5000`) are hard-coded.
- The service reads the sensor inside the request, so each dashboard poll blocks until a full window is available.
