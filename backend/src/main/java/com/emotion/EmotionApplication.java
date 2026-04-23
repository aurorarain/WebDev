package com.emotion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class EmotionApplication {

    public static void main(String[] args) {
        SpringApplication.run(EmotionApplication.class, args);
        System.out.println("\n========================================");
        System.out.println("  SingularityWalk Backend is running!");
        System.out.println("  Health: http://localhost:8080/api/health");
        System.out.println("========================================\n");
    }
}
