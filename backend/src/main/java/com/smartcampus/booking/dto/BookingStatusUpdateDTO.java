// Author: Member 2 - Booking Management Module
package com.smartcampus.booking.dto;

import com.smartcampus.booking.enums.BookingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingStatusUpdateDTO {

    @NotNull
    private BookingStatus status;

    private String rejectionReason;
}
