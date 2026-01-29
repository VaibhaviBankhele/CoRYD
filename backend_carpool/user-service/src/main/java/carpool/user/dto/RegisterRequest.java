package carpool.user.dto;

import carpool.user.entity.User;
import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

@Data
public class RegisterRequest {
    @NotBlank(message = "Email is required")
    private String email;
    
    @NotBlank(message = "Password is required")
    private String password;
    
    @NotBlank(message = "Name is required")
    private String name;
    
    @NotBlank(message = "Phone is required")
    private String phone;
    
    @NotNull(message = "Role is required")
    private User.Role role;
    
    private String vehicleNumber;  // Optional, for drivers
    private Integer vehicleCapacity; 
    // Optional, for drivers
	public String getEmail() {
		return email;
	}
	public void setEmail(String email) {
		this.email = email;
	}
	public String getPassword() {
		return password;
	}
	public void setPassword(String password) {
		this.password = password;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getPhone() {
		return phone;
	}
	public void setPhone(String phone) {
		this.phone = phone;
	}
	public User.Role getRole() {
		return role;
	}
	public void setRole(User.Role role) {
		this.role = role;
	}
	public String getVehicleNumber() {
		return vehicleNumber;
	}
	public void setVehicleNumber(String vehicleNumber) {
		this.vehicleNumber = vehicleNumber;
	}
	public Integer getVehicleCapacity() {
		return vehicleCapacity;
	}
	public void setVehicleCapacity(Integer vehicleCapacity) {
		this.vehicleCapacity = vehicleCapacity;
	}
}
