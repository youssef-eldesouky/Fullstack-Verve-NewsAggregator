package com.verve.vervedemo.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.verve.vervedemo.dto.request.CommentRequest;
import com.verve.vervedemo.dto.response.CommentResponse;
import com.verve.vervedemo.model.entity.Comments;
import com.verve.vervedemo.model.entity.NewArticle;
import com.verve.vervedemo.model.entity.User;
import com.verve.vervedemo.repo.ArticleRepository;
import com.verve.vervedemo.repo.CommentRepository;
import com.verve.vervedemo.repo.UserRepository;

@Service
public class CommentService {

    private static final Logger logger = LoggerFactory.getLogger(CommentService.class);

    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final NotificationService notificationService;

    public CommentService(
            ArticleRepository articleRepository,
            UserRepository userRepository,
            CommentRepository commentRepository,
            NotificationService notificationService) {
        this.articleRepository = articleRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.notificationService = notificationService;
    }

    public CommentResponse addComment(User user, CommentRequest request) {
        logger.info("Adding comment from user {} to post {}", 
            user.getUsername(), request.getPostId());
        
        NewArticle post = articleRepository.findById(request.getPostId()).orElse(null);
        if (post == null) {
            logger.error("Post not found with ID: {}", request.getPostId());
            return null;
        }

        Comments comment = new Comments();
        comment.setContent(request.getContent());
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUser(user);
        comment.setPost(post);

        comment = commentRepository.save(comment);
        logger.info("Comment saved with ID: {}", comment.getId());
        
        // Send notification to the post author
        User postAuthor = post.getPublisher();
        if (postAuthor != null) {
            logger.info("Post author found: {}", postAuthor.getUsername());
            
            if (!postAuthor.getId().equals(user.getId())) {
                logger.info("Sending notification because commenter {} is different from author {}", 
                    user.getUsername(), postAuthor.getUsername());
                
                try {
                    notificationService.notifyNewComment(user, postAuthor, post.getTitle(), post.getId());
                    logger.info("Notification sent successfully");
                } catch (Exception e) {
                    logger.error("Error sending notification", e);
                    
                    // Try the direct method as a fallback
                    try {
                        notificationService.createDirectNotification(
                            "NEW_COMMENT",
                            user.getUsername() + " commented on your article: " + post.getTitle(),
                            postAuthor.getId(),
                            post.getId()
                        );
                        logger.info("Direct notification sent as fallback");
                    } catch (Exception ex) {
                        logger.error("Error sending direct notification", ex);
                    }
                }
            } else {
                logger.info("No notification needed as commenter is the same as the author");
            }
        } else {
            logger.warn("Post author is null, cannot send notification");
        }

        return new CommentResponse(
                comment.getId(),
                comment.getContent(),
                user.getUsername(),
                post.getTitle()
        );
    }

    public List<CommentResponse> getCommentsForPost(Long postId) {
        return commentRepository.findAll().stream()
                .filter(c -> c.getPost().getId().equals(postId))
                .map(c -> new CommentResponse(
                        c.getId(),
                        c.getContent(),
                        c.getUser().getUsername(),
                        c.getPost().getTitle()))
                .collect(Collectors.toList());
    }

    public CommentResponse updateResponse(User user, Long commentId, String content) {
        Comments comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null || !comment.getUser().getId().equals(user.getId())) {
            return null;
        }

        comment.setContent(content);
        commentRepository.save(comment);

        return new CommentResponse(
                comment.getId(),
                comment.getContent(),
                comment.getUser().getUsername(),
                comment.getPost().getTitle()
        );
    }

    public boolean deleteComment(User user, Long commentId) {
        Optional<Comments> optionalComment = commentRepository.findById(commentId);
        if (optionalComment.isEmpty()) return false;

        Comments comment = optionalComment.get();
        if (!comment.getUser().getId().equals(user.getId())) return false;

        commentRepository.delete(comment);
        return true;
    }
}