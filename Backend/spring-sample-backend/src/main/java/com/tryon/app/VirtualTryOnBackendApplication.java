package com.tryon.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement
public class VirtualTryOnBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(VirtualTryOnBackendApplication.class, args);
    }
}
