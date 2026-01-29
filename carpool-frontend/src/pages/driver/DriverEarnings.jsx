import React from "react";
import { useEffect, useState } from "react";
import { paymentAPI } from "../../api/axiosAPI";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Common/Loader";
import ErrorMessage from "../../components/Common/ErrorMessage";

export default function DriverEarnings() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEarnings() {
      try {
        setLoading(true);
        // Fetch payments recorded for this driver from Payment Service
        const res = await paymentAPI.getPaymentsForDriver(user.id);
        const payments = res.data || [];

        console.log("💰 Driver payments fetched:", payments);

        let sum = 0;
        const list = payments.map((payment) => {
          const amount = payment.amount || 0;
          sum += amount;
          return {
            id: payment.id,
            rideId: payment.rideId,
            from: payment.from || "Pickup",
            to: payment.to || "Drop",
            amount: amount,
            date: payment.completedAt || payment.createdAt,
            riderId: payment.riderId,
            status: payment.status,
          };
        });

        setEarnings(list);
        setTotal(sum);
      } catch (err) {
        console.error("❌ Failed to load driver earnings:", err);
        setError("Failed to load earnings. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadEarnings();
  }, [user]);

  if (loading) return <Loader />;

  return (
    <div style={{ padding: 20 }}>
      <h2>💰 My Earnings</h2>

      {error && <ErrorMessage message={error} />}

      <div
        style={{
          backgroundColor: "#f0f8ff",
          padding: 15,
          borderRadius: 8,
          marginBottom: 20,
          borderLeft: "4px solid #0066cc",
        }}
      >
        <h3 style={{ margin: 0, color: "#0066cc" }}>Total Earned</h3>
        <p
          style={{
            margin: 5,
            fontSize: 28,
            fontWeight: "bold",
            color: "#0066cc",
          }}
        >
          ₹{total.toFixed(2)}
        </p>
        <p style={{ margin: 0, color: "#666" }}>
          From {earnings.length} completed ride{earnings.length !== 1 ? "s" : ""}
        </p>
      </div>

      {earnings.length === 0 && (
        <p style={{ color: "#999", textAlign: "center", padding: 20 }}>
          No completed rides yet. Start accepting ride requests!
        </p>
      )}

      {earnings.map((e) => (
        <div
          key={e.id}
          style={{
            border: "1px solid #ddd",
            padding: 15,
            marginBottom: 10,
            borderRadius: 6,
            backgroundColor: "#fafafa",
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
              <p style={{ margin: 0, fontSize: 14, color: "#666" }}>Route</p>
              <p style={{ margin: 5, fontWeight: "bold" }}>
                {e.from} → {e.to}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 14, color: "#666" }}>Earned</p>
              <p
                style={{
                  margin: 5,
                  fontWeight: "bold",
                  fontSize: 20,
                  color: "#0066cc",
                }}
              >
                ₹{e.amount.toFixed(2)}
              </p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#999" }}>
            {e.date ? new Date(e.date).toLocaleDateString("en-IN") : "Completed"} • Status: {e.status || "COMPLETED"}
          </p>
        </div>
      ))}
    </div>
  );
}
