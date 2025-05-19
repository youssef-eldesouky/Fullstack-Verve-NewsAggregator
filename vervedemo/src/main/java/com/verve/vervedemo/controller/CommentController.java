package com.verve.vervedemo.controller;


import com.verve.vervedemo.dto.request.CommentRequest;
import com.verve.vervedemo.dto.response.CommentResponse;
import com.verve.vervedemo.dto.update.CommentUpdate;
import com.verve.vervedemo.model.entity.User;
import com.verve.vervedemo.repo.CommentRepository;
import com.verve.vervedemo.repo.UserRepository;
import com.verve.vervedemo.services.CommentService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentService commentService;
    private final UserRepository userRepository;

    public CommentController(CommentService commentService, UserRepository userRepository) {
        this.commentService = commentService;
        this.userRepository = userRepository;
    }

    private User getUserFromSession(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return null;
        return userRepository.findById(userId).orElse(null);
    }

    @PostMapping("/add")
    public ResponseEntity<?> addComment(@RequestBody CommentRequest request, HttpSession session) {
        User user = getUserFromSession(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        CommentResponse response = commentService.addComment(user, request);
        return response != null ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body("Invalid post");
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long postId) {
        return ResponseEntity.ok(commentService.getCommentsForPost(postId));
    }

    @PutMapping("/update/{commentId}")
    public ResponseEntity<?> updateComment(@PathVariable Long commentId,
                                           @RequestBody CommentUpdate request,
                                           HttpSession session) {
        User user = getUserFromSession(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        CommentResponse response = commentService.updateResponse(user, commentId, request.getContent());
        return response != null ? ResponseEntity.ok(response) : ResponseEntity.status(HttpStatus.FORBIDDEN).body("Unauthorized or comment not found");
    }

    @DeleteMapping("/delete/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId, HttpSession session) {
        User user = getUserFromSession(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        boolean deleted = commentService.deleteComment(user, commentId);
        return deleted ? ResponseEntity.ok("Deleted") : ResponseEntity.status(HttpStatus.FORBIDDEN).body("Unauthorized or comment not found");
    }
}
