import React, { useState } from "react";
import "./App.css";
import Worker from "./pages/worker";
import Supervisor from "./pages/supervisor";

function App() {
  const [activeTab, setActiveTab] = useState("worker");

  return (
    <div className="app">
      <header className="topbar">
        <h1>Edge AI Structural Monitoring</h1>

        <div className="tabs">
          <button 
            className={activeTab === "worker" ? "active" : ""}
            onClick={() => setActiveTab("worker")}
          >
            Worker
          </button>
          <button 
            className={activeTab === "supervisor" ? "active" : ""}
            onClick={() => setActiveTab("supervisor")}
          >
            Supervisor
          </button>
        </div>
      </header>

      <div className="content">
        {activeTab === "worker" ? <Worker /> : <Supervisor />}
      </div>
    </div>
  );
}

export default App;