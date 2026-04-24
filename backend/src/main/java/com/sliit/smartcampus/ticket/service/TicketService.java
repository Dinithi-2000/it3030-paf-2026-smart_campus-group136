package com.sliit.smartcampus.ticket.service;

import com.sliit.smartcampus.shared.exception.ApiException;
import com.sliit.smartcampus.ticket.api.dto.AssignTechnicianRequest;
import com.sliit.smartcampus.ticket.api.dto.CreateCommentRequest;
import com.sliit.smartcampus.ticket.api.dto.CreateTicketRequest;
import com.sliit.smartcampus.ticket.api.dto.TicketResponse;
import com.sliit.smartcampus.ticket.api.dto.UpdateCommentRequest;
import com.sliit.smartcampus.ticket.api.dto.UpdateTicketStatusRequest;
import com.sliit.smartcampus.ticket.model.ActorRole;
import com.sliit.smartcampus.ticket.model.Ticket;
import com.sliit.smartcampus.ticket.model.TicketAttachment;
import com.sliit.smartcampus.ticket.model.TicketComment;
import com.sliit.smartcampus.ticket.model.TicketStatus;
import com.sliit.smartcampus.ticket.repository.TicketRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
public class TicketService {

    private static final int MAX_ATTACHMENTS_PER_TICKET = 3;
    private static final long MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

    private final TicketRepository ticketRepository;

    public TicketService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    public TicketResponse createTicket(CreateTicketRequest request, List<MultipartFile> files, ActorContext actor) {
        List<TicketAttachment> attachments = mapAttachments(files);

        Ticket ticket = new Ticket();
        ticket.setResourceId(request.getResourceId().trim());
        ticket.setLocation(request.getLocation().trim());
        ticket.setCategory(request.getCategory().trim());
        ticket.setDescription(request.getDescription().trim());
        ticket.setPriority(request.getPriority());
        ticket.setPreferredContact(request.getPreferredContact().trim());
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setCreatedByUserId(actor.userId());
        ticket.setCreatedByName(actor.displayName());
        ticket.setAttachments(attachments);
        ticket.setCreatedAt(Instant.now());
        ticket.setUpdatedAt(Instant.now());

        return toResponse(ticketRepository.save(ticket));
    }

    public List<TicketResponse> listTickets(String status, String priority, String category, ActorContext actor) {
        List<Ticket> base = switch (actor.role()) {
            case ADMIN -> ticketRepository.findAll();
            case TECHNICIAN -> mergeDistinct(
                ticketRepository.findByAssignedTechnicianId(actor.userId()),
                ticketRepository.findByCreatedByUserId(actor.userId())
            );
            case USER -> ticketRepository.findByCreatedByUserId(actor.userId());
        };

        return base.stream()
            .filter(ticket -> status == null || status.isBlank() || ticket.getStatus().name().equalsIgnoreCase(status))
            .filter(ticket -> priority == null || priority.isBlank() || ticket.getPriority().name().equalsIgnoreCase(priority))
            .filter(ticket -> category == null || category.isBlank() || ticket.getCategory().equalsIgnoreCase(category))
            .sorted(Comparator.comparing(Ticket::getCreatedAt).reversed())
            .map(this::toResponse)
            .toList();
    }

    public TicketResponse getTicket(Long id, ActorContext actor) {
        Ticket ticket = fetchTicket(id);
        assertTicketVisible(ticket, actor);
        return toResponse(ticket);
    }

    public TicketResponse assignTechnician(Long ticketId, AssignTechnicianRequest request, ActorContext actor) {
        ensureRole(actor, ActorRole.ADMIN, "Only ADMIN can assign technicians");

        Ticket ticket = fetchTicket(ticketId);
        if (ticket.getStatus() == TicketStatus.CLOSED || ticket.getStatus() == TicketStatus.REJECTED) {
            throw new ApiException(HttpStatus.CONFLICT, "Cannot assign technician to a closed/rejected ticket");
        }

        ticket.setAssignedTechnicianId(request.getTechnicianId().trim());
        ticket.setAssignedTechnicianName(request.getTechnicianName().trim());

        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        markFirstResponseIfNeeded(ticket, actor.role());

        ticket.setUpdatedAt(Instant.now());
        return toResponse(ticketRepository.save(ticket));
    }

    public TicketResponse updateStatus(Long ticketId, UpdateTicketStatusRequest request, ActorContext actor) {
        Ticket ticket = fetchTicket(ticketId);
        ensureCanUpdateStatus(ticket, actor);

        validateTransition(ticket.getStatus(), request.getStatus());

        if (request.getStatus() == TicketStatus.REJECTED && actor.role() != ActorRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only ADMIN can set ticket status to REJECTED");
        }

        if (request.getStatus() == TicketStatus.REJECTED && !StringUtils.hasText(request.getRejectionReason())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Rejection reason is required when status is REJECTED");
        }

        if (request.getStatus() == TicketStatus.RESOLVED && !StringUtils.hasText(request.getResolutionNotes())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Resolution notes are required when status is RESOLVED");
        }

        ticket.setStatus(request.getStatus());
        ticket.setUpdatedAt(Instant.now());
        markFirstResponseIfNeeded(ticket, actor.role());

        if (StringUtils.hasText(request.getResolutionNotes())) {
            ticket.setResolutionNotes(request.getResolutionNotes().trim());
        }

        if (request.getStatus() == TicketStatus.REJECTED) {
            ticket.setRejectionReason(request.getRejectionReason().trim());
            ticket.setClosedAt(Instant.now());
        }

        if (request.getStatus() == TicketStatus.CLOSED) {
            ticket.setClosedAt(Instant.now());
        }

        if (request.getStatus() == TicketStatus.RESOLVED || request.getStatus() == TicketStatus.CLOSED) {
            if (ticket.getResolvedAt() == null) {
                ticket.setResolvedAt(Instant.now());
            }
        } else if (request.getStatus() == TicketStatus.IN_PROGRESS) {
            ticket.setResolvedAt(null);
        }

        return toResponse(ticketRepository.save(ticket));
    }

    public TicketResponse addComment(Long ticketId, CreateCommentRequest request, ActorContext actor) {
        Ticket ticket = fetchTicket(ticketId);
        ensureCanComment(ticket, actor);

        TicketComment comment = new TicketComment();
        comment.setAuthorId(actor.userId());
        comment.setAuthorName(actor.displayName());
        comment.setAuthorRole(actor.role());
        comment.setContent(request.getContent().trim());
        comment.setCreatedAt(Instant.now());
        comment.setUpdatedAt(Instant.now());

        ticket.getComments().add(comment);
        markFirstResponseIfNeeded(ticket, actor.role());
        ticket.setUpdatedAt(Instant.now());
        return toResponse(ticketRepository.save(ticket));
    }

    public TicketResponse updateComment(Long ticketId, Long commentId, UpdateCommentRequest request, ActorContext actor) {
        Ticket ticket = fetchTicket(ticketId);
        TicketComment comment = findComment(ticket, commentId);
        ensureCanEditComment(comment, actor);

        comment.setContent(request.getContent().trim());
        comment.setUpdatedAt(Instant.now());

        ticket.setUpdatedAt(Instant.now());
        return toResponse(ticketRepository.save(ticket));
    }

    public void deleteComment(Long ticketId, Long commentId, ActorContext actor) {
        Ticket ticket = fetchTicket(ticketId);
        TicketComment comment = findComment(ticket, commentId);
        ensureCanEditComment(comment, actor);

        ticket.getComments().removeIf(each -> Objects.equals(each.getId(), commentId));
        ticket.setUpdatedAt(Instant.now());
        ticketRepository.save(ticket);
    }

    private Ticket fetchTicket(Long ticketId) {
        return ticketRepository.findById(ticketId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
    }

    private TicketComment findComment(Ticket ticket, Long commentId) {
        return ticket.getComments().stream()
            .filter(comment -> Objects.equals(comment.getId(), commentId))
            .findFirst()
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Comment not found"));
    }

    private void ensureCanComment(Ticket ticket, ActorContext actor) {
        if (actor.role() == ActorRole.ADMIN) {
            return;
        }
        if (Objects.equals(ticket.getCreatedByUserId(), actor.userId())) {
            return;
        }
        if (Objects.equals(ticket.getAssignedTechnicianId(), actor.userId())) {
            return;
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "You are not allowed to comment on this ticket");
    }

    private void ensureCanEditComment(TicketComment comment, ActorContext actor) {
        if (actor.role() == ActorRole.ADMIN) {
            return;
        }
        if (!Objects.equals(comment.getAuthorId(), actor.userId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the owner can edit/delete this comment");
        }
    }

    private void ensureCanUpdateStatus(Ticket ticket, ActorContext actor) {
        if (actor.role() == ActorRole.ADMIN) {
            return;
        }

        if (actor.role() == ActorRole.TECHNICIAN && Objects.equals(ticket.getAssignedTechnicianId(), actor.userId())) {
            return;
        }

        throw new ApiException(HttpStatus.FORBIDDEN, "Only ADMIN or assigned TECHNICIAN can update ticket status");
    }

    private void ensureRole(ActorContext actor, ActorRole requiredRole, String message) {
        if (actor.role() != requiredRole) {
            throw new ApiException(HttpStatus.FORBIDDEN, message);
        }
    }

    private void assertTicketVisible(Ticket ticket, ActorContext actor) {
        if (actor.role() == ActorRole.ADMIN) {
            return;
        }
        if (Objects.equals(ticket.getCreatedByUserId(), actor.userId())) {
            return;
        }
        if (Objects.equals(ticket.getAssignedTechnicianId(), actor.userId())) {
            return;
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "You are not allowed to view this ticket");
    }

    private void validateTransition(TicketStatus current, TicketStatus next) {
        if (current == next) {
            return;
        }

        boolean valid = switch (current) {
            case OPEN -> next == TicketStatus.IN_PROGRESS || next == TicketStatus.REJECTED;
            case IN_PROGRESS -> next == TicketStatus.RESOLVED || next == TicketStatus.REJECTED;
            case RESOLVED -> next == TicketStatus.CLOSED || next == TicketStatus.IN_PROGRESS;
            case CLOSED, REJECTED -> false;
        };

        if (!valid) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                "Invalid status transition from " + current + " to " + next);
        }
    }

    private List<TicketAttachment> mapAttachments(List<MultipartFile> files) {
        List<MultipartFile> safeFiles = files == null ? List.of() : files;
        if (safeFiles.size() > MAX_ATTACHMENTS_PER_TICKET) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                "A ticket can contain at most " + MAX_ATTACHMENTS_PER_TICKET + " attachments");
        }

        List<TicketAttachment> mapped = new ArrayList<>();
        for (MultipartFile file : safeFiles) {
            if (file.isEmpty()) {
                continue;
            }
            if (file.getSize() > MAX_FILE_SIZE_BYTES) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Attachment exceeds max size of " + MAX_FILE_SIZE_BYTES + " bytes");
            }
            String contentType = file.getContentType();
            if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Only image attachments are allowed");
            }

            try {
                TicketAttachment attachment = new TicketAttachment();
                attachment.setFileName(file.getOriginalFilename());
                attachment.setContentType(contentType);
                attachment.setSize(file.getSize());
                attachment.setData(file.getBytes());
                mapped.add(attachment);
            } catch (IOException ex) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Failed to read attachment data");
            }
        }

        return mapped;
    }

    private List<Ticket> mergeDistinct(List<Ticket> first, List<Ticket> second) {
        List<Ticket> merged = new ArrayList<>(first);
        for (Ticket ticket : second) {
            boolean exists = merged.stream().anyMatch(each -> Objects.equals(each.getId(), ticket.getId()));
            if (!exists) {
                merged.add(ticket);
            }
        }
        return merged;
    }

    private void markFirstResponseIfNeeded(Ticket ticket, ActorRole actorRole) {
        if (ticket.getFirstResponseAt() != null) {
            return;
        }
        if (actorRole == ActorRole.ADMIN || actorRole == ActorRole.TECHNICIAN) {
            ticket.setFirstResponseAt(Instant.now());
        }
    }

    private Long minutesBetween(Instant from, Instant to) {
        if (from == null || to == null) {
            return null;
        }
        long minutes = Duration.between(from, to).toMinutes();
        return Math.max(minutes, 0L);
    }

    private TicketResponse toResponse(Ticket ticket) {
        TicketResponse response = new TicketResponse();
        response.setId(ticket.getId());
        response.setResourceId(ticket.getResourceId());
        response.setLocation(ticket.getLocation());
        response.setCategory(ticket.getCategory());
        response.setDescription(ticket.getDescription());
        response.setPriority(ticket.getPriority());
        response.setPreferredContact(ticket.getPreferredContact());
        response.setStatus(ticket.getStatus());
        response.setRejectionReason(ticket.getRejectionReason());
        response.setResolutionNotes(ticket.getResolutionNotes());
        response.setCreatedByUserId(ticket.getCreatedByUserId());
        response.setCreatedByName(ticket.getCreatedByName());
        response.setAssignedTechnicianId(ticket.getAssignedTechnicianId());
        response.setAssignedTechnicianName(ticket.getAssignedTechnicianName());

        List<TicketResponse.AttachmentMetaResponse> attachmentResponses = ticket.getAttachments().stream()
            .map(attachment -> {
                TicketResponse.AttachmentMetaResponse item = new TicketResponse.AttachmentMetaResponse();
                item.setId(attachment.getId());
                item.setFileName(attachment.getFileName());
                item.setContentType(attachment.getContentType());
                item.setSize(attachment.getSize());
                return item;
            })
            .toList();

        List<TicketResponse.CommentResponse> commentResponses = ticket.getComments().stream()
            .map(comment -> {
                TicketResponse.CommentResponse item = new TicketResponse.CommentResponse();
                item.setId(comment.getId());
                item.setAuthorId(comment.getAuthorId());
                item.setAuthorName(comment.getAuthorName());
                item.setAuthorRole(comment.getAuthorRole());
                item.setContent(comment.getContent());
                item.setCreatedAt(comment.getCreatedAt());
                item.setUpdatedAt(comment.getUpdatedAt());
                return item;
            })
            .toList();

        response.setAttachments(attachmentResponses);
        response.setComments(commentResponses);
        response.setCreatedAt(ticket.getCreatedAt());
        response.setUpdatedAt(ticket.getUpdatedAt());
        response.setClosedAt(ticket.getClosedAt());
        response.setFirstResponseAt(ticket.getFirstResponseAt());
        response.setResolvedAt(ticket.getResolvedAt());
        response.setTimeToFirstResponseMinutes(minutesBetween(ticket.getCreatedAt(), ticket.getFirstResponseAt()));
        response.setTimeToResolutionMinutes(minutesBetween(ticket.getCreatedAt(), ticket.getResolvedAt()));
        return response;
    }
}
