package com.rideshare.rides;

import com.rideshare.bookings.Booking;
import com.rideshare.payments.Payment;
import com.rideshare.payments.PaymentRepository;
import com.rideshare.users.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * DTO representing a driver's ride along with all associated bookings and payments.
 */
public class DriverRideDTO {

    // -------------------- Ride Information --------------------
    private Long rideId;
    private Long driverId;
    private String driverName; // Filled from authenticated driver
    private String source;
    private String destination;
    private LocalDateTime departureDatetime;
    private Integer seatsTotal;
    private Integer seatsAvailable;
    private BigDecimal price; // Price per seat
    private String vehicleModel;
    private String licensePlate;

    // -------------------- Bookings for this ride --------------------
    private List<BookingInfo> bookings = new ArrayList<>();

    /**
     * Constructor to build a DriverRideDTO from Ride entity, its bookings,
     * a map of passengers, and the PaymentRepository to fetch payment info.
     *
     * @param ride Ride entity
     * @param rideBookings List of bookings associated with this ride
     * @param passengersMap Map of passengerId -> User entity
     * @param driverName Name of the driver
     * @param paymentRepository PaymentRepository instance to fetch payments
     */
    public DriverRideDTO(Ride ride, List<Booking> rideBookings, Map<Long, User> passengersMap,
                         String driverName, PaymentRepository paymentRepository) {
        this.rideId = ride.getId();
        this.driverId = ride.getDriverId();
        this.driverName = driverName != null ? driverName : "Unknown Driver";
        this.source = ride.getSource();
        this.destination = ride.getDestination();
        this.departureDatetime = ride.getDepartureDatetime();
        this.seatsTotal = ride.getSeatsTotal();
        this.seatsAvailable = ride.getSeatsAvailable();
        this.price = ride.getPrice();
        this.vehicleModel = ride.getVehicleModel();
        this.licensePlate = ride.getLicensePlate();

        // -------------------- Build booking info list --------------------
        for (Booking b : rideBookings) {
            User passenger = passengersMap.get(b.getPassengerId());
            String passengerName = passenger != null ? passenger.getName() : "Unknown Passenger";

            // ✅ Latest payment info
            Payment latestPayment = paymentRepository.findTopByBookingIdOrderByCreatedAtDesc(b.getId())
                    .orElse(null);

            Long paymentId = latestPayment != null ? latestPayment.getId() : null;
            String paymentMethod = latestPayment != null ? latestPayment.getPaymentMethod().name() : null;
            String paymentStatus = latestPayment != null ? latestPayment.getStatus().name() : null;

            BigDecimal totalPrice = b.getFare() != null ? b.getFare() : BigDecimal.ZERO;

            bookings.add(new BookingInfo(
                    b.getId(),
                    b.getPassengerId(),
                    passengerName,
                    b.getSeatsBooked(),
                    totalPrice,
                    paymentId,
                    paymentMethod,
                    paymentStatus,
                    b.getBookingStatus() // existing booking status
            ));
        }
    }

    // -------------------- Getters --------------------
    public Long getRideId() { return rideId; }
    public Long getDriverId() { return driverId; }
    public String getDriverName() { return driverName; }
    public String getSource() { return source; }
    public String getDestination() { return destination; }
    public LocalDateTime getDepartureDatetime() { return departureDatetime; }
    public Integer getSeatsTotal() { return seatsTotal; }
    public Integer getSeatsAvailable() { return seatsAvailable; }
    public BigDecimal getPrice() { return price; }
    public String getVehicleModel() { return vehicleModel; }
    public String getLicensePlate() { return licensePlate; }
    public List<BookingInfo> getBookings() { return bookings; }

    // -------------------- Inner class for booking details --------------------
    public static class BookingInfo {
        private Long bookingId;
        private Long passengerId;
        private String passengerName;
        private Integer seatsBooked;
        private BigDecimal totalPrice;
        private Long paymentId;
        private String paymentMethod;
        private String paymentStatus;
        private String bookingStatus;

        public BookingInfo(Long bookingId, Long passengerId, String passengerName,
                           Integer seatsBooked, BigDecimal totalPrice,
                           Long paymentId, String paymentMethod, String paymentStatus,
                           String bookingStatus) {
            this.bookingId = bookingId;
            this.passengerId = passengerId;
            this.passengerName = passengerName;
            this.seatsBooked = seatsBooked;
            this.totalPrice = totalPrice;
            this.paymentId = paymentId;
            this.paymentMethod = paymentMethod;
            this.paymentStatus = paymentStatus;
            this.bookingStatus = bookingStatus;
        }

        // --- Getters ---
        public Long getBookingId() { return bookingId; }
        public Long getPassengerId() { return passengerId; }
        public String getPassengerName() { return passengerName; }
        public Integer getSeatsBooked() { return seatsBooked; }
        public BigDecimal getTotalPrice() { return totalPrice; }
        public Long getPaymentId() { return paymentId; }
        public String getPaymentMethod() { return paymentMethod; }
        public String getPaymentStatus() { return paymentStatus; }
        public String getBookingStatus() { return bookingStatus; }
    }
}
