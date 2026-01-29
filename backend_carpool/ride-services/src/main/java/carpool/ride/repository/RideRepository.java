package carpool.ride.repository;

import carpool.ride.entity.Ride;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RideRepository extends JpaRepository<Ride, Long> {
    List<Ride> findByStatus(Ride.RideStatus status);
    List<Ride> findByDriverId(Long driverId);
}
