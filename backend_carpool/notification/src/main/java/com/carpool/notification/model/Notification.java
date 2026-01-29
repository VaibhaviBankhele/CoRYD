package com.carpool.notification.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long userId;  // Who receives the notification
    
    @Column(nullable = false)
    private String message;
    
    @Enumerated(EnumType.STRING)
    private NotificationType type;
    
    private boolean isRead;
    
    private LocalDateTime createdAt;
    
    public enum NotificationType {
        MATCH_FOUND,      // Driver notified about match
        RIDE_ACCEPTED,    // Rider notified ride accepted
        RIDE_STARTED,     // Ride started notification
        PICKUP_ARRIVED,   // Driver arrived at pickup
        RIDE_COMPLETED,   // Ride completed
        PAYMENT_RECEIVED  // Payment confirmation
    }

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public NotificationType getType() {
		return type;
	}

	public void setType(NotificationType type) {
		this.type = type;
	}

	public boolean isRead() {
		return isRead;
	}

	public void setRead(boolean isRead) {
		this.isRead = isRead;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}
}