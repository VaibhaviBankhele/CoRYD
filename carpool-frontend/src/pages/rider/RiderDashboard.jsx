import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { rideAPI } from "../../api/axiosAPI";
import LocationPicker from "../../components/Common/LocationPicker";
import PassengerCard from "../../components/Ride/PassengerCard";
import { LogOut, Bell, Search, MapPin, Clock, DollarSign } from "lucide-react";
import { RIDE_STATUS, RIDE_REQUEST_STATUS } from "../../utils/constants";

export default function RiderDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropLocation, setDropLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const [availableRides, setAvailableRides] = useState([]);
  const [myRide, setMyRide] = useState(null);
  const [searching, setSearching] = useState(false);

  // Fetch available rides
  const fetchAvailableRides = async () => {
    try {
      const res = await rideAPI.getActiveRides();
      setAvailableRides(res.data.rides || []);
    } catch (err) {
      console.error("Error fetching rides:", err);
    }
  };

  // Polling
  useEffect(() => {
    fetchAvailableRides();
    const interval = setInterval(fetchAvailableRides, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load user's active ride and watch for completion
  useEffect(() => {
    const loadUserRide = async () => {
      try {
        const res = await rideAPI.getActiveRides();
        const rides = res.data?.rides || [];

        // Find user's ride (active or completed)
        let userRide = null;
        rides.forEach((ride) => {
          if (ride.passengers) {
            const passenger = ride.passengers.find(
              (p) =>
                p.userId === user.id &&
                (p.status === "MATCHED" ||
                  p.status === "BOARDED" ||
                  p.status === "DROPPED"),
            );
            if (passenger) {
              userRide = {
                ...ride,
                passenger: passenger,
              };
            }
          }
        });

        // Check if ride was just completed (status changed to DROPPED)
        if (
          userRide &&
          userRide.passenger.status === "DROPPED" &&
          (!myRide || myRide.passenger.status !== "DROPPED")
        ) {
          // Navigate to payments page when ride is completed
          navigate("/rider/payments");
        }

        setMyRide(userRide);
      } catch (err) {
        console.error("Error loading user ride:", err);
      }
    };

    loadUserRide();
    const interval = setInterval(loadUserRide, 5000); // Check more frequently for status changes
    return () => clearInterval(interval);
  }, [user.id, myRide, navigate]);

  const calculateFareEstimate = () => {
    if (!pickupLocation || !dropLocation) return 0;

    // Simple distance calculation (Haversine)
    const R = 6371; // Earth's radius in km
    const dLat = ((dropLocation.lat - pickupLocation.lat) * Math.PI) / 180;
    const dLon = ((dropLocation.lng - pickupLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pickupLocation.lat * Math.PI) / 180) *
        Math.cos((dropLocation.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Calculate fare: ₹50 base + ₹10/km
    return 50 + distance * 10;
  };

  const handleFindRide = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSearching(true);

    try {
      if (!pickupLocation || !dropLocation) {
        setError("Please select pickup and drop locations");
        setSearching(false);
        return;
      }

      const requestData = {
        riderId: user.id,
        pickupLocation: pickupLocation.name,
        pickupLatitude: pickupLocation.lat,
        pickupLongitude: pickupLocation.lng,
        dropLocation: dropLocation.name,
        dropLatitude: dropLocation.lat,
        dropLongitude: dropLocation.lng,
      };

      const res = await rideAPI.createRideRequest(requestData);
      setSuccess("✅ Searching for rides... Match found!");

      // Reset form
      setTimeout(() => {
        setPickupLocation(null);
        setDropLocation(null);
        setSuccess("");
        fetchAvailableRides();
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to find ride");
    } finally {
      setSearching(false);
    }
  };

  const handleBookRide = async (ride) => {
    if (!pickupLocation || !dropLocation) {
      setError("Please select your pickup and drop locations");
      return;
    }

    if (ride.availableSeats <= 0) {
      setError("No seats available for this ride");
      return;
    }

    setLoading(true);
    try {
      const addPassengerData = {
        riderId: parseInt(user.id),
        pickupLocation: pickupLocation.name,
        pickupLatitude: pickupLocation.lat,
        pickupLongitude: pickupLocation.lng,
        dropLocation: dropLocation.name,
        dropLatitude: dropLocation.lat,
        dropLongitude: dropLocation.lng,
      };

      const res = await rideAPI.addPassenger(ride.id, addPassengerData);
      setMyRide({ ...ride, passenger: res.data.passenger });
      setSuccess(`✅ Booked! Driver: ${ride.driverName}`);
      setPickupLocation(null);
      setDropLocation(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to book ride");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const fareEstimate = calculateFareEstimate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">
              👤 Rider Dashboard
            </h1>
            <p className="text-gray-600">{user?.name}</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="relative">
              <Bell className="w-6 h-6 cursor-pointer text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 btn-secondary px-3 py-2"
            >
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded mb-4 border border-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded mb-4 border border-green-200">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Request Ride */}
          <div className="lg:col-span-2 space-y-6">
            {!myRide ? (
              <>
                {/* Find Ride Form */}
                <div className="card">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Search size={24} /> Find a Ride
                  </h2>

                  <form onSubmit={handleFindRide} className="space-y-4">
                    <LocationPicker
                      label="Pickup Location"
                      value={pickupLocation?.name || ""}
                      onSelect={setPickupLocation}
                    />

                    <LocationPicker
                      label="Drop Location"
                      value={dropLocation?.name || ""}
                      onSelect={setDropLocation}
                    />

                    {fareEstimate > 0 && (
                      <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
                        <p className="text-sm text-gray-600">Estimated Fare</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ₹{fareEstimate.toFixed(2)}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={searching || !pickupLocation || !dropLocation}
                      className="w-full btn-primary py-3 text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Search size={20} /> Find Ride
                    </button>
                  </form>
                </div>

                {/* Available Rides */}
                <div className="card">
                  <h3 className="text-2xl font-bold mb-4">
                    Available Rides ({availableRides.length})
                  </h3>

                  {availableRides.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No rides available. Try different locations.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {availableRides.map((ride) => (
                        <div
                          key={ride.id}
                          className="card border border-gray-300 hover:border-blue-500 hover:shadow-lg transition"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="text-lg font-bold text-gray-900">
                                👤 {ride.driverName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Vehicle: {ride.vehicleNumber}
                              </p>
                            </div>
                            <span
                              className={`badge ${ride.availableSeats > 0 ? "badge-green" : "badge-gray"}`}
                            >
                              {ride.availableSeats}/{ride.totalSeats} available
                            </span>
                          </div>

                          <div className="space-y-2 mb-4 text-sm">
                            <div className="flex items-center text-gray-700">
                              <MapPin
                                size={16}
                                className="mr-2 text-blue-500"
                              />
                              <span className="font-semibold">
                                {ride.pickupLocation} → {ride.dropLocation}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-gray-600">
                              <div className="flex items-center gap-1">
                                📏 {ride.distanceInKm?.toFixed(2)} km
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={16} />{" "}
                                {ride.estimatedDurationMinutes} min
                              </div>
                              <div className="flex items-center gap-1 font-bold text-green-600">
                                <DollarSign size={16} /> ₹
                                {(ride.totalFare || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleBookRide(ride)}
                            disabled={loading || ride.availableSeats <= 0}
                            className={`w-full py-2 font-bold rounded text-white transition ${
                              ride.availableSeats > 0
                                ? "btn-success"
                                : "bg-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {loading ? "Booking..." : "🚗 Book Seat"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              // My Active Ride
              <div className="card border-2 border-green-500">
                <h2 className="text-2xl font-bold text-green-600 mb-4">
                  🚗 Your Active Ride
                </h2>

                <div className="bg-green-50 p-4 rounded mb-4">
                  <p className="font-bold text-lg mb-2">
                    Driver: {myRide.driverName}
                  </p>
                  <p className="text-gray-600 mb-2">
                    Vehicle: {myRide.vehicleNumber}
                  </p>

                  <div className="space-y-2 text-sm mt-3">
                    <div className="flex items-center">
                      <MapPin size={16} className="mr-2" />
                      {pickupLocation?.name} → {dropLocation?.name}
                    </div>
                    <div className="flex items-center">
                      <Clock size={16} className="mr-2" />
                      Est. Duration: {myRide.estimatedDurationMinutes} min
                    </div>
                    <div className="flex items-center font-bold text-green-600">
                      <DollarSign size={16} className="mr-2" />
                      Your Fare: ₹
                      {myRide.passenger?.fareAmount?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600 mb-2">Status:</p>
                  <p className="text-lg font-bold text-blue-600">
                    {myRide.passenger?.status}
                  </p>

                  {myRide.passenger?.status === "MATCHED" && (
                    <p className="text-sm text-orange-600 mt-2">
                      ⏳ Waiting for driver to arrive...
                    </p>
                  )}
                  {myRide.passenger?.status === "BOARDED" && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ You are in the ride!
                    </p>
                  )}
                  {myRide.passenger?.status === "DROPPED" && (
                    <p className="text-sm text-gray-600 mt-2">
                      ✅ Ride completed. Payment processed.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Ride History */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4">Ride Information</h3>

            {myRide ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Driver Rating</p>
                  <p className="text-lg font-bold">⭐ 4.8/5</p>
                </div>
                <div>
                  <p className="text-gray-600">Rides Completed</p>
                  <p className="text-lg font-bold">124 rides</p>
                </div>
                <div className="bg-blue-50 p-3 rounded mt-4">
                  <p className="text-xs text-gray-600 mb-2">Trip Details</p>
                  <div className="space-y-1 text-xs">
                    <p>
                      <strong>Distance:</strong>{" "}
                      {myRide.distanceInKm?.toFixed(2)} km
                    </p>
                    <p>
                      <strong>Duration:</strong>{" "}
                      {myRide.estimatedDurationMinutes} min
                    </p>
                    <p>
                      <strong>Vehicle:</strong> {myRide.vehicleNumber}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p>Select a ride to see details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
