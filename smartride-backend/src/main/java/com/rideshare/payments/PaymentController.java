package com.rideshare.payments;

import com.rideshare.bookings.Booking;
import com.rideshare.bookings.BookingRepository;
import com.rideshare.rides.Ride;
import com.rideshare.rides.RideRepository;
import com.rideshare.users.User;
import com.rideshare.users.UserRepository;
import com.rideshare.notifications.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final RideRepository rideRepository;
    private final UserRepository userRepository;

    // Notification service (injected)
    @org.springframework.beans.factory.annotation.Autowired
    private NotificationService notificationService;

    private final BigDecimal BASE_FARE = BigDecimal.valueOf(50);
    private final BigDecimal RATE_PER_KM = BigDecimal.valueOf(10);

    public PaymentController(PaymentRepository paymentRepository,
                             BookingRepository bookingRepository,
                             RideRepository rideRepository,
                             UserRepository userRepository) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.rideRepository = rideRepository;
        this.userRepository = userRepository;
    }

    /** ---- Make Payment ---- */
    @PostMapping("/pay/{bookingId}")
    @Transactional
    public ResponseEntity<?> makePayment(@PathVariable Long bookingId,
                                         @RequestParam String paymentMethodStr) {

        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) return ResponseEntity.status(404).body(new ApiError("Booking not found"));

        // NEW GUARD: ensure driver has approved this booking before payment is allowed
        if (booking.getDriverApproved() == null || !booking.getDriverApproved()) {
            return ResponseEntity.badRequest().body(new ApiError("Driver has not approved this booking yet. Please wait."));
        }

        try {
            // Lock ride row to prevent overselling checks (not to decrement seats again)
            Ride ride = rideRepository.findByIdForUpdate(booking.getRideId())
                    .orElseThrow(() -> new RuntimeException("Ride not found"));

            if (ride.getSeatsAvailable() < 0) {
                // Defensive check; normally seats were reserved during booking creation
                return ResponseEntity.badRequest().body(new ApiError("Invalid seats state"));
            }

            // Calculate fare
            double distanceKm = calculateDistanceInKm(ride.getSource(), ride.getDestination());
            BigDecimal totalFare = BASE_FARE
                    .add(RATE_PER_KM.multiply(BigDecimal.valueOf(distanceKm)))
                    .multiply(BigDecimal.valueOf(booking.getSeatsBooked()));

            // Validate payment method
            Payment.PaymentMethod paymentMethod;
            try {
                paymentMethod = Payment.PaymentMethod.valueOf(paymentMethodStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(new ApiError("Invalid payment method"));
            }

            // Create payment
            Payment payment = new Payment();
            payment.setBooking(booking);
            payment.setAmount(totalFare);
            payment.setPaymentMethod(paymentMethod);
            payment.setStatus(paymentMethod == Payment.PaymentMethod.CASH
                    ? Payment.PaymentStatus.PENDING
                    : Payment.PaymentStatus.COMPLETED);
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            // Update booking: set fare (calculated) and confirm booking
            booking.setBookingStatus("CONFIRMED");
            booking.setFare(totalFare);
            bookingRepository.save(booking);

            // NOTE: seats were already reserved at booking time. DO NOT decrement again here.

            // --- Notifications: inform passenger & driver about confirmed booking ---
            try {
                User passenger = userRepository.findById(booking.getPassengerId()).orElse(null);
                User driver = userRepository.findById(ride.getDriverId()).orElse(null);

                if (passenger != null) {
                    String title = "Booking confirmed";
                    String msg = String.format("Your booking #%d is confirmed for ride from %s to %s. Driver: %s.",
                            booking.getId(), ride.getSource(), ride.getDestination(), driver != null ? driver.getName() : "");
                    notificationService.createNotification(passenger.getId(), ride.getId(), booking.getId(), title, msg, true, passenger.getEmail());
                }
                if (driver != null) {
                    String title2 = "Booking confirmed for your ride";
                    String msg2 = String.format("Booking #%d for your ride from %s to %s is confirmed. Passenger: %s.",
                            booking.getId(), ride.getSource(), ride.getDestination(), passenger != null ? passenger.getName() : "");
                    notificationService.createNotification(driver.getId(), ride.getId(), booking.getId(), title2, msg2, true, driver.getEmail());
                }
            } catch (Exception ex) {
                System.err.println("Notification error (makePayment): " + ex.getMessage());
            }

            // Return DTO
            PaymentResponseDTO response = new PaymentResponseDTO(payment, bookingRepository, rideRepository, userRepository);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiError("Payment failed: " + e.getMessage()));
        }
    }

    /** ---- Estimate Fare ---- */
    @GetMapping("/estimate/{bookingId}")
    public ResponseEntity<?> calculateFare(@PathVariable Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) return ResponseEntity.status(404).body(new ApiError("Booking not found"));

        try {
            Ride ride = rideRepository.findById(booking.getRideId()).orElse(null);
            if (ride == null) return ResponseEntity.status(404).body(new ApiError("Ride not found"));

            double distanceKm = calculateDistanceInKm(ride.getSource(), ride.getDestination());
            BigDecimal totalFare = BASE_FARE
                    .add(RATE_PER_KM.multiply(BigDecimal.valueOf(distanceKm)))
                    .multiply(BigDecimal.valueOf(booking.getSeatsBooked()));

            return ResponseEntity.ok(new FareEstimateDTO(booking, ride, distanceKm, totalFare));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiError("Fare calculation failed: " + e.getMessage()));
        }
    }

    /** ---- Update Payment Status (Driver action for CASH) ---- */
    @PatchMapping("/{paymentId}/status")
    @Transactional
    public ResponseEntity<?> updatePaymentStatus(@PathVariable Long paymentId,
                                                 @RequestParam String status) {
        Payment payment = paymentRepository.findById(paymentId).orElse(null);
        if (payment == null) return ResponseEntity.status(404).body(new ApiError("Payment not found"));

        try {
            Payment.PaymentStatus newStatus = Payment.PaymentStatus.valueOf(status.toUpperCase());

            payment.setStatus(newStatus);
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            return ResponseEntity.ok(new PaymentResponseDTO(payment, bookingRepository, rideRepository, userRepository));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiError("Invalid status. Use PENDING, COMPLETED, FAILED."));
        }
    }

    /** ---- Get Payments by Booking ---- */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<?> getPaymentsByBooking(@PathVariable Long bookingId) {
        List<Payment> payments = paymentRepository.findByBookingId(bookingId);
        List<PaymentResponseDTO> result = payments.stream()
                .map(p -> new PaymentResponseDTO(p, bookingRepository, rideRepository, userRepository))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // --- Utility Methods ---
    private double calculateDistanceInKm(String source, String destination) throws Exception {
        double[] src = getCoordinates(source);
        double[] dest = getCoordinates(destination);
        return haversineDistance(src[0], src[1], dest[0], dest[1]);
    }

    private double[] getCoordinates(String location) throws Exception {
        String url = "https://nominatim.openstreetmap.org/search?q=" +
                URLEncoder.encode(location, StandardCharsets.UTF_8) +
                "&format=json&limit=1";

        RestTemplate restTemplate = new RestTemplate();
        NominatimPlace[] results = restTemplate.getForObject(url, NominatimPlace[].class);

        if (results == null || results.length == 0) throw new Exception("Location not found: " + location);
        return new double[] { Double.parseDouble(results[0].lat), Double.parseDouble(results[0].lon) };
    }

    private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon/2) * Math.sin(dLon/2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // --- DTOs ---
    public record PaymentResponseDTO(
            Long paymentId,
            Long bookingId,
            Long rideId,
            BigDecimal amount,
            String paymentMethod,
            String status,
            LocalDateTime createdAt,
            String passengerName,
            String driverName
    ) {
        public PaymentResponseDTO(Payment p,
                                  BookingRepository bookingRepository,
                                  RideRepository rideRepository,
                                  UserRepository userRepository) {

            this(
                    p.getId(),
                    p.getBooking().getId(),
                    p.getBooking().getRideId(),
                    p.getAmount(),
                    p.getPaymentMethod().name(),
                    p.getStatus().name(),
                    p.getCreatedAt(),
                    userRepository.findById(p.getBooking().getPassengerId())
                            .map(User::getName)
                            .orElse("Unknown"),
                    rideRepository.findById(p.getBooking().getRideId())
                            .map(r -> userRepository.findById(r.getDriverId())
                                    .map(User::getName)
                                    .orElse("Unknown"))
                            .orElse("Unknown")
            );
        }
    }

    public record FareEstimateDTO(Long bookingId, Long rideId, double distanceKm, BigDecimal totalFare) {
        public FareEstimateDTO(Booking b, Ride r, double distanceKm, BigDecimal totalFare) {
            this(b.getId(), r.getId(), distanceKm, totalFare);
        }
    }

    private static class NominatimPlace { public String lat; public String lon; }
    private static class ApiError { public final String error; ApiError(String error) { this.error = error; } }
}
