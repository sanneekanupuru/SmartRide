RideShare backend (minimal starter)

1) Open project in IntelliJ (File -> Open) and select this folder.
2) Update src/main/resources/application.properties with your MySQL credentials and JWT secret.
3) Create database: CREATE DATABASE rideshare_db;
4) Run application: mvn spring-boot:run or run RideshareApplication from IntelliJ.
5) Postman endpoints:
   POST /api/v1/auth/register
   POST /api/v1/auth/login
   POST /api/v1/rides (Driver token)
   GET  /api/v1/rides?source=&destination=&date=
   POST /api/v1/bookings (Passenger token)
