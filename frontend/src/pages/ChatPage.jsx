import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatAPI, proposalsAPI } from '../services/api';
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

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

  const getErrorMessage = (err, fallback) => {
    const payload = err?.response?.data;
    if (typeof payload === 'string') return payload;
    if (payload && typeof payload === 'object') {
      return payload.error || payload.message || fallback;
    }
    return err?.message || fallback;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async ({ silent = false } = {}) => {
    if (!otherUserId) return;
    if (!silent) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const res = await chatAPI.getHistory(otherUserId);
      setMessages(Array.isArray(res.data) ? res.data : []);
      try { await chatAPI.markAsRead(otherUserId); } catch { /* ignore */ }
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to load chat history'));
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!otherUserId) return undefined;

    loadHistory();
    const interval = setInterval(() => {
      loadHistory({ silent: true });
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUserId]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!otherUserId || !newMessage.trim()) return;
    setError(null);
    try {
      await chatAPI.sendMessage({ receiverId: otherUserId, message: newMessage.trim() });
      setNewMessage('');
      await loadHistory();
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to send message'));
    }
  };

  const updateProposal = async (proposalId, action) => {
    try {
      if (action === 'accept') {
        await proposalsAPI.accept(proposalId);
      } else {
        await proposalsAPI.reject(proposalId);
      }
      await loadHistory();
    } catch (e) {
      setError(getErrorMessage(e, `Failed to ${action} proposal`));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="glass border-b border-white/6 px-5 py-4 rounded-t-2xl">
        <h1 className="text-base font-semibold text-white flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-cyan-400" />
          {otherUserId ? 'Chat' : 'Select a chat'}
        </h1>
        {otherUserId && (
          <p className="text-xs text-slate-500 mt-0.5">Chatting with user #{otherUserId}</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-navy-800/30">
        {!otherUserId && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mb-4">
              <ChatBubbleLeftRightIcon className="h-7 w-7 text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">Choose a guide from the guides list to start a chat.</p>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2 text-center">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-8">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-cyan-400" />
            Loading messages...
          </div>
        )}

        {!isLoading && otherUserId && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <p className="text-slate-500 text-sm">No messages yet. Send the first message below.</p>
          </div>
        )}

        {messages.map((message) => {
          const isMine = message.sender?.id === user?.id;
          const proposal = message.proposal;
          const isProposal = message.type === 'PROPOSAL' && proposal;
          return (
            <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs sm:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                  isMine
                    ? 'bg-cyan-500 text-white rounded-br-sm'
                    : 'bg-white/8 border border-white/10 text-slate-200 rounded-bl-sm'
                }`}
              >
                {isProposal ? (
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold">{proposal.title}</p>
                      <p className={`text-xs mt-1 ${isMine ? 'text-cyan-100/80' : 'text-slate-400'}`}>
                        ₹{proposal.price} • {proposal.days} day{proposal.days > 1 ? 's' : ''} • {proposal.status}
                      </p>
                    </div>
                    <p className={`text-xs leading-relaxed ${isMine ? 'text-cyan-50/90' : 'text-slate-300'}`}>
                      {proposal.description}
                    </p>
                    <div className={`rounded-xl p-3 whitespace-pre-wrap text-xs ${isMine ? 'bg-cyan-600/40' : 'bg-white/6 border border-white/8'}`}>
                      {proposal.itinerary}
                    </div>
                    {proposal.status === 'PENDING' && proposal.travelerId === user?.id && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateProposal(proposal.id, 'accept')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-100 text-xs font-semibold"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => updateProposal(proposal.id, 'reject')}
                          className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-100 text-xs font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {proposal.bookingId && (
                      <p className={`text-[10px] ${isMine ? 'text-cyan-100/80' : 'text-emerald-300'}`}>
                        Booking #{proposal.bookingId} created
                      </p>
                    )}
                  </div>
                ) : (
                  <p>{message.message}</p>
                )}
                <p className={`text-[10px] mt-1 ${isMine ? 'text-cyan-100/70' : 'text-slate-500'}`}>
                  {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="glass border-t border-white/6 px-4 py-3 rounded-b-2xl">
        <form onSubmit={sendMessage} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={otherUserId ? 'Type your message...' : 'Select a chat to start messaging'}
            className="input-dark flex-1 py-2.5"
            disabled={!otherUserId}
          />
          <button
            type="submit"
            disabled={!otherUserId || !newMessage.trim()}
            className="btn-cyan px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
