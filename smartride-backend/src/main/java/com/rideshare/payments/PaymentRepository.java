package com.rideshare.payments;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    // Existing method
    List<Payment> findByBookingId(Long bookingId);

    // NEW: Get latest payment by booking ID
    Optional<Payment> findTopByBookingIdOrderByCreatedAtDesc(Long bookingId);
}
