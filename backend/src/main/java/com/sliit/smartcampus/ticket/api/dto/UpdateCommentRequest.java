package com.sliit.smartcampus.ticket.api.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateCommentRequest {

    @NotBlank(message = "Comment content is required")
    private String content;

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
