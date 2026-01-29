package carpool.matching.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "matches")
@Data
public class Match {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long rideRequestId;
    private Long rideId;
    private Long riderId;
    private Long driverId;
    
    @Enumerated(EnumType.STRING)
    private MatchStatus status;
    
    private LocalDateTime matchedAt;
    
    public enum MatchStatus {
        PENDING,
        MATCHED,
        ACCEPTED,
        IN_PROGRESS,
        COMPLETED
    }

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getRideRequestId() {
		return rideRequestId;
	}

	public void setRideRequestId(Long rideRequestId) {
		this.rideRequestId = rideRequestId;
	}

	public Long getRideId() {
		return rideId;
	}

	public void setRideId(Long rideId) {
		this.rideId = rideId;
	}

	public Long getRiderId() {
		return riderId;
	}

	public void setRiderId(Long riderId) {
		this.riderId = riderId;
	}

	public Long getDriverId() {
		return driverId;
	}

	public void setDriverId(Long driverId) {
		this.driverId = driverId;
	}

	public MatchStatus getStatus() {
		return status;
	}

	public void setStatus(MatchStatus status) {
		this.status = status;
	}

	public LocalDateTime getMatchedAt() {
		return matchedAt;
	}

	public void setMatchedAt(LocalDateTime matchedAt) {
		this.matchedAt = matchedAt;
	}
    
}

