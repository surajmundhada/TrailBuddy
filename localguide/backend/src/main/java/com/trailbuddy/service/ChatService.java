package com.trailbuddy.service;

import com.trailbuddy.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;

import java.util.List;

public interface ChatService {
    ChatMessage sendMessage(ChatMessage message, Authentication authentication);
    Page<ChatMessage> getChatHistory(Long userId, Pageable pageable, Authentication authentication);
    List<?> getConversations(Authentication authentication);
    void markMessagesAsRead(Long senderId, Authentication authentication);
}
