package com.verve.vervedemo.dto.response;

import java.util.Set;

public class RegisterResponse {

        private String message;
        private String username;
        private Set<String> interests;

        public RegisterResponse(String message, String username, Set<String> interests) {
            this.message = message;
            this.username = username;
            this.interests = interests;
        }

        public String getMessage() {
            return message;
        }

        public String getUsername() {
            return username;
        }

        public Set<String> getInterests() {
            return interests;
        }
}
