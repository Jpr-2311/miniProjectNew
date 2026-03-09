import React, { useEffect, useState } from "react";
import "./Worker.css";

function Worker() {
  const [error, setError] = useState(0.18);
  const threshold = 0.26;

  useEffect(() => {
    const interval = setInterval(() => {
      const random = Math.random() * 0.4;
      setError(random);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const status =
    error > threshold ? "danger" :
    error > threshold * 0.8 ? "warning" :
    "safe";

  return (
    <div className="worker-wrapper">

      <div className={`status-bar ${status}`}>
        <span>{status === "safe" ? "SAFE" :
               status === "warning" ? "WARNING" : "ANOMALY"}</span>
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