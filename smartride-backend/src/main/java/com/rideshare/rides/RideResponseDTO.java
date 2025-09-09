package com.rideshare.rides;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;

public class RideResponseDTO {

    private Long rideId;
    private Long driverId;
    private String driverName;
    private String source;
    private String destination;
    private Timestamp departureDatetime;
    private Integer seatsTotal;
    private Integer seatsAvailable;
    private BigDecimal price;
    private String vehicleModel;
    private String licensePlate;

    public RideResponseDTO(Long rideId, Long driverId, String driverName,
                           String source, String destination, LocalDateTime departureDatetime,
                           Integer seatsTotal, Integer seatsAvailable, BigDecimal price,
                           String vehicleModel, String licensePlate) {
        this.rideId = rideId;
        this.driverId = driverId;
        this.driverName = driverName;
        this.source = source;
        this.destination = destination;
        this.departureDatetime = Timestamp.valueOf(departureDatetime);
        this.seatsTotal = seatsTotal;
        this.seatsAvailable = seatsAvailable;
        this.price = price;
        this.vehicleModel = vehicleModel;
        this.licensePlate = licensePlate;
    }

    // ✅ Getters
    public Long getRideId() { return rideId; }
    public Long getDriverId() { return driverId; }
    public String getDriverName() { return driverName; }
    public String getSource() { return source; }
    public String getDestination() { return destination; }
    public Timestamp getDepartureDatetime() { return departureDatetime; }
    public Integer getSeatsTotal() { return seatsTotal; }
    public Integer getSeatsAvailable() { return seatsAvailable; }
    public BigDecimal getPrice() { return price; }
    public String getVehicleModel() { return vehicleModel; }
    public String getLicensePlate() { return licensePlate; }
}
