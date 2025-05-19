package com.verve.vervedemo.controller;


import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.verve.vervedemo.dto.request.ArticleRequest;
import com.verve.vervedemo.dto.response.ArticleResponse;
import com.verve.vervedemo.model.entity.User;
import com.verve.vervedemo.repo.UserRepository;
import com.verve.vervedemo.services.ArticleService;
import com.verve.vervedemo.services.strategy.AllArticlesFilterStrategy;
import com.verve.vervedemo.services.strategy.SurpriseFilterStrategy;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/posts")
public class ArticleController {
    private ArticleService articleService;
    private UserRepository userRepository;
    private final AllArticlesFilterStrategy allArticlesStrategy;
    private final SurpriseFilterStrategy surpriseStrategy;
    
    public ArticleController(ArticleService articleService, UserRepository userRepository) {
        this.articleService = articleService;
        this.userRepository = userRepository;
        this.allArticlesStrategy = new AllArticlesFilterStrategy();
        this.surpriseStrategy = new SurpriseFilterStrategy();
    }


    private User getUserFromSession(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return null;
        return userRepository.findById(userId).orElse(null);
    }


    @PostMapping
    public ResponseEntity<ArticleResponse> createArticle(@RequestBody ArticleRequest request, HttpSession session) {
        User user = getUserFromSession(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ArticleResponse response = articleService.createPost(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get posts created by the current user
     */
    @GetMapping("/user")
    public ResponseEntity<List<ArticleResponse>> getUserArticles(HttpSession session) {
        User user = getUserFromSession(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<ArticleResponse> articles = articleService.getUserPosts(user);
        return ResponseEntity.ok(articles);
    }
    
    /**
     * Get feed articles based on user interests
     */
    @GetMapping("/feed")
    public ResponseEntity<List<ArticleResponse>> getFeedArticles(HttpSession session) {
        User user = getUserFromSession(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<ArticleResponse> articles = articleService.getFeedArticles(user);
        return ResponseEntity.ok(articles);
    }
    
    /**
     * Get articles outside user's interests (surprise content)
     */
    @GetMapping("/surprise")
    public ResponseEntity<List<ArticleResponse>> getSurpriseArticles(HttpSession session) {
        User user = getUserFromSession(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<ArticleResponse> articles = articleService.getFilteredPosts(user, surpriseStrategy);
        return ResponseEntity.ok(articles);
    }
    
    /**
     * Get all articles without filtering (legacy endpoint)
     */
    @GetMapping
    public ResponseEntity<List<ArticleResponse>> getAllArticles(HttpSession session) {
        User user = getUserFromSession(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        // For backward compatibility, we return all articles instead of just the user's
        List<ArticleResponse> articles = articleService.getFilteredPosts(user, allArticlesStrategy);
        return ResponseEntity.ok(articles);
    }

    @PutMapping("/{postId}")
    public ResponseEntity<ArticleResponse> updateArticle(@PathVariable Long postId,
                                                         @RequestBody ArticleRequest request,
                                                         HttpSession session) {
        User user = getUserFromSession(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ArticleResponse updated = articleService.updatePost(user, postId, request);
        if (updated == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deleteArticle(@PathVariable Long postId, HttpSession session) {
        User user = getUserFromSession(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        boolean deleted = articleService.deletePost(user, postId);
        if (!deleted) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{postId}")
    public ResponseEntity<ArticleResponse> getArticleById(@PathVariable Long postId, HttpSession session) {
        User user = getUserFromSession(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ArticleResponse article = articleService.getArticleById(postId);
        if (article == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(article);
    }
}
