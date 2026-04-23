package com.emotion.controller;

import com.emotion.dto.ApiResponse;
import com.emotion.dto.ProfileUpdateRequest;
import com.emotion.entity.User;
import com.emotion.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * 用户控制器 — 管理员资料与密码管理
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<User>> getProfile() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.getCurrentUser(username);
        user.setPassword(null); // 不返回密码
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /**
     * 更新管理员资料 — 支持 email、bio、avatarUrl
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<User>> updateProfile(@RequestBody ProfileUpdateRequest request) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userService.updateProfile(username, request);
            user.setPassword(null);
            return ResponseEntity.ok(ApiResponse.success("Profile updated", user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestParam String oldPassword,
            @RequestParam String newPassword) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            userService.changePassword(username, oldPassword, newPassword);
            return ResponseEntity.ok(ApiResponse.success("Password changed", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/delete-me")
    public ResponseEntity<ApiResponse<Void>> deleteAccount() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            userService.deleteAccount(username);
            return ResponseEntity.ok(ApiResponse.success("Account deleted", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}
