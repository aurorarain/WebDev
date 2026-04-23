package com.emotion.repository;

import com.emotion.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 项目数据访问层
 */
@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findAllByOrderBySortOrderAsc();
    Optional<Project> findBySlug(String slug);
    List<Project> findByFeaturedTrueOrderBySortOrderAsc();
}
