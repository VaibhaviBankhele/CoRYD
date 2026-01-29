package carpool.ride.repository;

import carpool.ride.entity.RidePassenger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface RidePassengerRepository extends JpaRepository<RidePassenger, Long> {
    
    // Get all passengers for a specific ride
    List<RidePassenger> findByRideId(Long rideId);
    
    // Get currently boarded passengers
    List<RidePassenger> findByRideIdAndStatus(Long rideId, RidePassenger.PassengerStatus status);
    
    // Get passengers who need to pay
    @Query("SELECT p FROM RidePassenger p WHERE p.status = 'DROPPED' AND p.paymentCompleted = false")
    List<RidePassenger> findPassengersNeedingPayment();
    
    // Count current passengers in ride
    @Query("SELECT COUNT(p) FROM RidePassenger p WHERE p.rideId = ?1 AND p.status = 'BOARDED'")
    Long countCurrentPassengers(Long rideId);
    
    // Get all passengers for a rider
    List<RidePassenger> findByRiderId(Long riderId);
    
    boolean existsByRideIdAndRiderId(Long rideId, Long riderId);

}