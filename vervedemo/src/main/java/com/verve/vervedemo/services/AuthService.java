package com.verve.vervedemo.services;

import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.verve.vervedemo.dto.request.LoginRequest;
import com.verve.vervedemo.dto.request.RegisterRequest;
import com.verve.vervedemo.dto.response.LoginResponse;
import com.verve.vervedemo.dto.response.RegisterResponse;
import com.verve.vervedemo.model.entity.InterestCategory;
import com.verve.vervedemo.model.entity.User;
import com.verve.vervedemo.repo.InterestCategoryRepository;
import com.verve.vervedemo.repo.UserRepository;
import com.verve.vervedemo.util.PasswordUtil;

@Service
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,6}$", Pattern.CASE_INSENSITIVE);
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]{3,20}$");
    private static final int MIN_PASSWORD_LENGTH = 6;

    private final UserRepository userRepository;
    private final InterestCategoryRepository interestCategoryRepository;

    public AuthService(UserRepository userRepository, InterestCategoryRepository interestCategoryRepository) {
        this.userRepository = userRepository;
        this.interestCategoryRepository = interestCategoryRepository;
    }

    public RegisterResponse register(RegisterRequest request) {
        logger.info("Processing registration request for email: {}, username: {}", request.getEmail(), request.getUsername());
        
        // Validate input
        validateRegistrationInput(request);
        
        // Check if email is already registered
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            logger.warn("Registration failed: Email already registered: {}", request.getEmail());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        
        // Check if username is already taken
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            logger.warn("Registration failed: Username already exists: {}", request.getUsername());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }
        
        // Create new user
        User user = new User();
        user.setEmail(request.getEmail());
        // Hash password before storing
        user.setPassword(PasswordUtil.hashPassword(request.getPassword()));
        user.setUsername(request.getUsername());

        // Process interests
        if (request.getInterests() == null || request.getInterests().isEmpty()) {
            logger.warn("Registration failed: No interests selected for user: {}", request.getUsername());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please select at least one interest");
        }

        try {
            Set<InterestCategory> selected = request.getInterests().stream()
                    .map(name -> interestCategoryRepository.findByName(name)
                            .orElseThrow(() -> {
                                logger.error("Interest not found: {}", name);
                                return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid interest: " + name);
                            }))
                    .collect(Collectors.toSet());

            user.setInterests(selected);
            userRepository.save(user);

            Set<String> interestsNames = selected.stream()
                    .map(InterestCategory::getName)
                    .collect(Collectors.toSet());

            logger.info("Registration successful for user: {}", user.getUsername());
            return new RegisterResponse("User registered successfully", user.getUsername(), interestsNames);
        } catch (Exception e) {
            logger.error("Error during user registration", e);
            if (e instanceof ResponseStatusException) {
                throw e;
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error processing registration");
        }
    }

    private void validateRegistrationInput(RegisterRequest request) {
        // Check for null or empty fields
        if (!StringUtils.hasText(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        
        if (!StringUtils.hasText(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
        }
        
        if (!StringUtils.hasText(request.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
        }
        
        // Validate email format
        if (!EMAIL_PATTERN.matcher(request.getEmail()).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email format");
        }
        
        // Validate username format
        if (!USERNAME_PATTERN.matcher(request.getUsername()).matches()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, 
                "Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens"
            );
        }
        
        // Validate password strength
        if (request.getPassword().length() < MIN_PASSWORD_LENGTH) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, 
                "Password must be at least " + MIN_PASSWORD_LENGTH + " characters long"
            );
        }
    }

    public LoginResponse login(LoginRequest request) {
        logger.info("Processing login request for username: {}", request.getUsername());
        
        if (!StringUtils.hasText(request.getUsername()) || !StringUtils.hasText(request.getPassword())) {
            logger.warn("Login failed: Empty username or password");
            return null;
        }
        
        try {
            // First try to find user by username
            Optional<User> optionalUser = userRepository.findByUsername(request.getUsername());
            
            if (optionalUser.isEmpty()) {
                logger.warn("Login failed: User not found: {}", request.getUsername());
                return null;
            }
            
            User user = optionalUser.get();
            
            // Verify password 
            if (PasswordUtil.verifyPassword(request.getPassword(), user.getPassword())) {
                logger.info("Login successful for user: {}", user.getUsername());
                return new LoginResponse(user.getId(), user.getUsername());
            } else {
                logger.warn("Login failed: Invalid password for user: {}", request.getUsername());
                return null;
            }
        } catch (Exception e) {
            logger.error("Error during login", e);
            return null;
        }
    }
}
