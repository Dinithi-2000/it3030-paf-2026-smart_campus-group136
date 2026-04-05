// Author: Member 2 - Booking Management Module
package com.smartcampus.booking.repository;

import com.smartcampus.booking.enums.BookingStatus;
import com.smartcampus.booking.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends MongoRepository<Booking, String> {

    @Query("{ 'resourceId': ?0, 'status': 'APPROVED', 'startTime': { $lt: ?2 }, 'endTime': { $gt: ?1 } }")
    List<Booking> findOverlappingBookings(String resourceId, LocalDateTime newStart, LocalDateTime newEnd);

    List<Booking> findByUserId(String userId);

    List<Booking> findByStatus(BookingStatus status);

    List<Booking> findByResourceId(String resourceId);

    List<Booking> findByUserIdAndStatus(String userId, BookingStatus status);
}
