package com.rideshare.auth;

import com.rideshare.notifications.NotificationService;
import com.rideshare.security.JwtUtil;
import com.rideshare.users.User;
import com.rideshare.users.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final NotificationService notificationService;

    @Autowired
    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil,
                          NotificationService notificationService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.notificationService = notificationService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (req.getEmail() == null || req.getPassword() == null || req.getName() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "email, password, name are required"));
        }

        String email = req.getEmail().trim().toLowerCase();
        String role = (req.getRole() == null) ? "PASSENGER" : req.getRole().trim().toUpperCase();

        if (!role.equals("DRIVER") && !role.equals("PASSENGER")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role must be DRIVER or PASSENGER"));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already in use"));
        }

        User u = new User();
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(req.getPassword())); // store encoded password
        u.setName(req.getName());
        u.setPhone(req.getPhone());
        u.setRole(role);

        if ("DRIVER".equals(role)) {
            u.setVehicleModel(req.getVehicleModel());
            u.setLicensePlate(req.getLicensePlate());
            u.setCapacity(req.getCapacity());
        }

        userRepository.save(u);

        // --- Send welcome email + in-app notification ---
        try {
            String title = "Welcome to SmartRide 🎉";
            String msg = String.format(
                    "Hello %s,\n\nWelcome to SmartRide! Your account has been created successfully as a %s.\n" +
                            "You can now log in and start your journey with us.\n\nHappy Riding!\n– SmartRide Team",
                    u.getName(), u.getRole()
            );

            notificationService.createNotification(
                    u.getId(), null, null,
                    title, msg,
                    true, u.getEmail()
            );
        } catch (Exception ex) {
            System.err.println("Welcome notification error: " + ex.getMessage());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "registered"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        var opt = userRepository.findByEmail(email);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "invalid credentials"));
        }
        User u = opt.get();
        if (!passwordEncoder.matches(req.getPassword(), u.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "invalid credentials"));
        }
        String token = jwtUtil.generateToken(u.getEmail(), u.getRole());
        return ResponseEntity.ok(Map.of("token", token, "role", u.getRole(), "email", u.getEmail()));
    }

    @GetMapping("/test")
    public String testApi() {
        return "Backend is running!";
    }

}
