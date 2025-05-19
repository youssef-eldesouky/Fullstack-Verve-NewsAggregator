package com.verve.vervedemo.controller;

import com.verve.vervedemo.dto.request.LoginRequest;
import com.verve.vervedemo.dto.request.RegisterRequest;
import com.verve.vervedemo.dto.response.ApiResponse;
import com.verve.vervedemo.dto.response.LoginResponse;
import com.verve.vervedemo.dto.response.RegisterResponse;
import com.verve.vervedemo.model.entity.User;
import com.verve.vervedemo.repo.UserRepository;
import com.verve.vervedemo.services.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(@RequestBody RegisterRequest request) {
        try {
            logger.info("Processing registration request for username: {}", request.getUsername());
            RegisterResponse response = authService.register(request);
            logger.info("Registration successful for username: {}", request.getUsername());
            return ResponseEntity.ok(new ApiResponse<>(true, "Registration successful", response));
        } catch (ResponseStatusException ex) {
            logger.warn("Registration failed for username: {}, reason: {}", request.getUsername(), ex.getReason());
            return ResponseEntity.status(ex.getStatusCode())
                    .body(new ApiResponse<>(false, ex.getReason(), null));
        } catch (Exception ex) {
            logger.error("Unexpected error during registration for username: {}", request.getUsername(), ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "An unexpected error occurred. Please try again later.", null));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest request, HttpSession session) {
        try {
            logger.info("Processing login request for username: {}", request.getUsername());
            LoginResponse loginResponse = authService.login(request);
            
            if (loginResponse != null) {
                session.setAttribute("userId", loginResponse.getId());
                session.setAttribute("username", loginResponse.getUsername());
                logger.info("Login successful for user: {}, session ID: {}", loginResponse.getUsername(), session.getId());
                
                // Set session timeout to 30 minutes
                session.setMaxInactiveInterval(1800);
                
                return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", loginResponse));
            } else {
                logger.warn("Login failed: invalid credentials for username: {}", request.getUsername());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse<>(false, "Invalid username or password", null));
            }
        } catch (Exception ex) {
            logger.error("Unexpected error during login for username: {}", request.getUsername(), ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "An unexpected error occurred. Please try again later.", null));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(HttpSession session) {
        try {
            String username = (String) session.getAttribute("username");
            logger.info("Processing logout request for user: {}, session ID: {}", username, session.getId());
            session.invalidate();
            return ResponseEntity.ok(new ApiResponse<>(true, "Logged out successfully", null));
        } catch (Exception ex) {
            logger.error("Error during logout", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error processing logout", null));
        }
    }
    
    @GetMapping("/session-check")
    public ResponseEntity<ApiResponse<User>> checkSession(HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                logger.debug("No active session found");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse<>(false, "No active session", null));
            }
            
            logger.debug("Session check for user ID: {}", userId);
            User user = userRepository.findById(userId).orElse(null);
            
            if (user == null) {
                logger.warn("Session contains invalid user ID: {}", userId);
                session.invalidate();
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse<>(false, "Invalid session", null));
            }
            
            // Don't send password in response
            user.setPassword(null);
            return ResponseEntity.ok(new ApiResponse<>(true, "Valid session", user));
        } catch (Exception ex) {
            logger.error("Error checking session", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error checking session", null));
        }
    }
    
    @GetMapping("/session-data")
    public ResponseEntity<ApiResponse<Object>> getSessionData(HttpServletRequest request) {
        try {
            HttpSession session = request.getSession(false);
            if (session == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse<>(false, "No active session", null));
            }
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Session data retrieved", 
                    Map.of(
                        "sessionId", session.getId(),
                        "creationTime", session.getCreationTime(),
                        "lastAccessedTime", session.getLastAccessedTime(),
                        "maxInactiveInterval", session.getMaxInactiveInterval(),
                        "userId", session.getAttribute("userId"),
                        "username", session.getAttribute("username")
                    ))
            );
        } catch (Exception ex) {
            logger.error("Error retrieving session data", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error retrieving session data", null));
        }
    }
}
