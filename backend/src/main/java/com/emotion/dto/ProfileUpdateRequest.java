package com.emotion.dto;

import lombok.Data;

/**
 * 管理员资料更新请求
 */
@Data
public class ProfileUpdateRequest {
    private String email;
    private String bio;
    private String avatarUrl;
}
