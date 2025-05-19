package com.verve.vervedemo.controller;


import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.verve.vervedemo.model.entity.InterestCategory;
import com.verve.vervedemo.model.entity.User;
import com.verve.vervedemo.repo.InterestCategoryRepository;
import com.verve.vervedemo.repo.UserRepository;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/interests")
public class InterestsController {

    private final InterestCategoryRepository interestCategoryRepository;
    private final UserRepository userRepository;

    public InterestsController(InterestCategoryRepository interestCategoryRepository, UserRepository userRepository) {
        this.interestCategoryRepository = interestCategoryRepository;
        this.userRepository=userRepository;
    }

    @GetMapping
    public ResponseEntity<List<String>> getAllInterests() {
        List<String> interests = interestCategoryRepository.findAll()
                .stream()
                .map(InterestCategory::getName)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(interests);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<Set<String>> getUserInterests(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Set<String> interestNames = user.getInterests()
                .stream().map(InterestCategory::getName).collect(Collectors.toSet());

        return ResponseEntity.ok(interestNames);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUserInterests(@PathVariable Long id, @RequestBody List<String> interestNames, HttpSession session) {
        // Check if user is authenticated and is updating their own interests
        Long sessionUserId = (Long) session.getAttribute("userId");
        if (sessionUserId == null || !sessionUserId.equals(id)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Find interest categories by name
        Set<InterestCategory> interests = new HashSet<>();
        for (String name : interestNames) {
            InterestCategory interest = interestCategoryRepository.findByName(name)
                    .orElseGet(() -> {
                        // Create new interest if it doesn't exist
                        InterestCategory newInterest = new InterestCategory(name);
                        return interestCategoryRepository.save(newInterest);
                    });
            interests.add(interest);
        }
        
        // Update user interests
        user.setInterests(interests);
        userRepository.save(user);
        
        return ResponseEntity.ok().build();
    }
}
