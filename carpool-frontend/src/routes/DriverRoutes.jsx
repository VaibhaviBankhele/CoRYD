import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "../components/Common/ProtectedRoute";
import DriverNavbar from "../components/Navbar/DriverNavbar";

import DriverHome from "../pages/driver/DriverHome";
import DriverDashboardNew from "../pages/driver/DriverDashboardNew";
import ActiveRide from "../pages/driver/ActiveRide";
import DriverEarnings from "../pages/driver/DriverEarnings";
import DriverProfile from "../pages/driver/DriverProfile";

export default function DriverRoutes() {
  return (
    <ProtectedRoute role="DRIVER">
      {/* Using new dashboard directly, removing navbar */}

      <Routes>
        <Route index element={<DriverDashboardNew />} />
        <Route path="dashboard" element={<DriverDashboardNew />} />
        <Route path="active" element={<ActiveRide />} />
        <Route path="earnings" element={<DriverEarnings />} />
        <Route path="profile" element={<DriverProfile />} />

        <Route path="*" element={<Navigate to="/driver" />} />
      </Routes>
    </ProtectedRoute>
  );
}
