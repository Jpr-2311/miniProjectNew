import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
} from "chart.js";
import "./Supervisor.css";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

function Supervisor() {
  const [dataPoints, setDataPoints] = useState([]);
  const [avg, setAvg] = useState(0);
  const [max, setMax] = useState(0);
  const [anomalies, setAnomalies] = useState(0);
  const threshold = 0.26;

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("http://localhost:5000/api/analytics");
      const data = await res.json();

      setDataPoints(data.history);
      setAvg(data.avg);
      setMax(data.max);
      setAnomalies(data.anomalies);
    };

    fetchData();
    const interval = setInterval(fetchData, 1500);
    return () => clearInterval(interval);
  }, []);

  const data = {
    labels: dataPoints.map((_, i) => i),
    datasets: [
      {
        label: "Error",
        data: dataPoints,
        borderColor: "#3b82f6",
        tension: 0.4
      },
      {
        label: "Threshold",
        data: new Array(dataPoints.length).fill(threshold),
        borderColor: "#ef4444",
        borderDash: [6, 6]
      }
    ]
  };

  return (
    <div className="supervisor-wrapper">
      <h2>Reconstruction Error Analysis</h2>

      <div className="stats-row">
        <div className="stat-card"><p>Avg</p><h3>{avg.toFixed(3)}</h3></div>
        <div className="stat-card"><p>Max</p><h3>{max.toFixed(3)}</h3></div>
        <div className="stat-card"><p>Anomalies</p><h3>{anomalies}</h3></div>
      </div>

      <div className="chart-card">
        <Line data={data} />
      </div>
    </div>
  );
}

export default Supervisor;