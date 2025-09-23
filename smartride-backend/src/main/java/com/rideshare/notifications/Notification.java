package com.rideshare.notifications;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "notification")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "ride_id")
    private Long rideId;

    @Column(name = "booking_id")
    private Long bookingId;

    private String title;

    @Column(length = 2000)
    private String message;

    @Enumerated(EnumType.STRING)
    private Channel channel = Channel.IN_APP; // IN_APP or EMAIL only

    private boolean isSent = false;
    private boolean seen = false;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public enum Channel { IN_APP, EMAIL }

    public Notification() {}

    public Notification(Long userId, Long rideId, Long bookingId, String title, String message, Channel channel) {
        this.userId = userId;
        this.rideId = rideId;
        this.bookingId = bookingId;
        this.title = title;
        this.message = message;
        this.channel = channel;
        this.createdAt = Instant.now();
    }

    // Getters/setters (same as earlier)
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getRideId() { return rideId; }
    public void setRideId(Long rideId) { this.rideId = rideId; }
    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Channel getChannel() { return channel; }
    public void setChannel(Channel channel) { this.channel = channel; }
    public boolean isSent() { return isSent; }
    public void setSent(boolean sent) { isSent = sent; }
    public boolean isSeen() { return seen; }
    public void setSeen(boolean seen) { this.seen = seen; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
