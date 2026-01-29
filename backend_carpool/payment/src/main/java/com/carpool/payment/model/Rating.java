package com.carpool.payment.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "ratings")
@Data
public class Rating {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long rideId;
    private Long fromUserId;  // Who gave the rating
    private Long toUserId;    // Who received the rating
    
    @Enumerated(EnumType.STRING)
    private RatingType type;  // RIDER_TO_DRIVER or DRIVER_TO_RIDER
    
    private Integer stars;  // 1-5
    private String comment;
    
    private LocalDateTime createdAt;
    
    public enum RatingType {
        RIDER_TO_DRIVER,
        DRIVER_TO_RIDER
    }

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getRideId() {
		return rideId;
	}

	public void setRideId(Long rideId) {
		this.rideId = rideId;
	}

	public Long getFromUserId() {
		return fromUserId;
	}

	public void setFromUserId(Long fromUserId) {
		this.fromUserId = fromUserId;
	}

	public Long getToUserId() {
		return toUserId;
	}

	public void setToUserId(Long toUserId) {
		this.toUserId = toUserId;
	}

	public RatingType getType() {
		return type;
	}

	public void setType(RatingType type) {
		this.type = type;
	}

	public Integer getStars() {
		return stars;
	}

	public void setStars(Integer stars) {
		this.stars = stars;
	}

	public String getComment() {
		return comment;
	}

	public void setComment(String comment) {
		this.comment = comment;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}
}