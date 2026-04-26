package com.emotion.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "emotion_history", indexes = {
    @Index(name = "idx_user_created", columnList = "user_id,created_at"),
    @Index(name = "idx_emotion", columnList = "emotion")
})
@Data
@EntityListeners(AuditingEntityListener.class)
public class EmotionHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(length = 255)
    private String imagePath;
    
    @Column(nullable = false, length = 20)
    private String emotion;
    
    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal confidence;
    
    @Column
    private Integer faceCount = 1;
    
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
