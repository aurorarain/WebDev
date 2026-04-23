package com.emotion.service;

import com.emotion.dto.response.PredictResponse;
import com.emotion.entity.EmotionHistory;
import com.emotion.entity.User;
import com.emotion.repository.EmotionHistoryRepository;
import com.emotion.security.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmotionHistoryService {
    
    private final EmotionHistoryRepository historyRepository;
    private final CustomUserDetailsService userDetailsService;
    
    @Transactional
    public EmotionHistory saveHistory(String username, String imagePath, 
                                      PredictResponse predictResponse) {
        User user = userDetailsService.getUserEntity(username);
        
        EmotionHistory history = new EmotionHistory();
        history.setUser(user);
        history.setImagePath(imagePath);
        
        // 安全地获取第一个face
        if (predictResponse.getFaces() != null && predictResponse.getFaces().length > 0) {
            PredictResponse.FaceResult face = predictResponse.getFaces()[0];
            history.setEmotion(face.getEmotion());
            history.setConfidence(BigDecimal.valueOf(face.getConfidence()));
            history.setFaceCount(predictResponse.getFaces().length);
        } else {
            // 默认值
            history.setEmotion("未知");
            history.setConfidence(BigDecimal.ZERO);
            history.setFaceCount(0);
        }
        
        return historyRepository.save(history);
    }
    
    public Page<EmotionHistory> getUserHistory(String username, Pageable pageable) {
        User user = userDetailsService.getUserEntity(username);
        return historyRepository.findByUserOrderByCreatedAtDesc(user, pageable);
    }
    
    public Page<EmotionHistory> getUserHistoryByEmotion(String username, String emotion, 
                                                           Pageable pageable) {
        User user = userDetailsService.getUserEntity(username);
        return historyRepository.findByUserAndEmotion(user, emotion, pageable);
    }
    
    public List<EmotionHistory> getUserHistoryByDateRange(String username, 
                                                             LocalDateTime startDate, 
                                                             LocalDateTime endDate) {
        User user = userDetailsService.getUserEntity(username);
        return historyRepository.findByUserAndCreatedAtBetweenOrderByCreatedAtDesc(
            user, startDate, endDate
        );
    }
    
    @Transactional
    public void deleteHistory(String username, Long historyId) {
        EmotionHistory history = historyRepository.findById(historyId)
                .orElseThrow(() -> new RuntimeException("历史记录不存在"));

        // 只能删除自己的记录
        if (!history.getUser().getUsername().equals(username)) {
            throw new RuntimeException("无权删除其他用户的记录");
        }

        historyRepository.delete(history);
    }

    public Map<String, Object> getUserStatistics(String username) {
        User user = userDetailsService.getUserEntity(username);

        long totalCount = historyRepository.countByUser(user);
        List<Object[]> emotionCounts = historyRepository.countEmotionsByUser(user);

        return Map.of(
            "totalCount", totalCount,
            "emotionDistribution", emotionCounts
        );
    }
}
