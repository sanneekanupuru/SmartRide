package com.rideshare.rides;

import com.rideshare.users.User;
import com.rideshare.users.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/rides")
@CrossOrigin(origins = "*")
public class RideController {

    private final RideRepository rideRepository;
    private final UserRepository userRepository;

    public RideController(RideRepository rideRepository, UserRepository userRepository) {
        this.rideRepository = rideRepository;
        this.userRepository = userRepository;
    }

    /** DRIVER: Create a ride */
    @PostMapping
    @Transactional
    public ResponseEntity<?> createRide(@RequestBody RideRequest req, Authentication auth) {
        try {
            // 1️⃣ Check authentication
            if (auth == null || auth.getPrincipal() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiError.of("Unauthorized: Please login"));
            }

            String principalEmail = (String) auth.getPrincipal();
            User driver = userRepository.findByEmail(principalEmail)
                    .orElseThrow(() -> new RuntimeException("Driver not found"));

            if (!"DRIVER".equalsIgnoreCase(driver.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiError.of("Only DRIVER can post rides"));
            }

            // 2️⃣ Validate required fields
            if (req.getSource() == null || req.getDestination() == null ||
                    req.getDate() == null || req.getTime() == null ||
                    req.getSeatsTotal() == null || req.getPrice() == null) {
                return ResponseEntity.badRequest()
                        .body(ApiError.of("source, destination, date, time, seatsTotal, price are required"));
            }

            // 3️⃣ Validate date and time formats
            LocalDate date;
            LocalTime time;
            try {
                date = LocalDate.parse(req.getDate().trim());
                time = LocalTime.parse(req.getTime().trim());
            } catch (Exception e) {
                return ResponseEntity.badRequest()
                        .body(ApiError.of("Invalid date/time format. Expect date=YYYY-MM-DD, time=HH:mm"));
            }

            // 4️⃣ Validate driver capacity and seats
            if (driver.getCapacity() == null || driver.getCapacity() <= 0) {
                return ResponseEntity.badRequest()
                        .body(ApiError.of("Driver profile missing capacity"));
            }
            if (req.getSeatsTotal() > driver.getCapacity()) {
                return ResponseEntity.badRequest()
                        .body(ApiError.of("seatsTotal exceeds driver capacity"));
            }

            // 5️⃣ Validate price
            if (req.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest()
                        .body(ApiError.of("Price must be greater than 0"));
            }

            // 6️⃣ Create ride entity
            Ride ride = new Ride();
            ride.setDriverId(driver.getId());
            ride.setSource(req.getSource().trim());
            ride.setDestination(req.getDestination().trim());
            ride.setDepartureDatetime(LocalDateTime.of(date, time));
            ride.setSeatsTotal(req.getSeatsTotal());
            ride.setSeatsAvailable(req.getSeatsTotal());
            ride.setPrice(req.getPrice()); // ✅ set price
            ride.setVehicleModel(driver.getVehicleModel() != null ? driver.getVehicleModel() : "Unknown");
            ride.setLicensePlate(driver.getLicensePlate() != null ? driver.getLicensePlate() : "Unknown");
            ride.setCreatedAt(LocalDateTime.now());

            // 7️⃣ Save ride
            Ride saved = rideRepository.save(ride);

            return ResponseEntity.status(HttpStatus.CREATED).body(saved);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiError.of("Internal server error: " + e.getMessage()));
        }
    }


    /** PASSENGER: Search rides */
    @GetMapping("/search")
    public ResponseEntity<?> searchRides(
            @RequestParam String source,
            @RequestParam String destination,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") String date
    ) {
        try {
            LocalDate parsedDate = LocalDate.parse(date.trim());
            List<Ride> result = rideRepository.search(source, destination, parsedDate);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiError.of("Invalid date format. Expected YYYY-MM-DD"));
        }
    }

    /** DRIVER: Get own rides */
    @GetMapping("/mine")
    public ResponseEntity<?> myRides(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiError.of("Unauthorized: Please login"));
        }
        String email = (String) auth.getPrincipal();
        User me = userRepository.findByEmail(email).orElseThrow();

        if (!"DRIVER".equalsIgnoreCase(me.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiError.of("Only DRIVER has /mine rides"));
        }
        return ResponseEntity.ok(rideRepository.findByDriverIdOrderByDepartureDatetimeDesc(me.getId()));
    }

    /** Get a ride by id */
    @GetMapping("/{id}")
    public ResponseEntity<?> getRide(@PathVariable Long id) {
        return rideRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiError.of("Ride not found")));
    }

    static class ApiError {
        public final String error;
        private ApiError(String error) { this.error = error; }
        public static ApiError of(String m) { return new ApiError(m); }
    }
}
