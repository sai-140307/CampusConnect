import React, { useState } from 'react';
import { useModal } from '../hooks/useModal';
import { 
  X, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  BarChart3, 
  Radio, 
  Loader2, 
  PlusCircle, 
  Flame,
  Mail,
  Users,
  ShieldCheck
} from 'lucide-react';
import { CampusEvent, EventRegistration, PerkType, EventCategory } from '../types';
import { enhanceEventWithAI } from '../services/aiService';
import { sendOrganizerBroadcastEmail } from '../services/emailService';
import { CAMPUS_TIME_ZONE_LABEL, campusDateKey, campusDateTimeToMs, eventEndMs, formatEventWhen, now as syncedNow } from '../utils/campusTime';

interface FacultyDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostEvent: (newEvent: Partial<CampusEvent>) => void;
  onBroadcastNotification: (title: string, body: string, urgent: boolean) => void;
  existingEvents: CampusEvent[];
  /** People who registered through the app for this event. */
  attendeesFor?: (event: CampusEvent) => EventRegistration[];
}

const AVAILABLE_PERKS: PerkType[] = [
  'Free Food 🍕',
  'Free Swag 👕',
  'Resume Drop 💼',
  'Free Coffee ☕',
  'Free Drinks ☕',
  'Pet Therapy 🐶',
  'Networking 🤝',
  'Live Music / DJ 🎵',
  'Hardware / 3D Print 🛠️',
  'Certificates 📜',
  'Tutors On-Duty 📚',
];

const CATEGORIES: EventCategory[] = [
  'Academic & STEM',
  'Free Food & Social',
  'Career & Professional',
  'Arts, Music & Culture',
  'Health & Wellness',
  'Tech & Hackathons',
  'Sports & Outdoors',
  'Leadership & Civic',
];

export const FacultyDashboardModal: React.FC<FacultyDashboardModalProps> = ({
  isOpen,
  onClose,
  onPostEvent,
  onBroadcastNotification,
  existingEvents,
  attendeesFor,
}) => {
  const [openRosterId, setOpenRosterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'broadcast' | 'analytics'>('create');

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('Tech & Hackathons');
  const [organizer, setOrganizer] = useState('');
  const [building, setBuilding] = useState('Student Union Hall');
  const [room, setRoom] = useState('Ballroom A');
  const [date, setDate] = useState(() => campusDateKey());
  const [formError, setFormError] = useState<string | null>(null);
  const [capacity, setCapacity] = useState(80);
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('19:00');
  const [description, setDescription] = useState('');
  const [foodDetails, setFoodDetails] = useState('');
  const [selectedPerks, setSelectedPerks] = useState<PerkType[]>(['Free Food 🍕']);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Broadcast State
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [bTitle, setBTitle] = useState('');
  const [bBody, setBBody] = useState('');
  const [bUrgent, setBUrgent] = useState(true);
  const [sendEmailAlso, setSendEmailAlso] = useState(true);
  const [bSuccess, setBSuccess] = useState(false);

  useModal(isOpen, onClose);

  if (!isOpen) return null;

  const togglePerk = (perk: PerkType) => {
    if ((selectedPerks || []).includes(perk)) {
      setSelectedPerks((selectedPerks || []).filter((p) => p !== perk));
    } else {
      setSelectedPerks([...(selectedPerks || []), perk]);
    }
  };

  const handleEnhanceWithAI = async () => {
    if (!title && !description) return;
    setIsEnhancing(true);
    try {
      const result = await enhanceEventWithAI({
        title,
        description,
        perks: selectedPerks,
        category,
      });
      setTitle(result.enhancedTitle);
      setDescription(result.enhancedDescription);
      if (result.suggestedPerks && result.suggestedPerks.length > 0) {
        setSelectedPerks(Array.from(new Set([...selectedPerks, ...result.suggestedPerks])));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !organizer.trim()) return;

    const startMs = campusDateTimeToMs(date, startTime);
    if (Number.isNaN(startMs)) {
      setFormError('Choose a valid date and start time.');
      return;
    }
    if (startTime === endTime) {
      setFormError('The end time must be different from the start time.');
      return;
    }
    if (eventEndMs({ date, startTime, endTime }) <= syncedNow()) {
      setFormError(`That time has already passed on campus (${CAMPUS_TIME_ZONE_LABEL}). Choose a later date or time.`);
      return;
    }
    setFormError(null);

    onPostEvent({
      title,
      category,
      organizer,
      building,
      room,
      date,
      startTime,
      endTime,
      description,
      shortDesc: description.trim().length > 110 ? `${description.trim().slice(0, 107)}…` : description.trim(),
      perks: selectedPerks,
      foodDetails: selectedPerks.includes('Free Food 🍕') ? foodDetails || 'Complimentary catered refreshments' : undefined,
      capacity: Math.max(1, Math.round(capacity) || 80),
      rsvpCount: 0,
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
      gradient: 'from-brand-800 to-amber-900',
      facultyApproved: true,
      eligibility: 'Open to all registered students',
      attendeeAvatars: [],
      campusZone: 'Central Hub',
      mapCoords: { x: 50, y: 50 },
    });
    setTitle('');
    setDescription('');
    setFoodDetails('');

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 900);
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle || !bBody) return;

    const targetEv = existingEvents.find(e => e.id === selectedEventId);
    const targetTitle = targetEv ? targetEv.title : 'Everyone on campus';

    onBroadcastNotification(bTitle, bBody, bUrgent);

    if (sendEmailAlso) {
      sendOrganizerBroadcastEmail(
        organizer || 'Event Organizer',
        targetTitle,
        bTitle,
        bBody,
        targetEv?.rsvpCount || 45
      );
    }

    setBSuccess(true);
    setTimeout(() => {
      setBSuccess(false);
      setBTitle('');
      setBBody('');
    }, 2000);
  };

  return (
    <div className="cc-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-xs overflow-y-auto" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div 
        className="cc-dialog relative w-full max-w-2xl bg-white border border-brand-200/80 rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh] text-ink-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-brand-50 to-amber-50/60 border-b border-brand-200/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="cc-btn-brand w-10 h-10 rounded-xl flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-ink-900 text-base">Organizer & Faculty Studio</h3>
                <span className="px-2 py-0.5 rounded text-2xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
                  Organizer Access
                </span>
              </div>
              <p className="text-xs text-ink-500">Publish verified campus sessions and broadcast announcements</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white border border-brand-200 hover:bg-brand-100/60 text-ink-500 hover:text-ink-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-brand-100 bg-brand-50/30 px-6 pt-2 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'border-brand-600 text-brand-950 font-bold'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            + Post Campus Event
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('broadcast')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'broadcast'
                ? 'border-brand-600 text-brand-950 font-bold'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Broadcast Email & Push Notice</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-brand-600 text-brand-950 font-bold'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Attendees</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto bg-ink-50/40">
          
          {/* TAB 1: CREATE EVENT */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              
              {isSubmitted && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Event published.
                </div>
              )}

              {/* Title & AI Assist */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-ink-700">Event Title</label>
                  <button
                    type="button"
                    onClick={handleEnhanceWithAI}
                    disabled={isEnhancing || (!title && !description)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-brand-600" />}
                    <span>{isEnhancing ? 'Enhancing with AI...' : 'AI Title & Perks Assist'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. ACM Full-Stack Hack Night & Pizza Social"
                  required
                  className="w-full bg-white border border-brand-200 rounded-xl px-3.5 py-2.5 text-xs text-ink-900 focus:outline-none focus:border-brand-500 shadow-2xs"
                />
              </div>

              {/* Category & Organizer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ink-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventCategory)}
                    className="w-full bg-white border border-brand-200 rounded-xl px-3 py-2.5 text-xs text-ink-900 focus:outline-none focus:border-brand-500 shadow-2xs"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-ink-700 mb-1">Host Organization</label>
                  <input
                    type="text"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    placeholder="e.g. GDSC Campus / Robotics Guild"
                    required
                    className="w-full bg-white border border-brand-200 rounded-xl px-3 py-2.5 text-xs text-ink-900 focus:outline-none focus:border-brand-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Location & Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ink-700 mb-1">Campus Building</label>
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    placeholder="e.g. Student Union Center"
                    required
                    className="w-full bg-white border border-brand-200 rounded-xl px-3 py-2.5 text-xs text-ink-900 focus:outline-none focus:border-brand-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink-700 mb-1">Room / Hall</label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. Ballroom A / Lab 102"
                    required
                    className="w-full bg-white border border-brand-200 rounded-xl px-3 py-2.5 text-xs text-ink-900 focus:outline-none focus:border-brand-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-ink-700 mb-1">Date</label>
                  <input
                    type="date"
                    min={campusDateKey()}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-white border border-brand-200 rounded-xl px-2.5 py-2 text-xs text-ink-900 focus:outline-none focus:border-brand-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-ink-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full bg-white border border-brand-200 rounded-xl px-2.5 py-2 text-xs text-ink-900 focus:outline-none focus:border-brand-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-ink-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full bg-white border border-brand-200 rounded-xl px-2.5 py-2 text-xs text-ink-900 focus:outline-none focus:border-brand-500 shadow-2xs"
                  />
                </div>
              </div>

              <p className="text-ink-500 -mt-1">
                Times are campus time ({CAMPUS_TIME_ZONE_LABEL}). An end time earlier than the start means the event runs past midnight.
              </p>

              {formError && (
                <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="event-capacity" className="block font-bold text-ink-700 mb-1">Capacity</label>
                <input
                  id="event-capacity"
                  type="number"
                  min={1}
                  max={50000}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  required
                  className="w-32 bg-white border border-brand-200 rounded-xl px-3 py-2 text-xs text-ink-900 focus:outline-none focus:border-brand-500 shadow-2xs"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-ink-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what attendees will learn, build, or experience..."
                  required
                  className="w-full bg-white border border-brand-200 rounded-xl p-3 text-xs text-ink-900 focus:outline-none focus:border-brand-500 shadow-2xs"
                />
              </div>

              {/* Perks Checklist */}
              <div>
                <label className="block font-bold text-ink-700 mb-1.5">
                  Select Included Student Perks
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_PERKS.map((perk) => (
                    <button
                      type="button"
                      key={perk}
                      onClick={() => togglePerk(perk)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedPerks.includes(perk)
                          ? 'cc-btn-brand shadow-2xs'
                          : 'bg-white border border-brand-200 text-ink-700 hover:bg-brand-50'
                      }`}
                    >
                      {perk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Food Details if selected */}
              {selectedPerks.includes('Free Food 🍕') && (
                <div>
                  <label className="block font-bold text-ink-700 mb-1">
                    Catering & Refreshments Details
                  </label>
                  <input
                    type="text"
                    value={foodDetails}
                    onChange={(e) => setFoodDetails(e.target.value)}
                    placeholder="e.g. Fresh wood-fired pizzas, samosas, and iced drinks"
                    className="w-full bg-white border border-brand-200 rounded-xl px-3.5 py-2 text-xs text-ink-900 focus:outline-none focus:border-brand-500 shadow-2xs"
                  />
                </div>
              )}

              {/* Submit */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="cc-btn-brand px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Publish Event to Campus
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: BROADCAST ANNOUNCEMENT */}
          {activeTab === 'broadcast' && (
            <form onSubmit={handleBroadcastSubmit} className="space-y-4 text-xs">
              
              {bSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Announcement sent.
                </div>
              )}

              <div>
                <label className="block font-bold text-ink-700 mb-1">
                  Target Event Channel
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-white border border-brand-200 rounded-xl px-3 py-2.5 text-xs text-ink-900 focus:outline-none focus:border-brand-500 shadow-2xs"
                >
                  <option value="">Everyone on campus</option>
                  {existingEvents.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.rsvpCount} registered attendees)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-ink-700 mb-1">
                  Announcement Headline
                </label>
                <input
                  type="text"
                  value={bTitle}
                  onChange={(e) => setBTitle(e.target.value)}
                  placeholder="e.g. Room Changed to Ballroom B / Catering Menu Updated!"
                  required
                  className="w-full bg-white border border-brand-200 rounded-xl px-3.5 py-2 text-xs text-ink-900 focus:outline-none focus:border-brand-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-bold text-ink-700 mb-1">
                  Message Content
                </label>
                <textarea
                  rows={4}
                  value={bBody}
                  onChange={(e) => setBBody(e.target.value)}
                  placeholder="Provide important details, agenda updates, or instructions for registered attendees..."
                  required
                  className="w-full bg-white border border-brand-200 rounded-xl p-3 text-xs text-ink-900 focus:outline-none focus:border-brand-500 shadow-2xs"
                />
              </div>

              {/* Options */}
              <div className="space-y-2 bg-brand-50/60 p-3 rounded-xl border border-brand-200/80">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmailAlso}
                    onChange={(e) => setSendEmailAlso(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded accent-brand-600"
                  />
                  <span className="font-bold text-ink-900 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-brand-600" />
                    <span>Send Official Email Alert to all registered student inboxes</span>
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bUrgent}
                    onChange={(e) => setBUrgent(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded accent-brand-600"
                  />
                  <span className="font-bold text-ink-900 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    <span>Mark as Urgent (pins to campus live banner)</span>
                  </span>
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="cc-btn-brand px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Announcement</span>
                </button>
              </div>

            </form>
          )}

          {/* TAB 3: ANALYTICS & ROSTER */}
          {activeTab === 'analytics' && (
            <div className="space-y-4 text-xs">
              <p className="text-ink-600 font-medium">
                Select an event to see who registered through the app. Counts update live.
              </p>
              <div className="space-y-2">
                {existingEvents.map((ev) => {
                  const attendees = attendeesFor ? attendeesFor(ev) : [];
                  const isOpen = openRosterId === ev.id;
                  return (
                    <div key={ev.id} className="bg-white rounded-xl border border-ink-200 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenRosterId(isOpen ? null : ev.id)}
                        aria-expanded={isOpen}
                        className="w-full p-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-ink-50 transition-colors"
                      >
                        <span className="min-w-0">
                          <span className="block font-bold text-ink-900 text-xs truncate">{ev.title}</span>
                          <span className="block text-xs text-ink-500">{formatEventWhen(ev)} • {ev.building}</span>
                        </span>
                        <span className="text-right shrink-0">
                          <span className="block font-bold text-brand-600 text-sm tabular-nums">
                            {ev.rsvpCount.toLocaleString('en-IN')}
                            <span className="text-xs text-ink-400 font-normal"> / {ev.capacity.toLocaleString('en-IN')}</span>
                          </span>
                          <span className="block text-2xs text-ink-500 tabular-nums">{attendees.length} via app</span>
                        </span>
                      </button>
                      {isOpen && (
                        <div className="border-t border-ink-100 px-3 py-2.5 bg-ink-50/60">
                          {attendees.length === 0 ? (
                            <p className="text-ink-500">No one has registered through the app yet.</p>
                          ) : (
                            <ol className="space-y-1.5">
                              {[...attendees]
                                .sort((a, b) => a.createdAt - b.createdAt)
                                .map((a, index) => (
                                  <li key={a.id} className="flex items-center justify-between gap-3">
                                    <span className="font-medium text-ink-900 truncate">
                                      <span className="text-ink-400 tabular-nums mr-2">{index + 1}.</span>
                                      {a.name}
                                    </span>
                                    <span className="text-ink-500 truncate">{[a.major, a.year].filter(Boolean).join(', ')}</span>
                                  </li>
                                ))}
                            </ol>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
