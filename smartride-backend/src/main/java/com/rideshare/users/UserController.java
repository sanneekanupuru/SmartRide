package com.rideshare.users;

import com.rideshare.reviews.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserRepository userRepository;
    private final ReviewService reviewService;

    public UserController(UserRepository userRepository, ReviewService reviewService) {
        this.userRepository = userRepository;
        this.reviewService = reviewService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> myProfile(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }
        String email = (String) auth.getPrincipal();
        Optional<User> opt = userRepository.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));

        User u = opt.get();
        Double avg = reviewService.getAvgRating(u.getId());
        long count = reviewService.getReviewCount(u.getId());

        UserProfileDTO dto = new UserProfileDTO(u, avg, count);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProfile(@PathVariable Long id) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "User not found"));

        User u = opt.get();
        Double avg = reviewService.getAvgRating(u.getId());
        long count = reviewService.getReviewCount(u.getId());

        UserProfileDTO dto = new UserProfileDTO(u, avg, count);
        return ResponseEntity.ok(dto);
    }
}
