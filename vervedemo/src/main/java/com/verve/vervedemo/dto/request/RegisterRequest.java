package com.verve.vervedemo.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.Set;

public class RegisterRequest {

    @NotNull(message = "Username is required")
    private String username;

    @NotNull(message = "Password is required")
    private String password;


    @NotNull(message = "Choose your interests")
    private Set<String> interests;


    @NotNull(message = "Email is required")
    private String email;

    public Set<String> getInterests() {
        return interests;
    }

    public void setInterests(Set<String> interests) {
        this.interests = interests;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
