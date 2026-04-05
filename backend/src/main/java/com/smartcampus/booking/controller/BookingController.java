// Author: Member 2 - Booking Management Module
package com.smartcampus.booking.controller;

import com.smartcampus.booking.dto.BookingRequestDTO;
import com.smartcampus.booking.dto.BookingResponseDTO;
import com.smartcampus.booking.dto.BookingStatusUpdateDTO;
import com.smartcampus.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponseDTO createBooking(@Valid @RequestBody BookingRequestDTO dto, Principal principal) {
        return bookingService.createBooking(dto, principal.getName());
    }

    @GetMapping
    public List<BookingResponseDTO> getBookings(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String resourceId,
        Principal principal,
        @AuthenticationPrincipal Object ignoredPrincipal
    ) {
        String role = extractCurrentUserRole();
        if ("ADMIN".equalsIgnoreCase(role) || "ROLE_ADMIN".equalsIgnoreCase(role)) {
            return bookingService.getAllBookings(status, resourceId);
        }
        return bookingService.getBookingsForUser(principal.getName());
    }

    @PatchMapping("/{id}/status")
    public BookingResponseDTO updateStatus(
        @PathVariable String id,
        @Valid @RequestBody BookingStatusUpdateDTO dto,
        Principal principal
    ) {
        String userId = principal.getName();
        String role = extractCurrentUserRole();
        return bookingService.updateBookingStatus(id, dto, userId, role);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteBooking(@PathVariable String id, Principal principal) {
        bookingService.deleteBooking(id, "ADMIN");
    }

    private String extractCurrentUserRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getAuthorities() == null || authentication.getAuthorities().isEmpty()) {
            return "USER";
        }
        return authentication.getAuthorities().stream()
            .findFirst()
            .map(grantedAuthority -> grantedAuthority.getAuthority())
            .orElse("USER");
    }
}
