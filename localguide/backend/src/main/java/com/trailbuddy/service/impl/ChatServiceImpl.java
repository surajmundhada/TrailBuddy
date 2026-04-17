package com.trailbuddy.service.impl;

import com.trailbuddy.entity.ChatMessage;
import com.trailbuddy.entity.User;
import com.trailbuddy.repository.ChatMessageRepository;
import com.trailbuddy.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChatServiceImpl implements ChatService {

    private static final Logger logger = LoggerFactory.getLogger(ChatServiceImpl.class);

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Override
    public ChatMessage sendMessage(ChatMessage message, Authentication authentication) {
        User sender = (User) authentication.getPrincipal();
        message.setSender(sender);
        message.setTimestamp(LocalDateTime.now());
        message.setReadStatus(false);
        
        return chatMessageRepository.save(message);
    }

    @Override
    public Page<ChatMessage> getChatHistory(Long userId, Pageable pageable, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return chatMessageRepository.findChatHistory(currentUser.getId(), userId, pageable);
    }

    @Override
    public List<?> getConversations(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return chatMessageRepository.findConversations(currentUser.getId());
    }

    @Override
    @Transactional
    public void markMessagesAsRead(Long senderId, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        chatMessageRepository.markMessagesAsRead(senderId, currentUser.getId());
    }
}
