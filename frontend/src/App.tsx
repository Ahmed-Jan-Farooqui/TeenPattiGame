import React from "react";
import HomePage from "./components/Home/Home";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { io } from "socket.io-client";
const socket = io("http://localhost:3001", { transports: ["websocket"] });
socket.connect();

function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage socket={socket} />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
