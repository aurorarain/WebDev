package com.emotion.controller;

import com.emotion.dto.ApiResponse;
import com.emotion.entity.User;
import com.emotion.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 站点配置控制器 - 提供站点信息的公开接口
 */
@RestController
@RequestMapping("/api/site")
@RequiredArgsConstructor
public class SiteController {

    @Value("classpath:site-config.yml")
    private Resource siteConfigResource;

    private final UserRepository userRepository;

    /**
     * 获取站点配置（公开）— 从 YAML 文件读取
     */
    @GetMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSiteConfig() {
        try {
            ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
            Map<String, Object> config = mapper.readValue(siteConfigResource.getInputStream(), Map.class);
            return ResponseEntity.ok(ApiResponse.success(config));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.success(Map.of()));
        }
    }

    /**
     * 获取关于页面数据（公开）— 合并 YAML 静态配置和数据库管理员资料
     * 数据库中的 bio、avatarUrl、email 会覆盖 YAML 中的静态值
     */
    @GetMapping("/about")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAboutData() {
        try {
            ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
            Map<String, Object> config = mapper.readValue(siteConfigResource.getInputStream(), Map.class);

            /* 从 YAML 中提取 about 节点 */
            Map<String, Object> site = (Map<String, Object>) config.getOrDefault("site", new LinkedHashMap<>());
            Map<String, Object> about = new LinkedHashMap<>((Map<String, Object>) site.getOrDefault("about", new LinkedHashMap<>()));

            /* 从数据库读取管理员用户信息，合并到 about 数据中 */
            userRepository.findByUsername("admin").ifPresent(admin -> {
                if (admin.getBio() != null && !admin.getBio().isBlank()) {
                    about.put("bio", admin.getBio());
                }
                if (admin.getAvatarUrl() != null && !admin.getAvatarUrl().isBlank()) {
                    about.put("avatar", admin.getAvatarUrl());
                }
                if (admin.getEmail() != null && !admin.getEmail().isBlank()) {
                    about.put("email", admin.getEmail());
                }
            });

            return ResponseEntity.ok(ApiResponse.success(about));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.success(Map.of()));
        }
    }
}
