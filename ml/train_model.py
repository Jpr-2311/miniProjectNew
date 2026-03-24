import pandas as pd
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense

# Load data
df = pd.read_csv("baseline_data.csv")

if df.empty:
    print("❌ ERROR: CSV is empty!")
    exit()

data = df.values

# Window size
window_size = 100
windows = []

# Create windows
for i in range(len(data) - window_size):
    windows.append(data[i:i+window_size])

windows = np.array(windows)

print("📊 Window shape:", windows.shape)

# Compute normalization (IMPORTANT)
mean = windows.mean()
std = windows.std()

# Save normalization values
np.save("mean.npy", mean)
np.save("std.npy", std)

# Normalize
windows = (windows - mean) / std

# Flatten
windows = windows.reshape((windows.shape[0], window_size * 3))

# Build model
model = Sequential([
    Dense(128, activation='relu', input_shape=(window_size * 3,)),
    Dense(64, activation='relu'),
    Dense(128, activation='relu'),
    Dense(window_size * 3)
])

model.compile(optimizer='adam', loss='mse')

# Train
model.fit(
    windows, windows,
    epochs=10,
    batch_size=32,
    validation_split=0.1
)

# Save model
model.save("autoencoder_model.h5")

print("✅ Training Complete")