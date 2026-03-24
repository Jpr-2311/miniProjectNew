from flask import Flask, jsonify
from flask_cors import CORS
import serial
import numpy as np
from tensorflow.keras.models import load_model

app = Flask(__name__)
CORS(app)

# ===== LOAD MODEL =====
model = load_model("autoencoder_model.h5", compile=False)
mean = np.load("mean.npy")
std = np.load("std.npy")

# ===== SERIAL =====
ser = serial.Serial('COM7', 115200, timeout=1)

THRESHOLD = 0.26
window_size = 100

buffer = []
history = []

# ===== FUNCTION =====
def get_window():
    while len(buffer) < window_size:
        line = ser.readline().decode().strip()
        values = line.split(',')

        if len(values) == 3:
            try:
                x = float(values[0])
                y = float(values[1])
                z = float(values[2])
                buffer.append([x, y, z])
            except:
                pass

    window = np.array(buffer[-window_size:])
    return window

# ===== SENSOR API =====
@app.route("/api/sensor")
def sensor():
    window = get_window()

    # Normalize
    window_norm = (window - mean) / std
    window_flat = window_norm.reshape(1, window_size * 3)

    # Predict
    recon = model.predict(window_flat, verbose=0)
    mse = np.mean((window_flat - recon) ** 2)

    # Save history
    history.append(float(mse))
    if len(history) > 50:
        history.pop(0)

    status = (
        "danger" if mse > THRESHOLD else
        "warning" if mse > THRESHOLD * 0.8 else
        "safe"
    )

    # 📍 LOCATION (SIMPLE LOGIC)
    location = "Center"
    if abs(window[-1][0]) > 0.5:
        location = "Left Side"
    elif abs(window[-1][1]) > 0.5:
        location = "Right Side"

    return jsonify({
        "error": round(float(mse), 3),
        "threshold": THRESHOLD,
        "status": status,
        "xyz": {
            "x": window[-1][0],
            "y": window[-1][1],
            "z": window[-1][2]
        },
        "location": location,
        "buzzer": mse > THRESHOLD
    })

# ===== ANALYTICS API =====
@app.route("/api/analytics")
def analytics():
    avg = np.mean(history) if history else 0
    mx = np.max(history) if history else 0
    anomalies = sum(1 for v in history if v > THRESHOLD)

    return jsonify({
        "history": history,
        "avg": avg,
        "max": mx,
        "anomalies": anomalies,
        "threshold": THRESHOLD
    })

# ===== BUZZER API FOR ESP32 =====
@app.route("/api/alert")
def alert():
    if history and history[-1] > THRESHOLD:
        return "true"
    return "false"

# ===== RUN =====
if __name__ == "__main__":
    print("🚀 LIVE EDGE AI SERVER RUNNING")
    app.run(debug=True)