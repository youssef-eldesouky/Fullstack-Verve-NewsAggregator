package com.verve.vervedemo.dto.response;

public class ArticleResponse {
    private Long id;
    private String title;
    private String content;
    private String category;
    private String publisherUsername;
    private Long publisherId;

    // Constructor with all fields
    public ArticleResponse(Long id, String title, String content, String publisherUsername, String category, Long publisherId) {
        this.id = id;
        this.title = title;
        this.category=category;
        this.content = content;
        this.publisherUsername = publisherUsername;
        this.publisherId = publisherId;
    }

    // Default constructor
    public ArticleResponse() {
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getPublisherUsername() {
        return publisherUsername;
    }

    public void setPublisherUsername(String publisherUsername) {
        this.publisherUsername = publisherUsername;
    }
    
    public Long getPublisherId() {
        return publisherId;
    }

    public void setPublisherId(Long publisherId) {
        this.publisherId = publisherId;
    }
}
