package com.rideshare.notifications;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository repo;
    private final EmailService emailService;

    public NotificationService(NotificationRepository repo, EmailService emailService) {
        this.repo = repo;
        this.emailService = emailService;
    }

    @Transactional
    public Notification createNotification(Long userId, Long rideId, Long bookingId, String title, String message, boolean sendEmail, String email) {
        Notification n = new Notification(userId, rideId, bookingId, title, message, Notification.Channel.IN_APP);
        n = repo.save(n);
        if (sendEmail && email != null && !email.isBlank()) {
            emailService.sendSimpleMessage(email, title, message);
            n.setSent(true);
            repo.save(n);
        }
        return n;
    }

    public List<Notification> getUserNotifications(Long userId) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void markAsSeen(Long notificationId) {
        Notification n = repo.findById(notificationId).orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        n.setSeen(true);
        repo.save(n);
    }
}
