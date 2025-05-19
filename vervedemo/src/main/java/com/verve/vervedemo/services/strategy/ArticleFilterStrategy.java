package com.verve.vervedemo.services.strategy;

import java.util.List;

import com.verve.vervedemo.model.entity.NewArticle;
import com.verve.vervedemo.model.entity.User;

/**
 * Strategy pattern interface for filtering articles based on different criteria
 */
public interface ArticleFilterStrategy {
    List<NewArticle> filterArticles(List<NewArticle> allArticles, User user);
} 