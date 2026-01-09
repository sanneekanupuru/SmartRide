-- =====================================================
-- DATABASE
-- =====================================================
CREATE DATABASE IF NOT EXISTS rideshare_db;
USE rideshare_db;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('DRIVER','PASSENGER') NOT NULL,
  vehicle_model VARCHAR(100),
  license_plate VARCHAR(50),
  capacity INT,
  is_blocked BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- RIDES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rides (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  driver_id BIGINT NOT NULL,
  source VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  departure_datetime DATETIME NOT NULL,
  seats_total INT NOT NULL,
  seats_available INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  vehicle_model VARCHAR(100),
  license_plate VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rides_driver
    FOREIGN KEY (driver_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- BOOKINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ride_id BIGINT NOT NULL,
  passenger_id BIGINT NOT NULL,
  seats_booked INT NOT NULL,
  booking_status ENUM('PENDING','CONFIRMED','CANCELLED') DEFAULT 'PENDING',
  fare DECIMAL(10,2),
  is_disputed BOOLEAN DEFAULT FALSE,
  driver_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_bookings_driver_approved (driver_approved),

  CONSTRAINT fk_bookings_ride
    FOREIGN KEY (ride_id) REFERENCES rides(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_bookings_passenger
    FOREIGN KEY (passenger_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('CREDIT','UPI','WALLET','CASH') NOT NULL,
  status ENUM('PENDING','COMPLETED','FAILED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_payments_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- ADMIN TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admin (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'ADMIN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Example admin record
INSERT INTO admin (username, password, role)
VALUES (
  'admin',
  '$2a$10$5wBj4pAUAkVp1XdsQbL36Oc6Hkyed.PIOdOJ8YXqWuKksdOHwpiwO',
  'ADMIN'
);

-- =====================================================
-- NOTIFICATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notification (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  ride_id BIGINT DEFAULT NULL,
  booking_id BIGINT DEFAULT NULL,
  title VARCHAR(255),
  message TEXT,
  channel VARCHAR(20) DEFAULT 'IN_APP',
  is_sent BOOLEAN DEFAULT FALSE,
  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_notification_user (user_id),
  INDEX idx_notification_created_at (created_at),

  CONSTRAINT fk_notification_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ride_id BIGINT NOT NULL,
  booking_id BIGINT NULL,
  reviewer_id BIGINT NOT NULL,
  reviewee_id BIGINT NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_reviews_reviewee (reviewee_id),
  INDEX idx_reviews_ride (ride_id),

  CONSTRAINT fk_reviews_ride
    FOREIGN KEY (ride_id) REFERENCES rides(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_reviews_reviewer
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_reviews_reviewee
    FOREIGN KEY (reviewee_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
