package com.sliit.smartcampus.ticket.api.dto;

import com.sliit.smartcampus.ticket.model.ActorRole;
import com.sliit.smartcampus.ticket.model.TicketPriority;
import com.sliit.smartcampus.ticket.model.TicketStatus;

import java.time.Instant;
import java.util.List;

public class TicketResponse {
    private Long id;
    private String resourceId;
    private String location;
    private String category;
    private String description;
    private TicketPriority priority;
    private String preferredContact;
    private TicketStatus status;
    private String rejectionReason;
    private String resolutionNotes;
    private String createdByUserId;
    private String createdByName;
    private String assignedTechnicianId;
    private String assignedTechnicianName;
    private List<AttachmentMetaResponse> attachments;
    private List<CommentResponse> comments;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant closedAt;
    private Instant firstResponseAt;
    private Instant resolvedAt;
    private Long timeToFirstResponseMinutes;
    private Long timeToResolutionMinutes;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public TicketPriority getPriority() {
        return priority;
    }

    public void setPriority(TicketPriority priority) {
        this.priority = priority;
    }

    public String getPreferredContact() {
        return preferredContact;
    }

    public void setPreferredContact(String preferredContact) {
        this.preferredContact = preferredContact;
    }

    public TicketStatus getStatus() {
        return status;
    }

    public void setStatus(TicketStatus status) {
        this.status = status;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

    public String getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(String createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public String getCreatedByName() {
        return createdByName;
    }

    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }

    public String getAssignedTechnicianId() {
        return assignedTechnicianId;
    }

    public void setAssignedTechnicianId(String assignedTechnicianId) {
        this.assignedTechnicianId = assignedTechnicianId;
    }

    public String getAssignedTechnicianName() {
        return assignedTechnicianName;
    }

    public void setAssignedTechnicianName(String assignedTechnicianName) {
        this.assignedTechnicianName = assignedTechnicianName;
    }

    public List<AttachmentMetaResponse> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<AttachmentMetaResponse> attachments) {
        this.attachments = attachments;
    }

    public List<CommentResponse> getComments() {
        return comments;
    }

    public void setComments(List<CommentResponse> comments) {
        this.comments = comments;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Instant getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(Instant closedAt) {
        this.closedAt = closedAt;
    }

    public Instant getFirstResponseAt() {
        return firstResponseAt;
    }

    public void setFirstResponseAt(Instant firstResponseAt) {
        this.firstResponseAt = firstResponseAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public Long getTimeToFirstResponseMinutes() {
        return timeToFirstResponseMinutes;
    }

    public void setTimeToFirstResponseMinutes(Long timeToFirstResponseMinutes) {
        this.timeToFirstResponseMinutes = timeToFirstResponseMinutes;
    }

    public Long getTimeToResolutionMinutes() {
        return timeToResolutionMinutes;
    }

    public void setTimeToResolutionMinutes(Long timeToResolutionMinutes) {
        this.timeToResolutionMinutes = timeToResolutionMinutes;
    }

    public static class AttachmentMetaResponse {
        private Long id;
        private String fileName;
        private String contentType;
        private long size;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getFileName() {
            return fileName;
        }

        public void setFileName(String fileName) {
            this.fileName = fileName;
        }

        public String getContentType() {
            return contentType;
        }

        public void setContentType(String contentType) {
            this.contentType = contentType;
        }

        public long getSize() {
            return size;
        }

        public void setSize(long size) {
            this.size = size;
        }
    }

    public static class CommentResponse {
        private Long id;
        private String authorId;
        private String authorName;
        private ActorRole authorRole;
        private String content;
        private Instant createdAt;
        private Instant updatedAt;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getAuthorId() {
            return authorId;
        }

        public void setAuthorId(String authorId) {
            this.authorId = authorId;
        }

        public String getAuthorName() {
            return authorName;
        }

        public void setAuthorName(String authorName) {
            this.authorName = authorName;
        }

        public ActorRole getAuthorRole() {
            return authorRole;
        }

        public void setAuthorRole(ActorRole authorRole) {
            this.authorRole = authorRole;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public Instant getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(Instant createdAt) {
            this.createdAt = createdAt;
        }

        public Instant getUpdatedAt() {
            return updatedAt;
        }

        public void setUpdatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
        }
    }
}
