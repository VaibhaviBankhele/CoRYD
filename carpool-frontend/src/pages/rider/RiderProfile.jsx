import React from "react";
import { useEffect, useState } from "react";
import { additionalUserAPI } from "../../api/axiosAPI";
import Loader from "../../components/Common/Loader";
import ErrorMessage from "../../components/Common/ErrorMessage";

export default function RiderProfile() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await additionalUserAPI.getUser(user.id);
        setProfile(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user.id]);

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} />;
  if (!profile) return <p>Profile not found</p>;

  return (
    <div style={{ padding: 20, maxWidth: 600 }}>
      <h2>👤 My Profile</h2>

      <div
        style={{
          backgroundColor: "white",
          padding: 20,
          borderRadius: 8,
          border: "1px solid #ddd",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 48, textAlign: "center", marginBottom: 15 }}>
            👤
          </div>
          <h3 style={{ textAlign: "center", margin: 0 }}>{profile.name}</h3>
          <p
            style={{
              textAlign: "center",
              color: "#0066cc",
              fontWeight: "bold",
            }}
          >
            Rider
          </p>
        </div>

        <div
          style={{
            borderTop: "1px solid #eee",
            paddingTop: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 20,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 12,
                color: "#999",
                textTransform: "uppercase",
                marginBottom: 5,
              }}
            >
              Email
            </p>
            <p style={{ fontWeight: "bold", margin: 0 }}>✉️ {profile.email}</p>
          </div>

          <div>
            <p
              style={{
                fontSize: 12,
                color: "#999",
                textTransform: "uppercase",
                marginBottom: 5,
              }}
            >
              Phone
            </p>
            <p style={{ fontWeight: "bold", margin: 0 }}>
              📱 {profile.phone || "Not provided"}
            </p>
          </div>

          <div>
            <p
              style={{
                fontSize: 12,
                color: "#999",
                textTransform: "uppercase",
                marginBottom: 5,
              }}
            >
              Role
            </p>
            <p style={{ fontWeight: "bold", margin: 0 }}>
              🚕 {profile.role || "Rider"}
            </p>
          </div>

          <div>
            <p
              style={{
                fontSize: 12,
                color: "#999",
                textTransform: "uppercase",
                marginBottom: 5,
              }}
            >
              Member Since
            </p>
            <p style={{ fontWeight: "bold", margin: 0 }}>
              📅{" "}
              {new Date(profile.createdAt || new Date()).toLocaleDateString()}
            </p>
          </div>
        </div>

        {profile.rating && (
          <div
            style={{
              marginTop: 20,
              paddingTop: 20,
              borderTop: "1px solid #eee",
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: "#999",
                textTransform: "uppercase",
                marginBottom: 5,
              }}
            >
              Rating
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24, color: "#ffc107" }}>⭐</span>
              <span style={{ fontWeight: "bold", fontSize: 18 }}>
                {profile.rating.toFixed(1)} / 5.0
              </span>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => {
          localStorage.clear();
          window.location.href = "/login";
        }}
        style={{
          width: "100%",
          marginTop: 20,
          backgroundColor: "#ff6b6b",
        }}
      >
        Logout
      </button>
    </div>
  );
}
