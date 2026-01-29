import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { rideAPI, paymentAPI } from "../../api/axiosAPI";
import LocationPicker from "../../components/Common/LocationPicker";
import RiderActiveRideStatus from "../../components/Ride/RiderActiveRideStatus";
import RidePaymentModal from "../../components/Ride/RidePaymentModal";
import { LogOut, Search, Loader, MapPin, DollarSign, Car, Star, Users, CreditCard, User } from "lucide-react";
import { RIDE_STATUS, PASSENGER_STATUS } from "../../utils/constants";

export default function RiderDashboardNew() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropLocation, setDropLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("available"); // available, active, payments, profile

  const [availableRides, setAvailableRides] = useState([]);
  const [myRide, setMyRide] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [totalFare, setTotalFare] = useState(0);
  const [availableLocations, setAvailableLocations] = useState({ pickups: [], drops: [] });
  const [driverRequests, setDriverRequests] = useState([]);

  // Calculate fare with fallback value
  const calculateDistance = (pickup, drop) => {
    if (!pickup || !drop || !pickup.lat || !pickup.lng || !drop.lat || !drop.lng) return "5.0";
    const R = 6371;
    const dLat = ((drop.lat - pickup.lat) * Math.PI) / 180;
    const dLon = ((drop.lng - pickup.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pickup.lat * Math.PI) / 180) *
        Math.cos((drop.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = (R * c).toFixed(1);
    return distance > 0 ? distance : "5.0";
  };

  // Don't fetch rides automatically - only search when user clicks Find Routes

  // Fetch available locations from all active rides
  useEffect(() => {
    const fetchAvailableLocations = async () => {
      try {
        const res = await rideAPI.getActiveRides();
        const rides = res.data.rides || [];

        // Extract unique pickup and drop locations
        const pickups = new Set();
        const drops = new Set();

        rides.forEach((ride) => {
          if (ride.pickup) pickups.add(ride.pickup);
          if (ride.drop) drops.add(ride.drop);
          if (ride.pickupLocation?.name) pickups.add(ride.pickupLocation.name);
          if (ride.dropLocation?.name) drops.add(ride.dropLocation.name);
        });

        setAvailableLocations({
          pickups: Array.from(pickups).sort(),
          drops: Array.from(drops).sort(),
        });

        // Also extract all unique drivers (driver requests for this rider)
        const uniqueDrivers = new Map();
        rides.forEach((ride) => {
          if (!uniqueDrivers.has(ride.driverId)) {
            uniqueDrivers.set(ride.driverId, {
              id: ride.driverId,
              name: ride.driverName || `Driver ${ride.driverId}`,
              rating: ride.rating || 4.5,
              reviews: ride.reviews || 100,
              vehicleType: ride.vehicleType || "Car",
              vehicleColor: ride.vehicleColor || "White",
              phone: ride.driverPhone || "+91-9876543210",
              rideId: ride.id,
              pickupLocation: ride.pickupLocation?.name || ride.pickup,
              dropLocation: ride.dropLocation?.name || ride.drop,
            });
          }
        });

        setDriverRequests(Array.from(uniqueDrivers.values()));
      } catch (err) {
        console.error("Error fetching available locations:", err);
      }
    };

    fetchAvailableLocations();
    const interval = setInterval(fetchAvailableLocations, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Load user's active ride and watch for completion
  useEffect(() => {
    const loadUserRide = async () => {
      try {
        const res = await rideAPI.getActiveRides();
        const rides = res.data?.rides || [];

        // Find user's ride
        let userRide = null;
        rides.forEach((ride) => {
          if (ride.passengers) {
            const passenger = ride.passengers.find(
              (p) =>
                p.userId === user.id &&
                (p.status === PASSENGER_STATUS.MATCHED ||
                  p.status === PASSENGER_STATUS.BOARDED ||
                  p.status === PASSENGER_STATUS.DROPPED)
            );
            if (passenger) {
              userRide = {
                ...ride,
                passenger: passenger,
              };
            }
          }
        });

        // Check if ride was just completed
        if (
          userRide &&
          userRide.passenger.status === PASSENGER_STATUS.DROPPED &&
          (!myRide || myRide.passenger.status !== PASSENGER_STATUS.DROPPED)
        ) {
          setMyRide(userRide);
          // Calculate fare
          const distance = calculateDistance(userRide.pickupLocation, userRide.dropLocation);
          const fare = (50 + parseFloat(distance) * 10).toFixed(0);
          setTotalFare(fare);
          setShowPaymentModal(true);
          setSuccess("🎉 You have reached your destination!");
        } else {
          setMyRide(userRide);
        }
      } catch (err) {
        console.error("Error loading user ride:", err);
      }
    };

    loadUserRide();
    const interval = setInterval(loadUserRide, 3000);
    return () => clearInterval(interval);
  }, [user.id]);

  const handleSearchRides = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSearching(true);
    setLoading(true);

    try {
      if (!pickupLocation || !dropLocation) {
        setError("Please select both pickup and drop locations");
        setSearching(false);
        setLoading(false);
        return;
      }

      // Fetch rides and filter by location proximity and nearby radius
      const res = await rideAPI.getActiveRides();
      const rides = res.data.rides || [];

      console.log("All rides from API:", rides);
      console.log("User searching for:", pickupLocation.name, "→", dropLocation.name);

      // Calculate if driver is within 5km radius (nearby)
      const isNearbyDriver = (driverPickupLat, driverPickupLng, riderPickupLat, riderPickupLng) => {
        if (!driverPickupLat || !driverPickupLng || !riderPickupLat || !riderPickupLng) return false;
        const R = 6371; // Earth radius in km
        const dLat = ((driverPickupLat - riderPickupLat) * Math.PI) / 180;
        const dLon = ((driverPickupLng - riderPickupLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((riderPickupLat * Math.PI) / 180) *
            Math.cos((driverPickupLat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance <= 5; // Within 5km radius
      };

      // Filter rides that match the requested route AND are nearby
      const matchingRides = rides.filter((ride) => {
        console.log("Checking ride:", {
          id: ride.id,
          pickup: ride.pickupLocation,
          drop: ride.dropLocation,
          status: ride.status,
          totalSeats: ride.totalSeats,
          passengers: ride.passengers?.length || 0
        });

        // Check if ride has available seats
        const availableSeats = ride.totalSeats - (ride.passengers?.length || 0);
        if (availableSeats <= 0) {
          console.log("Filtered: No available seats");
          return false;
        }

        // Check if ride is not already completed or dropped
        if (ride.status === "COMPLETED" || ride.status === "DROPPED") {
          console.log("Filtered: Ride already completed");
          return false;
        }

        // Check if user is not already a passenger in this ride
        const userIsPassenger = ride.passengers?.some((p) => p.userId === user.id);
        if (userIsPassenger) {
          console.log("Filtered: User is already a passenger");
          return false;
        }

        // First, try to match location by name
        let locationMatches = false;

        // The ride object has pickupLocation and dropLocation as strings
        const ridePickup = ride.pickupLocation || ride.pickup; // Try both formats
        const rideDrop = ride.dropLocation || ride.drop;

        console.log("DEBUG - Location matching:", {
          ridePickup,
          rideDrop,
          searchPickup: pickupLocation.name,
          searchDrop: dropLocation.name,
        });

        // Match location strings
        if (ridePickup && rideDrop) {
          const pickupMatch =
            ridePickup?.toLowerCase().includes(pickupLocation.name?.toLowerCase()) ||
            pickupLocation.name?.toLowerCase().includes(ridePickup?.toLowerCase());

          const dropMatch =
            rideDrop?.toLowerCase().includes(dropLocation.name?.toLowerCase()) ||
            dropLocation.name?.toLowerCase().includes(rideDrop?.toLowerCase());

          console.log("Location match result:", { pickupMatch, dropMatch });
          locationMatches = pickupMatch && dropMatch;
        }

        // If location doesn't match, filter out
        if (!locationMatches) {
          console.log("Filtered: Location doesn't match - pickup:", ridePickup, "drop:", rideDrop);
          return false;
        }

        // If location matches, check if driver is nearby (if coordinates available)
        if (ride.pickupLatitude && ride.pickupLongitude) {
          const driverNearby = isNearbyDriver(
            ride.pickupLatitude,
            ride.pickupLongitude,
            pickupLocation.lat || 18.5204,
            pickupLocation.lng || 73.8567
          );
          if (!driverNearby) {
            console.log("Filtered: Driver not nearby (>5km away)");
            return false;
          }
        } else {
          console.log("Note: No driver coordinates, skipping nearby distance check");
        }

        // Location matches and driver is nearby (or coordinates not available)
        return true;
      });

      console.log("Matching rides found:", matchingRides.length);

      if (matchingRides.length === 0) {
        // If no matching rides found, show error - don't show all rides
        console.log("No matching nearby rides found");
        setAvailableRides([]);
        setError("❌ No nearby rides found for your route. Try different locations or check back later.");
        setLoading(false);
        setSearching(false);
        return;
      }

      setAvailableRides(matchingRides);
      setSuccess(`✅ Found ${matchingRides.length} matching route(s)!`);

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Search error:", err);
      setError(err.response?.data?.message || "Failed to search rides");
    } finally {
      setSearching(false);
      setLoading(false);
    }
  };

  const handleBookRide = async (rideId) => {
    setLoading(true);
    try {
      if (!pickupLocation || !dropLocation) {
        setError("Please select pickup and drop locations");
        setLoading(false);
        return;
      }

      // Create ride request data - this will NOT save to DB yet
      const requestData = {
        riderId: parseInt(user.id),
        pickupLocation: pickupLocation.name,
        dropLocation: dropLocation.name,
      };

      console.log("Sending ride request with data:", requestData);
      
      // Send ride request to backend - saved as RideRequest, not RidePassenger
      // Will only create RidePassenger when driver accepts
      const res = await rideAPI.createRideRequest(requestData);
      
      // Set local state for immediate UI feedback
      // The actual RidePassenger record will be created only when driver accepts
      setMyRide({ 
        ...availableRides.find((r) => r.id === rideId), 
        passenger: { 
          riderId: user.id,
          riderName: user.name,
          status: "PENDING" // Request is pending driver acceptance
        } 
      });
      setSuccess("✅ Ride request sent! Waiting for driver to accept...");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error booking ride:", err);
      console.error("Backend response:", err.response?.data);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to request ride";
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = async (paymentMethod, amount) => {
    setLoading(true);
    try {
      if (!myRide || !myRide.id) {
        setError("Ride information missing. Cannot process payment.");
        setLoading(false);
        return;
      }

      // Build payment payload with all required fields
      const paymentPayload = {
        rideId: myRide.id,
        riderId: user.id,
        driverId: myRide.driverId,
        amount: parseFloat(amount),
        method: paymentMethod.toUpperCase(),
      };

      console.log("🔄 Processing payment via Payment Service:", paymentPayload);
      
      // Call Payment Service to record payment
      const response = await paymentAPI.processPayment(paymentPayload);
      console.log("✅ Payment recorded:", response.data);

      // Clear UI state
      setShowPaymentModal(false);
      setMyRide(null);
      setPickupLocation(null);
      setDropLocation(null);

      setSuccess("✅ Payment completed! Thank you for using Carpool.");
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("❌ Payment processing error:", err);
      setError(err.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-green-600">🚕 Rider Dashboard</h1>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 pb-3 border-b-2 border-gray-200">
            <button
              onClick={() => setActiveTab("available")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === "available"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Car size={18} />
              Available Rides
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === "active"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Users size={18} />
              Active Rides
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === "payments"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <CreditCard size={18} />
              Payments
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === "profile"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <User size={18} />
              Profile
            </button>
          </div>

          {/* Payment & Wallet Info Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
            {/* Ride Status */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg">
              <p className="text-xs text-gray-600 font-semibold uppercase">Ride Status</p>
              <p className="text-lg font-bold text-green-600">
                {myRide ? "🚗 On Trip" : "✅ Ready"}
              </p>
            </div>

            {/* Current Fare */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg">
              <p className="text-xs text-gray-600 font-semibold uppercase">Current Fare</p>
              <p className="text-lg font-bold text-blue-600">
                ₹{myRide && showPaymentModal ? totalFare : "0"}
              </p>
            </div>

            {/* Total Spent */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg">
              <p className="text-xs text-gray-600 font-semibold uppercase">Total Spent</p>
              <p className="text-lg font-bold text-orange-600">
                ₹850
              </p>
            </div>

            {/* Wallet Balance */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg">
              <p className="text-xs text-gray-600 font-semibold uppercase">Wallet Balance</p>
              <p className="text-lg font-bold text-purple-600">
                ₹3,250
              </p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
            <span>✅</span>
            {success}
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <RidePaymentModal
            ride={myRide}
            passenger={myRide?.passenger}
            totalFare={totalFare}
            onPaymentComplete={handlePaymentComplete}
            loading={loading}
          />
        )}

        {/* Main Layout - Tab Content - Fixed */}
        {activeTab === "available" ? (
          // Search for Rides
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left Column - Search Form */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-20">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Search size={24} />
                  Find a Ride
                </h2>

                <form onSubmit={handleSearchRides} className="space-y-4">
                  {/* Pickup Location */}
                  <LocationPicker
                    label="📍 Pickup Location"
                    value={pickupLocation?.name || ""}
                    onSelect={setPickupLocation}
                    required={true}
                  />

                  {/* Drop Location */}
                  <LocationPicker
                    label="📍 Drop Location"
                    value={dropLocation?.name || ""}
                    onSelect={setDropLocation}
                    required={true}
                  />

                  {/* Find Routes Button */}
                  <button
                    type="submit"
                    disabled={searching || loading}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {searching ? (
                      <>
                        <Loader size={20} className="animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search size={20} />
                        Find Routes
                      </>
                    )}
                  </button>

                  {/* Available Locations */}
                  {availableLocations.pickups.length > 0 && (
                    <div className="mt-6 pt-6 border-t-2 border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-3">📍 Available Pickup Locations:</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {availableLocations.pickups.map((location) => (
                          <button
                            key={`pickup-${location}`}
                            onClick={() => setPickupLocation({ name: location, lat: 0, lng: 0 })}
                            className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                              pickupLocation?.name === location
                                ? "bg-green-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {location}
                          </button>
                        ))}
                      </div>

                      <p className="text-sm font-semibold text-gray-700 mb-3">🏁 Available Drop Locations:</p>
                      <div className="flex flex-wrap gap-2">
                        {availableLocations.drops.map((location) => (
                          <button
                            key={`drop-${location}`}
                            onClick={() => setDropLocation({ name: location, lat: 0, lng: 0 })}
                            className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                              dropLocation?.name === location
                                ? "bg-green-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {location}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Right Column - Available Rides */}
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Available Routes</h2>

              {availableRides.length > 0 ? (
                <div className="space-y-4">
                  {availableRides.map((ride) => {
                    console.log("Rendering ride card:", ride);
                    const distance = parseFloat(calculateDistance(ride.pickupLocation, ride.dropLocation)) || 5.0;
                    const fare = isNaN(distance) ? "100" : (50 + distance * 10).toFixed(0);
                    const availableSeats = Math.max(0, (ride.totalSeats || 4) - (ride.passengers?.length || 0));

                    return (
                      <div
                        key={ride.id}
                        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition border-l-4 border-green-600"
                      >
                        {/* Header - Route and Fare */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                              📍 {ride.pickup || ride.pickupLocation?.name || ride.route || "Unknown Route"}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">Distance: {isNaN(distance) ? "5.0" : distance} km</p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-green-600">₹{isNaN(fare) ? "100" : fare}</p>
                            <p className="text-xs text-gray-600">Est. Time: {isNaN(distance) ? "8" : Math.ceil(distance / 40)} min</p>
                          </div>
                        </div>

                        {/* Driver Information */}
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg mb-4 border-l-4 border-blue-500">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Driver</p>
                              <p className="text-lg font-bold text-gray-800">{ride.driverName || "Unknown"}</p>
                              <p className="text-xs text-gray-600 mt-1">Phone: +91-9876543210</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Rating</p>
                              <p className="text-2xl font-bold text-yellow-600">⭐ {ride.rating || "4.8"}</p>
                              <p className="text-xs text-gray-600">({ride.reviews || "120"} reviews)</p>
                            </div>
                          </div>
                        </div>

                        {/* Vehicle & Seats Information */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          <div className="bg-purple-50 p-3 rounded-lg border-l-2 border-purple-500">
                            <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Vehicle</p>
                            <p className="text-sm font-bold text-purple-600">{ride.vehicleType || "Swift"}</p>
                            <p className="text-xs text-gray-600">Color: White</p>
                          </div>
                          <div className="bg-yellow-50 p-3 rounded-lg border-l-2 border-yellow-500">
                            <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Available Seats</p>
                            <p className="text-2xl font-bold text-yellow-600">{availableSeats}</p>
                            <p className="text-xs text-gray-600">of {ride.totalSeats}</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg border-l-2 border-green-500">
                            <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Fare Type</p>
                            <p className="text-sm font-bold text-green-600">₹{isNaN(distance) || distance === 0 ? "20" : (parseFloat(fare) / distance).toFixed(0)}/km</p>
                            <p className="text-xs text-gray-600">+ ₹50 base</p>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg border-l-2 border-blue-500">
                            <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Status</p>
                            <p className="text-sm font-bold text-blue-600">🟢 Active</p>
                            <p className="text-xs text-gray-600">Arriving soon</p>
                          </div>
                        </div>

                        {/* Ride Details */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-4 border-t-2 border-b-2 border-gray-300">
                          <p className="text-xs text-gray-600 uppercase font-semibold mb-3">Ride Details</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">📤 Pickup Time:</span>
                              <span className="font-semibold">10:30 AM</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">📍 Pickup Location:</span>
                              <span className="font-semibold">{ride.pickup || ride.pickupLocation?.name || "Not specified"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">🏁 Drop Location:</span>
                              <span className="font-semibold">{ride.drop || ride.dropLocation?.name || "Not specified"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">👥 Other Passengers:</span>
                              <span className="font-semibold">{Math.max(0, (ride.passengers?.length || 1) - 1)} person(s)</span>
                            </div>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                          <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">✓ AC</span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">✓ Music</span>
                          <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-semibold">✓ Premium</span>
                          <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-semibold">✓ Safe Travel</span>
                        </div>

                        {/* Booking Button */}
                        <button
                          onClick={() => handleBookRide(ride.id)}
                          disabled={loading || availableSeats === 0}
                          className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <>
                              <Loader size={20} className="animate-spin" />
                              Booking...
                            </>
                          ) : availableSeats === 0 ? (
                            "❌ No Seats Available"
                          ) : (
                            <>
                              <MapPin size={20} />
                              Book This Ride - ₹{isNaN(fare) ? "100" : fare}
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {searching ? "Searching..." : "No Routes Found"}
                  </h2>
                  <p className="text-gray-600">
                    {searching
                      ? "Finding available routes for you..."
                      : "Select pickup and drop locations, then click 'Find Routes' to see available rides"}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "active" ? (
          // Active Rides Tab - Shows driver requests and active rides
          <div className="space-y-8">
            {/* Onboarding Section - Show driver requests for rider */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl shadow-lg p-8 border-l-4 border-blue-600">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                🚗 Driver Requests ({driverRequests.length})
              </h2>
              
              {driverRequests.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {driverRequests.map((driver) => (
                    <div key={driver.id} className="bg-white rounded-lg p-6 border-2 border-blue-200 hover:shadow-lg transition">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{driver.name}</h3>
                          <p className="text-sm text-gray-600">⭐ {driver.rating} • {driver.reviews} rides</p>
                        </div>
                        <span className="text-2xl">👨‍💼</span>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm">
                        <p className="text-gray-700 mb-2"><strong>Vehicle:</strong> {driver.vehicleType} • {driver.vehicleColor}</p>
                        <p className="text-gray-700 mb-2"><strong>Phone:</strong> {driver.phone}</p>
                        <p className="text-gray-700"><strong>Route:</strong> {driver.pickupLocation} → {driver.dropLocation}</p>
                      </div>

                      <div className="flex gap-2">
                        <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
                          ✓ Accept
                        </button>
                        <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">
                          ✕ Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-lg">
                  <p className="text-gray-600 text-lg">📭 No driver requests at the moment</p>
                  <p className="text-gray-500 text-sm mt-2">Find a ride and drivers will request to pick you up</p>
                </div>
              )}
            </div>

            {/* Active Ride Status */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">🚗 Current Ride Status</h2>
              {myRide && (myRide.passenger.status === PASSENGER_STATUS.MATCHED ||
                myRide.passenger.status === PASSENGER_STATUS.BOARDED ||
                myRide.passenger.status === PASSENGER_STATUS.DROPPED) ? (
                <RiderActiveRideStatus
                  ride={myRide}
                  passenger={myRide.passenger}
                  onProceedToPayment={() => {
                    const distance = calculateDistance(myRide.pickupLocation, myRide.dropLocation);
                    const fare = (50 + parseFloat(distance) * 10).toFixed(0);
                    setTotalFare(fare);
                    setShowPaymentModal(true);
                  }}
                  loading={loading}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">📪 No active rides at the moment</p>
                  <button
                    onClick={() => setActiveTab("available")}
                    className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Find a Ride
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "payments" ? (
          // Payments Tab
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">💳 Payment History</h2>
            <div className="space-y-4">
              {/* Sample Payment History */}
              <div className="border-l-4 border-green-600 bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800">Hinjewadi → Kothrud</p>
                    <p className="text-sm text-gray-600">Jan 28, 2026 • 10:30 AM</p>
                    <p className="text-xs text-green-600 mt-1">✓ Payment Complete</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">₹110</p>
                    <p className="text-xs text-gray-600">6 km</p>
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-green-600 bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800">Baner → Wakad</p>
                    <p className="text-sm text-gray-600">Jan 27, 2026 • 03:15 PM</p>
                    <p className="text-xs text-green-600 mt-1">✓ Payment Complete</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">₹85</p>
                    <p className="text-xs text-gray-600">3.5 km</p>
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-green-600 bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800">Aundh → FC Road</p>
                    <p className="text-sm text-gray-600">Jan 26, 2026 • 08:45 AM</p>
                    <p className="text-xs text-green-600 mt-1">✓ Payment Complete</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">₹135</p>
                    <p className="text-xs text-gray-600">8.5 km</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-t-4 border-green-600">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Total Rides</p>
                  <p className="text-3xl font-bold text-green-600">12</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Spent</p>
                  <p className="text-3xl font-bold text-green-600">₹850</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Avg. Ride Cost</p>
                  <p className="text-3xl font-bold text-green-600">₹70.83</p>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "profile" ? (
          // Profile Tab
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">👤 My Profile</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Profile Info */}
              <div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border-l-4 border-blue-600 mb-6">
                  <p className="text-gray-600 text-sm mb-2">Name</p>
                  <p className="text-2xl font-bold text-gray-800">{user?.name || "Alex Kumar"}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border-l-4 border-purple-600 mb-6">
                  <p className="text-gray-600 text-sm mb-2">Email</p>
                  <p className="text-lg font-semibold text-gray-800">{user?.email || "alex@example.com"}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border-l-4 border-green-600 mb-6">
                  <p className="text-gray-600 text-sm mb-2">Rating</p>
                  <p className="text-2xl font-bold text-yellow-600">⭐ 4.8 (48 reviews)</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border-l-4 border-orange-600">
                  <p className="text-gray-600 text-sm mb-2">Member Since</p>
                  <p className="text-lg font-semibold text-gray-800">January 2026</p>
                </div>
              </div>

              {/* Stats */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Ride Statistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Total Rides</span>
                    <span className="text-2xl font-bold text-blue-600">12</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Total Distance</span>
                    <span className="text-2xl font-bold text-green-600">123 km</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Total Spent</span>
                    <span className="text-2xl font-bold text-orange-600">₹850</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Favorite Driver</span>
                    <span className="text-lg font-bold text-purple-600">Rajesh K.</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
                  <p className="text-gray-700 font-semibold mb-2">Safety Badges</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">✓ Verified Phone</span>
                    <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">✓ Email Verified</span>
                    <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">✓ Safe Rider</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Show active ride status if available
          myRide && myRide.passenger.status !== PASSENGER_STATUS.DROPPED ? (
            <RiderActiveRideStatus
              ride={myRide}
              passenger={myRide.passenger}
              onProceedToPayment={() => {
                const distance = calculateDistance(myRide.pickupLocation, myRide.dropLocation);
                const fare = (50 + parseFloat(distance) * 10).toFixed(0);
                setTotalFare(fare);
                setShowPaymentModal(true);
              }}
              loading={loading}
            />
          ) : null
        )}
      </div>
    </div>
  );
}
