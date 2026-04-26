package com.emotion.service;

import com.emotion.dto.BlogPostRequest;
import com.emotion.entity.BlogPost;
import com.emotion.entity.BlogPost.BlogStatus;
import com.emotion.entity.User;
import com.emotion.repository.BlogPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * 博客文章服务
 */
@Service
@RequiredArgsConstructor
public class BlogPostService {

    private final BlogPostRepository blogPostRepository;

    @Cacheable(value = "blogPosts", key = "'published-' + #page + '-' + #size")
    public Page<BlogPost> getPublishedPosts(int page, int size) {
        return blogPostRepository.findByStatusOrderByPublishedAtDesc(
                BlogStatus.PUBLISHED,
                PageRequest.of(page, size)
        );
    }

    @Cacheable(value = "blogPosts", key = "'slug-' + #slug")
    public Optional<BlogPost> getPublishedBySlug(String slug) {
        return blogPostRepository.findBySlugAndStatus(slug, BlogStatus.PUBLISHED);
    }

    /**
     * 获取所有文章（管理员用，分页）
     */
    public Page<BlogPost> getAllPosts(int page, int size) {
        return blogPostRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
    }

    @CacheEvict(value = "blogPosts", allEntries = true)
    @Transactional
    public BlogPost createPost(BlogPostRequest request, User author) {
        BlogPost post = new BlogPost();
        updatePostFromRequest(post, request);
        post.setAuthor(author);
        // 首次发布时设置发布时间
        if (request.getStatus() == BlogStatus.PUBLISHED && post.getPublishedAt() == null) {
            post.setPublishedAt(LocalDateTime.now());
        }
        return blogPostRepository.save(post);
    }

    @CacheEvict(value = "blogPosts", allEntries = true)
    @Transactional
    public BlogPost updatePost(Long id, BlogPostRequest request) {
        BlogPost post = blogPostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        boolean wasDraft = post.getStatus() == BlogStatus.DRAFT;
        updatePostFromRequest(post, request);
        // 首次发布时设置发布时间
        if (wasDraft && request.getStatus() == BlogStatus.PUBLISHED && post.getPublishedAt() == null) {
            post.setPublishedAt(LocalDateTime.now());
        }
        return blogPostRepository.save(post);
    }

    @CacheEvict(value = "blogPosts", allEntries = true)
    @Transactional
    public void deletePost(Long id) {
        blogPostRepository.deleteById(id);
    }

    /**
     * 从请求 DTO 更新文章实体字段
     */
    private void updatePostFromRequest(BlogPost post, BlogPostRequest request) {
        post.setTitle(request.getTitle());
        post.setSlug(request.getSlug());
        post.setContent(request.getContent());
        post.setExcerpt(request.getExcerpt());
        post.setCoverImageUrl(request.getCoverImageUrl());
        post.setTags(request.getTags());
        post.setCategory(request.getCategory());
        post.setStatus(request.getStatus());
    }
}
