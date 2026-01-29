package carpool.ride.dto;

import lombok.Data;

@Data
public class DistanceCalculationDTO {
    private String origin;
    private String destination;
    private Double distanceInKm;
    private Long durationInMinutes;
    private Double estimatedFare;
    private String routeInformation;
    private boolean success;
    
    public String getOrigin() {
		return origin;
	}
	public void setOrigin(String origin) {
		this.origin = origin;
	}
	public String getDestination() {
		return destination;
	}
	public void setDestination(String destination) {
		this.destination = destination;
	}
	public Double getDistanceInKm() {
		return distanceInKm;
	}
	public void setDistanceInKm(Double distanceInKm) {
		this.distanceInKm = distanceInKm;
	}
	public Long getDurationInMinutes() {
		return durationInMinutes;
	}
	public void setDurationInMinutes(Long durationInMinutes) {
		this.durationInMinutes = durationInMinutes;
	}
	public Double getEstimatedFare() {
		return estimatedFare;
	}
	public void setEstimatedFare(Double estimatedFare) {
		this.estimatedFare = estimatedFare;
	}
	public String getRouteInformation() {
		return routeInformation;
	}
	public void setRouteInformation(String routeInformation) {
		this.routeInformation = routeInformation;
	}
	public boolean isSuccess() {
		return success;
	}
	public void setSuccess(boolean success) {
		this.success = success;
	}
	public String getErrorMessage() {
		return errorMessage;
	}
	public void setErrorMessage(String errorMessage) {
		this.errorMessage = errorMessage;
	}
	private String errorMessage;
}