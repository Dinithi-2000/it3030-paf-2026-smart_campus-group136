package com.sliit.smartcampus.ticket.repository;

import com.sliit.smartcampus.ticket.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByCreatedByUserId(String createdByUserId);
    List<Ticket> findByAssignedTechnicianId(String assignedTechnicianId);
}
