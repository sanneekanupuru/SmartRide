package com.rideshare.bookings;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByRideId(Long id);
    List<Booking> findByPassengerId(Long passengerId);
}
