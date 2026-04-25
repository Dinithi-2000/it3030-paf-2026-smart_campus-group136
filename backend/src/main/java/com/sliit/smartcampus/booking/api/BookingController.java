// Author: Member 2 - Booking Management Module
package com.sliit.smartcampus.booking.api;

import com.sliit.smartcampus.booking.api.dto.BookingRequestDTO;
import com.sliit.smartcampus.booking.api.dto.BookingResponseDTO;
import com.sliit.smartcampus.booking.api.dto.BookingStatusUpdateDTO;
import com.sliit.smartcampus.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
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
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponseDTO createBooking(@Valid @RequestBody BookingRequestDTO dto, Authentication authentication) {
        return bookingService.createBooking(dto, requireUserId(authentication));
    }

    @GetMapping
    public List<BookingResponseDTO> listBookings(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String resourceId,
        Authentication authentication
    ) {
        String role = resolveRole(authentication);
        if ("ADMIN".equals(role)) {
            return bookingService.getAllBookings(status, resourceId);
        }
        return bookingService.getBookingsForUser(requireUserId(authentication));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public BookingResponseDTO updateBookingStatus(
        @PathVariable Long id,
        @Valid @RequestBody BookingStatusUpdateDTO dto,
        Authentication authentication
    ) {
        return bookingService.updateBookingStatus(id, dto, requireUserId(authentication), resolveRole(authentication));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBooking(@PathVariable Long id, Authentication authentication) {
        bookingService.deleteBooking(id, requireUserId(authentication), resolveRole(authentication));
    }

    private String resolveRole(Authentication authentication) {
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken || !authentication.isAuthenticated()) {
            return "";
        }

        return authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .map(authority -> authority.replace("ROLE_", ""))
            .findFirst()
            .orElse("");
    }

    private String requireUserId(Authentication authentication) {
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        return authentication.getName();
    }
}
