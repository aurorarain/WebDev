package com.emotion.controller;

import com.emotion.dto.ApiResponse;
import com.emotion.dto.BlogPostRequest;
import com.emotion.entity.BlogPost;
import com.emotion.entity.User;
import com.emotion.service.BlogPostService;
import com.emotion.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * 博客控制器 - 提供博客文章的 CRUD 接口
 */
@RestController
@RequestMapping("/api/blog")
@RequiredArgsConstructor
public class BlogController {

    private final BlogPostService blogPostService;
    private final UserService userService;

    /**
     * 获取已发布的博客列表（公开，分页）
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<BlogPost>>> getPublishedPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(blogPostService.getPublishedPosts(page, size)));
    }

    /**
     * 获取单篇已发布博客（公开）
     */
    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<BlogPost>> getPublishedPost(@PathVariable String slug) {
        return blogPostService.getPublishedBySlug(slug)
                .map(post -> ResponseEntity.ok(ApiResponse.success(post)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 获取所有博客（管理员，包含草稿）
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<BlogPost>>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(blogPostService.getAllPosts(page, size)));
    }

    /**
     * 创建博客（管理员）
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BlogPost>> createPost(@RequestBody BlogPostRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User author = userService.getCurrentUser(username);
        return ResponseEntity.ok(ApiResponse.success("Post created", blogPostService.createPost(request, author)));
    }

    /**
     * 更新博客（管理员）
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BlogPost>> updatePost(@PathVariable Long id, @RequestBody BlogPostRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Post updated", blogPostService.updatePost(id, request)));
    }

    /**
     * 删除博客（管理员）
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable Long id) {
        blogPostService.deletePost(id);
        return ResponseEntity.ok(ApiResponse.success("Post deleted", null));
    }
}
