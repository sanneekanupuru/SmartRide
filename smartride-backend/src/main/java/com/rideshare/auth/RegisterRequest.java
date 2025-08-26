package com.rideshare.auth;

public class RegisterRequest {
    private String email;
    private String password;
    private String name;
    private String phone;
    private String role;
    private String vehicleModel;
    private String licensePlate;
    private Integer capacity;

    public String getVehicleModel(){ return vehicleModel; }
    public void setVehicleModel(String vehicleModel){ this.vehicleModel = vehicleModel; }

    public String getLicensePlate(){ return licensePlate; }
    public void setLicensePlate(String licensePlate){ this.licensePlate = licensePlate; }

    public Integer getCapacity(){ return capacity; }
    public void setCapacity(Integer capacity){ this.capacity = capacity; }

    public String getEmail(){return email;}
    public void setEmail(String email){this.email=email;}
    public String getPassword(){return password;}
    public void setPassword(String password){this.password=password;}
    public String getName(){return name;}
    public void setName(String name){this.name=name;}
    public String getPhone(){return phone;}
    public void setPhone(String phone){this.phone=phone;}
    public String getRole(){return role;}
    public void setRole(String role){this.role=role;}
}
