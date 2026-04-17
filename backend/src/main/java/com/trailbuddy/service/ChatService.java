package com.trailbuddy.service;

import com.trailbuddy.entity.ChatMessage;
import com.trailbuddy.dto.ChatConversationDTO;
import org.springframework.security.core.Authentication;

import java.util.List;

public interface ChatService {
    ChatMessage sendMessage(Long receiverId, String message, Authentication authentication);
    List<ChatMessage> getChatHistory(Long userId, Authentication authentication);
    List<ChatConversationDTO> getConversations(Authentication authentication);
    void markMessagesAsRead(Long senderId, Authentication authentication);
}
