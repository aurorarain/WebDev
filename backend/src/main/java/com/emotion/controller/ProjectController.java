package com.emotion.controller;

import com.emotion.dto.ApiResponse;
import com.emotion.dto.ProjectRequest;
import com.emotion.entity.Project;
import com.emotion.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 项目控制器 - 提供项目展廊的 CRUD 接口
 */
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    /**
     * 获取所有项目（公开）
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Project>>> getAllProjects() {
        return ResponseEntity.ok(ApiResponse.success(projectService.getAllProjects()));
    }

    /**
     * 获取单个项目（公开）
     */
    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<Project>> getProject(@PathVariable String slug) {
        return projectService.getBySlug(slug)
                .map(project -> ResponseEntity.ok(ApiResponse.success(project)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 获取项目 README（公开） — 优先用 longDescription，否则从 GitHub 拉取
     */
    @GetMapping("/{slug}/readme")
    public ResponseEntity<ApiResponse<String>> getProjectReadme(@PathVariable String slug) {
        return projectService.getBySlug(slug)
                .map(project -> {
                    String content = projectService.getReadmeContent(project);
                    return ResponseEntity.ok(ApiResponse.success(content));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 创建项目（管理员）
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Project>> createProject(@RequestBody ProjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Project created", projectService.createProject(request)));
    }

    /**
     * 更新项目（管理员）
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Project>> updateProject(@PathVariable Long id, @RequestBody ProjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Project updated", projectService.updateProject(id, request)));
    }

    /**
     * 删除项目（管理员）
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok(ApiResponse.success("Project deleted", null));
    }
}
