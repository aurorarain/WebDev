package com.emotion.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 项目实体 - 用于项目展廊
 */
@Entity
@Table(name = "projects")
@Data
@EntityListeners(AuditingEntityListener.class)
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(unique = true, nullable = false, length = 100)
    private String slug;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(columnDefinition = "TEXT")
    private String longDescription;

    @Column(length = 500)
    private String thumbnailUrl;

    @Column(length = 500)
    private String demoUrl;

    @Column(length = 500)
    private String repoUrl;

    @Column(length = 500)
    private String tags;

    @Column(length = 50)
    private String category;

    @Column(nullable = false)
    private Boolean featured = false;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
