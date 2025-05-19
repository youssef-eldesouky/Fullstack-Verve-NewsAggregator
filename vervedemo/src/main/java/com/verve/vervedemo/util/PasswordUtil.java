package com.verve.vervedemo.util;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Password utility for hashing and verification
 */
public class PasswordUtil {
    private static final int SALT_LENGTH = 16;
    private static final String ALGORITHM = "SHA-256";
    private static final String SEPARATOR = ":";

    /**
     * Hash a password with a random salt
     * @param password The plain text password
     * @return Hashed password with salt in format "salt:hash"
     */
    public static String hashPassword(String password) {
        try {
            // Generate a random salt
            SecureRandom random = new SecureRandom();
            byte[] salt = new byte[SALT_LENGTH];
            random.nextBytes(salt);
            
            // Hash the password with the salt
            String hash = hashWithSalt(password, salt);
            
            // Encode salt to base64 for storage
            String saltStr = Base64.getEncoder().encodeToString(salt);
            
            // Return "salt:hash"
            return saltStr + SEPARATOR + hash;
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error hashing password", e);
        }
    }
    
    /**
     * Verify a password against a stored hash
     * @param password The plain text password to verify
     * @param storedHash The stored password hash (with salt)
     * @return true if password matches
     */
    public static boolean verifyPassword(String password, String storedHash) {
        try {
            // Split stored hash into salt and hash components
            String[] parts = storedHash.split(SEPARATOR);
            if (parts.length != 2) {
                return false;
            }
            
            // Decode stored salt
            byte[] salt = Base64.getDecoder().decode(parts[0]);
            
            // Hash the provided password with the stored salt
            String calculatedHash = hashWithSalt(password, salt);
            
            // Compare the calculated hash with the stored hash
            return calculatedHash.equals(parts[1]);
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Internal method to hash a password with a given salt
     */
    private static String hashWithSalt(String password, byte[] salt) throws NoSuchAlgorithmException {
        // Create digest
        MessageDigest md = MessageDigest.getInstance(ALGORITHM);
        
        // Add salt
        md.update(salt);
        
        // Add password bytes
        md.update(password.getBytes());
        
        // Get the hash
        byte[] hashedPassword = md.digest();
        
        // Convert to hex string
        return bytesToHex(hashedPassword);
    }
    
    /**
     * Convert bytes to hexadecimal string
     */
    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
} 