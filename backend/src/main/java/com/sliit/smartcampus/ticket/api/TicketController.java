package com.sliit.smartcampus.ticket.api;

import com.sliit.smartcampus.ticket.api.dto.AssignTechnicianRequest;
import com.sliit.smartcampus.ticket.api.dto.CreateCommentRequest;
import com.sliit.smartcampus.ticket.api.dto.CreateTicketRequest;
import com.sliit.smartcampus.ticket.api.dto.TicketResponse;
import com.sliit.smartcampus.ticket.api.dto.UpdateCommentRequest;
import com.sliit.smartcampus.ticket.api.dto.UpdateTicketStatusRequest;
import com.sliit.smartcampus.ticket.service.ActorContext;
import com.sliit.smartcampus.ticket.service.ActorContextResolver;
import com.sliit.smartcampus.ticket.service.TicketService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final ActorContextResolver actorContextResolver;

    public TicketController(TicketService ticketService, ActorContextResolver actorContextResolver) {
        this.ticketService = ticketService;
        this.actorContextResolver = actorContextResolver;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TicketResponse> createTicket(
        @Valid @ModelAttribute CreateTicketRequest request,
        @RequestParam(value = "attachments", required = false) List<MultipartFile> attachments,
        HttpServletRequest servletRequest
    ) {
        ActorContext actor = actorContextResolver.resolve(servletRequest);
        TicketResponse created = ticketService.createTicket(request, attachments, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public List<TicketResponse> listTickets(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String priority,
        @RequestParam(required = false) String category,
        HttpServletRequest servletRequest
    ) {
        ActorContext actor = actorContextResolver.resolve(servletRequest);
        return ticketService.listTickets(status, priority, category, actor);
    }

    @GetMapping("/{ticketId}")
    public TicketResponse getTicket(@PathVariable String ticketId, HttpServletRequest servletRequest) {
        ActorContext actor = actorContextResolver.resolve(servletRequest);
        return ticketService.getTicket(ticketId, actor);
    }

    @PutMapping("/{ticketId}/assignment")
    public TicketResponse assignTechnician(
        @PathVariable String ticketId,
        @Valid @RequestBody AssignTechnicianRequest request,
        HttpServletRequest servletRequest
    ) {
        ActorContext actor = actorContextResolver.resolve(servletRequest);
        return ticketService.assignTechnician(ticketId, request, actor);
    }

    @PatchMapping("/{ticketId}/status")
    public TicketResponse updateStatus(
        @PathVariable String ticketId,
        @Valid @RequestBody UpdateTicketStatusRequest request,
        HttpServletRequest servletRequest
    ) {
        ActorContext actor = actorContextResolver.resolve(servletRequest);
        return ticketService.updateStatus(ticketId, request, actor);
    }

    @PostMapping("/{ticketId}/comments")
    public TicketResponse addComment(
        @PathVariable String ticketId,
        @Valid @RequestBody CreateCommentRequest request,
        HttpServletRequest servletRequest
    ) {
        ActorContext actor = actorContextResolver.resolve(servletRequest);
        return ticketService.addComment(ticketId, request, actor);
    }

    @PatchMapping("/{ticketId}/comments/{commentId}")
    public TicketResponse updateComment(
        @PathVariable String ticketId,
        @PathVariable String commentId,
        @Valid @RequestBody UpdateCommentRequest request,
        HttpServletRequest servletRequest
    ) {
        ActorContext actor = actorContextResolver.resolve(servletRequest);
        return ticketService.updateComment(ticketId, commentId, request, actor);
    }

    @DeleteMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
        @PathVariable String ticketId,
        @PathVariable String commentId,
        HttpServletRequest servletRequest
    ) {
        ActorContext actor = actorContextResolver.resolve(servletRequest);
        ticketService.deleteComment(ticketId, commentId, actor);
        return ResponseEntity.noContent().build();
    }
}
