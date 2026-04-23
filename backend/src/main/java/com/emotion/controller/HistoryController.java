package com.emotion.controller;

import com.emotion.dto.ApiResponse;
import com.emotion.entity.EmotionHistory;
import com.emotion.entity.User;
import com.emotion.service.EmotionHistoryService;
import com.emotion.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HistoryController {
    
    private final EmotionHistoryService historyService;
    private final UserService userService;
    
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<Page<EmotionHistory>>> getMyHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<EmotionHistory> history = historyService.getUserHistory(username, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(history));
    }
    
    @GetMapping("/my/filter")
    public ResponseEntity<ApiResponse<Page<EmotionHistory>>> getMyHistoryByEmotion(
            @RequestParam(required = false) String emotion,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<EmotionHistory> history;
        
        if (emotion != null && !emotion.isEmpty()) {
            history = historyService.getUserHistoryByEmotion(username, emotion, pageable);
        } else {
            history = historyService.getUserHistory(username, pageable);
        }
        
        return ResponseEntity.ok(ApiResponse.success(history));
    }
    
    @GetMapping("/my/date-range")
    public ResponseEntity<ApiResponse<List<EmotionHistory>>> getMyHistoryByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        
        LocalDateTime start = LocalDateTime.parse(startDate);
        LocalDateTime end = LocalDateTime.parse(endDate);
        
        List<EmotionHistory> history = historyService.getUserHistoryByDateRange(
            username, start, end
        );
        
        return ResponseEntity.ok(ApiResponse.success(history));
    }
    
    @GetMapping("/my/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyStatistics() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Map<String, Object> statistics = historyService.getUserStatistics(username);
        return ResponseEntity.ok(ApiResponse.success(statistics));
    }
    
    @DeleteMapping("/my/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMyHistory(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        historyService.deleteHistory(username, id);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }
}
