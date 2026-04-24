package com.emotion.dto;

import lombok.Data;

/**
 * 项目请求 DTO
 */
@Data
public class ProjectRequest {
    private String title;
    private String slug;
    private String description;
    private String longDescription;
    private String thumbnailUrl;
    private String demoUrl;
    private String repoUrl;
    private String tags;
    private String category;
    private Boolean featured = false;
    private Integer sortOrder = 0;

    // 嵌入式部署相关字段
    private Boolean embeddedEnabled = false;
    private String githubRepoUrl;
    private String projectPath;
    private Integer backendPort;
    private String backendStartCmd;
    private String healthCheckUrl;
    private String frontendBuildDir;
}
