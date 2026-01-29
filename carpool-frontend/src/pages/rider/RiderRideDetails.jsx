import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { rideAPI } from "../../api/axiosAPI";
import Loader from "../../components/Common/Loader";
import ErrorMessage from "../../components/Common/ErrorMessage";

export default function RiderRideDetails() {
  const { rideId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await rideAPI.getRideById(rideId);
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load ride details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [rideId]);

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <p>Ride not found</p>;

  const ride = data.ride || data;
  const passengers = data.passengers || [];

  return (
    <div style={{ padding: 20 }}>
      <h2>🚗 Ride Details</h2>

      <div
        style={{
          backgroundColor: "white",
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
          border: "1px solid #ddd",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <h3>Route</h3>
          <p style={{ fontSize: 16, fontWeight: "bold" }}>
            📍 {ride.pickupLocation}
          </p>
          <p style={{ fontSize: 14, color: "#999" }}>↓</p>
          <p style={{ fontSize: 16, fontWeight: "bold" }}>
            📍 {ride.dropLocation}
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3>Driver Information</h3>
          <p>
            <b>Name:</b> {ride.driverName || "Driver"}
          </p>
          <p>
            <b>Vehicle:</b> {ride.vehicleNumber || "N/A"}
          </p>
          <p>
            <b>Status:</b> {ride.status}
          </p>
        </div>

        {ride.estimatedFare && (
          <div style={{ marginBottom: 20 }}>
            <h3>Fare</h3>
            <p style={{ fontSize: 20, fontWeight: "bold", color: "#0066cc" }}>
              ₹{ride.estimatedFare.toFixed(2)}
            </p>
          </div>
        )}

        <div>
          <h3>Seats</h3>
          <p>
            <b>Available:</b> {ride.availableSeats} / {ride.totalSeats}
          </p>
        </div>
      </div>

      {passengers.length > 0 && (
        <div
          style={{
            backgroundColor: "white",
            padding: 20,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        >
          <h3>Passengers</h3>
          {passengers.map((p, idx) => (
            <div
              key={idx}
              style={{
                padding: 15,
                backgroundColor: "#f9f9f9",
                borderRadius: 6,
                marginBottom: 10,
                borderLeft: "3px solid #0066cc",
              }}
            >
              <p>
                <b>Name:</b> {p.riderName || "Passenger"}
              </p>
              <p>
                <b>Status:</b>{" "}
                <span style={{ color: "#0066cc" }}>{p.status}</span>
              </p>
              {p.fareAmount && (
                <p>
                  <b>Fare:</b> ₹{p.fareAmount.toFixed(2)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
