package com.emotion.service;

import com.emotion.dto.GuestbookRequest;
import com.emotion.entity.GuestbookMessage;
import com.emotion.repository.GuestbookMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 留言板服务
 */
@Service
@RequiredArgsConstructor
public class GuestbookService {

    private final GuestbookMessageRepository guestbookMessageRepository;

    /**
     * 提交留言（默认未审核）
     */
    @Transactional
    public GuestbookMessage submitMessage(GuestbookRequest request, String ipAddress) {
        GuestbookMessage message = new GuestbookMessage();
        message.setName(request.getName());
        message.setEmail(request.getEmail());
        message.setMessage(request.getMessage());
        message.setIpAddress(ipAddress);
        return guestbookMessageRepository.save(message);
    }

    /**
     * 获取已审核通过的留言（分页）
     */
    public Page<GuestbookMessage> getApprovedMessages(int page, int size) {
        return guestbookMessageRepository.findByApprovedTrueOrderByCreatedAtDesc(
                PageRequest.of(page, size)
        );
    }

    /**
     * 获取所有留言（管理员用，分页）
     */
    public Page<GuestbookMessage> getAllMessages(int page, int size) {
        return guestbookMessageRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
    }

    /**
     * 审核通过留言
     */
    @Transactional
    public void approveMessage(Long id) {
        GuestbookMessage message = guestbookMessageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        message.setApproved(true);
        guestbookMessageRepository.save(message);
    }

    /**
     * 删除留言
     */
    @Transactional
    public void deleteMessage(Long id) {
        guestbookMessageRepository.deleteById(id);
    }
}
