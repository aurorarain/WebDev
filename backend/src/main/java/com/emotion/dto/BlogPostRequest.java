package com.emotion.dto;

import com.emotion.entity.BlogPost.BlogStatus;
import lombok.Data;

/**
 * 博客文章请求 DTO
 */
@Data
public class BlogPostRequest {
    private String title;
    private String slug;
    private String content;
    private String excerpt;
    private String coverImageUrl;
    private String tags;
    private String category;
    private BlogStatus status = BlogStatus.DRAFT;
}
