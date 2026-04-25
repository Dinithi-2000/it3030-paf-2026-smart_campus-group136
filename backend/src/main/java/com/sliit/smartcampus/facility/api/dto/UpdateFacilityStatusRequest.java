package com.sliit.smartcampus.facility.api.dto;

import com.sliit.smartcampus.facility.model.FacilityStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateFacilityStatusRequest {

    @NotNull(message = "Status is required")
    private FacilityStatus status;

    public FacilityStatus getStatus() {
        return status;
    }

    public void setStatus(FacilityStatus status) {
        this.status = status;
    }
}
