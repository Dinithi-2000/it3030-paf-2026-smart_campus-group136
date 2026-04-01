package com.sliit.smartcampus.ticket.api.dto;

import jakarta.validation.constraints.NotBlank;

public class AssignTechnicianRequest {

    @NotBlank(message = "Technician ID is required")
    private String technicianId;

    @NotBlank(message = "Technician name is required")
    private String technicianName;

    public String getTechnicianId() {
        return technicianId;
    }

    public void setTechnicianId(String technicianId) {
        this.technicianId = technicianId;
    }

    public String getTechnicianName() {
        return technicianName;
    }

    public void setTechnicianName(String technicianName) {
        this.technicianName = technicianName;
    }
}
