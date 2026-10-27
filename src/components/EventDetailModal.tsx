import React, { useEffect, useState } from 'react';
import { useModal } from '../hooks/useModal';
import { 
  X, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Utensils, 
  ShieldCheck, 
  Download, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  Send,
  Trash2,
  Radio,
  Pin
} from 'lucide-react';
import { CampusEvent, ChatMessage, UserProfile, DispatchedEmail } from '../types';
import { generateGoogleCalendarUrl, generateOutlookCalendarUrl, downloadIcsFile, detectScheduleConflict } from '../services/calendarService';
import { sendRsvpConfirmationEmail, generateGmailComposeUrl, generateMailtoUrl, downloadEmlFile } from '../services/emailService';
import { handleImageFallback, FALLBACK_EVENT_IMAGE, FALLBACK_AVATAR } from '../utils/imageUtils';
import { formatEventStatus, formatEventWhen, formatRelativeTime, getEventPhase } from '../utils/campusTime';
import { useNow } from '../hooks/useNow';
import { Mail, Inbox, FileText, Check } from 'lucide-react';

interface EventDetailModalProps {
  event: CampusEvent | null;
  isOpen: boolean;
  onClose: () => void;
  isRsvpd: boolean;
  onRsvp: (eventId: string) => void;
  onOpenChat: (eventId: string) => void;
  allEvents: CampusEvent[];
  rsvpdEvents: string[];
  userProfile?: UserProfile;
  messages?: ChatMessage[];
  onSendMessage?: (text: string, tag?: ChatMessage['tag']) => void;
  onDeleteEvent?: (eventId: string) => void;
  currentUid?: string;
  isAdmin?: boolean;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  isRsvpd,
  onRsvp,
  onOpenChat,
  allEvents,
  rsvpdEvents,
  userProfile,
  messages = [],
  onSendMessage,
  onDeleteEvent,
  currentUid,
  isAdmin = false,
}) => {
  const now = useNow();
  const [icsDownloaded, setIcsDownloaded] = useState(false);
  const [emailDispatchedNotice, setEmailDispatchedNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');
  const [chatInput, setChatInput] = useState('');
  const [selectedTag, setSelectedTag] = useState<ChatMessage['tag']>('general');

  useModal(isOpen, onClose);

  // Each event opens on its details, with a clean message box.
  const eventId = event?.id;
  useEffect(() => {
    setActiveTab('details');
    setChatInput('');
    setEmailDispatchedNotice(null);
    setIcsDownloaded(false);
  }, [eventId]);

  if (!isOpen || !event) return null;

  const conflict = detectScheduleConflict(event, allEvents || [], rsvpdEvents || []);
  const percentFull = Math.min(100, Math.round(((event.rsvpCount || 0) / (event.capacity || 100)) * 100));
  const phase = getEventPhase(event, now);
  const isExpired = phase === 'ended';
  const isFull = (event.rsvpCount || 0) >= (event.capacity || 0);
  const when = formatEventWhen(event, now);
  const ticketEmail = userProfile?.emailSettings?.recipientEmail || userProfile?.email || '';
  const isOrganizer = userProfile?.role === 'organizer';

  const eventMessages = (messages || []).filter((m) => m.targetId === event.id);

  const handleDownloadIcs = () => {
    downloadIcsFile(event);
    setIcsDownloaded(true);
    setTimeout(() => setIcsDownloaded(false), 3000);
  };

  const handleTriggerEmailConfirmation = () => {
    const userEmail = ticketEmail;
    if (!userEmail) return;
    const dispatched = sendRsvpConfirmationEmail(userProfile, event, userEmail);
    if (dispatched) {
      setEmailDispatchedNotice('Saved to your email center');
      setTimeout(() => setEmailDispatchedNotice(null), 4000);
    }
  };

  const currentEmailStub: DispatchedEmail = {
    id: `ticket-${event.id}`,
    recipientEmail: ticketEmail,
    recipientName: userProfile?.name || 'Student',
    subject: `🎟️ RSVP Confirmed: ${event.title}`,
    previewText: `Confirmed registration pass for ${event.title} at ${event.building} (${event.room})`,
    sentAt: 'Now',
    category: 'rsvp_confirmation',
    eventTitle: event.title,
    eventDate: when,
    eventLocation: `${event.building}, ${event.room}`,
    htmlContent: `<h2>${event.title}</h2><p>Date: ${when}</p><p>Location: ${event.building} (${event.room})</p>`,
  };

  const handleRsvp = () => {
    onRsvp(event.id);
  };

  const handleSendChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && onSendMessage) {
      onSendMessage(chatInput.trim(), selectedTag);
      setChatInput('');
    }
  };

  return (
    <div className="cc-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-xs overflow-y-auto" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div 
        role="dialog" aria-modal="true" aria-label={event.title}
        className="cc-dialog relative w-full max-w-2xl bg-white border border-brand-200/80 rounded-2xl shadow-2xl overflow-hidden my-8 text-ink-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="cc-static relative h-56 w-full bg-ink-100">
          <img
            src={event.image}
            alt={event.title}
            referrerPolicy="no-referrer"
            onError={(e) => handleImageFallback(e, FALLBACK_EVENT_IMAGE)}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/30 to-transparent" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badges on Banner */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-white text-brand-950 shadow-sm">
                {event.category}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-semibold shadow-sm tabular-nums flex items-center gap-1.5 ${
                  phase === 'live' ? 'bg-rose-600 text-white' : phase === 'ended' ? 'bg-black/60 text-white' : 'bg-emerald-500 text-white'
                }`}
              >
                {phase === 'live' && <span className="cc-live-dot" />}
                {formatEventStatus(event, now)}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              {event.title}
            </h2>
          </div>
        </div>

        {/* Tab Navigation (Details vs Event Discussion) */}
        <div className="flex border-b border-brand-100 bg-brand-50/40 px-6 pt-2 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'details'
                ? 'border-brand-600 text-brand-950 font-bold'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            Details
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'border-brand-600 text-brand-950 font-bold'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discussion ({eventMessages.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[calc(85vh-16rem)] overflow-y-auto text-ink-900 bg-white">
          
          {activeTab === 'details' ? (
            <>
              {/* Schedule Conflict Alert */}
              {conflict.hasConflict && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-amber-900">Schedule Notice: </strong>
                    You already RSVP’d to &ldquo;{conflict.conflictingEvent?.title}&rdquo; at this same time.
                  </div>
                </div>
              )}

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-brand-50/50 border border-brand-200/80 flex items-center gap-3">
                  <Clock className="w-4 h-4 text-brand-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-ink-500">When</p>
                    <p className="text-sm font-semibold text-ink-900 tabular-nums">{when}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-brand-50/50 border border-brand-200/80 flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-ink-500">Where</p>
                    <p className="text-xs font-bold text-ink-900">{event.building}, {event.room}</p>
                  </div>
                </div>
              </div>

              {/* Perks Included */}
              <div>
                <h4 className="text-xs font-bold text-ink-500 mb-2">
                  What you get
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {event.perks.map((perk, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-950 border border-amber-200"
                    >
                      {perk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Food Details */}
              {event.foodDetails && (
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-bold mb-1">
                    <Utensils className="w-4 h-4 text-amber-700" />
                    <span>Food and drinks</span>
                  </div>
                  <p className="text-ink-700 leading-relaxed font-normal">{event.foodDetails}</p>
                </div>
              )}

              {/* Full Description */}
              <div>
                <h4 className="text-xs font-bold text-ink-500 mb-1.5">About</h4>
                <p className="text-xs sm:text-sm text-ink-700 leading-relaxed whitespace-pre-line font-normal">
                  {event.description}
                </p>
              </div>

              {/* Organizer */}
              <div className="p-3.5 rounded-xl bg-ink-50 border border-brand-200/70 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="text-xs text-ink-500">Organized by</p>
                  <p className="font-bold text-ink-900">{event.organizer}</p>
                </div>
                {event.facultyApproved && (
                  <span className="flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified organizer
                  </span>
                )}
              </div>

              {/* Attendance Progress */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-ink-700 mb-1.5">
                  <span>Attendance</span>
                  <span>{event.rsvpCount.toLocaleString('en-IN')} of {event.capacity.toLocaleString('en-IN')} spots taken</span>
                </div>
                <div className="w-full h-2 rounded-full bg-brand-100 overflow-hidden">
                  <div
                    className="cc-meter h-full rounded-full bg-brand-600"
                    style={{ width: `${percentFull}%` }}
                  />
                </div>
              </div>

              {/* Add to Calendar Sync Section */}
              <div className="p-3.5 rounded-xl bg-brand-50/40 border border-brand-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-900">Add to your calendar</span>
                  {icsDownloaded && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Downloaded
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="btn-add-to-calendar-ics"
                    type="button"
                    onClick={handleDownloadIcs}
                    className="cc-btn-brand inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .ics</span>
                  </button>

                  <a
                    id="link-sync-google-cal"
                    href={generateGoogleCalendarUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-brand-50 text-ink-700 border border-brand-200 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-ink-500" />
                    <span>Google Calendar</span>
                  </a>

                  <a
                    id="link-sync-outlook-cal"
                    href={generateOutlookCalendarUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-brand-50 text-ink-700 border border-brand-200 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-ink-500" />
                    <span>Outlook Calendar</span>
                  </a>
                </div>
              </div>

              {/* Email Ticket & Confirmation Actions */}
              <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-brand-600" />
                    <span className="text-xs font-bold text-ink-900">Email ticket</span>
                  </div>
                  {emailDispatchedNotice && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {emailDispatchedNotice}
                    </span>
                  )}
                </div>

                <p className="text-xs text-ink-600">
                  Sends to{' '}
                  <strong className="text-brand-950">
                    {ticketEmail || 'Add an email in the email center'}
                  </strong>
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    id="btn-open-gmail-ticket"
                    href={ticketEmail ? generateGmailComposeUrl(currentEmailStub) : undefined}
                    aria-disabled={!ticketEmail}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cc-btn-brand inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Gmail</span>
                  </a>

                  <button
                    id="btn-download-eml"
                    type="button"
                    onClick={() => downloadEmlFile(currentEmailStub)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-brand-50 text-ink-700 border border-brand-200 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-ink-500" />
                    <span>Download .eml</span>
                  </button>

                  <button
                    id="btn-resend-confirmation"
                    type="button"
                    onClick={handleTriggerEmailConfirmation}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-brand-50 text-brand-900 border border-brand-200 transition-colors cursor-pointer"
                  >
                    <Inbox className="w-3.5 h-3.5 text-brand-600" />
                    <span>Save to email center</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Discussion Tab */
            <div className="space-y-4">
              <div className="bg-brand-50/60 p-3 rounded-xl border border-brand-200/80 text-xs text-brand-950">
                Messages here are visible to everyone attending and to the organizers.
              </div>

              {/* Message List */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {eventMessages.length === 0 ? (
                  <div className="text-center py-10 text-ink-400 text-xs">
                    No messages yet. Ask a question or look for a teammate.
                  </div>
                ) : (
                  eventMessages.map((msg) => (
                    <div key={msg.id} className="p-3 rounded-xl bg-white border border-brand-100 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <img
                            src={msg.senderAvatar}
                            alt={msg.senderName}
                            referrerPolicy="no-referrer"
                            onError={(e) => handleImageFallback(e, FALLBACK_AVATAR)}
                            className="w-5 h-5 rounded-full object-cover border border-brand-200"
                          />
                          <span className="font-bold text-ink-900">{msg.senderName}</span>
                          {msg.senderRole === 'organizer' && (
                            <span className="px-1.5 py-0.5 rounded text-2xs font-bold bg-amber-100 text-amber-900">
                              Host
                            </span>
                          )}
                        </div>
                        <span className="text-2xs text-ink-400">{formatRelativeTime(msg.createdAt, msg.timestamp, now)}</span>
                      </div>
                      <p className="text-xs text-ink-700 leading-relaxed pl-7">{msg.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Inline Send Box */}
              <form onSubmit={handleSendChatSubmit} className="pt-2 border-t border-brand-100 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message to other attendees..."
                    className="flex-1 bg-ink-50 border border-brand-200 rounded-xl px-3.5 py-2 text-xs text-ink-900 placeholder-ink-400 focus:outline-none focus:border-brand-500 focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="cc-btn-brand px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-brand-50/40 border-t border-brand-200/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenChat(event.id);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-ink-700 bg-white hover:bg-brand-100/60 border border-brand-200 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-brand-600" />
              <span>Open full discussion</span>
            </button>

            {onDeleteEvent && (isAdmin || (isOrganizer && event.createdBy === currentUid)) && (
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
                    onDeleteEvent(event.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Event</span>
              </button>
            )}
          </div>

          <button
            onClick={handleRsvp}
            disabled={!isRsvpd && (isExpired || isFull)}
            className={`cc-press disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isRsvpd
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'cc-btn-brand shadow-xs'
            }`}
          >
            {isRsvpd ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Going. Cancel RSVP</span>
              </>
            ) : (
              <span>{isExpired ? 'Event ended' : isFull ? 'Event is full' : 'RSVP'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
