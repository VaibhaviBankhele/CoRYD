import React, { useEffect, useState } from "react";
import { paymentAPI } from "../../api/axiosAPI";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Common/Loader";
import ErrorMessage from "../../components/Common/ErrorMessage";

export default function RiderPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        // Fetch payments from Payment Service for this user
        const res = await paymentAPI.getPaymentsForUser(user.id);
        const paymentsData = res.data || [];

        let total = 0;
        const myPayments = paymentsData.map((p) => {
          const amount = p.amount || 0;
          total += amount;
          return {
            rideId: p.rideId,
            driverName: p.driverId ? `Driver #${p.driverId}` : "Driver",
            from: p.from || p.pickupLocation || "",
            to: p.to || p.dropLocation || "",
            amount: amount,
            date: p.completedAt || p.createdAt || new Date().toISOString(),
            status: p.status || "COMPLETED",
          };
        });

        setPayments(myPayments.sort((a, b) => new Date(b.date) - new Date(a.date)));
        setTotalPaid(total);
      } catch (err) {
        console.error("Failed to load rider payments", err);
        setError("Failed to load payment history. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, [user]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "Completed";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Completed";
    }
  };

  if (loading) return <Loader />;

  return (
    <div style={{ padding: 20 }}>
      <h2>💳 CoRYD - Payments History</h2>

      {error && <ErrorMessage message={error} />}

      <div
        style={{
          backgroundColor: "#f8f0ff",
          padding: 15,
          borderRadius: 8,
          marginBottom: 20,
          borderLeft: "4px solid #9933cc",
        }}
      >
        <h3 style={{ margin: 0, color: "#9933cc" }}>Total Paid</h3>
        <p
          style={{
            margin: 5,
            fontSize: 28,
            fontWeight: "bold",
            color: "#9933cc",
          }}
        >
          ₹{totalPaid.toFixed(2)}
        </p>
        <p style={{ margin: 0, color: "#666" }}>
          For {payments.length} completed ride{payments.length !== 1 ? "s" : ""}
        </p>
      </div>

      {payments.length === 0 && (
        <p style={{ color: "#999", textAlign: "center", padding: 20 }}>
          No completed rides yet. Request a ride to start!
        </p>
      )}

      {payments.map((p, index) => (
        <div
          key={index}
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
                {p.from} → {p.to}
              </p>
              <p style={{ margin: 5, fontSize: 12, color: "#999" }}>
                Driver: {p.driverName}
              </p>
              <p style={{ margin: 5, fontSize: 11, color: "#0066cc" }}>
                ✓ Paid via Razorpay Secure Gateway
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 14, color: "#666" }}>
                Amount Paid
              </p>
              <p
                style={{
                  margin: 5,
                  fontWeight: "bold",
                  fontSize: 20,
                  color: "#9933cc",
                }}
              >
                ₹{p.amount.toFixed(2)}
              </p>
              <p
                style={{
                  margin: 5,
                  fontSize: 11,
                  color: "#666",
                  backgroundColor: "#e8f5e9",
                  padding: "4px 8px",
                  borderRadius: "4px",
                }}
              >
                {p.status === "DROPPED" ? "✓ Confirmed" : "✓ " + p.status}
              </p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#999" }}>
            {formatDate(p.date)}
          </p>
        </div>
      ))}
    </div>
  );
}
