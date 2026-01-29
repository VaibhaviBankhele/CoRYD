import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./map.css";

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const pickupIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: "pickup-marker",
});

export default function MapView({ pickup, drop, center = { lat: 28.6139, lng: 77.209 } }) {
  if (!pickup || !drop) {
    return <p style={{ color: "#999" }}>Loading map...</p>;
  }

  return (
    <div style={{ height: 400, width: "100%", borderRadius: 8, overflow: "hidden", marginTop: 10 }}>
      <MapContainer
        center={[pickup.lat, pickup.lng]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>📍 Pickup Location</Popup>
          </Marker>
        )}

        {drop && (
          <Marker position={[drop.lat, drop.lng]} icon={icon}>
            <Popup>📍 Drop Location</Popup>
          </Marker>
        )}

        {pickup && drop && (
          <Polyline positions={[[pickup.lat, pickup.lng], [drop.lat, drop.lng]]} color="blue" weight={3} opacity={0.7} />
        )}
      </MapContainer>
    </div>
  );
}
