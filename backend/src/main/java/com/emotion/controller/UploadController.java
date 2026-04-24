package com.emotion.controller;

import com.emotion.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

/**
 * 文件上传控制器 - 处理图片上传和孤立图片清理
 */
@Slf4j
@RestController
@RequestMapping("/api/upload")
public class UploadController {

    @Value("${file.upload-dir}")
    private String uploadDir;

    /** 允许上传的图片 MIME 类型 */
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    /** 单文件最大 5MB */
    private static final long MAX_SIZE = 5 * 1024 * 1024;

    /**
     * 上传图片文件
     * 按 yyyy-MM-dd 日期分目录存储，返回可访问的 URL 路径
     */
    @PostMapping("/image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("File is empty"));
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Only jpg/png/gif/webp images allowed"));
        }
        if (file.getSize() > MAX_SIZE) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Image must be under 5MB"));
        }

        try {
            String dateDir = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            String ext = file.getOriginalFilename() != null
                    ? file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf('.'))
                    : ".jpg";
            String filename = UUID.randomUUID().toString() + ext;

            Path dirPath = Paths.get(uploadDir, "images", dateDir);
            Files.createDirectories(dirPath);

            Path filePath = dirPath.resolve(filename);
            file.transferTo(filePath.toFile());

            String url = "/uploads/images/" + dateDir + "/" + filename;
            log.info("Image uploaded: {}", url);

            return ResponseEntity.ok(ApiResponse.success(Map.of("url", url)));
        } catch (IOException e) {
            log.error("Failed to upload image", e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Upload failed"));
        }
    }

    /**
     * 清理未被任何内容引用的孤立图片
     * 接收当前内容文本，扫描其中引用的图片 URL，删除 uploads/images/ 中未被引用的文件
     */
    @PostMapping("/cleanup-images")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Integer>> cleanupOrphanedImages(
            @RequestBody Map<String, String> body) {

        String content = body.get("content");
        if (content == null) content = "";

        // 从内容中提取所有 /uploads/images/xxx 的 URL
        Set<String> referencedUrls = new HashSet<>();
        Pattern pattern = Pattern.compile("/uploads/images/[^\\s)\"']+");
        Matcher matcher = pattern.matcher(content);
        while (matcher.find()) {
            referencedUrls.add(matcher.group());
        }

        // 扫描 uploads/images/ 目录
        Path imagesDir = Paths.get(uploadDir, "images");
        if (!Files.exists(imagesDir)) {
            return ResponseEntity.ok(ApiResponse.success(0));
        }

        int deleted = 0;
        try (Stream<Path> walk = Files.walk(imagesDir)) {
            deleted = walk
                .filter(Files::isRegularFile)
                .mapToInt(path -> {
                    String url = "/uploads/images/" + imagesDir.relativize(path).toString().replace('\\', '/');
                    if (!referencedUrls.contains(url)) {
                        try {
                            Files.delete(path);
                            log.info("Deleted orphaned image: {}", url);
                            return 1;
                        } catch (IOException e) {
                            log.warn("Failed to delete: {}", url);
                            return 0;
                        }
                    }
                    return 0;
                })
                .sum();
        } catch (IOException e) {
            log.error("Failed to scan images directory", e);
        }

        log.info("Cleanup complete: deleted {} orphaned images", deleted);
        return ResponseEntity.ok(ApiResponse.success(deleted));
    }
}
