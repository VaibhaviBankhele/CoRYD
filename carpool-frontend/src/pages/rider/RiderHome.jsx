import React from "react";
import MapPicker from "../../components/Map/MapPicker";
import { rideAPI } from "../../api/axiosAPI";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import Loader from "../../components/Common/Loader";
import ErrorMessage from "../../components/Common/ErrorMessage";

export default function RiderHome() {
  const { user } = useAuth();
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const request = async () => {
    setError("");
    setSuccess("");

    if (!pickup) {
      setError("Please select a pickup location");
      return;
    }

    if (!drop) {
      setError("Please select a drop location");
      return;
    }

    try {
      setLoading(true);
      await rideAPI.createRideRequest({
        riderId: user.id,
        pickupLocation: pickup.locationName,
        dropLocation: drop.locationName,
        pickupLatitude: pickup.latitude,
        pickupLongitude: pickup.longitude,
        dropLatitude: drop.latitude,
        dropLongitude: drop.longitude,
      });

      setSuccess("Ride request sent! Waiting for driver to accept...");
      // Reset form
      setTimeout(() => {
        setPickup(null);
        setDrop(null);
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to request ride. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🚕 Request a Ride</h2>
      <p style={{ color: "#666" }}>
        Search or pick your pickup and drop locations
      </p>

      {error && <ErrorMessage message={error} />}
      {success && (
        <p
          style={{
            color: "green",
            padding: 10,
            backgroundColor: "#f0f8f0",
            borderRadius: 4,
          }}
        >
          {success}
        </p>
      )}

      <div style={{ marginBottom: 20 }}>
        <h4>Pickup Location</h4>
        {pickup ? (
          <p style={{ color: "#0066cc", fontWeight: "bold" }}>
            ✓ {pickup.locationName}
          </p>
        ) : (
          <p style={{ color: "#999" }}>
            Search or click on map to select pickup location
          </p>
        )}
        <MapPicker mode="Pickup" onLocationSelect={setPickup} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <h4>Drop Location</h4>
        {drop ? (
          <p style={{ color: "#0066cc", fontWeight: "bold" }}>
            ✓ {drop.locationName}
          </p>
        ) : (
          <p style={{ color: "#999" }}>
            Search or click on map to select drop location
          </p>
        )}
        <MapPicker mode="Drop" onLocationSelect={setDrop} />
      </div>

      {loading ? (
        <Loader />
      ) : (
        <button
          onClick={request}
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
          }}
        >
          Request Ride
        </button>
      )}
    </div>
  );
}
