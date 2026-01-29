import React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { rideAPI } from "../../api/axiosAPI";
import Loader from "../../components/Common/Loader";
import ErrorMessage from "../../components/Common/ErrorMessage";
import MapView from "../../components/Map/MapView";

export default function RiderActiveRide() {
  const { user } = useAuth();
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadActiveRide = async () => {
      try {
        setLoading(true);
        const res = await rideAPI.getActiveRides();
        const rides = res.data?.rides || [];

        // Find active ride for this user
        let active = null;
        rides.forEach((ride) => {
          if (ride.passengers) {
            const passenger = ride.passengers.find(
              (p) => p.userId === user.id && p.status === "BOARDED",
            );
            if (passenger) {
              active = {
                ...ride,
                passenger: passenger,
              };
            }
          }
        });

        setActiveRide(active);
      } catch (err) {
        console.error(err);
        setError("Failed to load active ride. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const interval = setInterval(loadActiveRide, 3000);
    loadActiveRide();
    return () => clearInterval(interval);
  }, [user]);

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} />;

  if (!activeRide) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p style={{ color: "#999" }}>
          No active ride. Request a ride to get started!
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🚗 CoRYD - Active Ride</h2>

      <div
        style={{
          border: "1px solid #ddd",
          padding: 15,
          borderRadius: 8,
          marginBottom: 20,
          backgroundColor: "#f9f9f9",
        }}
      >
        <div style={{ marginBottom: 15 }}>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "#666",
              textTransform: "uppercase",
            }}
          >
            Status
          </p>
          <p
            style={{
              margin: 5,
              fontWeight: "bold",
              color: "#0066cc",
              fontSize: 16,
            }}
          >
            {activeRide.passenger?.status === "BOARDED"
              ? "✓ In Transit"
              : "⏳ Pickup Pending"}
          </p>
        </div>

        <div style={{ marginBottom: 15 }}>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "#666",
              textTransform: "uppercase",
            }}
          >
            Route
          </p>
          <p style={{ margin: 5, fontWeight: "bold", fontSize: 14 }}>
            📍 {activeRide.pickupLocation}
          </p>
          <p style={{ margin: 5, fontWeight: "bold", fontSize: 14 }}>
            📍 {activeRide.dropLocation}
          </p>
        </div>

        <div style={{ marginBottom: 15 }}>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "#666",
              textTransform: "uppercase",
            }}
          >
            Driver
          </p>
          <p style={{ margin: 5, fontWeight: "bold" }}>
            {activeRide.driverName || "Driver"}
          </p>
          <p style={{ margin: 5, fontSize: 12, color: "#999" }}>
            📱 Vehicle: {activeRide.vehicleNumber || "N/A"}
          </p>
        </div>

        <div style={{ marginBottom: 15, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ backgroundColor: "#e3f2fd", padding: 10, borderRadius: 6 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#1976d2" }}>Available Seats</p>
            <p style={{ margin: 5, fontSize: 18, fontWeight: "bold", color: "#1565c0" }}>
              {activeRide.availableSeats || 0}/{activeRide.totalSeats || 4}
            </p>
          </div>
          <div style={{ backgroundColor: "#c8e6c9", padding: 10, borderRadius: 6 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#388e3c" }}>Distance</p>
            <p style={{ margin: 5, fontSize: 18, fontWeight: "bold", color: "#2e7d32" }}>
              {activeRide.distanceInKm?.toFixed(2) || "0"}km
            </p>
          </div>
        </div>

        {activeRide.passenger?.fareAmount && (
          <div style={{ backgroundColor: "#fff3e0", padding: 10, borderRadius: 6 }}>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "#666",
                textTransform: "uppercase",
              }}
            >
              Fare Amount
            </p>
            <p
              style={{
                margin: 5,
                fontWeight: "bold",
                fontSize: 18,
                color: "#e65100",
              }}
            >
              ₹{activeRide.passenger.fareAmount.toFixed(2)}
            </p>
            <p style={{ margin: 5, fontSize: 11, color: "#666" }}>
              💳 Will be charged via Razorpay when dropped
            </p>
          </div>
        )}
      </div>

      {activeRide.pickupLatitude && activeRide.pickupLongitude && (
        <div style={{ marginTop: 20 }}>
          <h4>📍 Live Location</h4>
          <MapView
            pickup={{
              lat: activeRide.pickupLatitude,
              lng: activeRide.pickupLongitude,
            }}
            drop={{
              lat: activeRide.dropLatitude,
              lng: activeRide.dropLongitude,
            }}
          />
        </div>
      )}
    </div>
  );
}
