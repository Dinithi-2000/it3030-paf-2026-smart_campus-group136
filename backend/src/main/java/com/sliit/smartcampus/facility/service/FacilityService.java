package com.sliit.smartcampus.facility.service;

import com.sliit.smartcampus.facility.api.dto.CreateFacilityRequest;
import com.sliit.smartcampus.facility.api.dto.FacilityResponse;
import com.sliit.smartcampus.facility.api.dto.UpdateFacilityRequest;
import com.sliit.smartcampus.facility.api.dto.UpdateFacilityStatusRequest;
import com.sliit.smartcampus.facility.model.Facility;
import com.sliit.smartcampus.facility.model.FacilityStatus;
import com.sliit.smartcampus.facility.model.FacilityType;
import com.sliit.smartcampus.facility.repository.FacilityRepository;
import com.sliit.smartcampus.shared.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@Service
public class FacilityService {

    private final FacilityRepository facilityRepository;

    public FacilityService(FacilityRepository facilityRepository) {
        this.facilityRepository = facilityRepository;
    }

    public FacilityResponse create(CreateFacilityRequest request) {
        validateAvailabilityWindow(request.getAvailabilityStart().toSecondOfDay(), request.getAvailabilityEnd().toSecondOfDay());

        String normalizedCode = normalize(request.getCode()).toUpperCase();
        if (facilityRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new ApiException(HttpStatus.CONFLICT, "Facility code already exists");
        }

        Facility facility = new Facility();
        mapEditableFields(request, facility);
        facility.setCode(normalizedCode);
        facility.setCreatedAt(Instant.now());
        facility.setUpdatedAt(Instant.now());

        return toResponse(facilityRepository.save(facility));
    }

    public List<FacilityResponse> list(String type, String status, String location, Integer minCapacity, Integer maxCapacity, String query) {
        return facilityRepository.findAll().stream()
            .filter(facility -> matchesType(facility, type))
            .filter(facility -> matchesStatus(facility, status))
            .filter(facility -> matchesLocation(facility, location))
            .filter(facility -> matchesCapacity(facility, minCapacity, maxCapacity))
            .filter(facility -> matchesQuery(facility, query))
            .sorted(Comparator.comparing(Facility::getUpdatedAt).reversed())
            .map(this::toResponse)
            .toList();
    }

    public FacilityResponse get(Long id) {
        return toResponse(findById(id));
    }

    public FacilityResponse update(Long id, UpdateFacilityRequest request) {
        validateAvailabilityWindow(request.getAvailabilityStart().toSecondOfDay(), request.getAvailabilityEnd().toSecondOfDay());

        String normalizedCode = normalize(request.getCode()).toUpperCase();
        if (facilityRepository.existsByCodeIgnoreCaseAndIdNot(normalizedCode, id)) {
            throw new ApiException(HttpStatus.CONFLICT, "Facility code already exists");
        }

        Facility facility = findById(id);
        mapEditableFields(request, facility);
        facility.setCode(normalizedCode);
        facility.setUpdatedAt(Instant.now());

        return toResponse(facilityRepository.save(facility));
    }

    public FacilityResponse updateStatus(Long id, UpdateFacilityStatusRequest request) {
        Facility facility = findById(id);
        facility.setStatus(request.getStatus());
        facility.setUpdatedAt(Instant.now());
        return toResponse(facilityRepository.save(facility));
    }

    public void delete(Long id) {
        Facility facility = findById(id);
        facilityRepository.delete(facility);
    }

    private Facility findById(Long id) {
        return facilityRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Facility not found"));
    }

    private void validateAvailabilityWindow(int startSeconds, int endSeconds) {
        if (startSeconds >= endSeconds) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Availability start must be before end");
        }
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean matchesType(Facility facility, String type) {
        if (type == null || type.isBlank()) {
            return true;
        }

        try {
            FacilityType requestedType = FacilityType.valueOf(type.trim().toUpperCase());
            return facility.getType() == requestedType;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    private boolean matchesStatus(Facility facility, String status) {
        if (status == null || status.isBlank()) {
            return true;
        }

        try {
            FacilityStatus requestedStatus = FacilityStatus.valueOf(status.trim().toUpperCase());
            return facility.getStatus() == requestedStatus;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    private boolean matchesLocation(Facility facility, String location) {
        if (location == null || location.isBlank()) {
            return true;
        }
        return facility.getLocation().toLowerCase().contains(location.trim().toLowerCase());
    }

    private boolean matchesCapacity(Facility facility, Integer minCapacity, Integer maxCapacity) {
        if (minCapacity != null && facility.getCapacity() < minCapacity) {
            return false;
        }
        if (maxCapacity != null && facility.getCapacity() > maxCapacity) {
            return false;
        }
        return true;
    }

    private boolean matchesQuery(Facility facility, String query) {
        if (query == null || query.isBlank()) {
            return true;
        }

        String normalized = query.trim().toLowerCase();
        return facility.getCode().toLowerCase().contains(normalized)
            || facility.getName().toLowerCase().contains(normalized)
            || facility.getLocation().toLowerCase().contains(normalized)
            || (facility.getDescription() != null && facility.getDescription().toLowerCase().contains(normalized));
    }

    private void mapEditableFields(CreateFacilityRequest request, Facility facility) {
        facility.setName(normalize(request.getName()));
        facility.setType(request.getType());
        facility.setCapacity(request.getCapacity());
        facility.setLocation(normalize(request.getLocation()));
        facility.setAvailabilityStart(request.getAvailabilityStart());
        facility.setAvailabilityEnd(request.getAvailabilityEnd());
        facility.setStatus(request.getStatus());
        facility.setDescription(request.getDescription() == null ? null : request.getDescription().trim());
    }

    private void mapEditableFields(UpdateFacilityRequest request, Facility facility) {
        facility.setName(normalize(request.getName()));
        facility.setType(request.getType());
        facility.setCapacity(request.getCapacity());
        facility.setLocation(normalize(request.getLocation()));
        facility.setAvailabilityStart(request.getAvailabilityStart());
        facility.setAvailabilityEnd(request.getAvailabilityEnd());
        facility.setStatus(request.getStatus());
        facility.setDescription(request.getDescription() == null ? null : request.getDescription().trim());
    }

    private FacilityResponse toResponse(Facility facility) {
        FacilityResponse response = new FacilityResponse();
        response.setId(facility.getId());
        response.setCode(facility.getCode());
        response.setName(facility.getName());
        response.setType(facility.getType());
        response.setCapacity(facility.getCapacity());
        response.setLocation(facility.getLocation());
        response.setAvailabilityStart(facility.getAvailabilityStart());
        response.setAvailabilityEnd(facility.getAvailabilityEnd());
        response.setStatus(facility.getStatus());
        response.setDescription(facility.getDescription());
        response.setCreatedAt(facility.getCreatedAt());
        response.setUpdatedAt(facility.getUpdatedAt());
        return response;
    }
}
