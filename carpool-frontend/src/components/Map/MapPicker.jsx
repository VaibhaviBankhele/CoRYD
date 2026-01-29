import React, { useState, useRef, useEffect } from "react";

export default function MapPicker({ mode = "Location", onLocationSelect, disabled = false }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const iframeRef = useRef(null);

  // Default Delhi coordinates
  const defaultLat = 28.6139;
  const defaultLng = 77.209;

  // Search for locations using Nominatim
  const search = async (value) => {
    setQuery(value);
    
    if (value.length < 3) {
      setResults([]);
      return;
    }

    try {
      setSearching(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${value}&countrycodes=in&limit=5`,
        { headers: { "User-Agent": "CarpoolApp" } }
      );
      const data = await res.json();
      setResults(data || []);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Handle search result selection
  const handleSelectFromSearch = (result) => {
    const location = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      locationName: result.display_name
    };
    setSelected(location);
    onLocationSelect(location);
    setQuery("");
    setResults([]);
  };

  // Generate map HTML with satellite imagery
  const getMapHTML = () => {
    const lat = selected ? selected.latitude : defaultLat;
    const lng = selected ? selected.longitude : defaultLng;
    // sanitize location name for embedding inside JS string
    const popupText = selected && selected.locationName ? selected.locationName.replace(/'/g, "\\'") : '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { position: absolute; top: 0; bottom: 0; width: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([${lat}, ${lng}], 15);
          
          // Satellite imagery layer (USGS satellite)
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 19
          }).addTo(map);
          
          // Add marker
          const marker = L.circleMarker([${lat}, ${lng}], {
            radius: 8,
            fillColor: '#ff4444',
            color: '#cc0000',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          }).addTo(map);
          
          // Bind popup including the location name when available
          marker.bindPopup('<b>${mode}</b><br>' + '${popupText}' + '<br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}').openPopup();
          // Also show a permanent tooltip with the location name (if present)
          if ('${popupText}'.length > 0) {
            marker.bindTooltip('${popupText}', {permanent: true, direction: 'top', offset: [0, -10]}).openTooltip();
          }
        </script>
      </body>
      </html>
    `;
  };

  return (
    <div
      style={{
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? "none" : "auto",
        marginBottom: 20,
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 15,
        backgroundColor: "#fafafa"
      }}
    >
      {/* Search Box */}
      <div style={{ marginBottom: 15 }}>
        <input
          type="text"
          placeholder={`Search ${mode} location...`}
          value={query}
          onChange={(e) => search(e.target.value)}
          disabled={disabled}
          style={{
            width: "100%",
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 4,
            fontSize: 14,
            boxSizing: "border-box"
          }}
        />

        {searching && (
          <p style={{ color: "#999", fontSize: 12, marginTop: 5 }}>
            Searching...
          </p>
        )}

        {/* Search Results Dropdown */}
        {results.length > 0 && (
          <div
            style={{
              maxHeight: 200,
              overflowY: "auto",
              marginTop: 5,
              border: "1px solid #ddd",
              borderRadius: 4,
              backgroundColor: "#fff"
            }}
          >
            {results.map((result) => (
              <div
                key={result.place_id}
                onClick={() => handleSelectFromSearch(result)}
                style={{
                  cursor: "pointer",
                  padding: 10,
                  borderBottom: "1px solid #eee",
                  fontSize: 13,
                  color: "#333"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                📍 {result.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Satellite Map Iframe */}
      <iframe
        ref={iframeRef}
        srcDoc={getMapHTML()}
        style={{
          border: "2px solid #0066cc",
          borderRadius: 4,
          width: "100%",
          height: "500px",
          marginBottom: 10,
          display: "block"
        }}
      />
      <p style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
        🛰️ Satellite view | Search location above
      </p>

      {/* Selected Location Display */}
      {selected && (
        <div
          style={{
            padding: 10,
            backgroundColor: "#f0f8ff",
            borderRadius: 4,
            borderLeft: "4px solid #0066cc",
            marginTop: 10
          }}
        >
          <b>{mode}:</b> {selected.locationName}
          <br />
          <small style={{ color: "#999" }}>
            Lat: {selected.latitude.toFixed(6)}, Lng: {selected.longitude.toFixed(6)}
          </small>
          <br />
          <button
            onClick={() => {
              setSelected(null);
              setQuery("");
              setResults([]);
            }}
            style={{
              marginTop: 5,
              padding: "5px 10px",
              backgroundColor: "#ff6b6b",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12
            }}
          >
            Clear Selection
          </button>
        </div>
      )}

      {disabled && (
        <p style={{ color: "gray", marginTop: 10, fontSize: 12 }}>
          {mode} location locked
        </p>
      )}
    </div>
  );
}
