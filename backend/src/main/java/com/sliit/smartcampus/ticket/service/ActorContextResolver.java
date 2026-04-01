package com.sliit.smartcampus.ticket.service;

import com.sliit.smartcampus.shared.exception.ApiException;
import com.sliit.smartcampus.ticket.model.ActorRole;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class ActorContextResolver {

    public ActorContext resolve(HttpServletRequest request) {
        String userId = request.getHeader("X-User-Id");
        String userName = request.getHeader("X-User-Name");
        String userRole = request.getHeader("X-User-Role");

        if (userId == null || userId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "X-User-Id header is required");
        }

        ActorRole role;
        try {
            role = userRole == null || userRole.isBlank()
                ? ActorRole.USER
                : ActorRole.valueOf(userRole.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid X-User-Role header");
        }

        String resolvedName = (userName == null || userName.isBlank()) ? userId : userName;
        return new ActorContext(userId.trim(), resolvedName.trim(), role);
    }
}
