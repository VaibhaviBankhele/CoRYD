package com.carpool.notification.dto;

import com.carpool.notification.model.Notification;
import lombok.Data;

@Data
public class SendNotificationDTO {
    private Long userId;
    private String message;
    private Notification.NotificationType type;
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
	public Notification.NotificationType getType() {
		return type;
	}
	public void setType(Notification.NotificationType type) {
		this.type = type;
	}
}