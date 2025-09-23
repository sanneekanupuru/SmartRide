package com.rideshare.notifications;

import com.rideshare.users.User;
import com.rideshare.users.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService service;
    private final UserRepository userRepository;

    public NotificationController(NotificationService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    /**
     * Get notifications for the authenticated user.
     * Frontend should call this endpoint instead of /user/{id} to avoid exposing user IDs.
     */
    @GetMapping("/me")
    public ResponseEntity<List<Notification>> myNotifications(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(401).build();
        }

        String principalEmail = (String) auth.getPrincipal();
        User me = userRepository.findByEmail(principalEmail).orElse(null);
        if (me == null) {
            return ResponseEntity.status(401).build();
        }

        List<Notification> list = service.getUserNotifications(me.getId());
        return ResponseEntity.ok(list);
    }

    /**
     * Admin / internal use: get notifications for any user by ID.
     * If you expose this publicly, restrict with security annotations later.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> forUser(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getUserNotifications(userId));
    }

    // Mark a notification seen
    @PostMapping("/markSeen/{id}")
    public ResponseEntity<Void> markSeen(@PathVariable Long id, Authentication auth) {
        // Validate that authenticated user owns the notification
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(401).build();
        }
        String principalEmail = (String) auth.getPrincipal();
        User me = userRepository.findByEmail(principalEmail).orElse(null);
        if (me == null) {
            return ResponseEntity.status(401).build();
        }

        // ensure notification belongs to the authenticated user
        boolean owned = service.getUserNotifications(me.getId())
                .stream().anyMatch(n -> n.getId().equals(id));
        if (!owned) {
            return ResponseEntity.status(403).build();
        }

        service.markAsSeen(id);
        return ResponseEntity.ok().build();
    }
}
