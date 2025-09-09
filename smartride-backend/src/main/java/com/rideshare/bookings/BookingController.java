package com.rideshare.bookings;

import com.rideshare.payments.PaymentRepository;
import com.rideshare.rides.Ride;
import com.rideshare.rides.RideRepository;
import com.rideshare.users.User;
import com.rideshare.users.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    private final BookingRepository bookingRepository;
    private final RideRepository rideRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

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

            if (ride.getSeatsAvailable() < seats)
                return ResponseEntity.badRequest().body(new ApiError("Not enough seats available"));

            Booking booking = new Booking();
            booking.setRideId(rideId);
            booking.setPassengerId(passenger.getId());
            booking.setSeatsBooked(seats);
            booking.setBookingStatus("PENDING");

            // ✅ Calculate fare from ride price
            BigDecimal seatPrice = ride.getPrice();
            BigDecimal totalFare = seatPrice.multiply(BigDecimal.valueOf(seats));
            booking.setFare(totalFare);

            Booking saved = bookingRepository.save(booking);

            return ResponseEntity.ok(
                    new BookingResponseDTO(saved, ride, passenger, paymentRepository, userRepository)
            );
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiError("Internal server error: " + e.getMessage()));
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
