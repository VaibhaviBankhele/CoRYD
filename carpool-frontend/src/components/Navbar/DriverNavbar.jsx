import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

export default function DriverNavbar() {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <nav className="navbar">
      <h3>🚗 CoRYD</h3>
      <div>
        <Link to="/driver">Home</Link>
        <Link to="/driver/active">Active Rides</Link>
        <Link to="/driver/earnings">Earnings</Link>
        <Link to="/driver/profile">Profile</Link>
        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
