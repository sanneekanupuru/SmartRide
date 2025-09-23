package com.rideshare.users;

import java.time.LocalDateTime;

public class UserProfileDTO {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private String vehicleModel;
    private String licensePlate;
    private Integer capacity;
    private LocalDateTime createdAt;
    private Double avgRating;
    private Long reviewCount;

    public UserProfileDTO() {}

    public UserProfileDTO(User u, Double avgRating, Long reviewCount) {
        if (u != null) {
            this.id = u.getId();
            this.name = u.getName();
            this.email = u.getEmail();
            this.phone = u.getPhone();
            this.role = u.getRole();
            this.vehicleModel = u.getVehicleModel();
            this.licensePlate = u.getLicensePlate();
            this.capacity = u.getCapacity();
            this.createdAt = u.getCreatedAt();
        }
        this.avgRating = avgRating != null ? avgRating : 0.0;
        this.reviewCount = reviewCount != null ? reviewCount : 0L;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getRole() { return role; }
    public String getVehicleModel() { return vehicleModel; }
    public String getLicensePlate() { return licensePlate; }
    public Integer getCapacity() { return capacity; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Double getAvgRating() { return avgRating; }
    public Long getReviewCount() { return reviewCount; }
}
