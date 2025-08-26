package com.rideshare.bookings;

import com.rideshare.rides.Ride;
import com.rideshare.rides.RideRepository;
import com.rideshare.users.User;
import com.rideshare.users.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingRepository bookingRepository;
    private final RideRepository rideRepository;
    private final UserRepository userRepository;

    public BookingController(BookingRepository bookingRepository, RideRepository rideRepository, UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.rideRepository = rideRepository;
        this.userRepository = userRepository;
    }

    /** PASSENGER: Create booking & reduce seats atomically */
    @PostMapping
    @Transactional
    public ResponseEntity<?> book(@RequestBody BookingRequest req, Authentication auth) {

        if (req.getRideId() == null || req.getSeats() == null || req.getSeats() <= 0) {
            return ResponseEntity.badRequest().body(ApiError.of("rideId and seats (>0) are required"));
        }

        String email = auth == null ? null : auth.getName();
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiError.of("Authentication required"));
        }

        User passenger = userRepository.findByEmail(email).orElseThrow();
        if (!"PASSENGER".equalsIgnoreCase(passenger.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiError.of("Only PASSENGER can book"));
        }

        // Pessimistic lock to prevent overselling
        Ride ride = rideRepository.findByIdForUpdate(req.getRideId()).orElse(null);
        if (ride == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiError.of("Ride not found"));
        }

        if (ride.getSeatsAvailable() < req.getSeats()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiError.of("Not enough seats available"));
        }

        ride.setSeatsAvailable(ride.getSeatsAvailable() - req.getSeats());
        rideRepository.save(ride);

        Booking booking = new Booking();
        booking.setRideId(ride.getId());
        booking.setPassengerId(passenger.getId());
        booking.setSeatsBooked(req.getSeats());
        booking.setBookingStatus("CONFIRMED");
        booking.setPaymentStatus("PENDING");
        booking.setCreatedAt(LocalDateTime.now());

        Booking saved = bookingRepository.save(booking);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "booking", saved,
                "ride", ride
        ));
    }

    /** PASSENGER: My bookings with ride info for frontend */
    @GetMapping("/mine")
    public ResponseEntity<?> myBookings(Authentication auth) {
        String email = (String) auth.getPrincipal();
        User me = userRepository.findByEmail(email).orElseThrow();

        List<Booking> bookings = bookingRepository.findByPassengerId(me.getId());

        List<Map<String, Object>> mapped = bookings.stream()
                .map(b -> {
                    Ride ride = rideRepository.findById(b.getRideId()).orElse(null);
                    return Map.<String, Object>of(
                            "id", b.getId(),
                            "seatsBooked", b.getSeatsBooked(),
                            "bookingStatus", b.getBookingStatus(),
                            "paymentStatus", b.getPaymentStatus(),
                            "createdAt", b.getCreatedAt(),
                            "source", ride != null ? ride.getSource() : "",
                            "destination", ride != null ? ride.getDestination() : "",
                            "departureDatetime", ride != null ? ride.getDepartureDatetime() : null,
                            "price", ride != null ? ride.getPrice() : 0
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(mapped);
    }

    /** PASSENGER: Get booking by ID */
    @GetMapping("/{id}")
    public ResponseEntity<?> getBooking(@PathVariable Long id, Authentication auth) {
        String email = (String) auth.getPrincipal();
        User me = userRepository.findByEmail(email).orElseThrow();

        return bookingRepository.findById(id)
                .<ResponseEntity<?>>map(b -> {
                    if (!b.getPassengerId().equals(me.getId())) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiError.of("Not allowed"));
                    }
                    Ride ride = rideRepository.findById(b.getRideId()).orElse(null);
                    return ResponseEntity.ok(Map.<String, Object>of(
                            "booking", b,
                            "source", ride != null ? ride.getSource() : "",
                            "destination", ride != null ? ride.getDestination() : "",
                            "departureDatetime", ride != null ? ride.getDepartureDatetime() : null,
                            "price", ride != null ? ride.getPrice() : 0
                    ));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiError.of("Booking not found")));
    }

    /** Simple API error wrapper */
    static class ApiError {
        public final String error;
        private ApiError(String error) { this.error = error; }
        public static ApiError of(String m) { return new ApiError(m); }
    }
}
