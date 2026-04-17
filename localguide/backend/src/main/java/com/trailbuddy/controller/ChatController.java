package com.trailbuddy.controller;

import com.trailbuddy.entity.ChatMessage;
import com.trailbuddy.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/chat")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    @Autowired
    private ChatService chatService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping("/send")
    public ResponseEntity<ChatMessage> sendMessage(@RequestBody ChatMessage message, Authentication authentication) {
        logger.info("Sending chat message");
        ChatMessage sentMessage = chatService.sendMessage(message, authentication);
        
        // Send real-time message via WebSocket
        messagingTemplate.convertAndSendToUser(
            sentMessage.getReceiver().getId().toString(), 
            "/queue/messages", 
            sentMessage
        );
        
        return ResponseEntity.ok(sentMessage);
    }

    @GetMapping("/history")
    public ResponseEntity<Page<ChatMessage>> getChatHistory(
            @RequestParam Long userId,
            Pageable pageable,
            Authentication authentication) {
        logger.info("Getting chat history for user: {}", userId);
        Page<ChatMessage> messages = chatService.getChatHistory(userId, pageable, authentication);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations(Authentication authentication) {
        logger.info("Getting conversations for user");
        return ResponseEntity.ok(chatService.getConversations(authentication));
    }

    @PutMapping("/read")
    public ResponseEntity<?> markAsRead(@RequestParam Long senderId, Authentication authentication) {
        logger.info("Marking messages as read from sender: {}", senderId);
        chatService.markMessagesAsRead(senderId, authentication);
        return ResponseEntity.ok().build();
    }

    @MessageMapping("/chat.sendMessage")
    public void handleWebSocketMessage(@Payload ChatMessage message, Authentication authentication) {
        logger.info("Handling WebSocket message");
        ChatMessage sentMessage = chatService.sendMessage(message, authentication);
        
        // Send to specific user
        messagingTemplate.convertAndSendToUser(
            sentMessage.getReceiver().getId().toString(), 
            "/queue/messages", 
            sentMessage
        );
    }
}
