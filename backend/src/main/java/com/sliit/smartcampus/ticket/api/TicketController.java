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

    /**
     * POST /api/tickets
     *
     * Creates a new incident/maintenance ticket for a specific resource or location.
     * Accepts multipart/form-data to support up to 3 image attachments (e.g. photos of
     * damaged equipment or error screens). The ticket is initialised with status OPEN.
     *
     * Access: Any authenticated user (USER, TECHNICIAN, ADMIN).
     *
     * @param request       validated form fields (resourceId, location, category,
     *                      description, priority, preferredContact)
     * @param attachments   optional list of image files (max 3)
     * @param servletRequest HTTP request used to resolve the acting user context
     * @return 201 Created with the full {@link TicketResponse}
     */
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

    /**
     * GET /api/tickets
     *
     * Returns a list of incident tickets. Supports optional query-parameter filtering
     * by status, priority, and category.
     *
     * Access control:
     *   - ADMIN / TECHNICIAN : sees all tickets in the system.
     *   - USER               : sees only tickets they created.
     *
     * @param status         optional filter (OPEN | IN_PROGRESS | RESOLVED | CLOSED | REJECTED)
     * @param priority       optional filter (LOW | MEDIUM | HIGH | CRITICAL)
     * @param category       optional filter (free-text category name)
     * @param servletRequest HTTP request used to resolve the acting user context
     * @return 200 OK with a list of {@link TicketResponse} objects
     */
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

    /**
     * GET /api/tickets/{ticketId}
     *
     * Retrieves a single ticket by its unique ID, including all comments and
     * attachment metadata.
     *
     * Access control:
     *   - ADMIN / TECHNICIAN : can fetch any ticket.
     *   - USER               : can only fetch tickets they own.
     *
     * @param ticketId       the ID of the ticket to retrieve
     * @param servletRequest HTTP request used to resolve the acting user context
     * @return 200 OK with the {@link TicketResponse}, or 404 if not found / not owned
     */
    @GetMapping("/{ticketId}")
    public TicketResponse getTicket(@PathVariable Long ticketId, HttpServletRequest servletRequest) {
        ActorContext actor = actorContextResolver.resolve(servletRequest);
        return ticketService.getTicket(ticketId, actor);
    }

    /**
     * PUT /api/tickets/{ticketId}/assignment
     *
     * Assigns (or reassigns) a technician to the specified ticket. A full replacement
     * (PUT) is used because the assignment is a single, owned sub-resource.
     *
     * Access: ADMIN only.
     *
     * @param ticketId       the ID of the ticket to assign
     * @param request        body containing technicianId and technicianName
     * @param servletRequest HTTP request used to resolve the acting user context
     * @return 200 OK with the updated {@link TicketResponse}
     */
    @PutMapping("/{ticketId}/assignment")
    public TicketResponse assignTechnician(
        @PathVariable Long ticketId,
        @Valid @RequestBody AssignTechnicianRequest request,
        HttpServletRequest servletRequest
    ) {
        ActorContext actor = actorContextResolver.resolve(servletRequest);
        return ticketService.assignTechnician(ticketId, request, actor);
    }

    /**
     * PATCH /api/tickets/{ticketId}/status
     *
     * Advances or changes the ticket workflow status. Allowed transitions:
     *   OPEN → IN_PROGRESS (TECHNICIAN / ADMIN)
     *   IN_PROGRESS → RESOLVED (TECHNICIAN / ADMIN)
     *   RESOLVED → CLOSED (ADMIN)
     *   Any open state → REJECTED (ADMIN only, rejectionReason required)
     *
     * PATCH is used because only the status field (and optional notes/reason)
     * are being modified, not the entire ticket resource.
     *
     * @param ticketId       the ID of the ticket whose status should change
     * @param request        body with newStatus, optional resolutionNotes, optional rejectionReason
     * @param servletRequest HTTP request used to resolve the acting user context
     * @return 200 OK with the updated {@link TicketResponse}
     */
    @PatchMapping("/{ticketId}/status")
    public TicketResponse updateStatus(
        @PathVariable Long ticketId,
        @Valid @RequestBody UpdateTicketStatusRequest request,
        HttpServletRequest servletRequest
    ) {
        ActorContext actor = actorContextResolver.resolve(servletRequest);
        return ticketService.updateStatus(ticketId, request, actor);
    }

    /**
     * POST /api/tickets/{ticketId}/comments
     *
     * Appends a new comment to a ticket's comment thread. Both regular users and
     * staff (TECHNICIAN / ADMIN) may comment. The author is captured from the
     * resolved actor context.
     *
     * Access: Any authenticated user who can view the ticket.
     *
     * @param ticketId       the ID of the ticket to comment on
     * @param request        body containing the comment content
     * @param servletRequest HTTP request used to resolve the acting user context
     * @return 200 OK with the updated {@link TicketResponse} including the new comment
     */
    @PostMapping("/{ticketId}/comments")
    public TicketResponse addComment(
        @PathVariable Long ticketId,
        @Valid @RequestBody CreateCommentRequest request,
        HttpServletRequest servletRequest
    ) {
        ActorContext actor = actorContextResolver.resolve(servletRequest);
        return ticketService.addComment(ticketId, request, actor);
    }

    /**
     * PATCH /api/tickets/{ticketId}/comments/{commentId}
     *
     * Edits the content of an existing comment. Only the original author of the
     * comment may update it (ownership enforced in the service layer).
     *
     * Access: Comment owner only.
     *
     * @param ticketId       the ID of the parent ticket
     * @param commentId      the ID of the comment to update
     * @param request        body containing the updated content
     * @param servletRequest HTTP request used to resolve the acting user context
     * @return 200 OK with the updated {@link TicketResponse}
     */
    @PatchMapping("/{ticketId}/comments/{commentId}")
    public TicketResponse updateComment(
        @PathVariable Long ticketId,
        @PathVariable Long commentId,
        @Valid @RequestBody UpdateCommentRequest request,
        HttpServletRequest servletRequest
    ) {
        ActorContext actor = actorContextResolver.resolve(servletRequest);
        return ticketService.updateComment(ticketId, commentId, request, actor);
    }

    /**
     * DELETE /api/tickets/{ticketId}/comments/{commentId}
     *
     * Permanently removes a comment from a ticket. Only the original author of the
     * comment may delete it (ownership enforced in the service layer). ADMIN may
     * delete any comment for moderation purposes.
     *
     * Access: Comment owner or ADMIN.
     *
     * @param ticketId       the ID of the parent ticket
     * @param commentId      the ID of the comment to delete
     * @param servletRequest HTTP request used to resolve the acting user context
     * @return 204 No Content on successful deletion
     */
    @DeleteMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
        @PathVariable Long ticketId,
        @PathVariable Long commentId,
        HttpServletRequest servletRequest
    ) {
        ActorContext actor = actorContextResolver.resolve(servletRequest);
        ticketService.deleteComment(ticketId, commentId, actor);
        return ResponseEntity.noContent().build();
    }
}
