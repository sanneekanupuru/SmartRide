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
    public String driverName;
    public int seatsBooked;
    public BigDecimal totalPrice;
    public String bookingStatus;
    public String paymentStatus;
    public String paymentMethod;
    public String departureDatetime;

    public BookingResponseDTO(Booking booking, Ride ride, User passenger,
                              PaymentRepository paymentRepository, UserRepository userRepository) {

        this.bookingId = booking.getId();
        this.rideId = ride.getId();
        this.source = ride.getSource();
        this.destination = ride.getDestination();

        // Fetch driver name
        this.driverName = userRepository.findById(ride.getDriverId())
                .map(User::getName)
                .orElse("Unknown");

        this.seatsBooked = booking.getSeatsBooked();
        this.totalPrice = booking.getFare();
        this.bookingStatus = booking.getBookingStatus();
        this.departureDatetime = ride.getDepartureDatetime().toString();

        // Get latest payment for this booking
        List<Payment> payments = paymentRepository.findByBookingId(booking.getId());
        Payment latestPayment = payments.stream()
                .max(Comparator.comparing(Payment::getCreatedAt))
                .orElse(null);

        if (latestPayment != null) {
            this.paymentStatus = latestPayment.getStatus().name();
            this.paymentMethod = latestPayment.getPaymentMethod().name();
        } else {
            this.paymentStatus = "PENDING";
            this.paymentMethod = "CASH"; // default for unmade payments
        }
    }
}
