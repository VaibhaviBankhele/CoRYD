# 🚀 Quick Start Guide - Carpool App

Get the carpool application running in minutes!

## 🏃 5-Minute Quick Start

### Step 1: Start Backend Services (In Parallel)

Open 6 terminal tabs and run each in its directory:

```bash
# Terminal 1: Eureka Service Discovery
cd backend_carpool/EurekaServer
mvn spring-boot:run

# Terminal 2: User Service
cd backend_carpool/user-service
mvn spring-boot:run

# Terminal 3: Ride Service
cd backend_carpool/ride-services
mvn spring-boot:run

# Terminal 4: Payment Service
cd backend_carpool/payment
mvn spring-boot:run

# Terminal 5: Notification Service
cd backend_carpool/notification
mvn spring-boot:run

# Terminal 6: API Gateway
cd backend_carpool/ApiGateway
mvn spring-boot:run
```

**Wait for all services to start** (check Eureka dashboard: http://localhost:8761)

### Step 2: Start Frontend

```bash
cd carpool-frontend
npm install  # First time only
npm run dev
```

Open: **http://localhost:5173**

## 👤 Login & Test

### Account 1: Driver
- Email: `driver@test.com`
- Password: `password`

### Account 2: Rider
- Email: `rider@test.com`
- Password: `password`

## 🎯 Test Scenario (5 Minutes)

**Browser 1 - Driver:**
1. Login as driver
2. Create Ride:
   - Pickup: Hinjewadi Phase 1
   - Drop: Kothrud
   - Seats: 4
   - Click "Go Online"
3. Note the ride details

**Browser 2 - Rider:**
1. Login as rider
2. Find Ride:
   - Pickup: Hinjewadi Phase 1
   - Drop: Baner
   - Click "Find Ride"
3. See driver's ride in "Available Rides"
4. Click "Book Seat"

**Back to Browser 1 - Driver:**
1. See rider in "Matched" section
2. Click "Pick Up" → Status changes to "BOARDED"
3. Click "Drop Off" → Status "DROPPED", seat freed!
4. Available seats: Back to 4/4

## 📱 Key Routes

| Role | URL | Purpose |
|------|-----|---------|
| - | http://localhost:5173/login | Login page |
| - | http://localhost:5173/register | Register page |
| Driver | http://localhost:5173/driver-dashboard | Driver panel |
| Rider | http://localhost:5173/rider-dashboard | Rider panel |

## 🔧 Backend URLs

| Service | Port | URL |
|---------|------|-----|
| Eureka | 8761 | http://localhost:8761 |
| API Gateway | 8080 | http://localhost:8080 |
| User Service | 8081 | http://localhost:8081 |
| Ride Service | 8082 | http://localhost:8082 |
| Payment | 8083 | http://localhost:8083 |
| Notification | 8084 | http://localhost:8084 |

## 🐛 Troubleshooting Quick Fixes

**Port already in use?**
```bash
# Find process using port
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

**Eureka services not appearing?**
- Wait 30 seconds and refresh: http://localhost:8761
- Check all services are actually running

**Frontend not loading?**
```bash
cd carpool-frontend
# Clear cache
rm -rf node_modules/.vite
npm run dev
```

**Database connection error?**
```sql
-- Check MySQL is running
-- Create database
CREATE DATABASE carpool_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 🎮 Test the Complete Flow

### Scenario: Driver with 4 seats, 2 riders

**Setup:**
- ✅ Driver creates ride: Hinjewadi → Kothrud (4 seats)

**Action 1: Rider A books**
- ✅ Rider A: Hinjewadi → Baner
- ✅ Available seats: 3/4
- ✅ Rider A sees driver in available rides

**Action 2: Rider B books**
- ✅ Rider B: Hinjewadi → Kothrud
- ✅ Available seats: 2/4
- ✅ Rider B sees driver in available rides

**Action 3: Driver picks up both**
- ✅ Driver: Click "Pick Up" for Rider A → BOARDED
- ✅ Driver: Click "Pick Up" for Rider B → BOARDED
- ✅ Currently boarded: 2

**Action 4: Drop Rider A**
- ✅ Driver: Click "Drop Off" for Rider A
- ✅ Rider A: Status DROPPED
- ✅ Payment triggered: ₹102
- ✅ **SEAT FREED!**
- ✅ Available seats: 3/4

**Action 5: New rider (Rider C) can now book**
- ✅ Rider C: Baner → Kothrud
- ✅ Available seats: 2/4 (USING FREED SEAT!)

**Action 6: Driver completes**
- ✅ Driver: Click "Complete Ride"
- ✅ All remaining passengers auto-dropped
- ✅ All payments processed
- ✅ Ride completed ✅

## 📊 Expected Results

```
✅ All services started (green indicator in Eureka)
✅ Frontend loads without errors
✅ Login works for both roles
✅ Driver can create ride with calculated distance
✅ Rider can find and book rides
✅ Seats decrease when passenger books
✅ Seats increase when passenger dropped
✅ Payment triggered on drop
✅ Real-time updates (5-second polling)
✅ Status transitions work correctly
```

## 🔑 Key Features Demonstrated

1. **Dynamic Seats**: Freed when passenger drops
2. **Individual Pricing**: Each passenger pays their distance
3. **Real-time Updates**: See changes without refresh
4. **Role-based UI**: Different dashboards for driver/rider
5. **Complete Flow**: From ride creation to completion

## 📞 Support

If you encounter issues:
1. Check all services are running (`http://localhost:8761`)
2. Verify database exists and is running
3. Check console for error messages
4. Review COMPLETE_SETUP_GUIDE.md for detailed setup

## ✅ Success Checklist

- [ ] All 6 backend services running
- [ ] Eureka shows all services registered
- [ ] Frontend loads at localhost:5173
- [ ] Can login with demo credentials
- [ ] Driver can create ride
- [ ] Rider can see available rides
- [ ] Can book a seat
- [ ] Seat count updates correctly
- [ ] Can drop passengers
- [ ] Can complete ride

**Once all checked ✅ - You have a working carpool system!**

---

**Next**: Read `COMPLETE_SETUP_GUIDE.md` for advanced configuration and deployment.
