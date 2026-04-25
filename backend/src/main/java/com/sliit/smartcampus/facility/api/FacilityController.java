package com.sliit.smartcampus.facility.api;

import com.sliit.smartcampus.facility.api.dto.CreateFacilityRequest;
import com.sliit.smartcampus.facility.api.dto.FacilityResponse;
import com.sliit.smartcampus.facility.api.dto.UpdateFacilityRequest;
import com.sliit.smartcampus.facility.api.dto.UpdateFacilityStatusRequest;
import com.sliit.smartcampus.facility.service.FacilityService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/facilities")
public class FacilityController {

    private final FacilityService facilityService;

    public FacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    @PostMapping
    public ResponseEntity<FacilityResponse> create(@Valid @RequestBody CreateFacilityRequest request) {
        FacilityResponse created = facilityService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public List<FacilityResponse> list(
        @RequestParam(required = false) String type,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String location,
        @RequestParam(required = false) Integer minCapacity,
        @RequestParam(required = false) Integer maxCapacity,
        @RequestParam(required = false) String query
    ) {
        return facilityService.list(type, status, location, minCapacity, maxCapacity, query);
    }

    @GetMapping("/{id}")
    public FacilityResponse get(@PathVariable Long id) {
        return facilityService.get(id);
    }

    @PutMapping("/{id}")
    public FacilityResponse update(@PathVariable Long id, @Valid @RequestBody UpdateFacilityRequest request) {
        return facilityService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    public FacilityResponse updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateFacilityStatusRequest request) {
        return facilityService.updateStatus(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        facilityService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
