package com.emotion.repository;

import com.emotion.entity.EmotionHistory;
import com.emotion.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EmotionHistoryRepository extends JpaRepository<EmotionHistory, Long> {

    Page<EmotionHistory> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    List<EmotionHistory> findByUserAndCreatedAtBetweenOrderByCreatedAtDesc(
        User user,
        LocalDateTime startDate,
        LocalDateTime endDate
    );

    @Query("SELECT e FROM EmotionHistory e WHERE e.user = :user AND " +
           "(:emotion IS NULL OR e.emotion = :emotion) " +
           "ORDER BY e.createdAt DESC")
    Page<EmotionHistory> findByUserAndEmotion(
        @Param("user") User user,
        @Param("emotion") String emotion,
        Pageable pageable
    );

    @Query("SELECT COUNT(e) FROM EmotionHistory e WHERE e.user = :user")
    long countByUser(@Param("user") User user);

    @Query("SELECT e.emotion, COUNT(e) as count FROM EmotionHistory e " +
           "WHERE e.user = :user GROUP BY e.emotion")
    List<Object[]> countEmotionsByUser(@Param("user") User user);

    // --- 按 username 直接查询，避免先查 User 实体 ---

    @Query("SELECT e FROM EmotionHistory e WHERE e.user.username = :username ORDER BY e.createdAt DESC")
    Page<EmotionHistory> findByUsername(@Param("username") String username, Pageable pageable);

    @Query("SELECT e FROM EmotionHistory e WHERE e.user.username = :username AND " +
           "(:emotion IS NULL OR e.emotion = :emotion) " +
           "ORDER BY e.createdAt DESC")
    Page<EmotionHistory> findByUsernameAndEmotion(
        @Param("username") String username,
        @Param("emotion") String emotion,
        Pageable pageable
    );

    @Query("SELECT e FROM EmotionHistory e WHERE e.user.username = :username " +
           "AND e.createdAt BETWEEN :startDate AND :endDate ORDER BY e.createdAt DESC")
    List<EmotionHistory> findByUsernameAndDateRange(
        @Param("username") String username,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT COUNT(e) FROM EmotionHistory e WHERE e.user.username = :username")
    long countByUsername(@Param("username") String username);

    @Query("SELECT e.emotion, COUNT(e) as count FROM EmotionHistory e " +
           "WHERE e.user.username = :username GROUP BY e.emotion")
    List<Object[]> countEmotionsByUsername(@Param("username") String username);
}
