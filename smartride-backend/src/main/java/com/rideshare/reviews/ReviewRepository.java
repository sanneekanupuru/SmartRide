package com.rideshare.reviews;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByRevieweeId(Long revieweeId);

    List<Review> findByRideId(Long rideId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.revieweeId = :id")
    Double findAvgRatingByRevieweeId(@Param("id") Long id);

    long countByRevieweeId(Long revieweeId);

    boolean existsByBookingIdAndReviewerId(Long bookingId, Long reviewerId);
}
