package carpool.ride.service;

import carpool.ride.dto.CreateRideDTO;
import carpool.ride.dto.CreateRideRequestDTO;
import carpool.ride.entity.Ride;
import carpool.ride.entity.RidePassenger;
import carpool.ride.entity.RideRequest;
import carpool.ride.repository.RideRepository;
import carpool.ride.repository.RidePassengerRepository;
import carpool.ride.repository.RideRequestRepository;
import carpool.ride.util.MapDistanceUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RideService {
    
    @Autowired
    private RideRepository rideRepository;
    
    @Autowired
    private RideRequestRepository requestRepository;
    
    @Autowired
    private RidePassengerRepository passengerRepository;
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private MapDistanceUtil mapDistanceUtil;
    
    /**
     * Driver creates a ride
     */
    public Ride createRide(CreateRideDTO dto) {
        String userServiceUrl = "http://localhost:8081/api/users/" + dto.getDriverId();
        Map driver = restTemplate.getForObject(userServiceUrl, Map.class);
        
        Ride ride = new Ride();
        ride.setDriverId(dto.getDriverId());
        ride.setDriverName((String) driver.get("name"));
        ride.setPickupLocation(dto.getPickupLocation());
        ride.setDropLocation(dto.getDropLocation());
        ride.setRoute(dto.getRoute());
        ride.setTotalSeats(dto.getTotalSeats());
        ride.setAvailableSeats(dto.getTotalSeats()); // Initially all seats available
        ride.setStatus(Ride.RideStatus.WAITING);
        ride.setCreatedAt(LocalDateTime.now());
        
        // Store coordinates
        ride.setPickupLatitude(dto.getPickupLatitude());
        ride.setPickupLongitude(dto.getPickupLongitude());
        ride.setDropLatitude(dto.getDropLatitude());
        ride.setDropLongitude(dto.getDropLongitude());
        
        // Calculate total route distance
        try {
            double distance = mapDistanceUtil.calculateDistance(
                dto.getPickupLatitude(), dto.getPickupLongitude(),
                dto.getDropLatitude(), dto.getDropLongitude()
            );
            
            long duration = mapDistanceUtil.calculateDuration(
                dto.getPickupLatitude(), dto.getPickupLongitude(),
                dto.getDropLatitude(), dto.getDropLongitude()
            );
            
            ride.setDistanceInKm(distance);
            ride.setEstimatedDurationMinutes(duration);
            
            System.out.println("✅ Ride created: " + distance + " km, " + duration + " min");
            
        } catch (Exception e) {
            System.err.println("⚠️ Distance calculation failed");
            ride.setDistanceInKm(0.0);
            ride.setEstimatedDurationMinutes(0L);
        }
        
        return rideRepository.save(ride);
    }
    
    /**
     * Rider creates ride request - this will trigger matching
     */
    public RideRequest createRideRequest(CreateRideRequestDTO dto) {
        String userServiceUrl = "http://localhost:8081/api/users/" + dto.getRiderId();
        Map rider = restTemplate.getForObject(userServiceUrl, Map.class);
        
        RideRequest request = new RideRequest();
        request.setRiderId(dto.getRiderId());
        request.setRiderName((String) rider.get("name"));
        request.setPickupLocation(dto.getPickupLocation());
        request.setDropLocation(dto.getDropLocation());
        request.setStatus(RideRequest.RequestStatus.PENDING);
        request.setCreatedAt(LocalDateTime.now());
        
        RideRequest savedRequest = requestRepository.save(request);
        
        // Trigger matching
        callMatchingService(savedRequest);
        
        return savedRequest;
    }
    
    /**
     * Get all pending requests for a specific ride
     */
    public List<RideRequest> getPendingRequestsForRide(Long rideId) {
        // Verify ride exists
        Ride ride = rideRepository.findById(rideId)
            .orElseThrow(() -> new RuntimeException("Ride not found with id: " + rideId));
        
        // Get all requests, prioritizing those specifically matched to this ride
        List<RideRequest> allRequests = requestRepository.findAll();
        
        // First, get requests that are MATCHED to this specific ride
        List<RideRequest> matchedToThisRide = allRequests.stream()
            .filter(req -> req.getMatchedRideId() != null && 
                          req.getMatchedRideId().equals(rideId) &&
                          req.getStatus() != RideRequest.RequestStatus.COMPLETED)
            .toList();
        
        if (!matchedToThisRide.isEmpty()) {
            return matchedToThisRide;
        }
        
        // If no matched requests, look for PENDING requests with matching route
        return allRequests.stream()
            .filter(req -> req.getStatus() == RideRequest.RequestStatus.PENDING &&
                          req.getPickupLocation().equalsIgnoreCase(ride.getPickupLocation()) &&
                          req.getDropLocation().equalsIgnoreCase(ride.getDropLocation()))
            .toList();
    }
    
    /**
     * Driver accepts a ride request - converts RideRequest to RidePassenger
     */
    public RidePassenger acceptRideRequest(Long requestId) {
        RideRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Request not found"));
        
        if (request.getStatus() != RideRequest.RequestStatus.PENDING) {
            throw new RuntimeException("Request is not in PENDING status");
        }
        
        // Find a matching ride (by location names)
        Ride ride = rideRepository.findAll().stream()
            .filter(r -> r.getPickupLocation().equalsIgnoreCase(request.getPickupLocation()) &&
                        r.getDropLocation().equalsIgnoreCase(request.getDropLocation()) &&
                        r.getAvailableSeats() > 0)
            .findFirst()
            .orElseThrow(() -> new RuntimeException("No matching ride found"));
        
        // Create RidePassenger from RideRequest
        RidePassenger passenger = new RidePassenger();
        passenger.setRideId(ride.getId());
        passenger.setRiderId(request.getRiderId());
        passenger.setRiderName(request.getRiderName());
        passenger.setBoardingLocation(request.getPickupLocation());
        passenger.setDropLocation(request.getDropLocation());
        passenger.setStatus(RidePassenger.PassengerStatus.MATCHED);
        passenger.setJoinedAt(LocalDateTime.now());
        
        RidePassenger savedPassenger = passengerRepository.save(passenger);
        
        // Update ride available seats
        ride.setAvailableSeats(ride.getAvailableSeats() - 1);
        rideRepository.save(ride);
        
        // Mark request as MATCHED
        request.setStatus(RideRequest.RequestStatus.MATCHED);
        request.setMatchedRideId(ride.getId());
        requestRepository.save(request);
        
        return savedPassenger;
    }
    
    /**
     * Driver rejects a ride request
     */
    public void rejectRideRequest(Long requestId) {
        RideRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Request not found"));
        
        // Change status to something other than PENDING
        // Could use COMPLETED to mark as no longer available
        request.setStatus(RideRequest.RequestStatus.COMPLETED);
        requestRepository.save(request);
    }
    
    /**
     * Add passenger to ride (called by matching service)
     */
    public RidePassenger addPassengerToRide(Long rideId, Long riderId, 
                                            String pickupLocation, Double pickupLat, Double pickupLng,
                                            String dropLocation, Double dropLat, Double dropLng) {
        
        Ride ride = rideRepository.findById(rideId)
            .orElseThrow(() -> new RuntimeException("Ride not found"));
        
        // Check if seats available
        if (ride.getAvailableSeats() <= 0) {
            throw new RuntimeException("No seats available");
        }

        if (passengerRepository.existsByRideIdAndRiderId(rideId, riderId)) {
            throw new RuntimeException("Passenger already joined this ride");
        }
        
        // Get rider info
        String userServiceUrl = "http://localhost:8081/api/users/" + riderId;
        Map rider = restTemplate.getForObject(userServiceUrl, Map.class);
        
        // Create passenger record
        RidePassenger passenger = new RidePassenger();
        passenger.setRideId(rideId);
        passenger.setRiderId(riderId);
        passenger.setRiderName((String) rider.get("name"));
        passenger.setBoardingLocation(pickupLocation);
        passenger.setBoardingLatitude(pickupLat);
        passenger.setBoardingLongitude(pickupLng);
        passenger.setDropLocation(dropLocation);
        passenger.setDropLatitude(dropLat);
        passenger.setDropLongitude(dropLng);
        passenger.setStatus(RidePassenger.PassengerStatus.MATCHED);
        passenger.setJoinedAt(LocalDateTime.now());
        passenger.setPaymentCompleted(false);
        passenger.setRated(false);
        
        // Calculate passenger's individual distance and fare
        try {
            double distance = mapDistanceUtil.calculateDistance(
                pickupLat, pickupLng, dropLat, dropLng
            );
            passenger.setDistanceInKm(distance);
            
            // Calculate fare: Base ₹50 + ₹10/km
            double fare = 50.0 + (distance * 10.0);
            passenger.setFareAmount(fare);
            
            System.out.println("✅ Passenger added: " + distance + " km, Fare: ₹" + fare);
            
        } catch (Exception e) {
            System.err.println("⚠️ Distance calculation failed for passenger");
            passenger.setDistanceInKm(0.0);
            passenger.setFareAmount(50.0);
        }
        
        // Update available seats
        ride.setAvailableSeats(ride.getAvailableSeats() - 1);
        rideRepository.save(ride);

        
        return passengerRepository.save(passenger);
    }
    
    /**
     * Passenger boards the ride (driver confirms pickup)
     */
    public RidePassenger boardPassenger(Long passengerId) {
        RidePassenger passenger = passengerRepository.findById(passengerId)
            .orElseThrow(() -> new RuntimeException("Passenger not found"));
        
        passenger.setStatus(RidePassenger.PassengerStatus.BOARDED);
        passenger.setBoardedAt(LocalDateTime.now());
        
        return passengerRepository.save(passenger);
    }
    
    /**
     * Passenger drops off (seat becomes free again!)
     */
    public RidePassenger dropPassenger(Long passengerId) {
        System.out.println("🔷 DROP PASSENGER - ID: " + passengerId);
        
        RidePassenger passenger = passengerRepository.findById(passengerId)
            .orElseThrow(() -> {
                String error = "Passenger not found with id: " + passengerId;
                System.err.println("❌ " + error);
                return new RuntimeException(error);
            });

        System.out.println("  📍 Passenger Status: " + passenger.getStatus());
        System.out.println("  💰 Fare Amount: " + passenger.getFareAmount());
        
        passenger.setStatus(RidePassenger.PassengerStatus.DROPPED);
        passenger.setDroppedAt(LocalDateTime.now());

        Ride ride = rideRepository.findById(passenger.getRideId())
            .orElseThrow(() -> new RuntimeException("Ride not found with id: " + passenger.getRideId()));

        // ✅ FIX: just increment seat
        System.out.println("  🚗 Freeing seat - Available: " + ride.getAvailableSeats() + " → " + (ride.getAvailableSeats() + 1));
        ride.setAvailableSeats(ride.getAvailableSeats() + 1);
        rideRepository.save(ride);

        triggerPayment(passenger);
        
        System.out.println("✅ Passenger dropped successfully!");

        return passengerRepository.save(passenger);
    }

    
    /**
     * Get all passengers in a ride
     */
    public List<RidePassenger> getRidePassengers(Long rideId) {
        return passengerRepository.findByRideId(rideId);
    }
    
    /**
     * Get currently boarded passengers
     */
    public List<RidePassenger> getCurrentPassengers(Long rideId) {
        return passengerRepository.findByRideIdAndStatus(rideId, RidePassenger.PassengerStatus.BOARDED);
    }
    
    /**
     * Update ride status
     */
    public Ride updateRideStatus(Long rideId, Ride.RideStatus status) {
        Ride ride = rideRepository.findById(rideId)
            .orElseThrow(() -> new RuntimeException("Ride not found"));
        
        ride.setStatus(status);
        if (status == Ride.RideStatus.IN_PROGRESS) {
            ride.setStartedAt(LocalDateTime.now());
        } else if (status == Ride.RideStatus.COMPLETED) {
            ride.setCompletedAt(LocalDateTime.now());
            
            // Trigger payments for all remaining passengers
            List<RidePassenger> remainingPassengers = passengerRepository
                .findByRideIdAndStatus(rideId, RidePassenger.PassengerStatus.BOARDED);
            
            for (RidePassenger passenger : remainingPassengers) {
                dropPassenger(passenger.getId());
            }
        }
        
        return rideRepository.save(ride);
    }
    
    /**
     * Get active rides with available seats
     */
    public List<Ride> getActiveRides() {
        return rideRepository.findByStatus(Ride.RideStatus.WAITING);
    }

    /**
     * Get rides for a specific driver (all statuses)
     */
    public List<Ride> getRidesByDriver(Long driverId) {
        return rideRepository.findByDriverId(driverId);
    }
    
    /**
     * Trigger payment for dropped passenger
     */
    private void triggerPayment(RidePassenger passenger) {
        String paymentServiceUrl = "http://localhost:8085/api/payments/process";
        
        Map<String, Object> paymentData = new HashMap<>();
        paymentData.put("rideId", passenger.getRideId());
        paymentData.put("riderId", passenger.getRiderId());
        paymentData.put("amount", passenger.getFareAmount());
        paymentData.put("method", "UPI");
        
        new Thread(() -> {
            try {
                restTemplate.postForObject(paymentServiceUrl, paymentData, Map.class);
                System.out.println("💳 Payment triggered for passenger " + passenger.getRiderId());
            } catch (Exception e) {
                System.err.println("⚠️ Payment service unavailable");
            }
        }).start();
    }
    
    /**
     * Call matching service
     */
    private void callMatchingService(RideRequest request) {
        String matchingServiceUrl = "http://localhost:8083/api/matching/find-match";
        
        Map<String, Object> payload = new HashMap<>();
        payload.put("requestId", request.getId());
        payload.put("pickupLocation", request.getPickupLocation());
        payload.put("dropLocation", request.getDropLocation());
        
        new Thread(() -> {
            try {
                restTemplate.postForObject(matchingServiceUrl, payload, Map.class);
            } catch (Exception e) {
                System.out.println("Matching service unavailable");
            }
        }).start();
    }
    public Ride getRideById(Long rideId) {
        return rideRepository.findById(rideId)
            .orElseThrow(() -> new RuntimeException("Ride not found with id: " + rideId));
    }

    /**
     * Get passenger by ID
     */
    public RidePassenger getPassengerById(Long passengerId) {
        return passengerRepository.findById(passengerId)
            .orElseThrow(() -> new RuntimeException("Passenger not found with id: " + passengerId));
    }

    /**
     * Delete all rides - For testing/debugging only
     */
    public void deleteAllRides() {
        passengerRepository.deleteAll();
        requestRepository.deleteAll();
        rideRepository.deleteAll();
    }
}