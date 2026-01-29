import React from "react";
import MapPicker from "../../components/Map/MapPicker";
import { rideAPI } from "../../api/axiosAPI";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import Loader from "../../components/Common/Loader";
import ErrorMessage from "../../components/Common/ErrorMessage";

export default function DriverHome() {
  const { user } = useAuth();
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!user) {
    return <p>Loading...</p>;
  }

  const goOnline = async () => {
    setError("");
    setSuccess("");

    if (!pickup || !drop) {
      setError("Select both pickup and drop locations");
      return;
    }

    const payload = {
      driverId: user.id,
      pickupLocation: pickup.locationName,
      dropLocation: drop.locationName,
      route: pickup.locationName + " → " + drop.locationName,
      pickupLatitude: pickup.latitude,
      pickupLongitude: pickup.longitude,
      dropLatitude: drop.latitude,
      dropLongitude: drop.longitude,
      totalSeats: 3,
      availableSeats: 3,
      status: "ACTIVE",
    };

    try {
      setLoading(true);
      await rideAPI.createRide(payload);
      setSuccess("You're now online! Waiting for ride requests...");
      setTimeout(() => {
        setPickup(null);
        setDrop(null);
      }, 1500);
    } catch (err) {
      console.error("Ride create failed", err);
      setError(
        err.response?.data?.message || "Failed to go online. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h2>🚗 Go Online</h2>
      <p>Set your route to accept ride requests</p>

      {error && <ErrorMessage message={error} />}
      {success && (
        <p
          style={{
            color: "green",
            padding: 10,
            backgroundColor: "#f0f8f0",
            borderRadius: 4,
            marginBottom: 20,
          }}
        >
          {success}
        </p>
      )}

      <div style={{ marginBottom: 20 }}>
        <h4>Pickup Location</h4>
        {pickup ? (
          <p style={{ color: "#0066cc", fontWeight: "bold", marginBottom: 10 }}>
            ✓ {pickup.locationName}
          </p>
        ) : (
          <p style={{ color: "#999", marginBottom: 10 }}>
            Search or click on map to select pickup location
          </p>
        )}
        <MapPicker mode="Pickup" onLocationSelect={setPickup} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <h4>Drop Location</h4>
        {drop ? (
          <p style={{ color: "#0066cc", fontWeight: "bold", marginBottom: 10 }}>
            ✓ {drop.locationName}
          </p>
        ) : (
          <p style={{ color: "#999", marginBottom: 10 }}>
            Search or click on map to select drop location
          </p>
        )}
        <MapPicker mode="Drop" onLocationSelect={setDrop} />
      </div>

      {loading ? (
        <Loader />
      ) : (
        <button
          onClick={goOnline}
          disabled={!pickup || !drop}
          style={{
            width: "100%",
            padding: 12,
            backgroundColor: pickup && drop ? "#0066cc" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: pickup && drop ? "pointer" : "not-allowed",
            fontSize: 16,
            fontWeight: "bold",
            marginTop: 10,
          }}
        >
          Go Online
        </button>
      )}
    </div>
  );
}
