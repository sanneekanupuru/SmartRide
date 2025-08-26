package com.rideshare.rides;

import java.math.BigDecimal;

public class RideRequest {
    private String source;
    private String destination;
    private String date;       // e.g. "2025-08-25"
    private String time;       // e.g. "08:30"
    private Integer seatsTotal;
    private BigDecimal price;  // fare per seat

    public RideRequest() {}

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public Integer getSeatsTotal() { return seatsTotal; }
    public void setSeatsTotal(Integer seatsTotal) { this.seatsTotal = seatsTotal; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
}
