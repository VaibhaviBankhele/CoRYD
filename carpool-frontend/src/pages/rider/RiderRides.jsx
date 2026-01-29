import React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { rideAPI } from "../../api/axiosAPI";
import { Link } from "react-router-dom";
import Loader from "../../components/Common/Loader";
import ErrorMessage from "../../components/Common/ErrorMessage";

export default function RiderRides() {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    if (!user) return;

    const fetchRides = async () => {
      try {
        setLoading(true);
        const res = await rideAPI.getActiveRides();
        setRides(res.data?.rides || []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch rides");
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
    const interval = setInterval(fetchRides, 5000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} />;

  const filteredRides =
    filterStatus === "ALL"
      ? rides
      : rides.filter((r) => r.status === filterStatus);

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "#0066cc";
      case "COMPLETED":
        return "#4caf50";
      case "CANCELLED":
        return "#f44336";
      default:
        return "#999";
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🚕 Available Rides</h2>

      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        {["ALL", "ACTIVE", "COMPLETED", "CANCELLED"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: "8px 16px",
              backgroundColor: filterStatus === status ? "#0066cc" : "#ddd",
              color: filterStatus === status ? "white" : "#333",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: "500",
              fontSize: 12,
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {filteredRides.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            backgroundColor: "white",
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        >
          <p style={{ color: "#999", fontSize: 16 }}>
            {filterStatus === "ALL"
              ? "No rides available"
              : `No ${filterStatus.toLowerCase()} rides`}
          </p>
        </div>
      )}

      {filteredRides.map((ride) => (
        <Link
          key={ride.id}
          to={`/rider/rides/${ride.id}`}
          style={{ textDecoration: "none" }}
        >
          <div
            style={{
              border: "1px solid #ddd",
              padding: 15,
              marginBottom: 10,
              borderRadius: 6,
              backgroundColor: "#fafafa",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: "#666",
                    textTransform: "uppercase",
                  }}
                >
                  Route
                </p>
                <p style={{ margin: 5, fontWeight: "bold" }}>
                  📍 {ride.pickupLocation}
                </p>
                <p style={{ margin: 5, fontWeight: "bold" }}>
                  📍 {ride.dropLocation}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "white",
                    backgroundColor: getStatusColor(ride.status),
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontWeight: "bold",
                  }}
                >
                  {ride.status}
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 15,
              }}
            >
              <div>
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
                  {ride.driverName || "Driver"}
                </p>
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "#666",
                    textTransform: "uppercase",
                  }}
                >
                  Seats Available
                </p>
                <p style={{ margin: 5, fontWeight: "bold" }}>
                  {ride.availableSeats} / {ride.totalSeats}
                </p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
