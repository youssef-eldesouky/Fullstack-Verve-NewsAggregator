package com.verve.vervedemo.repo;

import com.verve.vervedemo.model.entity.Comments;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comments,Long> {
}
