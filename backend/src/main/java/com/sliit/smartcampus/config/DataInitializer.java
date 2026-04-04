package com.sliit.smartcampus.config;

import com.sliit.smartcampus.model.Role;
import com.sliit.smartcampus.model.User;
import com.sliit.smartcampus.repository.RoleRepository;
import com.sliit.smartcampus.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner init(RoleRepository roleRepository, UserRepository userRepository) {
        return args -> {
            if (roleRepository.count() == 0) {
                var adminRole = Role.builder()
                        .name("ADMIN")
                        .description("Administrator with full access")
                        .permissions(List.of("roles:manage", "bookings:manage", "tickets:manage"))
                        .build();
                var userRole = Role.builder()
                        .name("USER")
                        .description("Regular user")
                        .permissions(List.of("bookings:create", "tickets:create"))
                        .build();
                var techRole = Role.builder()
                        .name("TECHNICIAN")
                        .description("Technician role")
                        .permissions(List.of("tickets:update", "tickets:resolve"))
                        .build();

                roleRepository.saveAll(List.of(adminRole, userRole, techRole));
            }

            if (userRepository.count() == 0) {
                var admin = User.builder()
                        .username("admin")
                        .displayName("Administrator")
                        .email("admin@smartcampus.local")
                        .roles(List.of("ADMIN"))
                        .build();

                var user = User.builder()
                        .username("alice")
                        .displayName("Alice User")
                        .email("alice@smartcampus.local")
                        .roles(List.of("USER"))
                        .build();

                var tech = User.builder()
                        .username("tech")
                        .displayName("Tech Support")
                        .email("tech@smartcampus.local")
                        .roles(List.of("TECHNICIAN"))
                        .build();

                userRepository.saveAll(List.of(admin, user, tech));
            }
        };
    }
}
