package com.verve.vervedemo.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.verve.vervedemo.model.entity.User;

public interface UserRepository extends JpaRepository<User,Long> {
    /**
     * Find user by email
     */
    Optional<User> findByEmail(String userEmail);

    /**
     * Find user by username
     */
    Optional<User> findByUsername(String username);
}
