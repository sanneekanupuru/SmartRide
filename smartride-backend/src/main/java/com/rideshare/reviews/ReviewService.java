package com.rideshare.reviews;

import com.rideshare.bookings.Booking;
import com.rideshare.bookings.BookingRepository;
import com.rideshare.rides.Ride;
import com.rideshare.rides.RideRepository;
import com.rideshare.users.User;
import com.rideshare.users.UserRepository;
import com.rideshare.notifications.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepo;
    private final BookingRepository bookingRepo;
    private final RideRepository rideRepo;
    private final UserRepository userRepo;
    private final NotificationService notificationService;

    public ReviewService(ReviewRepository reviewRepo,
                         BookingRepository bookingRepo,
                         RideRepository rideRepo,
                         UserRepository userRepo,
                         NotificationService notificationService) {
        this.reviewRepo = reviewRepo;
        this.bookingRepo = bookingRepo;
        this.rideRepo = rideRepo;
        this.userRepo = userRepo;
        this.notificationService = notificationService;
    }

    /**
     * Adds a review. Validations:
     * - rideId and revieweeId must be provided (controller already checks rideId).
     * - bookingId must be provided (we require reviews to be tied to a booking).
     * - booking must exist and belong to the ride.
     * - ride must be completed (departureDatetime < now).
     * - reviewer must be either the booking passenger OR the ride driver.
     * - reviewee must be the *other* participant (driver if reviewer is passenger; passenger if reviewer is driver).
     * - prevents duplicate review per booking per reviewer (if bookingId provided).
     */
    @Transactional
    public Review addReview(Long rideId, Long bookingId, Long reviewerId,
                            Long revieweeId, int rating, String comment) {

        if (rideId == null) {
            throw new IllegalArgumentException("rideId is required");
        }
        if (revieweeId == null) {
            throw new IllegalArgumentException("revieweeId is required");
        }
        if (bookingId == null) {
            throw new IllegalArgumentException("bookingId is required");
        }

        // Ensure booking exists
        Booking booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        // booking must belong to ride
        if (booking.getRideId() == null || !booking.getRideId().equals(rideId)) {
            throw new IllegalArgumentException("Booking does not belong to the ride.");
        }

        // Prevent duplicate review per booking per reviewer (only if bookingId provided)
        if (reviewRepo.existsByBookingIdAndReviewerId(bookingId, reviewerId)) {
            throw new IllegalArgumentException("Review already submitted for this booking.");
        }

        // Ensure ride exists and was completed
        Ride ride = rideRepo.findById(rideId)
                .orElseThrow(() -> new IllegalArgumentException("Ride not found"));

        if (ride.getDepartureDatetime() == null) {
            throw new IllegalArgumentException("Ride departure time unknown");
        }

        if (ride.getDepartureDatetime().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Ride not completed yet.");
        }

        // Validate reviewer is part of booking (passenger) or ride (driver)
        boolean isPassengerReviewer = booking.getPassengerId() != null && booking.getPassengerId().equals(reviewerId);
        boolean isDriverReviewer = ride.getDriverId() != null && ride.getDriverId().equals(reviewerId);

        if (!isPassengerReviewer && !isDriverReviewer) {
            throw new IllegalArgumentException("Reviewer not part of this booking.");
        }

        // Validate reviewee is the other party:
        if (isPassengerReviewer) {
            // passenger reviews driver
            if (ride.getDriverId() == null || !ride.getDriverId().equals(revieweeId)) {
                throw new IllegalArgumentException("Reviewee must be the ride driver when passenger reviews.");
            }
        } else {
            // driver reviews passenger
            if (booking.getPassengerId() == null || !booking.getPassengerId().equals(revieweeId)) {
                throw new IllegalArgumentException("Reviewee must be the booking passenger when driver reviews.");
            }
        }

        Review review = new Review();
        review.setRideId(rideId);
        review.setBookingId(bookingId);
        review.setReviewerId(reviewerId);
        review.setRevieweeId(revieweeId);
        review.setRating(rating);
        review.setComment(comment);

        Review saved = reviewRepo.save(review);

        // Notify the reviewee (best-effort)
        Optional<User> maybeReviewee = userRepo.findById(revieweeId);
        maybeReviewee.ifPresent(reviewee -> {
            try {
                notificationService.createNotification(
                        reviewee.getId(), rideId, bookingId,
                        "New Review Received",
                        "You have received a new review from a " + (isDriverReviewer ? "driver" : "passenger"),
                        true,
                        reviewee.getEmail()
                );
            } catch (Exception ex) {
                // swallow notification exceptions — review saved is most important
                ex.printStackTrace();
            }
        });

        return saved;
    }

    public Double getAvgRating(Long userId) {
        Double avg = reviewRepo.findAvgRatingByRevieweeId(userId);
        return avg == null ? 0.0 : avg;
    }

    public long getReviewCount(Long userId) {
        return reviewRepo.countByRevieweeId(userId);
    }

    public List<Review> getReviewsForUser(Long userId) {
        return reviewRepo.findByRevieweeId(userId);
    }

    public List<Review> getReviewsForRide(Long rideId) {
        return reviewRepo.findByRideId(rideId);
    }
}
