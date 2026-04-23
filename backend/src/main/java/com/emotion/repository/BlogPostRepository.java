package com.emotion.repository;

import com.emotion.entity.BlogPost;
import com.emotion.entity.BlogPost.BlogStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 博客文章数据访问层
 */
@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {
    Page<BlogPost> findByStatusOrderByPublishedAtDesc(BlogStatus status, Pageable pageable);
    Optional<BlogPost> findBySlugAndStatus(String slug, BlogStatus status);
    Page<BlogPost> findByStatusAndCategoryOrderByPublishedAtDesc(BlogStatus status, String category, Pageable pageable);
}
