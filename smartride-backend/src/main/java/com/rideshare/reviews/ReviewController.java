package com.rideshare.reviews;

import com.rideshare.users.User;
import com.rideshare.users.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepo;

    public ReviewController(ReviewService reviewService, UserRepository userRepo) {
        this.reviewService = reviewService;
        this.userRepo = userRepo;
    }

    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody ReviewRequest req, Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }

        String email = (String) auth.getPrincipal();
        User me = userRepo.findByEmail(email).orElse(null);
        if (me == null) {
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }

        // Basic request validation
        if (req == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "invalid request"));
        }
        if (req.getRevieweeId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "revieweeId is required"));
        }
        if (req.getRideId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "rideId is required"));
        }
        if (req.getRating() < 1 || req.getRating() > 5) {
            return ResponseEntity.badRequest().body(Map.of("error", "rating must be between 1 and 5"));
        }

        try {
            Review saved = reviewService.addReview(
                    req.getRideId(),
                    req.getBookingId(),
                    me.getId(),
                    req.getRevieweeId(),
                    req.getRating(),
                    req.getComment()
            );
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            // Log server-side (use real logger in prod)
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "internal server error"));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserReviews(@PathVariable Long userId) {
        return ResponseEntity.ok(Map.of(
                "avgRating", reviewService.getAvgRating(userId),
                "reviewCount", reviewService.getReviewCount(userId),
                "reviews", reviewService.getReviewsForUser(userId)
        ));
    }

    @GetMapping("/ride/{rideId}")
    public ResponseEntity<List<Review>> getRideReviews(@PathVariable Long rideId) {
        return ResponseEntity.ok(reviewService.getReviewsForRide(rideId));
    }
}
