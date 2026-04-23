// Author: Member 2 - Booking Management Module
package com.sliit.smartcampus.booking.repository;

import com.sliit.smartcampus.booking.model.Booking;
import com.sliit.smartcampus.booking.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Query("SELECT b FROM Booking b WHERE b.resourceId = :resourceId AND b.status IN ('PENDING', 'APPROVED') AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findOverlappingBookings(
        @Param("resourceId") String resourceId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);

    List<Booking> findByUserId(String userId);

    List<Booking> findByStatus(BookingStatus status);

    List<Booking> findByResourceId(String resourceId);
}
