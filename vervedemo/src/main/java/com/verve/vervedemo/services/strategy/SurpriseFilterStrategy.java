package com.verve.vervedemo.services.strategy;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.verve.vervedemo.model.entity.InterestCategory;
import com.verve.vervedemo.model.entity.NewArticle;
import com.verve.vervedemo.model.entity.User;

/**
 * Filtering strategy that returns articles NOT matching user's interests (surprise content)
 */
public class SurpriseFilterStrategy implements ArticleFilterStrategy {
    @Override
    public List<NewArticle> filterArticles(List<NewArticle> allArticles, User user) {
        if (user == null || user.getInterests() == null) {
            return List.of(); // Return empty list if user or interests are not available
        }
        
        // Get user interests as a set of names for efficient lookup
        Set<String> userInterests = user.getInterests().stream()
                .map(InterestCategory::getName)
                .collect(Collectors.toSet());
        
        // Filter articles where category does NOT match any user interest
        return allArticles.stream()
                .filter(article -> article.getCategory() == null || !userInterests.contains(article.getCategory()))
                .collect(Collectors.toList());
    }
} 