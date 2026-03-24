import serial
import pandas as pd

# ⚠️ CHANGE COM PORT IF NEEDED
ser = serial.Serial('COM7', 115200, timeout=1)

data = []

print("📡 Collecting data... Press Ctrl+C to stop")

try:
    while True:
        line = ser.readline().decode('utf-8').strip()

        if line:
            print(line)  # DEBUG: see live data

            values = line.split(',')

            if len(values) == 3:
                try:
                    x = float(values[0])
                    y = float(values[1])
                    z = float(values[2])

                    data.append([x, y, z])
                except:
                    pass

except KeyboardInterrupt:
    print("\n🛑 Stopping collection...")

# Save to CSV
df = pd.DataFrame(data, columns=["ax", "ay", "az"])
df.to_csv("baseline_data.csv", index=False)

print(f"✅ Saved {len(data)} samples to baseline_data.csv")