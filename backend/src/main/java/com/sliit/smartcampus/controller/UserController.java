package com.sliit.smartcampus.controller;

import com.sliit.smartcampus.model.User;
import com.sliit.smartcampus.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRegisterDto dto) {
        try {
            if (userRepository.findByUsername(dto.getUsername()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
            }

            if (dto.getPassword() == null || dto.getPassword().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));
            }

            String requestedRole = dto.getRole() == null ? "USER" : dto.getRole().trim().toUpperCase();
            if (!List.of("USER", "ADMIN", "TECHNICIAN").contains(requestedRole)) {
                requestedRole = "USER";
            }

            var user = User.builder()
                    .username(dto.getUsername())
                    .displayName(dto.getDisplayName())
                    .email(dto.getEmail())
                        .password(passwordEncoder.encode(dto.getPassword()))
                    .roles(List.of(requestedRole))
                    .build();

            var saved = userRepository.save(user);
                    return ResponseEntity.created(URI.create("/api/users/" + saved.getId())).body(toSafeUser(saved));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Registration service is unavailable. Please check database connection."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLoginDto dto) {
        if (dto == null || dto.getUsername() == null || dto.getUsername().isBlank()) {
            return ResponseEntity.status(401).body(Map.of("error", "Username is required"));
        }

        return userRepository.findByUsername(dto.getUsername())
                .map(user -> {
                    if (dto.getPassword() == null || dto.getPassword().isBlank()) {
                        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
                    }

                    if (user.getPassword() == null || user.getPassword().isBlank()) {
                        user.setPassword(passwordEncoder.encode(dto.getPassword()));
                        userRepository.save(user);
                    }

                    if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
                }

                    var roles = resolveLoginRoles(user, dto);
                    return ResponseEntity.ok(Map.of(
                    "user", toSafeUser(user),
                            "roles", roles
                    ));
                })
                .orElse(ResponseEntity.status(401).body(Map.of("error", "Invalid credentials")));
    }

    private List<String> resolveLoginRoles(User user, UserLoginDto dto) {
        if (user == null) {
            return Collections.singletonList("USER");
        }

        return user.getRoles() == null || user.getRoles().isEmpty()
                ? Collections.singletonList("USER")
                : user.getRoles();
    }

    @GetMapping
    public ResponseEntity<?> listUsers(
            @RequestParam(required = false) String role) {
        try {
            List<User> all = userRepository.findAll();
            if (role != null && !role.isBlank()) {
                String roleUpper = role.trim().toUpperCase();
                all = all.stream()
                        .filter(u -> u.getRoles() != null && u.getRoles().contains(roleUpper))
                        .toList();
            }
            // Return safe projection (no passwords)
            var result = all.stream().map(u -> Map.of(
                    "id",          String.valueOf(u.getId()),
                    "username",    u.getUsername() != null    ? u.getUsername()    : "",
                    "displayName", u.getDisplayName() != null ? u.getDisplayName() : u.getUsername(),
                    "email",       u.getEmail() != null       ? u.getEmail()       : "",
                    "roles",       u.getRoles() != null       ? u.getRoles()       : List.of()
            )).toList();
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Could not fetch users: " + ex.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        
        return userRepository.findByUsername(auth.getName())
                .map(user -> {
                    var roles = auth.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .map(role -> role.replace("ROLE_", ""))
                            .toList();
                    return ResponseEntity.ok(Map.of(
                    "user", toSafeUser(user),
                            "roles", roles
                    ));
                })
                .orElse(ResponseEntity.status(401).body(Map.of("error", "User not found")));
    }

        private Map<String, Object> toSafeUser(User user) {
        return Map.of(
            "id", user.getId(),
            "username", user.getUsername(),
            "displayName", user.getDisplayName() != null ? user.getDisplayName() : user.getUsername(),
            "email", user.getEmail() != null ? user.getEmail() : "",
            "roles", user.getRoles() != null ? user.getRoles() : List.of("USER")
        );
        }

    // DTOs
    public static class UserLoginDto {
        public String username;
        public String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class UserRegisterDto {
        public String username;
        public String displayName;
        public String email;
        public String role;
        public String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getDisplayName() {
            return displayName;
        }

        public void setDisplayName(String displayName) {
            this.displayName = displayName;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}
