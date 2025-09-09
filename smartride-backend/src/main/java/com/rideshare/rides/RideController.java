package com.rideshare.rides;

import com.rideshare.bookings.Booking;
import com.rideshare.bookings.BookingRepository;
import com.rideshare.payments.PaymentRepository;
import com.rideshare.users.User;
import com.rideshare.users.UserRepository;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/rides")
@CrossOrigin(origins = "*")
public class RideController {

    private final RideRepository rideRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;

    public RideController(RideRepository rideRepository,
                          UserRepository userRepository,
                          BookingRepository bookingRepository,
                          PaymentRepository paymentRepository) {
        this.rideRepository = rideRepository;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
    }

    /** DRIVER: Create a ride */
    @PostMapping
    @Transactional
    public ResponseEntity<?> createRide(@RequestBody RideRequest req, Authentication auth) {
        try {
            if (auth == null || auth.getPrincipal() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiError("Unauthorized: Please login"));
            }

            String principalEmail = (String) auth.getPrincipal();
            User driver = userRepository.findByEmail(principalEmail)
                    .orElseThrow(() -> new RuntimeException("Driver not found"));

            if (!"DRIVER".equalsIgnoreCase(driver.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiError("Only DRIVER can post rides"));
            }

            if (req.getSource() == null || req.getDestination() == null ||
                    req.getDate() == null || req.getTime() == null ||
                    req.getSeatsTotal() == null || req.getPrice() == null) {
                return ResponseEntity.badRequest()
                        .body(new ApiError("source, destination, date, time, seatsTotal, price are required"));
            }

            LocalDate date;
            LocalTime time;
            try {
                date = LocalDate.parse(req.getDate().trim());
                time = LocalTime.parse(req.getTime().trim());
            } catch (Exception e) {
                return ResponseEntity.badRequest()
                        .body(new ApiError("Invalid date/time format. Expect date=YYYY-MM-DD, time=HH:mm"));
            }

            if (driver.getCapacity() == null || driver.getCapacity() <= 0) {
                return ResponseEntity.badRequest()
                        .body(new ApiError("Driver profile missing capacity"));
            }
            if (req.getSeatsTotal() > driver.getCapacity()) {
                return ResponseEntity.badRequest()
                        .body(new ApiError("seatsTotal exceeds driver capacity"));
            }

            if (req.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest()
                        .body(new ApiError("Price must be greater than 0"));
            }

            Ride ride = new Ride();
            ride.setDriverId(driver.getId());
            ride.setSource(req.getSource().trim());
            ride.setDestination(req.getDestination().trim());
            ride.setDepartureDatetime(LocalDateTime.of(date, time));
            ride.setSeatsTotal(req.getSeatsTotal());
            ride.setSeatsAvailable(req.getSeatsTotal());
            ride.setPrice(req.getPrice());
            ride.setVehicleModel(driver.getVehicleModel() != null ? driver.getVehicleModel() : "Unknown");
            ride.setLicensePlate(driver.getLicensePlate() != null ? driver.getLicensePlate() : "Unknown");
            ride.setCreatedAt(LocalDateTime.now());

            Ride saved = rideRepository.save(ride);

            RideResponseDTO response = new RideResponseDTO(
                    saved.getId(),
                    saved.getDriverId(),
                    driver.getName(),
                    saved.getSource(),
                    saved.getDestination(),
                    saved.getDepartureDatetime(),
                    saved.getSeatsTotal(),
                    saved.getSeatsAvailable(),
                    saved.getPrice(),
                    saved.getVehicleModel(),
                    saved.getLicensePlate()
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiError("Internal server error: " + e.getMessage()));
        }
    }

    /** PASSENGER: Search rides */
    @GetMapping("/search")
    public ResponseEntity<?> searchRides(
            @RequestParam String source,
            @RequestParam String destination,
            @RequestParam String date
    ) {
        try {
            LocalDate parsedDate = LocalDate.parse(date.trim());
            LocalDateTime startOfDay = parsedDate.atStartOfDay();
            LocalDateTime endOfDay = parsedDate.plusDays(1).atStartOfDay();

            List<Ride> rides = rideRepository.search(
                    source.trim(),
                    destination.trim(),
                    startOfDay,
                    endOfDay
            );

            List<RideResponseDTO> result = rides.stream().map(ride -> {
                User driver = userRepository.findById(ride.getDriverId()).orElse(null);
                String driverName = driver != null ? driver.getName() : "";
                return new RideResponseDTO(
                        ride.getId(),
                        ride.getDriverId(),
                        driverName,
                        ride.getSource(),
                        ride.getDestination(),
                        ride.getDepartureDatetime(),
                        ride.getSeatsTotal(),
                        ride.getSeatsAvailable(),
                        ride.getPrice(),
                        ride.getVehicleModel(),
                        ride.getLicensePlate()
                );
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiError("Internal server error: " + e.getMessage()));
        }
    }

    /** DRIVER: Get own rides with bookings */
    @GetMapping("/mine")
    public ResponseEntity<?> myRides(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiError("Unauthorized: Please login"));
        }

        String email = (String) auth.getPrincipal();
        User me = userRepository.findByEmail(email).orElseThrow(() ->
                new RuntimeException("Driver not found")
        );

        if (!"DRIVER".equalsIgnoreCase(me.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiError("Only DRIVER has /mine rides"));
        }

        // Fetch all rides for this driver
        List<Ride> rides = rideRepository.findByDriverIdOrderByDepartureDatetimeDesc(me.getId());
        if (rides.isEmpty()) return ResponseEntity.ok(List.of());

        // Load all bookings for this driver's rides
        List<Long> rideIds = rides.stream().map(Ride::getId).toList();
        List<Booking> allBookings = bookingRepository.findAll().stream()
                .filter(b -> rideIds.contains(b.getRideId()))
                .toList();

        // Load all passengers
        Map<Long, User> passengersMap = new HashMap<>();
        allBookings.forEach(b -> userRepository.findById(b.getPassengerId())
                .ifPresent(u -> passengersMap.put(u.getId(), u)));

        // Build DTOs with driverName and bookings
        List<DriverRideDTO> result = new ArrayList<>();
        for (Ride r : rides) {
            List<Booking> rideBookings = allBookings.stream()
                    .filter(b -> b.getRideId().equals(r.getId()))
                    .toList();

            result.add(new DriverRideDTO(r, rideBookings, passengersMap, me.getName(), paymentRepository));
        }

        return ResponseEntity.ok(result);
    }


    /** Get ride by id */
    @GetMapping("/{id}")
    public ResponseEntity<?> getRide(@PathVariable Long id) {
        return rideRepository.findById(id)
                .<ResponseEntity<?>>map(ride -> {
                    User driver = userRepository.findById(ride.getDriverId()).orElse(null);
                    String driverName = driver != null ? driver.getName() : "";
                    return ResponseEntity.ok(new RideResponseDTO(
                            ride.getId(),
                            ride.getDriverId(),
                            driverName,
                            ride.getSource(),
                            ride.getDestination(),
                            ride.getDepartureDatetime(),
                            ride.getSeatsTotal(),
                            ride.getSeatsAvailable(),
                            ride.getPrice(),
                            ride.getVehicleModel(),
                            ride.getLicensePlate()
                    ));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiError("Ride not found")));
    }

    /** Simple error class */
    static class ApiError {
        public final String error;
        public ApiError(String error) { this.error = error; }
    }
}
