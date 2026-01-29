package com.carpool.payment.repository;

import com.carpool.payment.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByRiderId(Long riderId);
    List<Payment> findByDriverId(Long driverId);
    List<Payment> findByStatus(Payment.PaymentStatus status);
}