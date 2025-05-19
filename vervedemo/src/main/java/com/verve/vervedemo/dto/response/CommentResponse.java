package com.verve.vervedemo.dto.response;

public class CommentResponse {

    private Long id;
    private String content;
    private String username;
    private String postTitle;

    public CommentResponse(Long id,String content, String username, String postTitle) {
        this.id = id;
        this.content = content;
        this.username = username;
        this.postTitle = postTitle;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPostTitle() {
        return postTitle;
    }

    public void setPostTitle(String postTitle) {
        this.postTitle = postTitle;
    }
}
