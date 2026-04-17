package com.trailbuddy.service.impl;

import com.trailbuddy.entity.ChatMessage;
import com.trailbuddy.entity.Booking;
import com.trailbuddy.dto.ChatConversationDTO;
import com.trailbuddy.entity.User;
import com.trailbuddy.repository.BookingRepository;
import com.trailbuddy.repository.ChatMessageRepository;
import com.trailbuddy.repository.UserRepository;
import com.trailbuddy.service.ChatService;
import com.trailbuddy.service.TravelerMarketplaceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChatServiceImpl implements ChatService {

    private static final Logger logger = LoggerFactory.getLogger(ChatServiceImpl.class);

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TravelerMarketplaceService travelerMarketplaceService;

    @Override
    public ChatMessage sendMessage(Long receiverId, String message, Authentication authentication) {
        User sender = (User) authentication.getPrincipal();
        if (receiverId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receiver is required");
        }
        if (message == null || message.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message is required");
        }

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver not found"));
        Booking booking = validateChatAccess(sender, receiver);

        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setSender(sender);
        chatMessage.setReceiver(receiver);
        chatMessage.setBooking(booking);
        chatMessage.setMessage(message.trim());
        chatMessage.setTimestamp(LocalDateTime.now());
        chatMessage.setReadStatus(false);
        chatMessage.setType(ChatMessage.MessageType.TEXT);

        return chatMessageRepository.save(chatMessage);
    }

    @Override
    public List<ChatMessage> getChatHistory(Long userId, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        User otherUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        validateChatAccess(currentUser, otherUser);
        return chatMessageRepository.findChatHistory(currentUser.getId(), userId);
    }

    @Override
    public List<ChatConversationDTO> getConversations(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        Map<Long, User> conversations = new LinkedHashMap<>();

        for (User receiver : chatMessageRepository.findDistinctReceiversBySenderId(currentUser.getId())) {
            conversations.put(receiver.getId(), receiver);
        }
        for (User sender : chatMessageRepository.findDistinctSendersByReceiverId(currentUser.getId())) {
            conversations.putIfAbsent(sender.getId(), sender);
        }

        return conversations.values().stream()
                .filter(otherUser -> isChatAllowed(currentUser, otherUser))
                .map(otherUser -> toConversationDto(currentUser, otherUser))
                .sorted(Comparator.comparing(
                        ChatConversationDTO::getLastMessageTime,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();
    }

    @Override
    @Transactional
    public void markMessagesAsRead(Long senderId, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        validateChatAccess(currentUser, sender);
        chatMessageRepository.markMessagesAsRead(senderId, currentUser.getId());
    }

    private Booking validateChatAccess(User currentUser, User otherUser) {
        Booking booking = findRelatedBooking(currentUser, otherUser);
        if (booking != null) {
            return booking;
        }
        if (!travelerMarketplaceService.canUsersChat(currentUser, otherUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Chat is only allowed between linked traveler-guide pairs");
        }
        return null;
    }

    private boolean isChatAllowed(User currentUser, User otherUser) {
        if (currentUser == null || otherUser == null) {
            return false;
        }
        if (currentUser.getId().equals(otherUser.getId())) {
            return false;
        }
        if (currentUser.isAdmin() || otherUser.isAdmin()) {
            return false;
        }
        return findRelatedBooking(currentUser, otherUser) != null
                || travelerMarketplaceService.canUsersChat(currentUser, otherUser);
    }

    private ChatConversationDTO toConversationDto(User currentUser, User otherUser) {
        ChatConversationDTO dto = new ChatConversationDTO();
        dto.setUserId(otherUser.getId());
        dto.setName(otherUser.getFullName());

        List<ChatMessage> latestMessages = chatMessageRepository.findLatestMessageBetweenUsers(
                currentUser.getId(),
                otherUser.getId(),
                PageRequest.of(0, 1)
        );
        if (!latestMessages.isEmpty()) {
            ChatMessage latest = latestMessages.get(0);
            dto.setLastMessage(latest.getMessage());
            dto.setLastMessageTime(latest.getTimestamp());
        }

        return dto;
    }

    private Booking findRelatedBooking(User firstUser, User secondUser) {
        List<Booking> directBookings = bookingRepository.findChatBookings(
                firstUser.getId(),
                secondUser.getId(),
                PageRequest.of(0, 1)
        );
        if (!directBookings.isEmpty()) {
            return directBookings.get(0);
        }

        List<Booking> reverseBookings = bookingRepository.findChatBookings(
                secondUser.getId(),
                firstUser.getId(),
                PageRequest.of(0, 1)
        );
        if (!reverseBookings.isEmpty()) {
            return reverseBookings.get(0);
        }

        return null;
    }
}
