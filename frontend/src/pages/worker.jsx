import React, { useEffect, useState, useRef } from "react";
import "./Worker.css";
import alarmSound from "../assets/alarm.mp3";

function Worker() {
  const [error, setError] = useState(0);
  const [xyz, setXyz] = useState({ x: 0, y: 0, z: 0 });
  const [location, setLocation] = useState("Unknown");

  const threshold = 0.26;

  const audioRef = useRef(null);
  const lastPlayedRef = useRef(0);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("http://localhost:5000/api/sensor");
      const data = await res.json();

      setError(data.error);
      setXyz(data.xyz);
      setLocation(data.location);

      // 🔊 BUZZER
      if (data.buzzer) {
        const now = Date.now();
        if (now - lastPlayedRef.current > 3000) {
          audioRef.current.play().catch(()=>{});
          lastPlayedRef.current = now;
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  const status =
    error > threshold ? "danger" :
    error > threshold * 0.8 ? "warning" :
    "safe";

  return (
    <div className="worker-wrapper">

      <audio ref={audioRef} src={alarmSound} />

      <div className={`status-bar ${status}`}>
        {status.toUpperCase()}
      </div>

      <div className="metrics-row">
        <div className="metric-card">
          <h4>Error</h4>
          <p>{error.toFixed(3)}</p>
        </div>

        <div className="metric-card">
          <h4>Threshold</h4>
          <p>{threshold}</p>
        </div>

        <div className="metric-card">
          <h4>Location</h4>
          <p>{location}</p>
        </div>
      </div>

      <div className="metrics-row">
        <div className="metric-card">
          <h4>X</h4>
          <p>{xyz.x.toFixed(3)}</p>
        </div>
        <div className="metric-card">
          <h4>Y</h4>
          <p>{xyz.y.toFixed(3)}</p>
        </div>
        <div className="metric-card">
          <h4>Z</h4>
          <p>{xyz.z.toFixed(3)}</p>
        </div>
      </div>

    </div>
  );
}

export default Worker;