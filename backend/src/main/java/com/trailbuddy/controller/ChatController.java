package com.trailbuddy.controller;

import com.trailbuddy.dto.ChatMessageRequest;
import com.trailbuddy.dto.ChatConversationDTO;
import com.trailbuddy.entity.ChatMessage;
import com.trailbuddy.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chat")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    @Autowired
    private ChatService chatService;

    @PostMapping("/send")
    public ResponseEntity<ChatMessage> sendMessage(@RequestBody ChatMessageRequest request, Authentication authentication) {
        logger.info("Sending chat message");
        ChatMessage sentMessage = chatService.sendMessage(
                request.getReceiverId(),
                request.getMessage(),
                authentication
        );
        return ResponseEntity.ok(sentMessage);
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<List<ChatMessage>> getChatHistory(
            @PathVariable Long userId,
            Authentication authentication) {
        logger.info("Getting chat history for user: {}", userId);
        List<ChatMessage> messages = chatService.getChatHistory(userId, authentication);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ChatConversationDTO>> getConversations(Authentication authentication) {
        logger.info("Getting conversations for user");
        return ResponseEntity.ok(chatService.getConversations(authentication));
    }

    @PutMapping("/read")
    public ResponseEntity<?> markAsRead(@RequestParam Long senderId, Authentication authentication) {
        logger.info("Marking messages as read from sender: {}", senderId);
        chatService.markMessagesAsRead(senderId, authentication);
        return ResponseEntity.ok().build();
    }
}
