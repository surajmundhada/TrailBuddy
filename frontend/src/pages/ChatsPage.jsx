import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { chatAPI } from '../services/api';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const ChatsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { data, isLoading, error } = useQuery(
    ['chat-conversations'],
    () => chatAPI.getConversations().then((response) => response.data),
    {
      refetchOnWindowFocus: true,
    }
  );

  const conversations = Array.isArray(data) ? data : [];
  const selectedUserId = location.pathname.startsWith('/chat/')
    ? Number(location.pathname.split('/').pop())
    : null;

  const getErrorMessage = (err) => {
    const payload = err?.response?.data;
    if (typeof payload === 'string') return payload;
    if (payload && typeof payload === 'object') {
      return payload.error || payload.message || 'Failed to load conversations';
    }
    return err?.message || 'Failed to load conversations';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-primary-400 bg-clip-text text-transparent">
          Chats
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          Continue your conversations with guides and travelers you have booked with.
        </p>
      </div>

      <div className="glass rounded-2xl border border-white/6 overflow-hidden">
        <div className="border-b border-white/6 px-5 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Your Conversations</h2>
            <p className="text-xs text-slate-500">Tap a chat to open the full conversation.</p>
          </div>
        </div>

        {isLoading && (
          <div className="px-5 py-12 text-center text-slate-500 text-sm">
            Loading conversations...
          </div>
        )}

        {error && (
          <div className="px-5 py-6 text-sm text-red-400 bg-red-400/10 border-t border-red-400/10">
            {getErrorMessage(error)}
          </div>
        )}

        {!isLoading && !error && conversations.length === 0 && (
          <div className="px-5 py-12 text-center">
            <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-4">
              <ChatBubbleLeftRightIcon className="h-7 w-7 text-slate-600" />
            </div>
            <p className="text-slate-400 text-sm">No chats yet. Start from a booked guide or traveler.</p>
          </div>
        )}

        {!isLoading && !error && conversations.length > 0 && (
          <div className="divide-y divide-white/6">
            {conversations.map((conversation) => {
              const name = conversation?.name || `User #${conversation?.userId}`;
              const initials = name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join('') || 'U';
              const isSelected = selectedUserId === conversation?.userId;

              return (
                <button
                  key={conversation.userId}
                  type="button"
                  onClick={() => navigate(`/chat/${conversation.userId}`)}
                  className={`w-full text-left px-5 py-4 transition-all hover:bg-white/5 ${
                    isSelected ? 'bg-cyan-500/10' : 'bg-transparent'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-semibold text-sm ${
                      isSelected
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white/6 border border-white/10 text-cyan-300'
                    }`}>
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-white truncate">{name}</p>
                        <p className="text-xs text-slate-500 flex-shrink-0">
                          {conversation?.lastMessageTime
                            ? new Date(conversation.lastMessageTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-slate-400 truncate">
                        {conversation?.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatsPage;
