package com.verve.vervedemo.services.strategy;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.verve.vervedemo.model.entity.InterestCategory;
import com.verve.vervedemo.model.entity.NewArticle;
import com.verve.vervedemo.model.entity.User;

/**
 * Filtering strategy that returns articles matching user's interests
 */
public class InterestBasedFilterStrategy implements ArticleFilterStrategy {
    @Override
    public List<NewArticle> filterArticles(List<NewArticle> allArticles, User user) {
        if (user == null || user.getInterests() == null || user.getInterests().isEmpty()) {
            return List.of(); // Return empty list if user or interests are not available
        }
        
        // Get user interests as a set of names for efficient lookup
        Set<String> userInterests = user.getInterests().stream()
                .map(InterestCategory::getName)
                .collect(Collectors.toSet());
        
        // Filter articles where category matches any user interest
        return allArticles.stream()
                .filter(article -> article.getCategory() != null && userInterests.contains(article.getCategory()))
                .collect(Collectors.toList());
    }
} 