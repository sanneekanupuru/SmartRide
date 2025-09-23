package com.rideshare.admin;

import com.rideshare.bookings.Booking;
import com.rideshare.bookings.BookingRepository;
import com.rideshare.bookings.BookingResponseDTO;
import com.rideshare.payments.Payment;
import com.rideshare.payments.PaymentRepository;
import com.rideshare.rides.DriverRideDTO;
import com.rideshare.rides.Ride;
import com.rideshare.rides.RideRepository;
import com.rideshare.security.JwtUtil;
import com.rideshare.users.User;
import com.rideshare.users.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    @Autowired private UserRepository userRepository;
    @Autowired private RideRepository rideRepository;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AdminRepository adminRepository;

    // -------------------- AUTH --------------------
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody AdminLoginRequest request) {
        Map<String, String> response = new HashMap<>();
        Admin admin = adminRepository.findByUsername(request.getUsername()).orElse(null);

        if (admin != null && passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            String token = jwtUtil.generateToken(admin.getUsername(), admin.getRole());
            response.put("message", "Admin login successful");
            response.put("token", token);
            response.put("role", admin.getRole());
            return ResponseEntity.ok(response);
        }

        response.put("message", "Invalid admin credentials");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    // -------------------- DASHBOARD STATS --------------------
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalRides", rideRepository.count());
        stats.put("totalBookings", bookingRepository.count());
        stats.put("totalPayments", paymentRepository.count());
        stats.put("totalEarnings", paymentRepository.sumCompletedPayments());
        stats.put("cancelledBookings", bookingRepository.countByBookingStatus("CANCELLED"));
        stats.put("disputedBookings", bookingRepository.countByIsDisputedTrue());
        stats.put("activeUsers", userRepository.countByIsBlockedFalse());
        return stats;
    }

    // -------------------- MONITORING --------------------
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/bookings")
    public List<BookingResponseDTO> getAllBookings() {
        List<Booking> bookings = bookingRepository.findAll();
        return bookings.stream().map(b -> {
            Ride ride = rideRepository.findById(b.getRideId()).orElse(null);
            User passenger = userRepository.findById(b.getPassengerId()).orElse(null);
            return new BookingResponseDTO(b, ride, passenger, paymentRepository, userRepository);
        }).toList();
    }

    @GetMapping("/rides")
    public List<DriverRideDTO> getAllRides() {
        List<Ride> rides = rideRepository.findAll();
        List<DriverRideDTO> result = new ArrayList<>();
        List<Booking> allBookings = bookingRepository.findAll();

        Map<Long, User> passengerMap = new HashMap<>();
        allBookings.forEach(b -> userRepository.findById(b.getPassengerId())
                .ifPresent(u -> passengerMap.put(u.getId(), u)));

        for (Ride r : rides) {
            List<Booking> rideBookings = allBookings.stream()
                    .filter(b -> b.getRideId().equals(r.getId()))
                    .collect(Collectors.toList());

            User driver = userRepository.findById(r.getDriverId()).orElse(null);
            String driverName = driver != null ? driver.getName() : "Unknown";

            result.add(new DriverRideDTO(r, rideBookings, passengerMap, driverName, paymentRepository));
        }
        return result;
    }

    // -------------------- PAYMENTS --------------------
    @GetMapping("/payments")
    public ResponseEntity<List<PaymentDTO>> getAllPayments() {
        List<Payment> payments = paymentRepository.findAll();
        List<PaymentDTO> result = payments.stream().map(p -> {
            Booking booking = p.getBooking();
            User passenger = booking != null ? userRepository.findById(booking.getPassengerId()).orElse(null) : null;
            Ride ride = booking != null ? rideRepository.findById(booking.getRideId()).orElse(null) : null;
            User driver = ride != null ? userRepository.findById(ride.getDriverId()).orElse(null) : null;
            return new PaymentDTO(p,
                    passenger != null ? passenger.getName() : "Unknown",
                    driver != null ? driver.getName() : "Unknown");
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // -------------------- ADMIN UPDATE PAYMENT STATUS --------------------
    @PatchMapping("/payments/{paymentId}/status")
    public ResponseEntity<?> updatePaymentStatusAdmin(@PathVariable Long paymentId,
                                                      @RequestParam String status) {
        Payment payment = paymentRepository.findById(paymentId).orElse(null);
        if (payment == null) return ResponseEntity.status(404).body("Payment not found");

        try {
            Payment.PaymentStatus newStatus = Payment.PaymentStatus.valueOf(status.toUpperCase());
            payment.setStatus(newStatus);
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            // AUTO-UPDATE BOOKING STATUS IF PAYMENT COMPLETED
            if (newStatus == Payment.PaymentStatus.COMPLETED) {
                Booking booking = payment.getBooking();
                if (booking != null && !"CONFIRMED".equalsIgnoreCase(booking.getBookingStatus())) {
                    booking.setBookingStatus("CONFIRMED");
                    bookingRepository.save(booking);
                }
            }

            // Return updated DTO
            Booking booking = payment.getBooking();
            User passenger = booking != null ? userRepository.findById(booking.getPassengerId()).orElse(null) : null;
            Ride ride = booking != null ? rideRepository.findById(booking.getRideId()).orElse(null) : null;
            User driver = ride != null ? userRepository.findById(ride.getDriverId()).orElse(null) : null;

            PaymentDTO dto = new PaymentDTO(payment,
                    passenger != null ? passenger.getName() : "Unknown",
                    driver != null ? driver.getName() : "Unknown");

            return ResponseEntity.ok(dto);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid status. Use PENDING, COMPLETED, FAILED.");
        }
    }

    // -------------------- DISPUTES --------------------
    @GetMapping("/disputes")
    public List<Booking> getDisputedBookings() {
        return bookingRepository.findByIsDisputedTrue();
    }

    // -------------------- USER MANAGEMENT --------------------
    @PutMapping("/block-user/{id}")
    public String blockUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setBlocked(true);
                    userRepository.save(user);
                    return "User blocked successfully";
                }).orElse("User not found");
    }

    @PutMapping("/verify-driver/{id}")
    public String verifyDriver(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setVerified(true);
                    userRepository.save(user);
                    return "Driver verified successfully";
                }).orElse("User not found");
    }

    // -------------------- DTOs --------------------
    public record PaymentDTO(
            Long paymentId,
            Long bookingId,
            Long rideId,
            BigDecimal amount,
            String paymentMethod,
            String paymentStatus,
            LocalDateTime createdAt,
            String passengerName,
            String driverName
    ) {
        public PaymentDTO(Payment p, String passengerName, String driverName) {
            this(
                    p.getId(),
                    p.getBooking() != null ? p.getBooking().getId() : null,
                    p.getBooking() != null ? p.getBooking().getRideId() : null,
                    p.getAmount(),
                    p.getPaymentMethod() != null ? p.getPaymentMethod().name() : "CASH",
                    p.getStatus() != null ? p.getStatus().name() : "PENDING",
                    p.getCreatedAt(),
                    passengerName,
                    driverName
            );
        }
    }
}
