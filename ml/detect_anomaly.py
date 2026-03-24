import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from tensorflow.keras.models import load_model

# Load model
model = load_model("autoencoder_model.h5", compile=False)

# Load normalization
mean = np.load("mean.npy")
std = np.load("std.npy")

# Load data
df = pd.read_csv("baseline_data.csv")

if df.empty:
    print("❌ CSV empty")
    exit()

data = df.values

window_size = 100
windows = []

for i in range(len(data) - window_size):
    windows.append(data[i:i+window_size])

windows = np.array(windows)

# Normalize
windows_norm = (windows - mean) / std

# Flatten
windows_flat = windows_norm.reshape((windows_norm.shape[0], window_size * 3))

# Predict
reconstructions = model.predict(windows_flat)

# Compute MSE
mse = np.mean((windows_flat - reconstructions) ** 2, axis=1)

# Threshold
threshold = 0.26

print("📊 Avg Error:", np.mean(mse))
print("📊 Max Error:", np.max(mse))

# Plot
plt.figure(figsize=(10,5))
plt.plot(mse, label="Error")
plt.axhline(y=threshold, color='r', linestyle='--', label="Threshold")
plt.legend()
plt.title("Reconstruction Error")
plt.show()