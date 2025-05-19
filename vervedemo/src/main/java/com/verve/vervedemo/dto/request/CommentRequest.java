package com.verve.vervedemo.dto.request;

import jakarta.validation.constraints.NotNull;

public class CommentRequest {

    @NotNull(message = "content is required")
    private String content;


    private Long userId;


    @NotNull(message = "Post ID is required")
    private Long postId;

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getPostId() {
        return postId;
    }

    public void setPostId(Long postId) {
        this.postId = postId;
    }
}
