package com.sliit.smartcampus.ticket.repository;

import com.sliit.smartcampus.ticket.model.Ticket;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TicketRepository extends MongoRepository<Ticket, String> {
    List<Ticket> findByCreatedByUserId(String createdByUserId);
    List<Ticket> findByAssignedTechnicianId(String assignedTechnicianId);
}
