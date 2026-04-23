package com.emotion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 留言请求 DTO
 */
@Data
public class GuestbookRequest {
    @NotBlank(message = "Name is required")
    @Size(max = 100)
    private String name;

    @Size(max = 200)
    private String email;

    @NotBlank(message = "Message is required")
    @Size(max = 2000)
    private String message;
}
