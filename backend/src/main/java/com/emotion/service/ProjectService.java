package com.emotion.service;

import com.emotion.dto.ProjectRequest;
import com.emotion.entity.Project;
import com.emotion.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 项目服务
 */
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;

    /**
     * 获取所有项目（按排序字段升序）
     */
    public List<Project> getAllProjects() {
        return projectRepository.findAllByOrderBySortOrderAsc();
    }

    /**
     * 根据 slug 获取单个项目
     */
    public Optional<Project> getBySlug(String slug) {
        return projectRepository.findBySlug(slug);
    }

    /**
     * 创建项目
     */
    @Transactional
    public Project createProject(ProjectRequest request) {
        Project project = new Project();
        updateProjectFromRequest(project, request);
        return projectRepository.save(project);
    }

    /**
     * 更新项目
     */
    @Transactional
    public Project updateProject(Long id, ProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        updateProjectFromRequest(project, request);
        return projectRepository.save(project);
    }

    /**
     * 删除项目
     */
    @Transactional
    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
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
    }
}
