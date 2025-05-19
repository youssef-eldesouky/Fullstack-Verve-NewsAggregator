package com.verve.vervedemo.services.strategy;

import java.util.List;

import com.verve.vervedemo.model.entity.NewArticle;
import com.verve.vervedemo.model.entity.User;

/**
 * Filtering strategy that returns all articles without any filtering
 */
public class AllArticlesFilterStrategy implements ArticleFilterStrategy {
    @Override
    public List<NewArticle> filterArticles(List<NewArticle> allArticles, User user) {
        return allArticles; // Return all articles without filtering
    }
} 