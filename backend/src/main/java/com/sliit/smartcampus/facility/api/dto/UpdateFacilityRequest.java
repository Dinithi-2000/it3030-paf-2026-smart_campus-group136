package com.sliit.smartcampus.facility.api.dto;

import com.sliit.smartcampus.facility.model.FacilityStatus;
import com.sliit.smartcampus.facility.model.FacilityType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

public class UpdateFacilityRequest {

    @NotBlank(message = "Code is required")
    @Size(max = 40, message = "Code cannot exceed 40 characters")
    private String code;

    @NotBlank(message = "Name is required")
    @Size(max = 120, message = "Name cannot exceed 120 characters")
    private String name;

    @NotNull(message = "Type is required")
    private FacilityType type;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    @Max(value = 5000, message = "Capacity cannot exceed 5000")
    private Integer capacity;

    @NotBlank(message = "Location is required")
    @Size(max = 120, message = "Location cannot exceed 120 characters")
    private String location;

    @NotNull(message = "Availability start is required")
    private LocalTime availabilityStart;

    @NotNull(message = "Availability end is required")
    private LocalTime availabilityEnd;

    @NotNull(message = "Status is required")
    private FacilityStatus status;

    @Size(max = 255, message = "Description cannot exceed 255 characters")
    private String description;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public FacilityType getType() {
        return type;
    }

    public void setType(FacilityType type) {
        this.type = type;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public LocalTime getAvailabilityStart() {
        return availabilityStart;
    }

    public void setAvailabilityStart(LocalTime availabilityStart) {
        this.availabilityStart = availabilityStart;
    }

    public LocalTime getAvailabilityEnd() {
        return availabilityEnd;
    }

    public void setAvailabilityEnd(LocalTime availabilityEnd) {
        this.availabilityEnd = availabilityEnd;
    }

    public FacilityStatus getStatus() {
        return status;
    }

    public void setStatus(FacilityStatus status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
