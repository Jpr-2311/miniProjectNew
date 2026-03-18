import React, { useEffect, useState } from "react";
import "./Worker.css";

function Worker() {
  const [error, setError] = useState(0.18);
  const [xyz, setXyz] = useState({ x: 0, y: 0, z: 0 });
  const threshold = 0.26;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/sensor");
        const data = await res.json();
        setError(data.error);
        setXyz(data.xyz);
      } catch (err) {
        console.error("Could not reach backend:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1500);
    return () => clearInterval(interval);
  }, []);

  const status =
    error > threshold       ? "danger"  :
    error > threshold * 0.8 ? "warning" :
                              "safe";

  return (
    <div className="worker-wrapper">

      <div className={`status-bar ${status}`}>
        <span>
          {status === "safe"    ? "SAFE"             :
           status === "warning" ? "WARNING"          :
                                  "ANOMALY DETECTED"}
        </span>
      </div>

      <div className="metrics-row">
        <div className="metric-card">
          <h4>Current Error</h4>
          <p>{error.toFixed(3)}</p>
        </div>

        <div className="metric-card">
          <h4>Threshold</h4>
          <p>{threshold}</p>
        </div>

        <div className="metric-card live">
          <h4>Status</h4>
          <p><span className="live-dot"></span> Live</p>
        </div>
      </div>

      {/* Raw accelerometer readings from ESP32 */}
      <div className="metrics-row">
        <div className="metric-card">
          <h4>Accel X (g)</h4>
          <p>{xyz.x?.toFixed(3)}</p>
        </div>
        <div className="metric-card">
          <h4>Accel Y (g)</h4>
          <p>{xyz.y?.toFixed(3)}</p>
        </div>
        <div className="metric-card">
          <h4>Accel Z (g)</h4>
          <p>{xyz.z?.toFixed(3)}</p>
        </div>
      </div>

      <div className="health-card">
        <h4>System Health</h4>
        <p>Sensor: Connected</p>
        <p>Edge Device: Active</p>
        <p>Last Sync: Real-Time</p>
      </div>

    </div>
  );
}

export default Worker;