// Author: Member 2 - Booking Management Module
package com.smartcampus.booking.service;

import com.smartcampus.booking.dto.BookingRequestDTO;
import com.smartcampus.booking.dto.BookingResponseDTO;
import com.smartcampus.booking.dto.BookingStatusUpdateDTO;
import com.smartcampus.booking.enums.BookingStatus;
import com.smartcampus.booking.exception.ConflictException;
import com.smartcampus.booking.exception.ResourceNotFoundException;
import com.smartcampus.booking.model.Booking;
import com.smartcampus.booking.repository.BookingRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;

    public BookingService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    public BookingResponseDTO createBooking(BookingRequestDTO dto, String userId) {
        if (!dto.getEndTime().isAfter(dto.getStartTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }

        List<Booking> overlaps = bookingRepository.findOverlappingBookings(
            dto.getResourceId(),
            dto.getStartTime(),
            dto.getEndTime()
        );

        if (!overlaps.isEmpty()) {
            throw new ConflictException("Resource is already booked during the requested time.");
        }

        LocalDateTime now = LocalDateTime.now();
        Booking booking = Booking.builder()
            .resourceId(dto.getResourceId())
            .userId(userId)
            .startTime(dto.getStartTime())
            .endTime(dto.getEndTime())
            .purpose(dto.getPurpose())
            .expectedAttendees(dto.getExpectedAttendees())
            .status(BookingStatus.PENDING)
            .createdAt(now)
            .updatedAt(now)
            .build();

        Booking saved = bookingRepository.save(booking);
        return mapToResponseDTO(saved);
    }

    public List<BookingResponseDTO> getBookingsForUser(String userId) {
        return bookingRepository.findByUserId(userId)
            .stream()
            .map(this::mapToResponseDTO)
            .toList();
    }

    public List<BookingResponseDTO> getAllBookings(String status, String resourceId) {
        List<Booking> bookings;

        if (status != null && !status.isBlank()) {
            BookingStatus bookingStatus;
            try {
                bookingStatus = BookingStatus.valueOf(status.toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Invalid status value: " + status);
            }
            bookings = bookingRepository.findByStatus(bookingStatus);
        } else if (resourceId != null && !resourceId.isBlank()) {
            bookings = bookingRepository.findByResourceId(resourceId);
        } else {
            bookings = bookingRepository.findAll();
        }

        if (resourceId != null && !resourceId.isBlank()) {
            bookings = bookings.stream()
                .filter(booking -> resourceId.equals(booking.getResourceId()))
                .toList();
        }

        return bookings.stream()
            .map(this::mapToResponseDTO)
            .toList();
    }

    public BookingResponseDTO updateBookingStatus(String bookingId, BookingStatusUpdateDTO dto, String currentUserId, String currentUserRole) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (isAdmin(currentUserRole)) {
            if (dto.getStatus() != BookingStatus.APPROVED && dto.getStatus() != BookingStatus.REJECTED) {
                throw new IllegalArgumentException("Admins can only approve or reject bookings");
            }
            booking.setStatus(dto.getStatus());
            if (dto.getStatus() == BookingStatus.REJECTED) {
                booking.setRejectionReason(dto.getRejectionReason());
            } else {
                booking.setRejectionReason(null);
            }
        } else if (isUser(currentUserRole)) {
            if (dto.getStatus() != BookingStatus.CANCELLED
                || !booking.getUserId().equals(currentUserId)
                || booking.getStatus() != BookingStatus.APPROVED) {
                throw new AccessDeniedException("You are not allowed to perform this action");
            }
            booking.setStatus(BookingStatus.CANCELLED);
        } else {
            throw new AccessDeniedException("You are not allowed to perform this action");
        }

        booking.setUpdatedAt(LocalDateTime.now());
        Booking updated = bookingRepository.save(booking);
        return mapToResponseDTO(updated);
    }

    public void deleteBooking(String bookingId, String currentUserRole) {
        if (!isAdmin(currentUserRole)) {
            throw new AccessDeniedException("Only admins can delete bookings");
        }

        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        bookingRepository.deleteById(booking.getId());
    }

    private BookingResponseDTO mapToResponseDTO(Booking booking) {
        return BookingResponseDTO.builder()
            .id(booking.getId())
            .resourceId(booking.getResourceId())
            .userId(booking.getUserId())
            .startTime(booking.getStartTime())
            .endTime(booking.getEndTime())
            .purpose(booking.getPurpose())
            .expectedAttendees(booking.getExpectedAttendees())
            .status(booking.getStatus())
            .rejectionReason(booking.getRejectionReason())
            .createdAt(booking.getCreatedAt())
            .updatedAt(booking.getUpdatedAt())
            .build();
    }

    private boolean isAdmin(String role) {
        return "ADMIN".equalsIgnoreCase(role) || "ROLE_ADMIN".equalsIgnoreCase(role);
    }

    private boolean isUser(String role) {
        return "USER".equalsIgnoreCase(role) || "ROLE_USER".equalsIgnoreCase(role);
    }
}
