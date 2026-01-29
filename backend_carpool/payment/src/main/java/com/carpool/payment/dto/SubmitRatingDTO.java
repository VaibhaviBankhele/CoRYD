package com.carpool.payment.dto;

import com.carpool.payment.model.Rating;
import lombok.Data;

@Data
public class SubmitRatingDTO {
    private Long rideId;
    private Long fromUserId;
    private Long toUserId;
    private Rating.RatingType type;
    private Integer stars;
    private String comment;
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
	public Rating.RatingType getType() {
		return type;
	}
	public void setType(Rating.RatingType type) {
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
}