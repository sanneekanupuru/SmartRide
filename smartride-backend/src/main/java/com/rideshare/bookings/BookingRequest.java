package com.rideshare.bookings;

public class BookingRequest {
    private Long rideId;
    private Integer seats;

    public BookingRequest() {}

    public Long getRideId() {
        return rideId;
    }

    public void setRideId(Long rideId) {
        this.rideId = rideId;
    }

    public Integer getSeats() {
        return seats;
    }

    public void setSeats(Integer seats) {
        this.seats = seats;
    }
}
