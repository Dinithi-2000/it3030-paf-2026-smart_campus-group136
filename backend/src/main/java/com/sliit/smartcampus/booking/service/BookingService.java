// Author: Member 2 - Booking Management Module
package com.sliit.smartcampus.booking.service;

import com.sliit.smartcampus.booking.api.dto.BookingRequestDTO;
import com.sliit.smartcampus.booking.api.dto.BookingResponseDTO;
import com.sliit.smartcampus.booking.api.dto.BookingStatusUpdateDTO;
import com.sliit.smartcampus.booking.model.Booking;
import com.sliit.smartcampus.booking.model.BookingStatus;
import com.sliit.smartcampus.booking.repository.BookingRepository;
import com.sliit.smartcampus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    public BookingResponseDTO createBooking(BookingRequestDTO dto, String userId) {
        if (!dto.getEndTime().isAfter(dto.getStartTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }

        List<Booking> overlappingBookings = bookingRepository.findOverlappingBookings(
            dto.getResourceId(),
            dto.getStartTime(),
            dto.getEndTime());
        if (!overlappingBookings.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Resource is already booked during the requested time.");
        }

        Booking booking = Booking.builder()
            .resourceId(dto.getResourceId())
            .userId(userId)
            .startTime(dto.getStartTime())
            .endTime(dto.getEndTime())
            .purpose(dto.getPurpose())
            .expectedAttendees(dto.getExpectedAttendees())
            .status(BookingStatus.PENDING)
            .build();

        return mapToResponse(bookingRepository.save(booking));
    }

    public List<BookingResponseDTO> getBookingsForUser(String userId) {
        return bookingRepository.findByUserId(userId).stream()
            .map(this::mapToResponse)
            .toList();
    }

    public List<BookingResponseDTO> getAllBookings(String status, String resourceId) {
        List<Booking> bookings;

        boolean hasStatus = StringUtils.hasText(status);
        boolean hasResourceId = StringUtils.hasText(resourceId);

        if (!hasStatus && !hasResourceId) {
            bookings = bookingRepository.findAll();
        } else if (hasStatus && hasResourceId) {
            BookingStatus bookingStatus = parseStatus(status);
            bookings = bookingRepository.findByStatus(bookingStatus).stream()
                .filter(booking -> booking.getResourceId().equals(resourceId.trim()))
                .toList();
        } else if (hasStatus) {
            bookings = bookingRepository.findByStatus(parseStatus(status));
        } else {
            bookings = bookingRepository.findByResourceId(resourceId.trim());
        }

        return bookings.stream()
            .map(this::mapToResponse)
            .toList();
    }

    public BookingResponseDTO updateBookingStatus(
        Long bookingId,
        BookingStatusUpdateDTO dto,
        String currentUserId,
        String currentUserRole) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        String normalizedRole = currentUserRole == null ? "" : currentUserRole.trim().toUpperCase();
        BookingStatus nextStatus = dto.getStatus();

        if ("ADMIN".equals(normalizedRole)) {
            if (nextStatus == BookingStatus.APPROVED) {
                booking.setStatus(BookingStatus.APPROVED);
                booking.setRejectionReason(null);
                notificationService.notifyBookingApprovedByUsername(
                    booking.getUserId(),
                    booking.getResourceId(),
                    booking.getId()
                );
            } else if (nextStatus == BookingStatus.REJECTED) {
                if (!StringUtils.hasText(dto.getRejectionReason())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rejection reason is required when rejecting a booking.");
                }
                booking.setStatus(BookingStatus.REJECTED);
                booking.setRejectionReason(dto.getRejectionReason().trim());
                notificationService.notifyBookingRejectedByUsername(
                    booking.getUserId(),
                    booking.getResourceId(),
                    booking.getRejectionReason(),
                    booking.getId()
                );
            } else {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
            }
        } else if ("USER".equals(normalizedRole)) {
            if (!currentUserId.equals(booking.getUserId())
                || booking.getStatus() != BookingStatus.APPROVED
                || nextStatus != BookingStatus.CANCELLED) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
            }
            booking.setStatus(BookingStatus.CANCELLED);
            booking.setRejectionReason(null);
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }

        return mapToResponse(bookingRepository.save(booking));
    }

    public void deleteBooking(Long bookingId, String currentUserId, String currentUserRole) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        String normalizedRole = currentUserRole == null ? "" : currentUserRole.trim().toUpperCase();
        if ("ADMIN".equals(normalizedRole)) {
            bookingRepository.delete(booking);
            return;
        }

        if ("USER".equals(normalizedRole)) {
            if (!currentUserId.equals(booking.getUserId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
            }
            if (booking.getStatus() == BookingStatus.APPROVED) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Approved bookings cannot be deleted. Cancel it instead.");
            }

            bookingRepository.delete(booking);
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
    }

    private BookingResponseDTO mapToResponse(Booking booking) {
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

    private BookingStatus parseStatus(String status) {
        try {
            return BookingStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid booking status");
        }
    }
}
