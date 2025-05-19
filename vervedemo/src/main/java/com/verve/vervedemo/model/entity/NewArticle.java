package com.verve.vervedemo.model.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "news_article")
public class NewArticle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50000)
    private String content;

    @Column()
    private String title;

    @Column()
    private String category;

    @ManyToOne
    private User publisher;

    public NewArticle(){}

    public NewArticle(String content, String title, String category) {
        this.content = content;
        this.title = title;
        this.category = category;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public User getPublisher() {
        return publisher;
    }

    public void setPublisher(User publisher) {
        this.publisher = publisher;
    }
}
