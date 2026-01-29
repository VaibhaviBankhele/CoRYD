import React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { matchAPI } from "../../api/axiosAPI";
import Loader from "../../components/Common/Loader";
import ErrorMessage from "../../components/Common/ErrorMessage";

export default function ActiveRide() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acceptingId, setAcceptingId] = useState(null);

  useEffect(() => {
    if (!user) return;

    const loadMatches = async () => {
      try {
        setLoading(true);
        const res = await matchAPI.getDriverMatches(user.id);
        setMatches(res.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load ride requests. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
    const interval = setInterval(loadMatches, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleAcceptMatch = async (matchId) => {
    try {
      setAcceptingId(matchId);
      await matchAPI.acceptMatch(matchId);
      setMatches(matches.filter((m) => m.id !== matchId));
      setAcceptingId(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to accept ride request.");
      setAcceptingId(null);
    }
  };

  if (loading) return <Loader />;

  return (
    <div style={{ padding: 20 }}>
      <h2>🚗 Active Ride Requests</h2>

      {error && <ErrorMessage message={error} />}

      {matches.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            backgroundColor: "white",
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        >
          <p style={{ fontSize: 18, color: "#999" }}>
            ⏳ Waiting for rider requests…
          </p>
          <p style={{ color: "#ccc" }}>
            Requests will appear here when riders need a ride
          </p>
        </div>
      )}

      {matches.map((m) => (
        <div
          key={m.id}
          style={{
            border: "2px solid #0066cc",
            borderRadius: 8,
            padding: 15,
            marginBottom: 15,
            backgroundColor: "#f9f9f9",
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "#666",
                textTransform: "uppercase",
              }}
            >
              Ride Request
            </p>
            <p style={{ margin: 5, fontWeight: "bold" }}>
              Request ID: #{m.rideRequestId}
            </p>
          </div>

          <div style={{ marginBottom: 10 }}>
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
                color: m.status === "MATCHED" ? "#0066cc" : "#999",
              }}
            >
              {m.status}
            </p>
          </div>

          {m.riderName && (
            <div style={{ marginBottom: 10 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#666",
                  textTransform: "uppercase",
                }}
              >
                Rider
              </p>
              <p style={{ margin: 5, fontWeight: "bold" }}>{m.riderName}</p>
            </div>
          )}

          {m.pickupLocation && (
            <div style={{ marginBottom: 10 }}>
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
              <p style={{ margin: 5, fontSize: 14 }}>📍 {m.pickupLocation}</p>
              <p style={{ margin: 5, fontSize: 14 }}>📍 {m.dropLocation}</p>
            </div>
          )}

          {m.status === "MATCHED" && (
            <button
              onClick={() => handleAcceptMatch(m.id)}
              disabled={acceptingId === m.id}
              style={{
                width: "100%",
                padding: 12,
                backgroundColor: acceptingId === m.id ? "#ccc" : "#0066cc",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: acceptingId === m.id ? "not-allowed" : "pointer",
                fontWeight: "bold",
              }}
            >
              {acceptingId === m.id ? "Accepting..." : "✓ Accept Ride"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
