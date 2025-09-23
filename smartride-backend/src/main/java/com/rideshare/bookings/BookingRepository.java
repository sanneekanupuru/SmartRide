package com.rideshare.bookings;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByRideId(Long id);
    List<Booking> findByPassengerId(Long passengerId);

    List<Booking> findByIsDisputedTrue();
    long countByIsDisputedTrue();

    // ✅ Dashboard: count by booking status
    long countByBookingStatus(String bookingStatus);

    // ✅ Needed for ReviewService: check if a passenger booked a seat in a ride
    List<Booking> findByRideIdAndPassengerId(Long rideId, Long passengerId);
}
