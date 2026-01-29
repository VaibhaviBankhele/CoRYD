import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { rideAPI, notificationAPI, paymentAPI } from "../../api/axiosAPI";
import LocationPicker from "../../components/Common/LocationPicker";
import IncomingRideRequest from "../../components/Ride/IncomingRideRequest";
import ActiveDriverRideCard from "../../components/Ride/ActiveDriverRideCard";
import { initiatePayment, convertToPaise } from "../../utils/razorpayUtils";
import { LogOut, Bell, Plus, Loader, TrendingUp } from "lucide-react";
import { RIDE_STATUS, PASSENGER_STATUS } from "../../utils/constants";

export default function DriverDashboardNew() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropLocation, setDropLocation] = useState(null);
  const [totalSeats, setTotalSeats] = useState(4);
  const [currentRide, setCurrentRide] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [incomingRideRequest, setIncomingRideRequest] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [processedRequestIds, setProcessedRequestIds] = useState(new Set()); // Track viewed/processed requests
  const [earnings, setEarnings] = useState(0);
  const [processingPayment, setProcessingPayment] = useState(null);
  const [sessionEarnings, setSessionEarnings] = useState(0);

  // Debug: Log user data
  useEffect(() => {
    console.log("Current user:", user);
  }, [user]);

  // Polling for ride updates
  useEffect(() => {
    if (currentRide?.id) {
      const interval = setInterval(() => {
        fetchRideDetails();
        fetchPassengers();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentRide?.id]);

  const [endpointNotFound, setEndpointNotFound] = useState(false); // Track if endpoint doesn't exist

  // Polling for incoming ride requests
  useEffect(() => {
    const checkIncomingRequests = async () => {
      if (!currentRide?.id || endpointNotFound) {
        console.log("Skipping check - currentRide.id:", currentRide?.id, "endpointNotFound:", endpointNotFound);
        return;
      }
      
      try {
        console.log("Checking for incoming requests for ride:", currentRide.id);
        const res = await rideAPI.getPendingRequests(currentRide.id);
        console.log("Raw API response:", res);
        
        // Handle various response formats from backend
        let requests = [];
        if (Array.isArray(res.data)) {
          requests = res.data;
        } else if (res.data?.requests && Array.isArray(res.data.requests)) {
          requests = res.data.requests;
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          requests = res.data.data;
        } else if (res.data) {
          requests = Array.isArray(res.data) ? res.data : [];
        }
        
        console.log("Parsed requests array:", requests);
        console.log("Requests count:", requests.length, "Processed IDs:", Array.from(processedRequestIds));
        
        // Find first unprocessed request
        let firstUnprocessedRequest = null;
        if (Array.isArray(requests) && requests.length > 0) {
          for (const req of requests) {
            console.log("Checking request ID:", req.id, "Already processed?", processedRequestIds.has(req.id));
            if (!processedRequestIds.has(req.id)) {
              firstUnprocessedRequest = req;
              console.log("Found unprocessed request:", req.id);
              break;
            }
          }
        }
        
        // Show the first unprocessed request if any and modal is not already showing
        if (firstUnprocessedRequest && !incomingRideRequest) {
          console.log("Creating modal for request:", firstUnprocessedRequest);
          const firstRequest = firstUnprocessedRequest;
          
          // Use fallback coordinates if not available
          const pickupLat = currentRide.pickupLatitude || 18.5;
          const pickupLng = currentRide.pickupLongitude || 73.8;
          const dropLat = currentRide.dropLatitude || 18.6;
          const dropLng = currentRide.dropLongitude || 73.9;
          
          const newRequest = {
            id: firstRequest.id,
            riderId: firstRequest.riderId,
            riderName: firstRequest.riderName || "Rider",
            pickupLocation: {
              name: firstRequest.pickupLocation,
              lat: pickupLat,
              lng: pickupLng,
            },
            dropLocation: {
              name: firstRequest.dropLocation,
              lat: dropLat,
              lng: dropLng,
            },
            status: firstRequest.status,
          };
          
          // Mark this request as processed BEFORE showing it to prevent duplicates
          setProcessedRequestIds(prev => new Set([...prev, firstRequest.id]));
          setIncomingRideRequest(newRequest);
          console.log("Modal state updated with request:", firstRequest.id);
        } else {
          console.log("No new unprocessed request to show. HasRequest:", !!firstUnprocessedRequest, "ModalOpen:", !!incomingRideRequest);
        }
      } catch (err) {
        // If endpoint doesn't exist (404), stop trying
        if (err.response?.status === 404) {
          console.warn("Pending requests endpoint not available (404) - stopping polls");
          setEndpointNotFound(true);
        } else {
          console.error("Error checking requests:", err.message, err.response?.status);
        }
      }
    };

    // Check immediately on ride creation, then poll
    if (currentRide?.id && !endpointNotFound) {
      console.log("Starting polling for ride:", currentRide.id);
      checkIncomingRequests();
      const interval = setInterval(checkIncomingRequests, 3000);
      return () => clearInterval(interval);
    }
  }, [currentRide?.id, endpointNotFound, processedRequestIds, incomingRideRequest]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await notificationAPI.getUnreadNotifications(user.id);
        const notifs = res.data || [];
        setNotifications(notifs);
        setUnreadCount(notifs.length);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user.id]);

  // Fetch driver earnings
  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await paymentAPI.getPaymentsForDriver(user.id);
        const payments = res.data || [];
        const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        setEarnings(total);
      } catch (err) {
        console.error("Error fetching earnings:", err);
      }
    };

    fetchEarnings();
    const interval = setInterval(fetchEarnings, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [user.id]);

  const fetchRideDetails = async () => {
    if (!currentRide?.id) return;
    try {
      const res = await rideAPI.getRideById(currentRide.id);
      setCurrentRide(res.data.ride);
    } catch (err) {
      console.error("Error fetching ride:", err);
    }
  };

  const fetchPassengers = async () => {
    if (!currentRide?.id) return;
    try {
      const res = await rideAPI.getRidePassengers(currentRide.id);
      setPassengers(res.data.allPassengers || []);
    } catch (err) {
      console.error("Error fetching passengers:", err);
    }
  };

  const handleCreateRide = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!user || !user.id) {
        setError("User not logged in properly. Please reload the page.");
        setLoading(false);
        return;
      }

      if (!pickupLocation || !dropLocation) {
        setError("Please select pickup and drop locations");
        setLoading(false);
        return;
      }

      const rideData = {
        driverId: parseInt(user.id),
        pickupLocation: pickupLocation.name,
        pickupLatitude: pickupLocation.lat,
        pickupLongitude: pickupLocation.lng,
        dropLocation: dropLocation.name,
        dropLatitude: dropLocation.lat,
        dropLongitude: dropLocation.lng,
        route: `${pickupLocation.name} → ${dropLocation.name}`,
        totalSeats: parseInt(totalSeats),
      };

      console.log("Creating ride with data:", rideData);
      console.log("User ID:", user.id, "Type:", typeof user.id);
      const res = await rideAPI.createRide(rideData);
      const ride = res.data;

      setCurrentRide(ride);
      setSuccess("✅ Ride created! Waiting for riders to book...");

      // Reset form
      setTimeout(() => {
        setPickupLocation(null);
        setDropLocation(null);
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error creating ride:", err);
      console.error("Backend response:", err.response?.data);
      console.error("Error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to create ride";
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRideRequest = async () => {
    if (!incomingRideRequest?.id) {
      setError("No ride request to accept");
      return;
    }

    setLoading(true);
    const acceptedRequestId = incomingRideRequest.id;
    
    try {
      console.log("Accepting ride request:", acceptedRequestId);
      
      // Accept the ride request (converts RideRequest to RidePassenger)
      const res = await rideAPI.acceptRequest(acceptedRequestId);
      
      console.log("Request accepted:", res.data);
      
      // IMPORTANT: Clear the modal FIRST, mark as processed SECOND
      setIncomingRideRequest(null);
      setProcessedRequestIds(prev => new Set([...prev, acceptedRequestId]));
      setSuccess("✅ Ride request accepted! Passenger added to your ride.");
      
      // Refresh passengers list
      await fetchPassengers();
    } catch (err) {
      console.error("Error accepting request:", err);
      setError("Failed to accept ride request");
    } finally {
      setLoading(false);
    }
  };

  const handleBoardPassenger = async (passengerId) => {
    setLoading(true);
    try {
      const res = await rideAPI.boardPassenger(passengerId);
      setSuccess("✅ Passenger boarded!");
      fetchPassengers();
    } catch (err) {
      setError("Failed to board passenger");
    } finally {
      setLoading(false);
    }
  };

  const handleDropPassenger = async (passengerId) => {
    setLoading(true);
    setProcessingPayment(passengerId);
    try {
      // Drop the passenger first
      const res = await rideAPI.dropPassenger(passengerId);
      
      const droppedPassenger = passengers.find(p => p.id === passengerId);
      
      // Update session earnings
      if (droppedPassenger) {
        setSessionEarnings(prev => prev + (droppedPassenger.fareAmount || 0));
        
        // Trigger payment if fare exists
        if (droppedPassenger.fareAmount && droppedPassenger.fareAmount > 0) {
          try {
            const paymentOrderRes = await paymentAPI.createPaymentOrder({
              rideId: currentRide.id,
              riderId: droppedPassenger.riderId, // Use riderId from passenger data
              driverId: user.id,
              amount: droppedPassenger.fareAmount,
              description: `CoRYD Ride Payment - ${currentRide.route || 'Ride'}`,
            });

            if (paymentOrderRes.data?.orderId) {
              await initiatePayment({
                orderId: paymentOrderRes.data.orderId, // Order ID from backend
                amount: convertToPaise(droppedPassenger.fareAmount),
                currency: "INR",
                description: `CoRYD Ride Payment`,
                passengerName: droppedPassenger.riderName || "Passenger",
                passengerEmail: droppedPassenger.riderEmail || "passenger@coryd.com",
                passengerPhone: droppedPassenger.riderPhone || user.phone,
                onSuccess: async (verificationResult) => {
                  // Backend has already verified payment
                  if (verificationResult.success) {
                    setSuccess(`💳 Payment successful! ₹${droppedPassenger.fareAmount.toFixed(2)} received`);
                    setProcessingPayment(null);
                    fetchPassengers();
                    // Refresh earnings
                    const earningsRes = await paymentAPI.getPaymentsForDriver(user.id);
                    const payments = earningsRes.data || [];
                    const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
                    setEarnings(total);
                  }
                },
                onError: (errorMsg) => {
                  setError(`Payment failed: ${errorMsg}. Passenger dropped but payment pending.`);
                  setProcessingPayment(null);
                  fetchPassengers();
                },
              });
            }
          } catch (paymentErr) {
            console.error("Payment error:", paymentErr);
            setSuccess("✅ Passenger dropped! (Payment will be processed)");
            setProcessingPayment(null);
            fetchPassengers();
          }
        } else {
          setSuccess("✅ Passenger dropped off!");
          setProcessingPayment(null);
          fetchPassengers();
        }
      }
    } catch (err) {
      setError("Failed to drop passenger");
      setProcessingPayment(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRide = async () => {
    if (
      !window.confirm(
        "Complete ride? Make sure all passengers have been dropped off."
      )
    )
      return;
    setLoading(true);
    try {
      await rideAPI.updateRideStatus(
        currentRide.id,
        RIDE_STATUS.COMPLETED
      );
      setCurrentRide(null);
      setPassengers([]);
      setSuccess("🎉 Ride completed! Total earnings: ₹" + (passengers.length * 100));
    } catch (err) {
      setError("Failed to complete ride");
    } finally {
      setLoading(false);
    }
  };

  // Simulate incoming ride request (for demo)
  const handleSimulateIncomingRequest = () => {
    setIncomingRideRequest({
      id: Math.random(),
      riderName: "John Doe",
      riderRating: "4.8",
      pickupLocation: pickupLocation,
      dropLocation: dropLocation,
      availableSeats: 2,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-blue-600">🚗 CoRYD - Driver Dashboard</h1>
            <div className="flex items-center gap-4">
              {/* Earnings Display */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-green-100 px-4 py-2 rounded-lg border border-green-300">
                <TrendingUp size={24} className="text-green-600" />
                <div>
                  <p className="text-xs text-gray-600 font-semibold">TODAY'S EARNINGS</p>
                  <p className="text-lg font-bold text-green-600">₹{earnings.toFixed(2)}</p>
                </div>
              </div>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-blue-600"
              >
                <Bell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate("/driver/profile")}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600"
              >
                👤 Profile
              </button>
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
          </div>

          {/* Payment & Earnings Info Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
            {/* Current Ride Info */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg">
              <p className="text-xs text-gray-600 font-semibold uppercase">Current Ride Status</p>
              <p className="text-lg font-bold text-blue-600">
                {currentRide ? "🚗 Active" : "⏸️ Waiting"}
              </p>
            </div>

            {/* Total Passengers */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-lg">
              <p className="text-xs text-gray-600 font-semibold uppercase">Passengers</p>
              <p className="text-lg font-bold text-yellow-600">
                {currentRide ? passengers.length : 0}
              </p>
            </div>

            {/* Session Earnings */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg">
              <p className="text-xs text-gray-600 font-semibold uppercase">Session Earnings</p>
              <p className="text-lg font-bold text-green-600">
                ₹{sessionEarnings.toFixed(2)}
              </p>
            </div>

            {/* Total Wallet Balance */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg">
              <p className="text-xs text-gray-600 font-semibold uppercase">Wallet Balance</p>
              <p className="text-lg font-bold text-purple-600">
                ₹2,450
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

        {/* Incoming Ride Request Modal */}
        {console.log("=== RENDER CYCLE ===", "incomingRideRequest:", incomingRideRequest, "Type:", typeof incomingRideRequest, "Truthy:", !!incomingRideRequest)}
        {incomingRideRequest ? (
          <>
            {console.log("Rendering IncomingRideRequest component with:", incomingRideRequest)}
            <IncomingRideRequest
              ride={incomingRideRequest}
              onAccept={handleAcceptRideRequest}
              onReject={() => {
                console.log("Rejecting request:", incomingRideRequest.id);
                // Mark as processed so we don't show it again
                setProcessedRequestIds(prev => new Set([...prev, incomingRideRequest.id]));
                setIncomingRideRequest(null);
              }}
              loading={loading}
            />
          </>
        ) : (
          console.log("incomingRideRequest is falsy, not rendering component")
        )}

        {/* Main Layout */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Create/View Rides */}
          <div className="md:col-span-1">
            {!currentRide ? (
              // Create New Ride Form
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-20">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Plus size={24} />
                  Create New Ride
                </h2>

                <form onSubmit={handleCreateRide} className="space-y-4">
                  {/* Pickup Location */}
                  <LocationPicker
                    label="Pickup Location"
                    value={pickupLocation?.name || ""}
                    onSelect={setPickupLocation}
                    required={true}
                  />

                  {/* Drop Location */}
                  <LocationPicker
                    label="Drop Location"
                    value={dropLocation?.name || ""}
                    onSelect={setDropLocation}
                    required={true}
                  />

                  {/* Total Seats */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Available Seats
                    </label>
                    <select
                      value={totalSeats}
                      onChange={(e) => setTotalSeats(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>
                          {num} Seat{num > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Ride Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader size={20} className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus size={20} />
                        Create Ride
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              // Current Ride Stats
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-20">
                <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Ride Stats</h2>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border-l-4 border-yellow-500">
                    <p className="text-xs text-gray-600 uppercase mb-1">Waiting for Pickup</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {passengers.filter((p) => p.status === PASSENGER_STATUS.MATCHED).length}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-l-4 border-green-500">
                    <p className="text-xs text-gray-600 uppercase mb-1">In Ride</p>
                    <p className="text-3xl font-bold text-green-600">
                      {passengers.filter((p) => p.status === PASSENGER_STATUS.BOARDED).length}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-l-4 border-blue-500">
                    <p className="text-xs text-gray-600 uppercase mb-1">Total Earnings</p>
                    <p className="text-3xl font-bold text-blue-600">
                      ₹{passengers.filter((p) => p.status === PASSENGER_STATUS.DROPPED).length * 100}
                    </p>
                  </div>

                  <button
                    onClick={() => setCurrentRide(null)}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Create Another Ride
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Active Ride */}
          <div className="md:col-span-2">
            {currentRide ? (
              <>
                <ActiveDriverRideCard
                  ride={currentRide}
                  passengers={passengers}
                  onBoardPassenger={handleBoardPassenger}
                  onDropPassenger={handleDropPassenger}
                  onCompleteRide={handleCompleteRide}
                  loading={loading}
                  processingPayment={processingPayment}
                />

                {/* Demo: Simulate Incoming Request */}
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-2">🧪 Demo Controls</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSimulateIncomingRequest}
                      className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 text-sm"
                    >
                      📨 Simulate Rider Request
                    </button>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <div className={`w-2 h-2 rounded-full ${currentRide && !endpointNotFound ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      Polling: {currentRide && !endpointNotFound ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🚗</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">No Active Ride</h2>
                <p className="text-gray-600">Create a new ride to start earning!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
