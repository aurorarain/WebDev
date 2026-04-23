package com.emotion.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 留言板消息实体
 */
@Entity
@Table(name = "guestbook_messages")
@Data
@EntityListeners(AuditingEntityListener.class)
public class GuestbookMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 200)
    private String email;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(length = 45)
    private String ipAddress;

    @Column(nullable = false)
    private Boolean approved = false;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
