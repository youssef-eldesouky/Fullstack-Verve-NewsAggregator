package com.verve.vervedemo.repo;

import com.verve.vervedemo.model.entity.NewArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ArticleRepository extends JpaRepository<NewArticle,Long> {
    @Query("SELECT a FROM NewArticle a WHERE a.publisher.id = :userId")
    List<NewArticle> findByPublisherId(@Param("userId") Long userId);

}
