import React, { useState } from 'react';
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
import { CampusEvent, PerkType, EventCategory } from '../types';
import { enhanceEventWithAI } from '../services/aiService';
import { sendOrganizerBroadcastEmail } from '../services/emailService';

interface FacultyDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostEvent: (newEvent: Partial<CampusEvent>) => void;
  onBroadcastNotification: (title: string, body: string, urgent: boolean) => void;
  existingEvents: CampusEvent[];
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
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'broadcast' | 'analytics'>('create');

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('Tech & Hackathons');
  const [organizer, setOrganizer] = useState('');
  const [building, setBuilding] = useState('Student Union Hall');
  const [room, setRoom] = useState('Ballroom A');
  const [date, setDate] = useState('2026-08-20');
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('19:00');
  const [description, setDescription] = useState('');
  const [foodDetails, setFoodDetails] = useState('');
  const [selectedPerks, setSelectedPerks] = useState<PerkType[]>(['Free Food 🍕']);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Broadcast State
  const [selectedEventId, setSelectedEventId] = useState<string>(existingEvents[0]?.id || '');
  const [bTitle, setBTitle] = useState('');
  const [bBody, setBBody] = useState('');
  const [bUrgent, setBUrgent] = useState(true);
  const [sendEmailAlso, setSendEmailAlso] = useState(true);
  const [bSuccess, setBSuccess] = useState(false);

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
    if (!title || !description || !organizer) return;

    onPostEvent({
      title,
      category,
      organizer,
      building,
      room,
      date,
      startTime,
      endTime,
      displayTime: `Aug 20, ${startTime} - ${endTime}`,
      description,
      shortDesc: description.slice(0, 90) + '...',
      perks: selectedPerks,
      foodDetails: selectedPerks.includes('Free Food 🍕') ? foodDetails || 'Complimentary catered refreshments' : undefined,
      capacity: 80,
      rsvpCount: 1,
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
      gradient: 'from-orange-800 to-amber-900',
      facultyApproved: true,
      eligibility: 'Open to all registered students',
      attendeeAvatars: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'],
      campusZone: 'Central Hub',
      mapCoords: { x: 50, y: 50 },
      isToday: false,
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1500);
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle || !bBody) return;

    const targetEv = existingEvents.find(e => e.id === selectedEventId);
    const targetTitle = targetEv ? targetEv.title : 'All Campus Students';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-2xl bg-white border border-orange-200/80 rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh] text-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-orange-50 to-amber-50/60 border-b border-orange-200/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 text-base">Organizer & Faculty Studio</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                  Organizer Access
                </span>
              </div>
              <p className="text-xs text-stone-500">Publish verified campus sessions and broadcast announcements</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white border border-orange-200 hover:bg-orange-100/60 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-orange-100 bg-orange-50/30 px-6 pt-2 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'border-orange-600 text-orange-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            + Post Campus Event
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('broadcast')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'broadcast'
                ? 'border-orange-600 text-orange-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
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
                ? 'border-orange-600 text-orange-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Attendance & Roster</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto bg-stone-50/40">
          
          {/* TAB 1: CREATE EVENT */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              
              {isSubmitted && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Event published successfully to VIT campus feeds!
                </div>
              )}

              {/* Title & AI Assist */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-stone-700 uppercase tracking-wider">Event Title</label>
                  <button
                    type="button"
                    onClick={handleEnhanceWithAI}
                    disabled={isEnhancing || (!title && !description)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-orange-600" />}
                    <span>{isEnhancing ? 'Enhancing with AI...' : 'AI Title & Perks Assist'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. ACM Full-Stack Hack Night & Pizza Social"
                  required
                  className="w-full bg-white border border-orange-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                />
              </div>

              {/* Category & Organizer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventCategory)}
                    className="w-full bg-white border border-orange-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">Host Organization</label>
                  <input
                    type="text"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    placeholder="e.g. GDSC Campus / Robotics Guild"
                    required
                    className="w-full bg-white border border-orange-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Location & Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">Campus Building</label>
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    placeholder="e.g. Student Union Center"
                    required
                    className="w-full bg-white border border-orange-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">Room / Hall</label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. Ballroom A / Lab 102"
                    required
                    className="w-full bg-white border border-orange-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-white border border-orange-200 rounded-xl px-2.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full bg-white border border-orange-200 rounded-xl px-2.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full bg-white border border-orange-200 rounded-xl px-2.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what attendees will learn, build, or experience..."
                  required
                  className="w-full bg-white border border-orange-200 rounded-xl p-3 text-xs text-stone-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                />
              </div>

              {/* Perks Checklist */}
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1.5">
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
                          ? 'bg-orange-600 text-white shadow-2xs'
                          : 'bg-white border border-orange-200 text-stone-700 hover:bg-orange-50'
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
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Catering & Refreshments Details
                  </label>
                  <input
                    type="text"
                    value={foodDetails}
                    onChange={(e) => setFoodDetails(e.target.value)}
                    placeholder="e.g. Fresh wood-fired pizzas, samosas, and iced drinks"
                    className="w-full bg-white border border-orange-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  />
                </div>
              )}

              {/* Submit */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
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
                  Announcement dispatched via Push Alert and Email!
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Target Event Channel
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-white border border-orange-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                >
                  {existingEvents.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.rsvpCount} registered attendees)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Announcement Headline
                </label>
                <input
                  type="text"
                  value={bTitle}
                  onChange={(e) => setBTitle(e.target.value)}
                  placeholder="e.g. Room Changed to Ballroom B / Catering Menu Updated!"
                  required
                  className="w-full bg-white border border-orange-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Message Content
                </label>
                <textarea
                  rows={4}
                  value={bBody}
                  onChange={(e) => setBBody(e.target.value)}
                  placeholder="Provide important details, agenda updates, or instructions for registered attendees..."
                  required
                  className="w-full bg-white border border-orange-200 rounded-xl p-3 text-xs text-stone-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                />
              </div>

              {/* Options */}
              <div className="space-y-2 bg-orange-50/60 p-3 rounded-xl border border-orange-200/80">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmailAlso}
                    onChange={(e) => setSendEmailAlso(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded accent-orange-600"
                  />
                  <span className="font-bold text-stone-900 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-orange-600" />
                    <span>Send Official Email Alert to all registered student inboxes</span>
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bUrgent}
                    onChange={(e) => setBUrgent(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded accent-orange-600"
                  />
                  <span className="font-bold text-stone-900 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    <span>Mark as Urgent (pins to campus live banner)</span>
                  </span>
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
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
              <p className="text-stone-600 font-medium">Real-time RSVP registrations across all hosted campus events:</p>
              <div className="space-y-2">
                {existingEvents.map((ev) => (
                  <div key={ev.id} className="p-3 bg-white rounded-xl border border-orange-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-stone-900 text-xs">{ev.title}</h4>
                      <p className="text-[11px] text-stone-500">{ev.displayTime} • {ev.building}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-orange-600 text-sm">{ev.rsvpCount}</span>
                      <span className="text-[11px] text-stone-400">/{ev.capacity} spots</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
