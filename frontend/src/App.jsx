import React, { useState } from "react";
import Worker from "./pages/worker";
import Supervisor from "./pages/supervisor";
import "./App.css";

function App() {
  const [tab, setTab] = useState("worker");

  return (
    <div className="app">
      <header className="topbar">
        <h1>Edge AI Monitoring</h1>

        <div className="tabs">
          <button onClick={()=>setTab("worker")}>Worker</button>
          <button onClick={()=>setTab("supervisor")}>Supervisor</button>
        </div>
      </header>

      <div className="content">
        {tab === "worker" ? <Worker /> : <Supervisor />}
      </div>
    </div>
  );
}

export default App;