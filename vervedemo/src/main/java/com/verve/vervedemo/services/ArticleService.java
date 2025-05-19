package com.verve.vervedemo.services;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.verve.vervedemo.dto.request.ArticleRequest;
import com.verve.vervedemo.dto.response.ArticleResponse;
import com.verve.vervedemo.model.entity.NewArticle;
import com.verve.vervedemo.model.entity.User;
import com.verve.vervedemo.repo.ArticleRepository;
import com.verve.vervedemo.repo.UserRepository;
import com.verve.vervedemo.services.strategy.ArticleFilterStrategy;
import com.verve.vervedemo.services.strategy.InterestBasedFilterStrategy;

@Service
public class ArticleService {

    private UserRepository userRepository;
    private ArticleRepository articleRepository;
    private final ArticleFilterStrategy defaultFilterStrategy;
    private final NotificationService notificationService;

    public ArticleService(
            UserRepository userRepository, 
            ArticleRepository articleRepository,
            NotificationService notificationService) {
        this.userRepository = userRepository;
        this.articleRepository = articleRepository;
        this.notificationService = notificationService;
        this.defaultFilterStrategy = new InterestBasedFilterStrategy(); // Default filter is interest-based
    }


    public ArticleResponse createPost(User user, ArticleRequest request){
        if(user == null) return null;

        NewArticle article= new NewArticle();
        article.setTitle(request.getTitle());
        article.setCategory(request.getCategory());
        article.setPublisher(user);
        article.setContent(request.getContent());

        articleRepository.save(article);

        // Send notification about the new article
        notificationService.notifyNewArticle(user, article.getTitle(), article.getId());

        return new ArticleResponse(
                article.getId(),
                article.getTitle(),
                article.getContent(),
                article.getPublisher().getUsername(),
                article.getCategory(),
                article.getPublisher().getId()
        );
    }

    /**
     * Get posts created by the current user
     */
    public List<ArticleResponse> getUserPosts(User user) {
        if (user == null) return List.of();

        return articleRepository.findByPublisherId(user.getId()).stream()
                .map(a -> new ArticleResponse(
                        a.getId(),
                        a.getTitle(),
                        a.getContent(),
                        a.getPublisher().getUsername(),
                        a.getCategory(),
                        a.getPublisher().getId()
                ))
                .collect(Collectors.toList());
    }
    
    /**
     * Get all posts filtered by a specific strategy
     * @param user The current user
     * @param strategy The filtering strategy to use
     * @return List of filtered articles
     */
    public List<ArticleResponse> getFilteredPosts(User user, ArticleFilterStrategy strategy) {
        if (user == null) return List.of();
        
        List<NewArticle> allArticles = articleRepository.findAll();
        List<NewArticle> filteredArticles = strategy.filterArticles(allArticles, user);
        
        return filteredArticles.stream()
                .map(a -> new ArticleResponse(
                        a.getId(),
                        a.getTitle(),
                        a.getContent(),
                        a.getPublisher().getUsername(),
                        a.getCategory(),
                        a.getPublisher().getId()
                ))
                .collect(Collectors.toList());
    }
    
    /**
     * Get feed articles based on user interests using the default filter strategy
     */
    public List<ArticleResponse> getFeedArticles(User user) {
        return getFilteredPosts(user, defaultFilterStrategy);
    }
    
    /**
     * Legacy method for backwards compatibility
     */
    public List<ArticleResponse> getAllPosts(User user) {
        return getUserPosts(user);
    }

    public ArticleResponse updatePost(User user, Long postId, ArticleRequest request) {
        Optional<NewArticle> opt = articleRepository.findById(postId);
        if (opt.isEmpty()) return null;

        NewArticle article = opt.get();

        if (!article.getPublisher().getId().equals(user.getId())) {
            return null;
        }

        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        article.setCategory(request.getCategory());
        articleRepository.save(article);

        return new ArticleResponse(
                article.getId(),
                article.getTitle(),
                article.getContent(),
                article.getPublisher().getUsername(),
                article.getCategory(),
                article.getPublisher().getId()
        );
    }

    public boolean deletePost(User user, Long postId) {
        Optional<NewArticle> opt = articleRepository.findById(postId);
        if (opt.isEmpty()) return false;

        NewArticle article = opt.get();

        if (!article.getPublisher().getId().equals(user.getId())) {
            return false;
        }

        articleRepository.delete(article);
        return true;
    }

    public ArticleResponse getArticleById(Long postId) {
        Optional<NewArticle> opt = articleRepository.findById(postId);
        if (opt.isEmpty()) return null;
        
        NewArticle article = opt.get();
        return new ArticleResponse(
            article.getId(),
            article.getTitle(),
            article.getContent(),
            article.getPublisher().getUsername(),
            article.getCategory(),
            article.getPublisher().getId()
        );
    }
}
