package com.emotion.controller;

import com.emotion.dto.ApiResponse;
import com.emotion.dto.GuestbookRequest;
import com.emotion.entity.GuestbookMessage;
import com.emotion.service.GuestbookService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 留言板控制器 - 提供留言提交与管理接口
 */
@RestController
@RequestMapping("/api/guestbook")
@RequiredArgsConstructor
public class GuestbookController {

    private final GuestbookService guestbookService;

    /**
     * 获取已审核的留言（公开，分页）
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<GuestbookMessage>>> getApprovedMessages(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(guestbookService.getApprovedMessages(page, size)));
    }

    /**
     * 提交留言（公开，无需登录，需审核后显示）
     */
    @PostMapping
    public ResponseEntity<ApiResponse<GuestbookMessage>> submitMessage(
            @Valid @RequestBody GuestbookRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = httpRequest.getRemoteAddr();
        GuestbookMessage message = guestbookService.submitMessage(request, ipAddress);
        return ResponseEntity.ok(ApiResponse.success("Message submitted for review", message));
    }

    /**
     * 获取所有留言（管理员，包含未审核）
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<GuestbookMessage>>> getAllMessages(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(guestbookService.getAllMessages(page, size)));
    }

    /**
     * 审核通过留言（管理员）
     */
    @PutMapping("/admin/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> approveMessage(@PathVariable Long id) {
        guestbookService.approveMessage(id);
        return ResponseEntity.ok(ApiResponse.success("Message approved", null));
    }

    /**
     * 删除留言（管理员）
     */
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(@PathVariable Long id) {
        guestbookService.deleteMessage(id);
        return ResponseEntity.ok(ApiResponse.success("Message deleted", null));
    }
}
