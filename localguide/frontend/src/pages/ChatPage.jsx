import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../services/api';

const ChatPage = () => {
  const { user } = useAuth();
  const { userId } = useParams();

  const otherUserId = useMemo(() => {
    if (!userId) return null;
    const n = Number(userId);
    return Number.isFinite(n) ? n : null;
  }, [userId]);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadHistory = async () => {
    if (!otherUserId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await chatAPI.getHistory(otherUserId, 0, 50);
      // Spring Page -> { content: [...] }
      setMessages(res.data?.content ?? []);

      // Mark messages from the other user as read (best-effort).
      try {
        await chatAPI.markAsRead(otherUserId);
      } catch {
        // ignore
      }
    } catch (e) {
      setError(e?.response?.data || 'Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (otherUserId) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!otherUserId) return;
    if (!newMessage.trim()) return;

    setError(null);

    try {
      // Backend fills sender from JWT; we provide receiver + message text.
      await chatAPI.sendMessage({
        receiver: { id: otherUserId },
        message: newMessage.trim(),
      });

      setNewMessage('');
      await loadHistory();
    } catch (e) {
      setError(e?.response?.data || 'Failed to send message');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 flex flex-col">
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">
            {otherUserId ? 'Chat' : 'Select a chat'}
          </h1>
          {otherUserId ? (
            <p className="text-sm text-gray-500">
              Chatting with user ID: {otherUserId}
            </p>
          ) : null}
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!otherUserId && (
            <div className="text-gray-600">
              Choose a guide from the guides list to start a chat.
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          {isLoading && (
            <div className="text-gray-600 text-sm">Loading messages...</div>
          )}

          {!isLoading && otherUserId && messages.length === 0 && (
            <div className="text-gray-600 text-sm">
              No messages yet. Send the first message below.
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender?.id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.sender?.id === user?.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.message}</p>
                <p className="text-xs mt-1 opacity-75">
                  {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
                </p>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
        
        <div className="bg-white border-t px-6 py-4">
          <form onSubmit={sendMessage} className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!otherUserId}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              disabled={!otherUserId}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
