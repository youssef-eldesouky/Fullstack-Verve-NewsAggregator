package com.verve.vervedemo.repo;

import com.verve.vervedemo.model.entity.InterestCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InterestCategoryRepository extends JpaRepository<InterestCategory,Long> {
    Optional<InterestCategory> findByName(String name);

}
