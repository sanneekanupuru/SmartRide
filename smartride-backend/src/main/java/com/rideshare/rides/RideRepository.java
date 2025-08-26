package com.rideshare.rides;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RideRepository extends JpaRepository<Ride, Long> {

    /**
     * Search rides by source/destination (case-insensitive contains) and date (LOCAL DATE of departureDatetime).
     * Only returns rides with seatsAvailable > 0.
     */
    @Query("SELECT r FROM Ride r " +
            "WHERE LOWER(r.source) LIKE LOWER(CONCAT('%',:source,'%')) " +
            "AND LOWER(r.destination) LIKE LOWER(CONCAT('%',:destination,'%')) " +
            "AND FUNCTION('DATE', r.departureDatetime) = :date " +
            "AND r.seatsAvailable > 0")
    List<Ride> search(@Param("source") String source,
                      @Param("destination") String destination,
                      @Param("date") LocalDate date);

    /**
     * Pessimistic lock used when performing seat decrement to avoid overselling seats.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Ride r WHERE r.id = :id")
    Optional<Ride> findByIdForUpdate(@Param("id") Long id);

    /**
     * Find rides posted by a specific driver.
     */
    List<Ride> findByDriverIdOrderByDepartureDatetimeDesc(Long driverId);
}
