package com.rideshare.bookings;

import com.rideshare.payments.Payment;
import com.rideshare.payments.PaymentRepository;
import com.rideshare.users.User;
import com.rideshare.users.UserRepository;
import com.rideshare.rides.Ride;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

public class BookingResponseDTO {

    public Long bookingId;
    public Long rideId;
    public String source;
    public String destination;

    // Add these IDs so frontend can target the correct user when leaving reviews
    public Long driverId;      // <-- NEW
    public Long passengerId;   // <-- NEW

    public String driverName;
    public String passengerName;
    public int seatsBooked;
    // NOTE: totalPrice may be null when fare not yet calculated
    public BigDecimal totalPrice;
    public String bookingStatus;
    public String paymentStatus;
    public String paymentMethod;
    public String departureDatetime;

    // NEW: expose driver approval flag to frontend
    public boolean driverApproved;

    public BookingResponseDTO(Booking booking, Ride ride, User passenger,
                              PaymentRepository paymentRepository, UserRepository userRepository) {

        this.bookingId = booking != null ? booking.getId() : null;
        this.rideId = ride != null ? ride.getId() : null;

        this.source = (ride != null && ride.getSource() != null) ? ride.getSource() : "Unknown";
        this.destination = (ride != null && ride.getDestination() != null) ? ride.getDestination() : "Unknown";
        this.departureDatetime = (ride != null && ride.getDepartureDatetime() != null)
                ? ride.getDepartureDatetime().toString() : "Unknown";

        // Driver: populate id + name (if ride exists)
        if (ride != null && ride.getDriverId() != null) {
            this.driverId = ride.getDriverId();
            this.driverName = userRepository.findById(ride.getDriverId()).map(User::getName).orElse("Unknown");
        } else {
            this.driverId = null;
            this.driverName = "Unknown";
        }

        // Passenger: populate id + name
        if (passenger != null) {
            this.passengerId = passenger.getId();
            this.passengerName = passenger.getName() != null ? passenger.getName() : "Unknown";
        } else {
            this.passengerId = null;
            this.passengerName = "Unknown";
        }

        this.seatsBooked = booking != null ? booking.getSeatsBooked() : 0;

        // IMPORTANT: Do not convert null fare into ZERO.
        // If fare not calculated yet (pending booking), totalPrice will be null.
        this.totalPrice = (booking != null) ? booking.getFare() : null;

        this.bookingStatus = booking != null && booking.getBookingStatus() != null ? booking.getBookingStatus() : "PENDING";

        // NEW: driverApproved (default to false if null)
        this.driverApproved = booking != null && booking.getDriverApproved() != null ? booking.getDriverApproved() : false;

        // Payment info (find latest payment record if any)
        if (booking != null && paymentRepository != null) {
            List<Payment> payments = paymentRepository.findByBookingId(booking.getId());
            Payment latestPayment = payments.stream()
                    .max(Comparator.comparing(Payment::getCreatedAt))
                    .orElse(null);

            if (latestPayment != null) {
                this.paymentStatus = latestPayment.getStatus() != null ? latestPayment.getStatus().name() : "PENDING";
                this.paymentMethod = latestPayment.getPaymentMethod() != null ? latestPayment.getPaymentMethod().name() : "CASH";
            } else {
                this.paymentStatus = "PENDING";
                this.paymentMethod = "CASH";
            }
        } else {
            this.paymentStatus = "PENDING";
            this.paymentMethod = "CASH";
        }
    }
}
