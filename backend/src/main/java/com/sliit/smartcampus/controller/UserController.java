package com.sliit.smartcampus.controller;

import com.sliit.smartcampus.model.User;
import com.sliit.smartcampus.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRegisterDto dto) {
        if (userRepository.findByUsername(dto.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }
        
        var user = User.builder()
                .username(dto.getUsername())
                .displayName(dto.getDisplayName())
                .email(dto.getEmail())
                .roles(List.of("USER"))
                .build();
        
        var saved = userRepository.save(user);
        return ResponseEntity.created(URI.create("/api/users/" + saved.getId())).body(saved);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLoginDto dto, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
        
        return userRepository.findByUsername(auth.getName())
                .map(user -> {
                    var roles = auth.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .map(role -> role.replace("ROLE_", ""))
                            .toList();
                    return ResponseEntity.ok(Map.of(
                            "user", user,
                            "roles", roles
                    ));
                })
                .orElse(ResponseEntity.status(401).body(Map.of("error", "User not found")));
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
                            "user", user,
                            "roles", roles
                    ));
                })
                .orElse(ResponseEntity.status(401).body(Map.of("error", "User not found")));
    }

    // DTOs
    public static class UserLoginDto {
        public String username;
        public String password;
    }

    public static class UserRegisterDto {
        public String username;
        public String displayName;
        public String email;
    }
}
