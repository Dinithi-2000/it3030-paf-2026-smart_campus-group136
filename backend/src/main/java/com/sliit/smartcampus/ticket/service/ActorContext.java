package com.sliit.smartcampus.ticket.service;

import com.sliit.smartcampus.ticket.model.ActorRole;

public record ActorContext(String userId, String displayName, ActorRole role) {
}
