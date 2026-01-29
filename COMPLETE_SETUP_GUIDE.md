# 🚗 Carpool App - Complete System

A modern, full-stack carpool application with dynamic seat sharing. Drivers can create rides with multiple seats, and riders can book individual seats for their own pickup/drop locations. Each passenger pays individually based on their distance.

## 🎯 Key Features

✅ **Dynamic Seat Sharing**: Seats automatically freed when passengers drop off  
✅ **Individual Pricing**: Each passenger pays based on their distance  
✅ **Real-time Updates**: Polling-based notifications for ride status  
✅ **Role-based Access**: Separate dashboards for Drivers and Riders  
✅ **Location Picker**: Easy location selection for Pune with coordinates  
✅ **Passenger Management**: Track matched, boarded, and dropped passengers  
✅ **Automatic Payments**: Triggered when passenger is dropped  

## 🏗️ Architecture

### Backend (Java Spring Boot)
```
backend_carpool/
├── ride-services/          # Core ride management
├── user-service/          # User authentication & management
├── payment/              # Payment processing
├── notification/         # Notifications
├── matching-service/    # Ride matching algorithm
├── EurekaServer/       # Service discovery
└── ApiGateway/        # API Gateway routing
```

### Frontend (React + Vite)
```
carpool-frontend/
├── src/
│   ├── pages/
│   │   ├── auth/           # Login, Register
│   │   ├── driver/        # Driver Dashboard
│   │   └── rider/         # Rider Dashboard
│   ├── components/
│   │   ├── Common/       # Shared components
│   │   └── Ride/        # Ride-specific components
│   ├── context/         # Auth Context
│   ├── api/            # API integration
│   └── utils/          # Constants & helpers
```

## 🚀 Setup & Installation

### Prerequisites
- **Java 17+** (for backend)
- **Node.js 18+** (for frontend)
- **MySQL 8.0+**
- **Maven 3.8+**

### Backend Setup

#### 1. Navigate to backend directory
```bash
cd backend_carpool
```

#### 2. Set up MySQL Database
```sql
-- Create database
CREATE DATABASE carpool_db;

-- Run migrations (if schema files exist)
-- Or let Spring Boot create tables via JPA
```

#### 3. Update application.yaml files
Each microservice needs database configuration:

```yaml
# ride-services/src/main/resources/application.yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/carpool_db
    username: root
    password: your_password
  jpa:
    hibernate:
      ddl-auto: update
  application:
    name: ride-service
```

#### 4. Start services (in this order):
```bash
# Terminal 1: Eureka Server
cd EurekaServer
mvn spring-boot:run

# Terminal 2: User Service
cd user-service
mvn spring-boot:run

# Terminal 3: Ride Service
cd ride-services
mvn spring-boot:run

# Terminal 4: Payment Service
cd payment
mvn spring-boot:run

# Terminal 5: Notification Service
cd notification
mvn spring-boot:run

# Terminal 6: API Gateway
cd ApiGateway
mvn spring-boot:run
```

### Frontend Setup

#### 1. Navigate to frontend directory
```bash
cd carpool-frontend
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Create .env file (optional, if using environment variables)
```env
VITE_API_URL=http://localhost:8080/api
```

#### 4. Start development server
```bash
npm run dev
```

The application will be available at: **http://localhost:5173**

## 📋 API Endpoints

### User Service (Port 8081)
```
POST   /api/users/register       # Register new user
POST   /api/users/login          # Login user
GET    /api/users/{id}           # Get user details
```

### Ride Service (Port 8082)
```
# Ride Management
POST   /api/rides/create              # Create new ride
GET    /api/rides/{rideId}           # Get ride details
GET    /api/rides/active             # List active rides
PUT    /api/rides/{rideId}/status    # Update ride status

# Passenger Management
POST   /api/rides/{rideId}/add-passenger        # Add passenger
PUT    /api/rides/passenger/{id}/board         # Board passenger
PUT    /api/rides/passenger/{id}/drop          # Drop passenger
GET    /api/rides/{rideId}/passengers          # Get all passengers
GET    /api/rides/{rideId}/current-passengers  # Get boarded passengers

# Rider
POST   /api/rides/request        # Create ride request
```

### Payment Service (Port 8083)
```
POST   /api/payments/process    # Process payment
GET    /api/payments/{id}       # Get payment status
```

### Notification Service (Port 8084)
```
GET    /api/notifications/user/{userId}/unread   # Get unread notifications
PUT    /api/notifications/{id}/read              # Mark as read
```

## 🔄 Complete User Flows

### Driver Flow
```
1. Login as Driver
   ├─ Email: driver@test.com | Password: password
   
2. Create Ride
   ├─ Select Pickup: Hinjewadi Phase 1
   ├─ Select Drop: Kothrud
   ├─ Set Seats: 4
   └─ Click "Go Online"
   
3. Manage Passengers
   ├─ Rider matches → Shows in "Matched" section
   ├─ Click "Pick Up" → Status changes to "BOARDED"
   ├─ Click "Drop Off" → Status "DROPPED", seat freed!
   └─ New rider can now book freed seat
   
4. Complete Ride
   ├─ Click "Start Ride" (when ready to begin)
   ├─ Drive passengers
   ├─ Drop each passenger individually
   └─ Click "Complete Ride" (auto-drops remaining passengers)
```

### Rider Flow
```
1. Login as Rider
   ├─ Email: rider@test.com | Password: password
   
2. Request Ride
   ├─ Select Pickup: Hinjewadi Phase 1
   ├─ Select Drop: Baner
   ├─ See Estimated Fare: ₹ 50 + (Distance × ₹10)
   └─ Click "Find Ride"
   
3. Browse Available Rides
   ├─ See all drivers with available seats
   ├─ Check seat availability (e.g., 3/4)
   ├─ Check estimated fare and distance
   └─ Click "Book Seat"
   
4. Track Ride
   ├─ Status: MATCHED → Waiting for pickup
   ├─ Status: BOARDED → In the ride
   ├─ Status: DROPPED → Completed (Payment processed)
   └─ See ride details and cost
```

## 💻 Technology Stack

### Backend
- **Spring Boot 3.1.x - 4.0.x**
- **Spring Cloud (Eureka, API Gateway)**
- **MySQL/JPA/Hibernate**
- **Maven**
- **Java 17**

### Frontend
- **React 18**
- **Vite (build tool)**
- **Axios (HTTP client)**
- **Tailwind CSS (styling)**
- **Lucide React (icons)**
- **React Router (navigation)**

## 🎨 UI Components

### LocationPicker
Dropdown-based location selector for Pune with coordinates

### PassengerCard
Shows passenger details with action buttons for boarding/dropping

### DriverDashboard
- Create ride form
- Current ride management
- Passenger list with status
- Real-time updates

### RiderDashboard
- Find ride form
- Available rides browser
- Active ride tracking
- Fare estimation

## 🔐 Authentication

Users are authenticated via JWT tokens stored in localStorage.

```javascript
// Login response
{
  "user": {
    "id": 1,
    "name": "John Driver",
    "email": "driver@test.com",
    "role": "DRIVER",
    "vehicleNumber": "MH02AB1234"
  },
  "token": "eyJhbGc..."
}
```

Role-based access:
- **DRIVER**: Access to `/driver-dashboard`
- **RIDER**: Access to `/rider-dashboard`

## 📊 Data Models

### Ride
```java
{
  "id": 1,
  "driverId": 1,
  "driverName": "John",
  "pickupLocation": "Hinjewadi",
  "dropLocation": "Kothrud",
  "totalSeats": 4,
  "availableSeats": 2,
  "distanceInKm": 12.5,
  "estimatedDurationMinutes": 24,
  "status": "IN_PROGRESS"
}
```

### RidePassenger
```java
{
  "id": 1,
  "rideId": 1,
  "riderId": 2,
  "riderName": "Jane",
  "boardingLocation": "Hinjewadi",
  "dropLocation": "Baner",
  "distanceInKm": 5.2,
  "fareAmount": 102.0,
  "status": "BOARDED"
}
```

## 🧪 Testing the Application

### Test Scenario
```
Driver creates ride: Hinjewadi → Kothrud (4 seats)
│
├─ Rider A books: Hinjewadi → Baner
│   └─ Available seats: 3/4 ✅
│
├─ Rider B books: Hinjewadi → Kothrud
│   └─ Available seats: 2/4 ✅
│
├─ Driver starts ride
│
├─ Driver picks up A & B
│   └─ Status: BOARDED
│
├─ Driver drops A at Baner
│   ├─ Payment triggered: ₹102
│   ├─ Available seats: 3/4 ✅ (SEAT FREED!)
│   └─ Rider C can now book!
│
├─ Rider C books: Baner → Kothrud
│   └─ Available seats: 2/4 ✅
│
├─ Driver continues to Kothrud
│
└─ Driver completes ride
    ├─ All remaining auto-dropped
    ├─ Payments triggered for B & C
    └─ Ride completed ✅
```

## 📱 Demo Credentials

### Driver Account
- Email: `driver@test.com`
- Password: `password`
- Vehicle: `MH02AB1234`

### Rider Account
- Email: `rider@test.com`
- Password: `password`

## 🐛 Troubleshooting

### Backend Issues

**Eureka server not starting**
```bash
# Check if port 8761 is available
# If not, update eureka.instance.port in application.yaml
```

**Database connection failed**
```bash
# Verify MySQL is running
# Check connection string in application.yaml
# Ensure database exists: CREATE DATABASE carpool_db;
```

**CVE vulnerabilities in dependencies**
```bash
# All MySQL connectors updated to safe versions
# mysql-connector-java: 8.0.33 → 8.2.0
# mysql-connector-j: 9.0.0 → 9.0.1
```

### Frontend Issues

**Tailwind CSS not working**
```bash
# Run npm install again
npm install
# Verify tailwind.config.js exists
# Clear .next or build cache
rm -rf node_modules/.cache
```

**API calls failing**
```bash
# Ensure backend is running on port 8080
# Check API_BASE_URL in constants.js
# Check browser console for CORS errors
```

## 📚 Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite Documentation](https://vitejs.dev)

## ✅ Acceptance Criteria Met

✅ Driver creates ride → Distance calculated automatically  
✅ Multiple riders can join same ride  
✅ Driver can board each passenger individually  
✅ Driver drops passenger → Seat becomes free immediately  
✅ Another rider can book the freed seat  
✅ Each passenger pays individually based on distance  
✅ Real-time seat availability updates  
✅ Location picker with coordinates  
✅ Notifications work  
✅ Complete ride → All passengers auto-dropped  

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For issues, questions, or contributions, please reach out to the development team.

---

**Last Updated**: January 27, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
