package com.sliit.smartcampus.config;

import com.sliit.smartcampus.model.Role;
import com.sliit.smartcampus.model.User;
import com.sliit.smartcampus.repository.RoleRepository;
import com.sliit.smartcampus.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

@Configuration
public class DataInitializer {

    private static final Logger LOGGER = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    CommandLineRunner init(RoleRepository roleRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            try {
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

                ensureSeedUser(userRepository, passwordEncoder,
                        "admin", "Administrator", "admin@smartcampus.local", "adminpass", List.of("ADMIN"));
                ensureSeedUser(userRepository, passwordEncoder,
                        "user", "Campus User", "user@smartcampus.local", "userpass", List.of("USER"));
                ensureSeedUser(userRepository, passwordEncoder,
                        "tech", "Tech Support", "tech@smartcampus.local", "techpass", List.of("TECHNICIAN"));
                ensureSeedUser(userRepository, passwordEncoder,
                        "Admin123", "Admin123", "admin123@smartcampus.local", "Admin@123", List.of("ADMIN"));
            } catch (Exception ex) {
                LOGGER.warn("Skipping data seeding because database is unavailable: {}", ex.getMessage());
            }
        };
    }

    private void ensureSeedUser(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            String username,
            String displayName,
            String email,
            String rawPassword,
            List<String> roles
    ) {
        Optional<User> maybeExisting = userRepository.findByUsername(username);
        if (maybeExisting.isPresent()) {
            User existing = maybeExisting.get();
            boolean needsSave = false;

            if (existing.getPassword() == null || existing.getPassword().isBlank()) {
                existing.setPassword(passwordEncoder.encode(rawPassword));
                needsSave = true;
            }
            if (existing.getRoles() == null || existing.getRoles().isEmpty()) {
                existing.setRoles(roles);
                needsSave = true;
            }
            if (existing.getDisplayName() == null || existing.getDisplayName().isBlank()) {
                existing.setDisplayName(displayName);
                needsSave = true;
            }
            if (existing.getEmail() == null || existing.getEmail().isBlank()) {
                existing.setEmail(email);
                needsSave = true;
            }

            if (needsSave) {
                userRepository.save(existing);
            }
            return;
        }

        User seeded = User.builder()
                .username(username)
                .displayName(displayName)
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .roles(roles)
                .build();

        userRepository.save(seeded);
    }
}
