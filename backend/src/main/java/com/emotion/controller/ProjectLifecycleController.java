package com.emotion.controller;

import com.emotion.dto.ApiResponse;
import com.emotion.entity.Project;
import com.emotion.model.ProcessStatus;
import com.emotion.service.ProjectBuildService;
import com.emotion.service.ProjectProcessManager;
import com.emotion.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 项目生命周期控制器 - 管理嵌入式项目的启动、停止、状态查询和构建
 */
@RestController
@RequestMapping("/api/projects/{id}")
@RequiredArgsConstructor
public class ProjectLifecycleController {

    private final ProjectProcessManager processManager;
    private final ProjectBuildService buildService;
    private final ProjectService projectService;

    /**
     * 启动嵌入式项目
     */
    @PostMapping("/start")
    public ResponseEntity<ApiResponse<ProcessStatus>> startProject(@PathVariable Long id) {
        return projectService.getById(id)
                .map(project -> {
                    if (!Boolean.TRUE.equals(project.getEmbeddedEnabled())) {
                        return ResponseEntity.ok(ApiResponse.success(
                                "Not an embedded project",
                                ProcessStatus.error("Embedded deployment not enabled")));
                    }
                    ProcessStatus status = processManager.startProject(id, project);
                    return ResponseEntity.ok(ApiResponse.success(status));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 停止嵌入式项目
     */
    @PostMapping("/stop")
    public ResponseEntity<ApiResponse<ProcessStatus>> stopProject(@PathVariable Long id) {
        ProcessStatus status = processManager.stopProject(id);
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    /**
     * 获取嵌入式项目运行状态
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<ProcessStatus>> getStatus(@PathVariable Long id) {
        ProcessStatus status = processManager.getStatus(id);
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    /**
     * 加入项目预览 - 多用户并发支持
     */
    @PostMapping("/join")
    public ResponseEntity<ApiResponse<ProcessStatus>> joinProject(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String viewerId = body.get("viewerId");
        if (viewerId == null || viewerId.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("viewerId is required"));
        }
        return projectService.getById(id)
                .map(project -> {
                    if (!Boolean.TRUE.equals(project.getEmbeddedEnabled())) {
                        return ResponseEntity.ok(ApiResponse.success("Not an embedded project", ProcessStatus.error("Embedded deployment not enabled")));
                    }
                    ProcessStatus status = processManager.joinProject(id, project, viewerId);
                    return ResponseEntity.ok(ApiResponse.success(status));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 离开项目预览
     */
    @PostMapping("/leave")
    public ResponseEntity<ApiResponse<ProcessStatus>> leaveProject(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String viewerId = body.get("viewerId");
        if (viewerId == null || viewerId.isBlank()) {
            return ResponseEntity.ok(ApiResponse.success(ProcessStatus.stopped()));
        }
        ProcessStatus status = processManager.leaveProject(id, viewerId);
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    /**
     * 从 GitHub 克隆并构建项目（仅管理员）
     */
    @PostMapping("/clone")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProjectBuildService.BuildResult>> cloneProject(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String githubUrl = body.get("githubUrl");
        if (githubUrl == null || githubUrl.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("GitHub URL is required"));
        }
        String branch = body.getOrDefault("branch", "");

        return projectService.getById(id)
                .map(project -> {
                    String slug = project.getSlug();
                    ProjectBuildService.BuildResult result = buildService.cloneAndBuild(githubUrl, slug, branch);
                    return ResponseEntity.ok(ApiResponse.success(result));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
