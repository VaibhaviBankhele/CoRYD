# 🧪 PAYMENT SYSTEM - TESTING GUIDE

## Pre-Testing Setup

### 1. Stop All Services
Ensure all running microservices are stopped:
```
Ctrl+C in each terminal window for:
  - Eureka Server (port 8761)
  - Ride Service (port 8082)
  - Payment Service (port 8085)
  - API Gateway (port 8080)
  - Frontend (port 3002)
```

### 2. Start Microservices in Order
```
Terminal 1 - Eureka Server:
  cd c:\Users\kanch\Downloads\carpoolApp\backend_carpool\EurekaServer
  mvn spring-boot:run

Wait 5 seconds for Eureka to start, then:

Terminal 2 - Ride Service:
  cd c:\Users\kanch\Downloads\carpoolApp\backend_carpool\ride-services
  mvn spring-boot:run

Terminal 3 - Payment Service:
  cd c:\Users\kanch\Downloads\carpoolApp\backend_carpool\payment
  mvn spring-boot:run

Terminal 4 - API Gateway:
  cd c:\Users\kanch\Downloads\carpoolApp\backend_carpool\ApiGateway
  mvn spring-boot:run

Terminal 5 - Frontend:
  cd c:\Users\kanch\Downloads\carpoolApp\carpool-frontend
  npm run dev -- --port 3002
```

Wait for all services to show "Started" message before continuing.

---

## Test Case 1: Create Ride & Add Passengers

### Prerequisites
- All services running ✓
- Frontend accessible at http://localhost:3002 ✓
- Logged in as Driver ✓

### Steps
1. Navigate to Driver Dashboard
2. Click "Create New Ride"
3. Enter ride details:
   - Route: "Test Ride"
   - Seats: 2
   - Start Location: "Central Station"
4. Click "Create Ride"
5. **Expected**: Ride created successfully, shows in active rides

---

## Test Case 2: Accept Passenger & Calculate Fare

### Prerequisites
- Active ride created ✓
- Browser second window open with Rider account ✓

### Steps
1. **Rider Side**: Request a ride (same route)
2. **Driver Side**: See pending request
3. **Driver**: Accept request
4. **Expected Results**:
   - ✓ Passenger shows in driver's active ride list
   - ✓ Passenger.fareAmount calculated: Base ₹50 + ₹10/km
   - ✓ Fare amount visible in UI
   - ✓ Passenger status = MATCHED

---

## Test Case 3: Payment Order Creation

### Prerequisites
- Passenger added to ride ✓
- Passenger not yet dropped ✓

### Steps
1. In DriverDashboardNew, click "Drop Passenger" button
2. **Expected**: Payment modal opens immediately with order ID

### Backend Check:
```bash
# In MySQL:
SELECT * FROM payments WHERE rider_id = [passengerId];

Expected columns populated:
  - id: Auto-generated
  - ride_id: From the ride
  - rider_id: From the passenger
  - driver_id: From current driver
  - amount: Passenger's fare (e.g., 51.5 for 1.5km ride)
  - status: PENDING
  - razorpay_order_id: order_[id]
  - method: UPI
  - created_at: Current timestamp
  - razorpay_payment_id: NULL (not yet paid)
  - razorpay_signature: NULL (not yet paid)
```

---

## Test Case 4: Razorpay Payment Modal

### Prerequisites
- Payment modal is open ✓
- Order ID visible in modal ✓

### Steps
1. Look at Razorpay modal displaying:
   - Amount: ₹[fareAmount]
   - Currency: INR
   - Order ID: order_[paymentId]
   - Description: "CoRYD Ride Payment"
2. **Expected**: Modal is functional and displays all info correctly

### Note for Testing
Since we're using Razorpay test mode, you can use test card:
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVV: Any 3 digits (e.g., 123)
```

---

## Test Case 5: Payment Verification (Critical)

### Prerequisites
- Razorpay modal open ✓
- Ready to complete payment ✓

### Steps
1. Complete Razorpay payment in modal
2. **Expected**: Modal closes and receives:
   ```json
   {
     "razorpay_order_id": "order_[id]",
     "razorpay_payment_id": "pay_[id]",
     "razorpay_signature": "[signature_hash]"
   }
   ```

3. Frontend automatically calls `/payments/verify` endpoint

### Backend Verification:
Check Payment Service logs for:
```
✅ Signature verification successful
✅ Payment verified and completed: pay_[id]
```

### Database Check:
```bash
SELECT * FROM payments WHERE id = [paymentId];

Expected changes:
  - status: COMPLETED (was PENDING)
  - razorpay_payment_id: pay_[id] (populated)
  - razorpay_signature: [signature] (populated)
  - completed_at: Current timestamp (populated)
  - transaction_id: pay_[id] (set to payment ID)
```

---

## Test Case 6: Driver Earnings Update

### Prerequisites
- Payment successfully verified ✓
- Status shown as COMPLETED in DB ✓

### Steps
1. Check DriverDashboardNew header
2. **Expected**: Earnings display shows updated amount
   - Previous: ₹0.00
   - After: ₹[fareAmount]

### Frontend Check:
- Earnings box should show: `₹[amount]`
- Message should show: `💳 Payment successful! ₹[amount] received`

### Backend Check:
```bash
# Call endpoint:
GET /api/payments/driver/[driverId]

Expected response:
[
  {
    "id": [paymentId],
    "amount": [fareAmount],
    "status": "COMPLETED",
    "completedAt": "2026-01-29T12:30:00",
    ...
  }
]

Note: Should ONLY include COMPLETED payments
```

---

## Test Case 7: Multiple Earnings Accumulation

### Prerequisites
- First payment successful and showing in earnings ✓
- Same ride still active ✓

### Steps
1. Add another passenger to same ride
2. Drop second passenger
3. Complete second payment in Razorpay
4. **Expected**: Earnings increase by second payment amount

### Database Check:
```bash
SELECT SUM(amount) FROM payments 
WHERE driver_id = [driverId] AND status = 'COMPLETED';

Expected: Sum of all completed payment amounts
```

### UI Check:
```
Total earnings = Payment1 + Payment2
Example: ₹50 + ₹75 = ₹125
```

---

## Test Case 8: Failed Payment Not Counted

### Prerequisites
- Have Razorpay modal open ✓

### Steps
1. Close modal without completing payment
2. Try again but cancel in Razorpay
3. **Expected**: No earnings increment
4. Check DB:
```bash
SELECT * FROM payments WHERE rider_id = [riderId];

Expected:
  - status: PENDING (not COMPLETED)
  - razorpay_payment_id: NULL (never received)
  - earnings remain unchanged
```

---

## Test Case 9: Ride Completion & Payment History

### Prerequisites
- Multiple passengers dropped and paid ✓

### Steps
1. Navigate to RiderPayments page (as rider)
2. **Expected**: Shows list of payments:
   - Date of payment
   - Amount paid
   - Status: "✓ Paid" (dynamic, from DB)
   - Ride info

### Database Check:
```bash
SELECT * FROM payments WHERE rider_id = [riderId] ORDER BY created_at DESC;

Expected:
  - All completed payments showing
  - Status dynamically derived from DB (not hard-coded)
```

---

## Test Case 10: Page Refresh Persistence

### Prerequisites
- Payment completed and showing ✓
- Earnings displayed ✓

### Steps
1. Refresh page (F5) in DriverDashboardNew
2. **Expected**:
   - Earnings amount persists
   - No loss of data
   - Fetch from backend confirms

### Why This Tests:
- Validates earnings not stored only in frontend state
- Confirms database persistence
- Ensures backend returns same data after reload

---

## Test Case 11: Signature Verification Security

### Prerequisites
- Payment Service logs visible ✓

### Steps
1. Attempt to manually call `/payments/verify` with:
   - Wrong signature
   - Wrong order ID
2. **Expected**: 
```json
{
  "success": false,
  "message": "❌ Invalid Razorpay signature"
}
```

### Backend Logs:
```
❌ Signature verification failed
```

### Database Check:
- Payment status remains PENDING
- No unauthorized completion

---

## Troubleshooting

### Issue: Razorpay modal doesn't open
**Check:**
- [ ] Frontend console for errors (F12)
- [ ] `/payments/order` endpoint called successfully
- [ ] Order ID returned from response
- [ ] Razorpay script loaded (check Network tab)

### Issue: Payment verification fails
**Check:**
- [ ] Backend logs for signature error
- [ ] Razorpay returned valid IDs
- [ ] Order ID matches in database

### Issue: Earnings not updating
**Check:**
- [ ] Payment status is COMPLETED (not PENDING)
- [ ] `getPaymentsForDriver()` returns the payment
- [ ] Frontend fetches after verification

### Issue: Multiple payments not accumulating
**Check:**
- [ ] Each drop creates new Payment record
- [ ] All have status COMPLETED
- [ ] Sum calculation correct in frontend

---

## Success Criteria

All tests pass when:

✅ Payment order created with unique ID
✅ Razorpay signature verified successfully
✅ Payment status becomes COMPLETED in database
✅ Driver earnings increment for successful payments
✅ Failed payments don't increment earnings
✅ Multiple payments accumulate correctly
✅ Payment history shows dynamic status (not hard-coded)
✅ Data persists after page refresh
✅ Signature verification prevents unauthorized payments

---

## Logging Output Examples

### Successful Payment Flow:
```
Payment Service:
  📋 Creating payment order - Ride: 1, Amount: ₹50.00
  ✅ Payment order created with ID: order_42

  ✅ Signature verification successful
  ✅ Payment verified and completed: pay_JqLhDvNKPaVcBa
  
Driver Dashboard:
  💳 Payment successful! ₹50.00 received
  ✅ Passenger dropped successfully!
  📊 Driver earnings updated: ₹50.00
```

### Failed Signature:
```
Payment Service:
  ❌ Signature verification failed
  ❌ Invalid Razorpay signature

Frontend:
  Payment failed: Invalid signature
```

---

## Notes

- Test cases should be run in order
- Database should be fresh for clean testing
- All terminals should show "Started" or "ready in" message
- Frontend hot reload should work (no need to restart)
- Backend restarts required only after code changes
