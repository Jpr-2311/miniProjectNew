from flask import Flask, jsonify
from flask_cors import CORS
import math
import time
import random

app = Flask(__name__)
CORS(app)  # Allow requests from React dev server

# ─── Simulation State Machine ────────────────────────────────────────────────
# Phases: safe → buildup → anomaly → recovery → safe ...
# This mimics how a real autoencoder would see vibration anomalies on a brick prototype

THRESHOLD = 0.26

state = {
    "phase": "safe",
    "ticks_left": random.randint(12, 20),
    "error": 0.13,
    "history": [],        # last 50 readings
    "anomaly_count": 0,
}

PHASE_NEXT = {
    "safe":     "buildup",
    "buildup":  "anomaly",
    "anomaly":  "recovery",
    "recovery": "safe",
}

PHASE_DURATION = {
    "safe":     (12, 20),
    "buildup":  (6, 10),
    "anomaly":  (5, 9),
    "recovery": (6, 10),
}


def next_error(prev, phase):
    """Generate next reconstruction error value based on current phase."""
    if phase == "safe":
        # Normal: tight cluster well below threshold
        val = prev + (random.random() - 0.5) * 0.04 + (0.13 - prev) * 0.1
        return max(0.05, val)
    elif phase == "buildup":
        # Gradually creeping up — like a developing structural crack
        val = prev + random.random() * 0.025 + 0.008
        return min(0.38, val)
    elif phase == "anomaly":
        # Volatile, high reconstruction error — model can't explain this signal
        return 0.28 + random.random() * 0.18 + math.sin(time.time() * 3) * 0.04
    elif phase == "recovery":
        # Settling back down after anomaly resolved
        val = prev - random.random() * 0.03 - 0.01
        return max(0.08, val)
    return prev


def xyz_for_phase(phase):
    """Simulate raw ADXL345 accelerometer X/Y/Z readings."""
    amp = 0.8 if phase == "anomaly" else 0.35 if phase == "buildup" else 0.12
    t = time.time()
    return {
        "x": round(math.sin(t / 0.18) * amp + (random.random() - 0.5) * 0.1, 3),
        "y": round(math.cos(t / 0.22) * amp + (random.random() - 0.5) * 0.1, 3),
        "z": round(math.sin(t / 0.15) * amp * 0.6 + (random.random() - 0.5) * 0.08, 3),
    }


def tick():
    """Advance simulation by one step."""
    s = state

    # Phase transition
    s["ticks_left"] -= 1
    if s["ticks_left"] <= 0:
        next_phase = PHASE_NEXT[s["phase"]]
        s["phase"] = next_phase
        lo, hi = PHASE_DURATION[next_phase]
        s["ticks_left"] = random.randint(lo, hi)

    # New error value
    s["error"] = next_error(s["error"], s["phase"])

    # Track anomaly count
    if s["error"] > THRESHOLD:
        s["anomaly_count"] += 1

    # Rolling history (last 50)
    s["history"].append(round(s["error"], 4))
    if len(s["history"]) > 50:
        s["history"].pop(0)


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.route("/api/sensor", methods=["GET"])
def get_sensor():
    """
    Worker dashboard polls this every 1.5s.
    Returns current error, status, phase, and raw XYZ.
    """
    tick()

    error = state["error"]
    status = (
        "danger"  if error > THRESHOLD else
        "warning" if error > THRESHOLD * 0.85 else
        "safe"
    )

    return jsonify({
        "error":     round(error, 3),
        "threshold": THRESHOLD,
        "status":    status,
        "phase":     state["phase"],
        "xyz":       xyz_for_phase(state["phase"]),
    })


@app.route("/api/analytics", methods=["GET"])
def get_analytics():
    """
    Supervisor dashboard polls this every 1.5s.
    Returns history + stats for the chart and summary cards.
    """
    history = state["history"]
    avg = round(sum(history) / len(history), 3) if history else 0
    maximum = round(max(history), 3) if history else 0
    anomalies = sum(1 for v in history if v > THRESHOLD)

    return jsonify({
        "history":   history,
        "avg":       avg,
        "max":       maximum,
        "anomalies": anomalies,
        "threshold": THRESHOLD,
        "phase":     state["phase"],
        "latest":    round(state["error"], 3),
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


# ─── Run ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("🚀 Edge AI Structural Monitoring — Simulation Server")
    print(f"   Threshold: {THRESHOLD}")
    print("   Endpoints: /api/sensor  |  /api/analytics  |  /api/health")
    app.run(debug=True, port=5000)