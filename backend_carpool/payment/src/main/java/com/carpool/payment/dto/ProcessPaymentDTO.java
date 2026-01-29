package com.carpool.payment.dto;

import com.carpool.payment.model.Payment;
import lombok.Data;

@Data
public class ProcessPaymentDTO {
    private Long rideId;
    private Long riderId;
    private Long driverId;
    private Double amount;
    private Payment.PaymentMethod method;
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
	public Double getAmount() {
		return amount;
	}
	public void setAmount(Double amount) {
		this.amount = amount;
	}
	public Payment.PaymentMethod getMethod() {
		return method;
	}
	public void setMethod(Payment.PaymentMethod method) {
		this.method = method;
	}
}