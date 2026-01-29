import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import DriverRoutes from "./DriverRoutes";
import RiderRoutes from "./RiderRoutes";

export default function AppRoutes() {
  const { user, loading } = useAuth();

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-500 to-blue-600">
        <div className="text-center">
          <div className="text-6xl mb-4">🚗</div>
          <p className="text-white text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Role-based */}
      <Route path="/driver/*" element={<DriverRoutes />} />
      <Route path="/rider/*" element={<RiderRoutes />} />

      {/* Default */}
      <Route
        path="/"
        element={
          user ? (
            user.role === "DRIVER" ? (
              <Navigate to="/driver" />
            ) : (
              <Navigate to="/rider" />
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
