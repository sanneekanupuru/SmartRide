package com.rideshare.bookings;

import com.rideshare.payments.PaymentRepository;
import com.rideshare.rides.Ride;
import com.rideshare.rides.RideRepository;
import com.rideshare.users.User;
import com.rideshare.users.UserRepository;
import com.rideshare.notifications.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    private final BookingRepository bookingRepository;
    private final RideRepository rideRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    // Notification service (injected)
    @org.springframework.beans.factory.annotation.Autowired
    private NotificationService notificationService;

    public BookingController(BookingRepository bookingRepository,
                             RideRepository rideRepository,
                             UserRepository userRepository,
                             PaymentRepository paymentRepository) {
        this.bookingRepository = bookingRepository;
        this.rideRepository = rideRepository;
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
    }

    /** Create booking (status = PENDING) */
    @PostMapping("/{rideId}")
    @Transactional
    public ResponseEntity<?> createBooking(@PathVariable Long rideId,
                                           @RequestParam int seats,
                                           Authentication auth) {
        try {
            User passenger = userRepository.findByEmail(auth.getName()).orElse(null);
            if (passenger == null)
                return ResponseEntity.badRequest().body(new ApiError("Passenger not found"));

            Ride ride = rideRepository.findById(rideId).orElse(null);
            if (ride == null)
                return ResponseEntity.badRequest().body(new ApiError("Ride not found"));

            if (seats <= 0) return ResponseEntity.badRequest().body(new ApiError("Seats must be > 0"));

            // Atomic decrement/reserve seats
            int updated = rideRepository.decrementSeatsIfAvailable(rideId, seats);
            if (updated == 0) {
                return ResponseEntity.badRequest().body(new ApiError("Not enough seats available"));
            }

            // Create booking (PENDING). Important: do NOT set fare here.
            Booking booking = new Booking();
            booking.setRideId(rideId);
            booking.setPassengerId(passenger.getId());
            booking.setSeatsBooked(seats);
            booking.setBookingStatus("PENDING");
            booking.setDriverApproved(false);

            Booking saved = bookingRepository.save(booking);

            // --- Notification: inform driver about the pending booking (in-app + email) ---
            try {
                com.rideshare.users.User driver = userRepository.findById(ride.getDriverId()).orElse(null);
                if (driver != null) {
                    String title = "New ride request";
                    // intentionally do NOT include fare in the message
                    String msg = String.format("Passenger %s requested %d seat(s) on your ride from %s to %s departing at %s.",
                            passenger.getName(), saved.getSeatsBooked(), ride.getSource(), ride.getDestination(), ride.getDepartureDatetime());
                    // create in-app record AND send email (sendEmail=true)
                    notificationService.createNotification(driver.getId(), ride.getId(), saved.getId(), title, msg, true, driver.getEmail());
                }
            } catch (Exception ex) {
                // Swallow / log — must not break booking flow
                System.err.println("Notification error (createBooking): " + ex.getMessage());
            }

            return ResponseEntity.ok(
                    new BookingResponseDTO(saved, ride, passenger, paymentRepository, userRepository)
            );
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiError("Internal server error: " + e.getMessage()));
        }
    }


    /** DRIVER: Approve a booking request */
    @PostMapping("/approve/{bookingId}")
    @Transactional
    public ResponseEntity<?> approveBooking(@PathVariable Long bookingId, Authentication auth) {
        try {
            Booking booking = bookingRepository.findById(bookingId).orElse(null);
            if (booking == null) return ResponseEntity.status(404).body(new ApiError("Booking not found"));

            Ride ride = rideRepository.findById(booking.getRideId()).orElse(null);
            if (ride == null) return ResponseEntity.badRequest().body(new ApiError("Ride not found"));

            String principalEmail = (String) auth.getPrincipal();
            User driver = userRepository.findByEmail(principalEmail).orElse(null);
            if (driver == null || !driver.getId().equals(ride.getDriverId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiError("Not authorized"));
            }

            // mark driver_approved true
            booking.setDriverApproved(true);
            bookingRepository.save(booking);

            // Notify passenger (in-app + email)
            User passenger = userRepository.findById(booking.getPassengerId()).orElse(null);
            if (passenger != null) {
                String title = "Driver approved your ride request";
                String msg = String.format("Your request for %d seat(s) on ride %d from %s to %s has been approved by %s. Please proceed to payment.",
                        booking.getSeatsBooked(), ride.getId(), ride.getSource(), ride.getDestination(), driver.getName());
                notificationService.createNotification(passenger.getId(), ride.getId(), booking.getId(), title, msg, true, passenger.getEmail());
            }

            return ResponseEntity.ok(Map.of("message", "Booking approved"));

        } catch (Exception ex) {
            return ResponseEntity.status(500).body(new ApiError("Failed to approve: " + ex.getMessage()));
        }
    }

    /** DRIVER: Reject a booking request */
    @PostMapping("/reject/{bookingId}")
    @Transactional
    public ResponseEntity<?> rejectBooking(@PathVariable Long bookingId, Authentication auth) {
        try {
            Booking booking = bookingRepository.findById(bookingId).orElse(null);
            if (booking == null) return ResponseEntity.status(404).body(new ApiError("Booking not found"));

            Ride ride = rideRepository.findById(booking.getRideId()).orElse(null);
            if (ride == null) return ResponseEntity.badRequest().body(new ApiError("Ride not found"));

            String principalEmail = (String) auth.getPrincipal();
            User driver = userRepository.findByEmail(principalEmail).orElse(null);
            if (driver == null || !driver.getId().equals(ride.getDriverId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiError("Not authorized"));
            }

            booking.setBookingStatus("CANCELLED");
            bookingRepository.save(booking);

            // restore seats because booking was pending and now cancelled
            try {
                rideRepository.incrementSeats(booking.getRideId(), booking.getSeatsBooked());
            } catch (Exception ex) {
                System.err.println("Failed to restore seats after rejection: " + ex.getMessage());
            }

            // Notify passenger
            User passenger = userRepository.findById(booking.getPassengerId()).orElse(null);
            if (passenger != null) {
                String title = "Driver rejected your ride request";
                String msg = String.format("Your request for %d seat(s) on ride %d from %s to %s was rejected by the driver.",
                        booking.getSeatsBooked(), ride.getId(), ride.getSource(), ride.getDestination());
                notificationService.createNotification(passenger.getId(), ride.getId(), booking.getId(), title, msg, true, passenger.getEmail());
            }

            return ResponseEntity.ok(Map.of("message", "Booking rejected"));

        } catch (Exception ex) {
            return ResponseEntity.status(500).body(new ApiError("Failed to reject: " + ex.getMessage()));
        }
    }

    /** Get booking by ID */
    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingById(@PathVariable Long id) {
        try {
            Booking booking = bookingRepository.findById(id).orElse(null);
            if (booking == null) return ResponseEntity.badRequest().body(new ApiError("Booking not found"));

            Ride ride = rideRepository.findById(booking.getRideId()).orElse(null);
            if (ride == null) return ResponseEntity.badRequest().body(new ApiError("Ride not found"));

            User passenger = userRepository.findById(booking.getPassengerId()).orElse(null);
            if (passenger == null) return ResponseEntity.badRequest().body(new ApiError("Passenger not found"));

            return ResponseEntity.ok(
                    new BookingResponseDTO(booking, ride, passenger, paymentRepository, userRepository)
            );
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiError("Internal server error: " + e.getMessage()));
        }
    }

    /** Get bookings for authenticated user */
    @GetMapping("/mine")
    public ResponseEntity<?> getMyBookings(Authentication auth) {
        try {
            User passenger = userRepository.findByEmail(auth.getName()).orElse(null);
            if (passenger == null)
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiError("Passenger not found"));

            List<Booking> bookings = bookingRepository.findByPassengerId(passenger.getId());
            if (bookings.isEmpty()) return ResponseEntity.ok(List.of());

            List<BookingResponseDTO> response = bookings.stream()
                    .map(b -> {
                        Ride ride = rideRepository.findById(b.getRideId()).orElse(null);
                        return new BookingResponseDTO(b, ride, passenger, paymentRepository, userRepository);
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiError("Internal server error: " + e.getMessage()));
        }
    }

    // --- Helper class for API error responses ---
    static class ApiError {
        public final String error;
        public ApiError(String error) { this.error = error; }
    }
}
