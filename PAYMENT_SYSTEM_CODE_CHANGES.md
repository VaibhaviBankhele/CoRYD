# 🔄 PAYMENT SYSTEM - SIDE-BY-SIDE CODE COMPARISON

## Change 1: Payment Model - Add Razorpay Fields

### BEFORE (Incomplete)
```java
@Entity
@Table(name = "payments")
public class Payment {
    private Long id;
    private Long rideId;
    private Long riderId;
    private Long driverId;
    private Double amount;
    @Enumerated(EnumType.STRING)
    private PaymentStatus status;
    @Enumerated(EnumType.STRING)
    private PaymentMethod method;
    private String transactionId;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    
    // ❌ Missing:
    // - razorpayOrderId
    // - razorpayPaymentId
    // - razorpaySignature
}
```

### AFTER (Complete)
```java
@Entity
@Table(name = "payments")
@Data
public class Payment {
    private Long id;
    private Long rideId;
    private Long riderId;
    private Long driverId;
    private Double amount;
    @Enumerated(EnumType.STRING)
    private PaymentStatus status;
    @Enumerated(EnumType.STRING)
    private PaymentMethod method;
    private String transactionId;
    
    // ✅ NEW FIELDS
    private String razorpayOrderId;      // Order ID from our system
    private String razorpayPaymentId;    // Payment ID from Razorpay
    private String razorpaySignature;    // Signature for verification
    
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    
    // ✅ Getters/Setters for new fields
    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String id) { this.razorpayOrderId = id; }
    // ... more getters/setters ...
}
```

---

## Change 2: Payment Controller - Add Payment Order Endpoint

### BEFORE (No order creation)
```java
@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    @Autowired
    private PaymentService paymentService;
    
    @PostMapping("/process")
    public ResponseEntity<?> processPayment(@RequestBody ProcessPaymentDTO dto) {
        try {
            Payment payment = paymentService.processPayment(dto);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // ❌ Missing:
    // - /payments/order endpoint
    // - /payments/verify endpoint
}
```

### AFTER (Order and Verify endpoints)
```java
@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    @Autowired
    private PaymentService paymentService;
    
    @PostMapping("/process")
    public ResponseEntity<?> processPayment(@RequestBody ProcessPaymentDTO dto) {
        try {
            Payment payment = paymentService.processPayment(dto);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // ✅ NEW: Create payment order
    @PostMapping("/order")
    public ResponseEntity<?> createPaymentOrder(@RequestBody Map<String, Object> payload) {
        try {
            Long rideId = ((Number) payload.get("rideId")).longValue();
            Long riderId = ((Number) payload.get("riderId")).longValue();
            Long driverId = ((Number) payload.get("driverId")).longValue();
            Double amount = ((Number) payload.get("amount")).doubleValue();
            String description = (String) payload.get("description");
            
            Payment payment = paymentService.createPaymentOrder(
                rideId, riderId, driverId, amount, description
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "orderId", payment.getId().toString(),
                "amount", payment.getAmount(),
                "payment", payment
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    // ✅ NEW: Verify Razorpay payment
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> payload) {
        try {
            String orderId = payload.get("razorpayOrderId");
            String paymentId = payload.get("razorpayPaymentId");
            String signature = payload.get("razorpaySignature");
            
            Payment payment = paymentService.verifyAndCompletePayment(
                orderId, paymentId, signature
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payment verified successfully",
                "payment", payment
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}
```

---

## Change 3: Payment Service - Add Order Creation & Verification

### BEFORE (No verification)
```java
public class PaymentService {
    @Autowired
    private PaymentRepository paymentRepository;
    
    public Payment processPayment(ProcessPaymentDTO dto) {
        Payment payment = new Payment();
        payment.setRideId(dto.getRideId());
        payment.setRiderId(dto.getRiderId());
        payment.setDriverId(dto.getDriverId());
        payment.setAmount(dto.getAmount());
        payment.setMethod(dto.getMethod());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setCreatedAt(LocalDateTime.now());
        
        // ❌ Just assume success
        boolean success = simulatePaymentGateway(dto);
        if (success) {
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setTransactionId(UUID.randomUUID().toString());
            payment.setCompletedAt(LocalDateTime.now());
        }
        
        return paymentRepository.save(payment);
    }
    
    // ❌ Missing:
    // - createPaymentOrder()
    // - verifyAndCompletePayment()
    
    // ❌ Wrong: Returns ALL payments for driver
    public List<Payment> getPaymentsForDriver(Long driverId) {
        return paymentRepository.findByDriverId(driverId);
    }
}
```

### AFTER (Complete verification)
```java
public class PaymentService {
    @Autowired
    private PaymentRepository paymentRepository;
    
    public Payment processPayment(ProcessPaymentDTO dto) {
        Payment payment = new Payment();
        payment.setRideId(dto.getRideId());
        payment.setRiderId(dto.getRiderId());
        payment.setDriverId(dto.getDriverId());
        payment.setAmount(dto.getAmount());
        payment.setMethod(dto.getMethod());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setCreatedAt(LocalDateTime.now());
        
        return paymentRepository.save(payment);
    }
    
    // ✅ NEW: Create payment order (prepare for Razorpay)
    public Payment createPaymentOrder(
            Long rideId, Long riderId, Long driverId,
            Double amount, String description) {
        
        System.out.println("📋 Creating payment order - Amount: ₹" + amount);
        
        Payment payment = new Payment();
        payment.setRideId(rideId);
        payment.setRiderId(riderId);
        payment.setDriverId(driverId);
        payment.setAmount(amount);
        payment.setMethod(PaymentMethod.UPI);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setCreatedAt(LocalDateTime.now());
        
        // Save to get ID
        payment = paymentRepository.save(payment);
        
        // Use ID as order ID
        payment.setRazorpayOrderId("order_" + payment.getId());
        payment = paymentRepository.save(payment);
        
        return payment;
    }
    
    // ✅ NEW: Verify signature and complete payment
    public Payment verifyAndCompletePayment(
            String razorpayOrderId,
            String razorpayPaymentId,
            String razorpaySignature) {
        
        // ✅ Step 1: Verify signature (security!)
        boolean isValid = RazorpayVerificationUtil.verifyRazorpaySignature(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );
        
        if (!isValid) {
            throw new RuntimeException("❌ Invalid Razorpay signature");
        }
        
        // ✅ Step 2: Find payment
        List<Payment> allPayments = paymentRepository.findAll();
        Payment payment = allPayments.stream()
            .filter(p -> razorpayOrderId.equals(p.getRazorpayOrderId()))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("❌ Payment not found"));
        
        // ✅ Step 3: Update payment record
        payment.setRazorpayPaymentId(razorpayPaymentId);
        payment.setRazorpaySignature(razorpaySignature);
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setCompletedAt(LocalDateTime.now());
        payment.setTransactionId(razorpayPaymentId);
        
        System.out.println("✅ Payment verified: " + razorpayPaymentId);
        
        // ✅ Step 4: Notify services
        notifyPaymentSuccess(payment.getRiderId());
        
        return paymentRepository.save(payment);
    }
    
    // ✅ FIXED: Returns ONLY COMPLETED payments (not all)
    public List<Payment> getPaymentsForDriver(Long driverId) {
        List<Payment> payments = paymentRepository.findByDriverId(driverId);
        
        // ✅ Filter only COMPLETED (verified) payments
        payments = payments.stream()
            .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
            .toList();
        
        System.out.println("📊 Driver earnings from " + payments.size() + " payments");
        
        return payments;
    }
}
```

---

## Change 4: Payment Repository - Add findByStatus Query

### BEFORE (Limited queries)
```java
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByRiderId(Long riderId);
    List<Payment> findByDriverId(Long driverId);
    // ❌ Missing query for status
}
```

### AFTER (Complete queries)
```java
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByRiderId(Long riderId);
    List<Payment> findByDriverId(Long driverId);
    
    // ✅ NEW: Query by status (for filtering)
    List<Payment> findByStatus(PaymentStatus status);
}
```

---

## Change 5: CREATE NEW FILE - RazorpayVerificationUtil.java

### NEW FILE CREATED
```java
package com.carpool.payment.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

/**
 * ✅ NEW UTILITY CLASS
 * Verifies Razorpay signatures using HMAC-SHA256
 */
public class RazorpayVerificationUtil {
    
    private static final String RAZORPAY_KEY_SECRET = "test_secret";
    
    /**
     * Verify Razorpay payment signature
     * Prevents fraudulent payments by verifying signature
     */
    public static boolean verifyRazorpaySignature(
            String razorpayOrderId,
            String razorpayPaymentId,
            String signature) {
        
        try {
            // Construct payload
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            
            // Generate HMAC-SHA256
            String expectedSignature = generateHMAC(payload, RAZORPAY_KEY_SECRET);
            
            // Compare signatures
            return signature.equals(expectedSignature);
            
        } catch (Exception e) {
            System.err.println("❌ Signature verification failed: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Generate HMAC-SHA256 hash
     */
    private static String generateHMAC(String message, String secret)
            throws Exception {
        
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(
            secret.getBytes(StandardCharsets.UTF_8),
            0,
            secret.getBytes(StandardCharsets.UTF_8).length,
            "HmacSHA256"
        );
        mac.init(secretKey);
        
        byte[] hash = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
        
        // Convert to hex string
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        
        return hexString.toString();
    }
}
```

---

## Change 6: Frontend - razorpayUtils.js

### BEFORE (No backend verification)
```javascript
export const initiatePayment = async ({
  orderId,
  amount,
  currency = "INR",
  description,
  passengerName,
  passengerEmail,
  passengerPhone,
  onSuccess,
  onError,
}) => {
  // ... load script ...
  
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: amount,
    order_id: orderId,
    handler: function (response) {
      // ❌ Called immediately without verification
      onSuccess?.(response);
    },
  };
  
  const rzp1 = new window.Razorpay(options);
  rzp1.open();
};
```

### AFTER (With backend verification)
```javascript
import axios from "axios";

// ✅ NEW: Verify with backend
export const verifyPaymentWithBackend = async (paymentData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_BASE_URL}/payments/verify`,
      {
        razorpayOrderId: paymentData.razorpay_order_id,
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpaySignature: paymentData.razorpay_signature,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    console.log("✅ Payment verified:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Verification failed:", error.response?.data);
    throw new Error(error.response?.data?.message || "Verification failed");
  }
};

export const initiatePayment = async ({
  orderId,
  amount,
  currency = "INR",
  description,
  passengerName,
  passengerEmail,
  passengerPhone,
  onSuccess,
  onError,
}) => {
  // ... load script ...
  
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: amount,
    order_id: orderId,
    handler: async function (response) {
      try {
        // ✅ NEW: Verify with backend before calling onSuccess
        const verificationResult = await verifyPaymentWithBackend(response);
        
        if (verificationResult.success) {
          console.log("✅ Payment successful and verified");
          onSuccess?.(verificationResult);  // ✅ Only now
        } else {
          onError?.(verificationResult.message);
        }
      } catch (error) {
        onError?.(error.message);
      }
    },
  };
  
  const rzp1 = new window.Razorpay(options);
  rzp1.open();
};
```

---

## Change 7: Frontend - DriverDashboardNew.jsx

### BEFORE (Wrong field names, no verification wait)
```javascript
const handleDropPassenger = async (passengerId) => {
  setLoading(true);
  setProcessingPayment(passengerId);
  try {
    const res = await rideAPI.dropPassenger(passengerId);
    
    const droppedPassenger = passengers.find(p => p.id === passengerId);
    
    if (droppedPassenger) {
      // ❌ Updates only state, not DB
      setSessionEarnings(prev => prev + (droppedPassenger.fareAmount || 0));
      
      if (droppedPassenger.fareAmount && droppedPassenger.fareAmount > 0) {
        try {
          const paymentOrderRes = await paymentAPI.createPaymentOrder({
            rideId: currentRide.id,
            riderId: droppedPassenger.userId,  // ❌ Wrong field name
            driverId: user.id,
            amount: droppedPassenger.fareAmount,
            description: `CoRYD Ride Payment`,
          });

          if (paymentOrderRes.data?.orderId) {
            await initiatePayment({
              orderId: paymentOrderRes.data.orderId,
              amount: convertToPaise(droppedPassenger.fareAmount),
              onSuccess: async (response) => {
                // ❌ Assumes success immediately
                setSuccess(`💳 Payment successful! ₹${droppedPassenger.fareAmount}`);
                setProcessingPayment(null);
                // ❌ But doesn't verify backend updated
              },
            });
          }
        } catch (paymentErr) {
          // ❌ Error handling incomplete
        }
      }
    }
  } catch (err) {
    setError("Failed to drop passenger");
    setProcessingPayment(null);
  }
};
```

### AFTER (Correct fields, waits for verification)
```javascript
const handleDropPassenger = async (passengerId) => {
  setLoading(true);
  setProcessingPayment(passengerId);
  try {
    const res = await rideAPI.dropPassenger(passengerId);
    
    const droppedPassenger = passengers.find(p => p.id === passengerId);
    
    if (droppedPassenger) {
      // ✅ Frontend state (temporary)
      setSessionEarnings(prev => prev + (droppedPassenger.fareAmount || 0));
      
      if (droppedPassenger.fareAmount && droppedPassenger.fareAmount > 0) {
        try {
          // ✅ Create payment order
          const paymentOrderRes = await paymentAPI.createPaymentOrder({
            rideId: currentRide.id,
            riderId: droppedPassenger.riderId,  // ✅ Correct field
            driverId: user.id,
            amount: droppedPassenger.fareAmount,
            description: `CoRYD Ride Payment - ${currentRide.route || 'Ride'}`,
          });

          if (paymentOrderRes.data?.orderId) {
            // ✅ Initiate payment with correct handler
            await initiatePayment({
              orderId: paymentOrderRes.data.orderId,
              amount: convertToPaise(droppedPassenger.fareAmount),
              currency: "INR",
              description: `CoRYD Ride Payment`,
              passengerName: droppedPassenger.riderName || "Passenger",
              passengerEmail: droppedPassenger.riderEmail || "passenger@coryd.com",
              passengerPhone: droppedPassenger.riderPhone || user.phone,
              onSuccess: async (verificationResult) => {
                // ✅ Backend has already verified and updated DB
                if (verificationResult.success) {
                  setSuccess(`💳 Payment successful! ₹${droppedPassenger.fareAmount.toFixed(2)} received`);
                  setProcessingPayment(null);
                  fetchPassengers();
                  
                  // ✅ Fetch fresh earnings from DB
                  const earningsRes = await paymentAPI.getPaymentsForDriver(user.id);
                  const payments = earningsRes.data || [];
                  // ✅ Only COMPLETED payments counted
                  const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
                  setEarnings(total);
                }
              },
              onError: (errorMsg) => {
                // ✅ Better error handling
                setError(`Payment failed: ${errorMsg}. Passenger dropped.`);
                setProcessingPayment(null);
                fetchPassengers();
              },
            });
          }
        } catch (paymentErr) {
          console.error("Payment error:", paymentErr);
          // ✅ Clear error state
          setSuccess("✅ Passenger dropped! (Payment processing)");
          setProcessingPayment(null);
          fetchPassengers();
        }
      } else {
        setSuccess("✅ Passenger dropped off!");
        setProcessingPayment(null);
        fetchPassengers();
      }
    }
  } catch (err) {
    setError("Failed to drop passenger");
    setProcessingPayment(null);
  } finally {
    setLoading(false);
  }
};
```

---

## Summary of Changes

| Component | File | Changes | Impact |
|-----------|------|---------|--------|
| **Backend** | Payment.java | Added Razorpay fields | Store verification details |
| | PaymentController.java | Added 2 endpoints | Create orders, verify payments |
| | PaymentService.java | Added 2 methods | Complete payment flow |
| | PaymentRepository.java | Added 1 query | Filter by status |
| | **NEW** RazorpayVerificationUtil.java | Signature verification | Security |
| **Frontend** | razorpayUtils.js | Added verification call | Wait for backend confirm |
| | DriverDashboardNew.jsx | Updated payment handler | Fetch from DB after verify |

---

## Test the Changes

```bash
# 1. Compile backend
cd payment && mvn clean compile

# 2. Package backend
mvn package -DskipTests

# 3. Start services and test payment flow
# Expected: Payment is verified and earnings increment
```
