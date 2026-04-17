package com.trailbuddy.repository;

import com.trailbuddy.entity.ChatMessage;
import com.trailbuddy.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
           "(m.sender.id = :userId2 AND m.receiver.id = :userId1) " +
           "ORDER BY m.timestamp ASC")
    List<ChatMessage> findChatHistory(@Param("userId1") Long userId1,
                                      @Param("userId2") Long userId2);

    @Query("SELECT DISTINCT m.receiver FROM ChatMessage m WHERE m.sender.id = :userId")
    List<User> findDistinctReceiversBySenderId(@Param("userId") Long userId);

    @Query("SELECT DISTINCT m.sender FROM ChatMessage m WHERE m.receiver.id = :userId")
    List<User> findDistinctSendersByReceiverId(@Param("userId") Long userId);

    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
           "(m.sender.id = :userId2 AND m.receiver.id = :userId1) " +
           "ORDER BY m.timestamp DESC")
    List<ChatMessage> findLatestMessageBetweenUsers(@Param("userId1") Long userId1,
                                                    @Param("userId2") Long userId2,
                                                    Pageable pageable);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.readStatus = true WHERE m.sender.id = :senderId AND m.receiver.id = :receiverId AND m.readStatus = false")
    void markMessagesAsRead(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);
}
