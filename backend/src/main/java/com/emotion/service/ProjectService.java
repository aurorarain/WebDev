package com.emotion.service;

import com.emotion.dto.ProjectRequest;
import com.emotion.entity.Project;
import com.emotion.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 项目服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectProcessManager processManager;

    @Cacheable(value = "projects", key = "'all'")
    public List<Project> getAllProjects() {
        return projectRepository.findAllByOrderBySortOrderAsc();
    }

    @Cacheable(value = "projects", key = "#slug")
    public Optional<Project> getBySlug(String slug) {
        return projectRepository.findBySlug(slug);
    }

    /**
     * 根据 ID 获取单个项目
     */
    public Optional<Project> getById(Long id) {
        return projectRepository.findById(id);
    }

    @CacheEvict(value = "projects", allEntries = true)
    @Transactional
    public Project createProject(ProjectRequest request) {
        Project project = new Project();
        updateProjectFromRequest(project, request);
        return projectRepository.save(project);
    }

    @CacheEvict(value = "projects", allEntries = true)
    @Transactional
    public Project updateProject(Long id, ProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        updateProjectFromRequest(project, request);
        return projectRepository.save(project);
    }

    @CacheEvict(value = "projects", allEntries = true)
    @Transactional
    public void deleteProject(Long id) {
        Project project = projectRepository.findById(id).orElse(null);
        if (project != null) {
            // 1. 停止运行中的进程
            processManager.stopProject(id);
            // 2. 删除服务器上的嵌入项目文件
            if (project.getProjectPath() != null && !project.getProjectPath().isBlank()) {
                deleteProjectFiles(project.getProjectPath());
            }
        }
        // 3. 删除数据库记录
        projectRepository.deleteById(id);
    }

    private void deleteProjectFiles(String path) {
        try {
            java.io.File dir = new java.io.File(path);
            if (dir.exists()) {
                deleteDirectory(dir);
                log.info("已删除项目文件: {}", path);
            }
        } catch (Exception e) {
            log.warn("删除项目文件失败 {}: {}", path, e.getMessage());
        }
    }

    private void deleteDirectory(java.io.File dir) {
        java.io.File[] files = dir.listFiles();
        if (files != null) {
            for (java.io.File file : files) {
                if (file.isDirectory()) deleteDirectory(file);
                else file.delete();
            }
        }
        dir.delete();
    }

    /**
     * 从请求 DTO 更新项目实体字段
     */
    private void updateProjectFromRequest(Project project, ProjectRequest request) {
        project.setTitle(request.getTitle());
        project.setSlug(request.getSlug());
        project.setDescription(request.getDescription());
        project.setLongDescription(request.getLongDescription());
        project.setThumbnailUrl(request.getThumbnailUrl());
        project.setDemoUrl(request.getDemoUrl());
        project.setRepoUrl(request.getRepoUrl());
        project.setTags(request.getTags());
        project.setCategory(request.getCategory());
        project.setFeatured(request.getFeatured());
        project.setSortOrder(request.getSortOrder());

        // 嵌入式部署字段
        project.setEmbeddedEnabled(request.getEmbeddedEnabled());
        project.setGithubRepoUrl(request.getGithubRepoUrl());
        project.setProjectPath(request.getProjectPath());
        project.setBackendPort(request.getBackendPort());
        project.setBackendStartCmd(request.getBackendStartCmd());
        project.setHealthCheckUrl(request.getHealthCheckUrl());
        project.setFrontendBuildDir(request.getFrontendBuildDir());
    }

    /**
     * 获取项目 README 内容
     * 优先使用数据库 longDescription，否则从 GitHub 拉取
     */
    public String getReadmeContent(Project project) {
        if (project.getLongDescription() != null && project.getLongDescription().trim().length() > 20) {
            return normalizeNewlines(project.getLongDescription());
        }

        if (project.getRepoUrl() != null) {
            String readme = fetchGitHubReadme(project.getRepoUrl());
            if (readme != null) return readme;
        }

        return project.getDescription() != null ? project.getDescription() : "No description available.";
    }

    private String normalizeNewlines(String text) {
        return text.replace("\\n", "\n");
    }

    private String fetchGitHubReadme(String repoUrl) {
        try {
            Matcher m = Pattern.compile("github\\.com/([^/]+)/([^/?#.]+)").matcher(repoUrl);
            if (!m.find()) return null;
            String owner = m.group(1);
            String repo = m.group(2).replace(".git", "");

            String[] branches = {"main", "master"};
            String[] files = {"README.md", "Readme.md", "readme.md"};

            for (String branch : branches) {
                for (String file : files) {
                    String url = String.format("https://raw.githubusercontent.com/%s/%s/%s/%s", owner, repo, branch, file);
                    HttpURLConnection conn = (HttpURLConnection) URI.create(url).toURL().openConnection();
                    conn.setConnectTimeout(5000);
                    conn.setReadTimeout(10000);
                    conn.setRequestProperty("Accept", "text/plain; charset=utf-8");
                    if (conn.getResponseCode() == 200) {
                        try (BufferedReader reader = new BufferedReader(
                                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                            StringBuilder sb = new StringBuilder();
                            String line;
                            while ((line = reader.readLine()) != null) {
                                sb.append(line).append("\n");
                            }
                            log.info("Successfully fetched README for {}/{}", owner, repo);
                            return sb.toString();
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch README from {}: {}", repoUrl, e.getMessage());
        }
        return null;
    }
}
