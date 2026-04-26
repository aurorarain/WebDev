package com.emotion.service;

import com.emotion.dto.response.PredictResponse;
import com.emotion.entity.EmotionHistory;
import com.emotion.entity.User;
import com.emotion.repository.EmotionHistoryRepository;
import com.emotion.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmotionHistoryService {

    private final EmotionHistoryRepository historyRepository;
    private final UserRepository userRepository;

    private User getUserEntity(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在: " + username));
    }

    @Async("taskExecutor")
    @Transactional
    public void saveHistory(String username, String imagePath,
                            PredictResponse predictResponse) {
        try {
            User user = getUserEntity(username);

            EmotionHistory history = new EmotionHistory();
            history.setUser(user);
            history.setImagePath(imagePath);

            if (predictResponse.getFaces() != null && predictResponse.getFaces().length > 0) {
                PredictResponse.FaceResult face = predictResponse.getFaces()[0];
                history.setEmotion(face.getEmotion());
                history.setConfidence(BigDecimal.valueOf(face.getConfidence()));
                history.setFaceCount(predictResponse.getFaces().length);
            } else {
                history.setEmotion("未知");
                history.setConfidence(BigDecimal.ZERO);
                history.setFaceCount(0);
            }

            historyRepository.save(history);
        } catch (Exception e) {
            log.warn("异步保存历史记录失败: {}", e.getMessage());
        }
    }

    public Page<EmotionHistory> getUserHistory(String username, Pageable pageable) {
        return historyRepository.findByUsername(username, pageable);
    }

    public Page<EmotionHistory> getUserHistoryByEmotion(String username, String emotion,
                                                           Pageable pageable) {
        return historyRepository.findByUsernameAndEmotion(username, emotion, pageable);
    }

    public List<EmotionHistory> getUserHistoryByDateRange(String username,
                                                             LocalDateTime startDate,
                                                             LocalDateTime endDate) {
        return historyRepository.findByUsernameAndDateRange(username, startDate, endDate);
    }

    @Transactional
    public void deleteHistory(String username, Long historyId) {
        EmotionHistory history = historyRepository.findById(historyId)
                .orElseThrow(() -> new RuntimeException("历史记录不存在"));

        if (!history.getUser().getUsername().equals(username)) {
            throw new RuntimeException("无权删除其他用户的记录");
        }

        historyRepository.delete(history);
    }

    public Map<String, Object> getUserStatistics(String username) {
        long totalCount = historyRepository.countByUsername(username);
        List<Object[]> emotionCounts = historyRepository.countEmotionsByUsername(username);

        return Map.of(
            "totalCount", totalCount,
            "emotionDistribution", emotionCounts
        );
    }
}
