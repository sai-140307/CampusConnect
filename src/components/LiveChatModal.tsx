import React, { useState, useEffect, useRef } from 'react';
import { useModal } from '../hooks/useModal';
import { 
  X, 
  Send, 
  Heart, 
  Pin, 
  MessageSquare,
  Users,
  Sparkles,
  Smile,
  ShieldCheck
} from 'lucide-react';
import { ChatMessage, UserProfile } from '../types';
import { handleImageFallback, FALLBACK_AVATAR } from '../utils/imageUtils';
import { formatRelativeTime } from '../utils/campusTime';
import { useNow } from '../hooks/useNow';

interface LiveChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTitle: string;
  targetType: 'event' | 'club';
  messages: ChatMessage[];
  onSendMessage: (text: string, tag?: ChatMessage['tag']) => void;
  onToggleLikeMessage: (msgId: string) => void;
  userProfile: UserProfile;
}

export const LiveChatModal: React.FC<LiveChatModalProps> = ({
  isOpen,
  onClose,
  targetTitle,
  targetType,
  messages,
  onSendMessage,
  onToggleLikeMessage,
  userProfile,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedTag, setSelectedTag] = useState<ChatMessage['tag']>('general');
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = useNow();

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [messages.length]);

  useModal(isOpen, onClose);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim(), selectedTag);
      setInputText('');
    }
  };

  const getTagBadge = (tag?: ChatMessage['tag']) => {
    switch (tag) {
      case 'looking_for_team':
        return <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Teammate Request 🤝</span>;
      case 'food_update':
        return <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">Food Update 🍕</span>;
      case 'rideshare':
        return <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-ink-100 text-ink-800 border border-ink-200">Walk / Ride Buddy 🚶</span>;
      case 'qa':
        return <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">Q&A ❓</span>;
      default:
        return null;
    }
  };

  return (
    <div 
      className="cc-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="cc-dialog relative w-full max-w-xl bg-white border border-ink-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[92vh] text-ink-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-brand-50/70 border-b border-brand-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="cc-btn-brand w-10 h-10 rounded-xl flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-ink-900 text-sm line-clamp-1">{targetTitle}</h3>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-xs text-ink-500 flex items-center gap-1.5 mt-0.5">
                <span>{targetType === 'club' ? 'Club discussion' : 'Attendee discussion'}</span>
                <span>•</span>
                <span className="text-brand-700 font-medium">Updates live for everyone</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white border border-brand-200/80 hover:bg-brand-100/60 text-ink-500 hover:text-ink-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Feed */}
        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-ink-50/50">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-ink-400 text-xs space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-ink-300 stroke-[1.5]" />
              <p className="font-bold text-ink-600">No messages in this channel yet.</p>
              <p className="text-ink-400">Be the first student to post a question, find teammates, or share notes!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  msg.isPinned
                    ? 'bg-amber-50/60 border-amber-200/90 shadow-2xs'
                    : 'bg-white border-ink-200/90 shadow-2xs'
                }`}
              >
                {/* Sender bar */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <img
                      src={msg.senderAvatar || FALLBACK_AVATAR}
                      alt={msg.senderName}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageFallback(e, FALLBACK_AVATAR)}
                      className="w-6 h-6 rounded-full object-cover border border-ink-200"
                    />
                    <span className="text-xs font-bold text-ink-900">{msg.senderName}</span>
                    {msg.senderRole === 'organizer' && (
                      <span className="px-1.5 py-0.5 rounded text-2xs font-bold bg-brand-100 text-brand-800 border border-brand-200">
                        Host
                      </span>
                    )}
                    {msg.senderRole === 'faculty' && (
                      <span className="px-1.5 py-0.5 rounded text-2xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        Faculty
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {msg.isPinned && (
                      <span className="flex items-center gap-1 text-2xs font-bold text-amber-800 bg-amber-100/60 px-1.5 py-0.5 rounded">
                        <Pin className="w-3 h-3 fill-current" />
                        Pinned
                      </span>
                    )}
                    <span className="text-2xs text-ink-400">
                      {formatRelativeTime(msg.createdAt, msg.timestamp, now)}
                    </span>
                  </div>
                </div>

                {/* Tag pill */}
                {msg.tag && msg.tag !== 'general' && (
                  <div className="mb-2">
                    {getTagBadge(msg.tag)}
                  </div>
                )}

                {/* Message Body */}
                <p className="text-xs sm:text-sm text-ink-800 leading-relaxed whitespace-pre-line mb-2">
                  {msg.text}
                </p>

                {/* Likes */}
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-ink-100">
                  <button
                    type="button"
                    onClick={() => onToggleLikeMessage(msg.id)}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      msg.isLikedByMe
                        ? 'text-rose-600 font-bold bg-rose-50'
                        : 'text-ink-400 hover:text-ink-700 hover:bg-ink-100'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${msg.isLikedByMe ? 'fill-current' : ''}`} />
                    <span>{msg.likes}</span>
                  </button>
                  <span className="text-2xs text-ink-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    {msg.senderRole === 'student' ? 'Student' : 'Verified host'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-3.5 bg-white border-t border-ink-200 space-y-2">
          
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <span className="text-2xs text-ink-400 font-bold shrink-0">Topic:</span>
            {[
              { id: 'general', label: 'General' },
              { id: 'looking_for_team', label: '🤝 Teammates' },
              { id: 'qa', label: '❓ Q&A' },
              { id: 'food_update', label: '🍕 Food Drop' },
              { id: 'rideshare', label: '🚶 Walk/Ride' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTag(t.id as any)}
                className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                  selectedTag === t.id
                    ? 'cc-btn-brand'
                    : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message attendees as ${userProfile.name}...`}
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-ink-50 border border-ink-300 rounded-xl focus:outline-none focus:border-brand-600 focus:bg-white transition-all text-ink-900 placeholder:text-ink-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="cc-btn-brand p-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all cursor-pointer shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
