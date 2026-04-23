package com.emotion.repository;

import com.emotion.entity.GuestbookMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 留言板数据访问层
 */
@Repository
public interface GuestbookMessageRepository extends JpaRepository<GuestbookMessage, Long> {
    Page<GuestbookMessage> findByApprovedTrueOrderByCreatedAtDesc(Pageable pageable);
}
