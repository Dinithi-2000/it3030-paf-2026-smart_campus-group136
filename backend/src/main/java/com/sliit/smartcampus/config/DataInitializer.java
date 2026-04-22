package com.sliit.smartcampus.config;

import com.sliit.smartcampus.facility.model.Facility;
import com.sliit.smartcampus.facility.model.FacilityStatus;
import com.sliit.smartcampus.facility.model.FacilityType;
import com.sliit.smartcampus.facility.repository.FacilityRepository;
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
import java.time.Instant;
import java.time.LocalTime;
import java.util.Optional;

@Configuration
public class DataInitializer {

    private static final Logger LOGGER = LoggerFactory.getLogger(DataInitializer.class);

    @Bean

    CommandLineRunner init(RoleRepository roleRepository, UserRepository userRepository, FacilityRepository facilityRepository, PasswordEncoder passwordEncoder) {
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

                if (facilityRepository.count() == 0) {
                    Instant now = Instant.now();

                    Facility lab = new Facility();
                    lab.setCode("LAB-402");
                    lab.setName("Computing Lab 402");
                    lab.setType(FacilityType.LAB);
                    lab.setCapacity(80);
                    lab.setLocation("Engineering Building - Floor 4");
                    lab.setAvailabilityStart(LocalTime.of(8, 0));
                    lab.setAvailabilityEnd(LocalTime.of(18, 0));
                    lab.setStatus(FacilityStatus.ACTIVE);
                    lab.setDescription("High-performance lab with 80 workstations and dual projectors");
                    lab.setCreatedAt(now);
                    lab.setUpdatedAt(now);

                    Facility hall = new Facility();
                    hall.setCode("LH-201");
                    hall.setName("Lecture Hall 201");
                    hall.setType(FacilityType.LECTURE_HALL);
                    hall.setCapacity(220);
                    hall.setLocation("Main Academic Block - Floor 2");
                    hall.setAvailabilityStart(LocalTime.of(7, 30));
                    hall.setAvailabilityEnd(LocalTime.of(20, 30));
                    hall.setStatus(FacilityStatus.ACTIVE);
                    hall.setDescription("Large lecture hall with smart podium and recording support");
                    hall.setCreatedAt(now);
                    hall.setUpdatedAt(now);

                    Facility equipment = new Facility();
                    equipment.setCode("EQ-PROJ-01");
                    equipment.setName("Portable Projector Unit 01");
                    equipment.setType(FacilityType.EQUIPMENT);
                    equipment.setCapacity(1);
                    equipment.setLocation("Media Services Store");
                    equipment.setAvailabilityStart(LocalTime.of(8, 30));
                    equipment.setAvailabilityEnd(LocalTime.of(17, 0));
                    equipment.setStatus(FacilityStatus.MAINTENANCE);
                    equipment.setDescription("Portable laser projector for seminars and events");
                    equipment.setCreatedAt(now);
                    equipment.setUpdatedAt(now);

                    facilityRepository.saveAll(List.of(lab, hall, equipment));
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
