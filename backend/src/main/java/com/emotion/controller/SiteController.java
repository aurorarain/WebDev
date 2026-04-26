package com.emotion.controller;

import com.emotion.dto.ApiResponse;
import com.emotion.entity.User;
import com.emotion.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/site")
@RequiredArgsConstructor
public class SiteController {

    @Value("classpath:site-config.yml")
    private Resource siteConfigResource;

    private final UserRepository userRepository;

    private Map<String, Object> cachedConfig;

    @PostConstruct
    @SuppressWarnings("unchecked")
    public void init() throws Exception {
        ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
        cachedConfig = mapper.readValue(siteConfigResource.getInputStream(), Map.class);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSiteConfig() {
        return ResponseEntity.ok(ApiResponse.success(cachedConfig));
    }

    @GetMapping("/about")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAboutData() {
        Map<String, Object> site = (Map<String, Object>) cachedConfig.getOrDefault("site", new LinkedHashMap<>());
        Map<String, Object> about = new LinkedHashMap<>((Map<String, Object>) site.getOrDefault("about", new LinkedHashMap<>()));

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
    }
}
