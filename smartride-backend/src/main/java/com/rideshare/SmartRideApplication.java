package com.rideshare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@EnableAsync
@EnableScheduling
@SpringBootApplication
public class SmartRideApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmartRideApplication.class, args);
    }

    // 🔑 Temporary runner to generate BCrypt hash for "admin123"
    @Bean
    public CommandLineRunner generateAdminPassword(PasswordEncoder encoder) {
        return args -> {
            String raw = "admin123";
            String hash = encoder.encode(raw);
            System.out.println("=====================================");
            System.out.println("🔑 BCrypt hash for '" + raw + "': " + hash);
            System.out.println("=====================================");
        };
    }
}
