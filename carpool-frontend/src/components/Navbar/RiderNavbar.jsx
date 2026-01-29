import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

export default function RiderNavbar() {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <nav className="navbar">
      <h3>🚕 CoRYD</h3>
      <div>
        <Link to="/rider">Dashboard</Link>
        <Link to="/rider/request">Request Ride</Link>
        <Link to="/rider/active-ride">Active Ride</Link>
        <Link to="/rider/rides">My Rides</Link>
        <Link to="/rider/payments">Payments</Link>
        <Link to="/rider/profile">Profile</Link>
        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
