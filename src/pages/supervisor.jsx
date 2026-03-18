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
  const [avg, setAvg]               = useState(0);
  const [max, setMax]               = useState(0);
  const [anomalies, setAnomalies]   = useState(0);
  const threshold = 0.26;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res  = await fetch("http://localhost:5000/api/analytics");
        const data = await res.json();
        setDataPoints(data.history);
        setAvg(data.avg);
        setMax(data.max);
        setAnomalies(data.anomalies);
      } catch (err) {
        console.error("Could not reach backend:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1500);
    return () => clearInterval(interval);
  }, []);

  const data = {
    labels: dataPoints.map((_, i) => i),
    datasets: [
      {
        label: "Reconstruction Error",
        data: dataPoints,
        borderColor: "#3b82f6",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: dataPoints.map(v => (v > threshold ? 4 : 0)),
        pointBackgroundColor: dataPoints.map(v =>
          v > threshold ? "#ef4444" : "transparent"
        )
      },
      {
        label: "Threshold",
        data: new Array(dataPoints.length).fill(threshold),
        borderColor: "#ef4444",
        borderDash: [6, 6],
        pointRadius: 0
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#cbd5e1" } }
    },
    scales: {
      x: {
        ticks: { color: "#64748b" },
        grid:  { color: "rgba(255,255,255,0.05)" }
      },
      y: {
        ticks: { color: "#64748b" },
        grid:  { color: "rgba(255,255,255,0.05)" },
        min: 0,
        max: 0.5
      }
    }
  };

  return (
    <div className="supervisor-wrapper">
      <h2 className="analytics-title">Reconstruction Error Analysis</h2>

      <div className="stats-row">
        <div className="stat-card">
          <p>Average</p>
          <h3>{avg.toFixed(3)}</h3>
        </div>
        <div className="stat-card">
          <p>Max</p>
          <h3>{max.toFixed(3)}</h3>
        </div>
        <div className="stat-card">
          <p>Anomalies</p>
          <h3>{anomalies}</h3>
        </div>
      </div>

      <div className="chart-card">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default Supervisor;