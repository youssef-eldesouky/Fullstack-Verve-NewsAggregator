package com.verve.vervedemo.model.entity;


import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class Comments {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String content;


    @ManyToOne
    private User user;


    @ManyToOne
    private NewArticle post;

    private LocalDateTime createdAt;


    public Comments(){}


    public Comments(String content, User user, LocalDateTime createdAt, NewArticle post) {
        this.content = content;
        this.user = user;
        this.createdAt = createdAt;
        this.post = post;
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public NewArticle getPost() {
        return post;
    }

    public void setPost(NewArticle post) {
        this.post = post;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
