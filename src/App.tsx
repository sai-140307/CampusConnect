import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Network, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';

import {
  CampusEvent,
  CampusClub,
  CampusResource,
  NotificationItem,
  ChatMessage,
  UserProfile,
  AIMatchResult,
  UserRole,
  EmailNotificationSettings,
  EventRegistration,
} from './types';

import {
  MOCK_EVENTS,
  MOCK_CLUBS,
  MOCK_RESOURCES,
  INITIAL_USER,
  buildInitialNotifications,
  INITIAL_CHAT_MESSAGES,
} from './data/mockData';
import { SEED_CYCLE_START } from './data/mockEvents';

import { requestAIMatch } from './services/aiService';
import { Navbar } from './components/Navbar';
import { LiveCampusTicker } from './components/LiveCampusTicker';
import { ExploreView } from './components/views/ExploreView';
import { EventsView } from './components/views/EventsView';
import { ClubsView } from './components/views/ClubsView';
import { ResourcesView } from './components/views/ResourcesView';
import { InteractiveCampusMap } from './components/InteractiveCampusMap';
import { SocialCalendarView } from './components/SocialCalendarView';
import { EventDetailModal } from './components/EventDetailModal';
import { ClubDetailModal } from './components/ClubDetailModal';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { LiveChatModal } from './components/LiveChatModal';
import { FacultyDashboardModal } from './components/FacultyDashboardModal';
import { NotificationDropdown } from './components/NotificationDropdown';
import { UserProfileModal } from './components/UserProfileModal';
import { EmailNotificationModal } from './components/EmailNotificationModal';
import { CampusVideoShowcase } from './components/CampusVideoShowcase';
import { AuthScreen } from './components/AuthScreen';
import { Toast } from './components/Toast';

import {
  auth,
  db,
  logOutUser,
  onAuthStateChanged,
  syncUserProfileToFirestore,
  fetchUserProfileFromFirestore,
  subscribeToCampusChats,
  sendChatMessageToFirestore,
  updateChatLikeInFirestore,
  subscribeToEvents,
  saveEventToFirestore,
  deleteEventFromFirestore,
  subscribeToRegistrations,
  registerForEvent,
  cancelRegistration,
  registrationId,
  FirebaseUser,
} from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';

import { sendRsvpConfirmationEmail, sendClubWelcomeEmail, sendMissedEventEmail } from './services/emailService';
import { getSentWrapUpKeys, markWrapUpSent, wrapUpKey } from './utils/dateSyncUtils';
import { compareEventsByStart, eventEndMs, isEventEnded, now as syncedNow } from './utils/campusTime';
import { useNow } from './hooks/useNow';
import { useModal } from './hooks/useModal';
import { readJson, readString, writeJson, writeString } from './utils/storage';
import { initialsAvatar } from './utils/imageUtils';

type Tab = 'explore' | 'events' | 'clubs' | 'resources' | 'map' | 'calendar' | 'faculty';
type Theme = 'light' | 'dark';

const STORAGE_KEYS = {
  USER: 'campusconnect_user_v1',
  NOTIFICATIONS: 'campusconnect_notifications_v1',
  MESSAGES: 'campusconnect_messages_v1',
  SEED_CYCLE: 'campusconnect_seed_cycle_v1',
  THEME: 'campusconnect_theme_v1',
};

const SEED_EVENT_IDS = new Set(MOCK_EVENTS.map((e) => e.id));
const DAY_MS = 86_400_000;

const DEFAULT_EMAIL_SETTINGS: EmailNotificationSettings = {
  enabled: true,
  recipientEmail: '',
  notifyOnRsvp: true,
  notifyOnMissedEvent: true,
  notify24hBefore: true,
  notify1hBefore: true,
  notifyClubAnnouncements: true,
  notifyAiDigest: true,
};

const asStringArray = (value: unknown, fallback: string[] = []): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : fallback;

/** Build a complete, well-formed profile from whatever was stored or synced. */
function normalizeProfile(base: UserProfile, incoming: Partial<UserProfile> | null | undefined): UserProfile {
  const data = incoming || {};
  return {
    ...base,
    ...data,
    name: (typeof data.name === 'string' && data.name.trim()) || base.name,
    role: data.role === 'organizer' || data.role === 'student' ? data.role : base.role,
    rsvpdEvents: asStringArray(data.rsvpdEvents, base.rsvpdEvents),
    savedEvents: asStringArray(data.savedEvents, base.savedEvents),
    joinedClubs: asStringArray(data.joinedClubs, base.joinedClubs),
    savedResources: asStringArray(data.savedResources, base.savedResources),
    interests: asStringArray(data.interests, base.interests),
    preferredPerks: Array.isArray(data.preferredPerks) ? data.preferredPerks : base.preferredPerks,
    emailSettings: { ...DEFAULT_EMAIL_SETTINGS, ...(base.emailSettings || {}), ...(data.emailSettings || {}) },
  };
}

/** The fields that are kept in the cloud, in a stable order so they can be compared. */
function cloudProfileFields(profile: UserProfile) {
  return {
    name: profile.name,
    email: profile.email || '',
    major: profile.major,
    year: profile.year,
    campusZone: profile.campusZone,
    role: profile.role,
    interests: profile.interests,
    preferredPerks: profile.preferredPerks,
    rsvpdEvents: profile.rsvpdEvents,
    savedEvents: profile.savedEvents,
    joinedClubs: profile.joinedClubs,
    savedResources: profile.savedResources,
    emailSettings: profile.emailSettings || DEFAULT_EMAIL_SETTINGS,
    seedCycle: SEED_CYCLE_START,
  };
}

/** RSVPs to sample events belong to one schedule cycle; drop them when a new cycle starts. */
function dropStaleSeedEvents(profile: UserProfile, cycle: string | null | undefined): UserProfile {
  if (!cycle || cycle === SEED_CYCLE_START) return profile;
  return {
    ...profile,
    rsvpdEvents: profile.rsvpdEvents.filter((id) => !SEED_EVENT_IDS.has(id)),
    savedEvents: profile.savedEvents.filter((id) => !SEED_EVENT_IDS.has(id)),
  };
}

function loadInitialProfile(): UserProfile {
  const stored = readJson<Partial<UserProfile> | null>(STORAGE_KEYS.USER, null);
  const profile = normalizeProfile(INITIAL_USER, stored);
  return dropStaleSeedEvents(profile, readString(STORAGE_KEYS.SEED_CYCLE));
}

/** Identifies one occurrence of an event: sample events repeat on new dates. */
const occurrenceKey = (eventId: string, date: string) => `${eventId}__${date}`;

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item || !item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export default function App() {
  const now = useNow();

  const [activeTab, setActiveTab] = useState<Tab>('explore');

  // Theme
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = readString(STORAGE_KEYS.THEME);
    if (saved === 'light' || saved === 'dark') return saved;
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    writeString(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // A new page starts at the top.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeTab]);

  // Auth
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  /** Role chosen (and verified) on the sign-in screen, applied when sign-in completes. */
  const pendingRoleRef = useRef<UserRole | null>(null);

  // Data
  const [userProfile, setUserProfile] = useState<UserProfile>(loadInitialProfile);
  /** Events organizers have published, live from the shared database. */
  const [publishedEvents, setPublishedEvents] = useState<CampusEvent[]>([]);
  /** Everyone's registrations, live from the shared database. */
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [registrationsLoaded, setRegistrationsLoaded] = useState(false);
  const [sharedDataError, setSharedDataError] = useState(false);
  const [clubs, setClubs] = useState<CampusClub[]>(() => {
    const joined = new Set(loadInitialProfile().joinedClubs);
    return MOCK_CLUBS.map((c) => (joined.has(c.id) ? { ...c, membersCount: c.membersCount + 1 } : c));
  });
  const resources: CampusResource[] = MOCK_RESOURCES;

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const stored = readJson<NotificationItem[] | null>(STORAGE_KEYS.NOTIFICATIONS, null);
    return Array.isArray(stored) ? dedupeById(stored) : buildInitialNotifications(MOCK_EVENTS);
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const stored = readJson<ChatMessage[] | null>(STORAGE_KEYS.MESSAGES, null);
    return Array.isArray(stored) ? dedupeById(stored) : INITIAL_CHAT_MESSAGES;
  });

  // AI matchmaker
  const [aiMatchResult, setAiMatchResult] = useState<AIMatchResult | null>(null);
  const [isAiMatching, setIsAiMatching] = useState(false);

  // Dialogs
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<CampusResource | null>(null);
  const [chatTarget, setChatTarget] = useState<{ id: string; type: 'event' | 'club'; title: string } | null>(null);
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isRestrictedModalOpen, setIsRestrictedModalOpen] = useState(false);
  const [isVideoShowcaseOpen, setIsVideoShowcaseOpen] = useState(false);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);

  // Registrations grouped by event occurrence, for live counts and attendee lists.
  const registrationsByOccurrence = useMemo(() => {
    const map = new Map<string, EventRegistration[]>();
    registrations.forEach((r) => {
      const key = occurrenceKey(r.eventId, r.eventDate);
      const list = map.get(key);
      if (list) list.push(r);
      else map.set(key, [r]);
    });
    return map;
  }, [registrations]);

  // Every event: published ones first, then the built-in samples. The "going"
  // count is the event's starting number plus real registrations from everyone.
  const events = useMemo(() => {
    const cutoff = syncedNow() - 30 * DAY_MS;
    const published = publishedEvents.filter((e) => !SEED_EVENT_IDS.has(e.id) && eventEndMs(e) > cutoff);
    return [...published, ...MOCK_EVENTS].map((e) => {
      const extra = registrationsByOccurrence.get(occurrenceKey(e.id, e.date))?.length || 0;
      return extra ? { ...e, rsvpCount: e.rsvpCount + extra } : e;
    });
  }, [publishedEvents, registrationsByOccurrence]);

  // Always read the selected event and club from the live lists, so an open
  // dialog shows current counts instead of a stale copy.
  const selectedEvent = useMemo(
    () => (selectedEventId ? events.find((e) => e.id === selectedEventId) || null : null),
    [events, selectedEventId]
  );
  const selectedClub = useMemo(
    () => (selectedClubId ? clubs.find((c) => c.id === selectedClubId) || null : null),
    [clubs, selectedClubId]
  );

  const upcomingEvents = useMemo(
    () => events.filter((e) => !isEventEnded(e, now)).sort(compareEventsByStart),
    [events, now]
  );

  const activeEmail = firebaseUser?.email || userProfile.email || userProfile.emailSettings?.recipientEmail || '';

  // ---- Persistence -------------------------------------------------------

  useEffect(() => {
    writeJson(STORAGE_KEYS.USER, userProfile);
    writeString(STORAGE_KEYS.SEED_CYCLE, SEED_CYCLE_START);
  }, [userProfile]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.NOTIFICATIONS, notifications.slice(0, 100));
  }, [notifications]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.MESSAGES, messages.slice(0, 300));
  }, [messages]);

  // ---- Toast -------------------------------------------------------------

  const showToast = useCallback((message: string) => {
    setToast({ id: Date.now() + Math.random(), message });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  // ---- Live chat sync ----------------------------------------------------

  // Subscribes once someone is signed in: the database only lets signed-in people read messages.
  const signedInUid = firebaseUser?.uid;
  useEffect(() => {
    if (!signedInUid) return;
    const unsubscribe = subscribeToCampusChats((remote) => {
      if (!remote || remote.length === 0) return;
      setMessages((prev) => {
        const likedByMe = new Set(prev.filter((m) => m.isLikedByMe).map((m) => m.id));
        const remoteIds = new Set(remote.map((m) => m.id));
        const merged = [
          ...remote.map((m) => (likedByMe.has(m.id) ? { ...m, isLikedByMe: true } : m)),
          ...prev.filter((m) => !remoteIds.has(m.id)),
        ];
        return merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      });
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [signedInUid]);

  // ---- Shared events and registrations -----------------------------------

  useEffect(() => {
    if (!signedInUid) {
      setPublishedEvents([]);
      setRegistrations([]);
      setRegistrationsLoaded(false);
      return;
    }
    setSharedDataError(false);
    const stopEvents = subscribeToEvents(setPublishedEvents, () => setSharedDataError(true));
    const stopRegistrations = subscribeToRegistrations(
      (list) => {
        setRegistrations(list);
        setRegistrationsLoaded(true);
      },
      () => setSharedDataError(true)
    );
    return () => {
      stopEvents();
      stopRegistrations();
    };
  }, [signedInUid]);

  // The signed-in person's schedule is exactly their registrations for the
  // current occurrences. Keep the profile's list in step with that.
  useEffect(() => {
    if (!signedInUid || !registrationsLoaded) return;
    const current = new Set(events.map((e) => occurrenceKey(e.id, e.date)));
    const mine = registrations
      .filter((r) => r.uid === signedInUid && current.has(occurrenceKey(r.eventId, r.eventDate)))
      .map((r) => r.eventId)
      .sort();
    setUserProfile((prev) => {
      const before = [...prev.rsvpdEvents].sort();
      if (before.length === mine.length && before.every((id, i) => id === mine[i])) return prev;
      return { ...prev, rsvpdEvents: mine };
    });
  }, [registrations, registrationsLoaded, signedInUid, events]);

  // ---- Wrap-up notices for events the student attended --------------------

  const addNotification = useCallback((notif: NotificationItem) => {
    setNotifications((prev) => (prev.some((n) => n.id === notif.id) ? prev : [notif, ...prev]));
  }, []);

  useEffect(() => {
    if (userProfile.rsvpdEvents.length === 0) return;
    const mine = new Set(userProfile.rsvpdEvents);
    const alreadySent = new Set(getSentWrapUpKeys());

    events.forEach((ev) => {
      if (!mine.has(ev.id) || !isEventEnded(ev, now)) return;
      const key = wrapUpKey(ev);
      if (alreadySent.has(key)) return;
      markWrapUpSent(key);

      addNotification({
        id: `wrap-up-${key}`,
        title: `Wrapped up: ${ev.title}`,
        body: `${ev.title} has ended. The attendee discussion stays open if you want to follow up.`,
        timestamp: 'Just now',
        createdAt: Math.min(syncedNow(), eventEndMs(ev)),
        isRead: false,
        type: 'reminder',
        eventId: ev.id,
      });

      const emailOn =
        userProfile.emailSettings?.enabled !== false && userProfile.emailSettings?.notifyOnMissedEvent !== false;
      if (emailOn && activeEmail) sendMissedEventEmail(userProfile, ev, activeEmail);
    });
    // Runs on each clock tick; the profile object itself is intentionally not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, events, userProfile.rsvpdEvents, activeEmail]);

  // ---- Auth + cloud profile ----------------------------------------------

  /** JSON of the profile as last seen in / written to the cloud. Prevents write loops. */
  const lastCloudProfileRef = useRef<string>('');
  const cloudReadyRef = useRef(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let cancelled = false;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      cloudReadyRef.current = false;
      lastCloudProfileRef.current = '';
      setFirebaseUser(user);

      if (!user) {
        setIsAuthChecking(false);
        return;
      }

      const cloud = await fetchUserProfileFromFirestore(user.uid);
      if (cancelled) return;

      const verifiedRole = pendingRoleRef.current;
      pendingRoleRef.current = null;
      const fallbackName = user.displayName || (user.email ? user.email.split('@')[0] : '');

      setUserProfile((prev) => {
        // A different account signed in on this device: start from a clean profile.
        const base = prev.email && user.email && prev.email !== user.email ? INITIAL_USER : prev;
        let next = normalizeProfile(base, cloud as Partial<UserProfile> | null);
        next = dropStaleSeedEvents(next, cloud?.seedCycle);
        next.email = user.email || next.email;
        if (!cloud?.name && fallbackName && (next.name === INITIAL_USER.name || !next.name)) next.name = fallbackName;
        // Organizer access is granted on sign-in (with the passcode) and then remembered.
        // If the cloud profile could not be read, keep the role this device already had
        // rather than silently demoting (and then overwriting) an organizer.
        const knownOrganizer = cloud ? cloud.role === 'organizer' : base.role === 'organizer';
        next.role = verifiedRole === 'organizer' || knownOrganizer ? 'organizer' : 'student';
        next.emailSettings = {
          ...DEFAULT_EMAIL_SETTINGS,
          ...next.emailSettings,
          recipientEmail: next.emailSettings?.recipientEmail || user.email || '',
        };
        return next;
      });

      cloudReadyRef.current = true;
      setIsAuthChecking(false);

      try {
        unsubscribeProfile = onSnapshot(
          doc(db, 'users', user.uid),
          (snap: any) => {
            // Skip echoes of our own pending writes.
            if (!snap.exists() || snap.metadata?.hasPendingWrites) return;
            const data = snap.data() as Partial<UserProfile> & { seedCycle?: string };
            setUserProfile((prev) => {
              const merged = dropStaleSeedEvents(normalizeProfile(prev, data), data.seedCycle);
              merged.email = user.email || merged.email;
              const mergedJson = JSON.stringify(cloudProfileFields(merged));
              lastCloudProfileRef.current = mergedJson;
              return mergedJson === JSON.stringify(cloudProfileFields(prev)) ? prev : merged;
            });
          },
          (err: unknown) => console.warn('Profile sync paused:', err)
        );
      } catch (err) {
        console.warn('Profile sync unavailable:', err);
      }
    });

    return () => {
      cancelled = true;
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // Push local profile changes (RSVPs, clubs, preferences) to the cloud so
  // they follow the student across devices. Debounced, and skipped when the
  // cloud already has the same data.
  useEffect(() => {
    if (!firebaseUser?.uid || !cloudReadyRef.current) return;
    const fields = cloudProfileFields(userProfile);
    const json = JSON.stringify(fields);
    if (json === lastCloudProfileRef.current) return;

    const uid = firebaseUser.uid;
    const timer = setTimeout(() => {
      lastCloudProfileRef.current = json;
      void syncUserProfileToFirestore(uid, fields);
    }, 800);
    return () => clearTimeout(timer);
  }, [userProfile, firebaseUser?.uid]);

  const handleLogout = async () => {
    const result = await logOutUser();
    if (!result.success) {
      showToast('Could not sign out. Check your connection and try again.');
      return;
    }
    setActiveTab('explore');
    showToast('Signed out.');
  };

  // ---- Actions -----------------------------------------------------------

  const handleAIMatchSearch = async (query: string) => {
    setIsAiMatching(true);
    try {
      const result = await requestAIMatch(query, upcomingEvents, clubs, resources, userProfile);
      setAiMatchResult(result);
      const total = result.matchedEvents.length + result.matchedClubs.length + result.matchedResources.length;
      showToast(total > 0 ? `Found ${total} matches.` : 'No matches found. Try different words.');
    } catch (e) {
      console.error(e);
      showToast('Search failed. Try again.');
    } finally {
      setIsAiMatching(false);
    }
  };

  const handleToggleRsvp = useCallback(
    (eventId: string) => {
      const target = events.find((e) => e.id === eventId);
      if (!target) return;
      const wasGoing = userProfile.rsvpdEvents.includes(eventId);

      if (!wasGoing && isEventEnded(target, syncedNow())) {
        showToast('This event has already ended.');
        return;
      }
      if (!wasGoing && target.rsvpCount >= target.capacity) {
        showToast('This event is full.');
        return;
      }

      if (!signedInUid) return;
      const id = registrationId(target.id, target.date, signedInUid);

      // The database listener updates the schedule and the count for everyone,
      // including this device, as soon as the write is made.
      const write = wasGoing
        ? cancelRegistration(id)
        : registerForEvent({
            id,
            eventId: target.id,
            eventDate: target.date,
            uid: signedInUid,
            name: userProfile.name || 'Student',
            major: userProfile.major,
            year: userProfile.year,
            createdAt: syncedNow(),
          });
      write.catch((err) => {
        console.warn('Registration failed:', err);
        showToast(wasGoing ? 'Could not cancel your RSVP. Try again.' : 'Could not save your RSVP. Try again.');
      });

      if (wasGoing) {
        showToast('RSVP cancelled.');
        return;
      }

      confetti({ particleCount: 40, spread: 60, origin: { y: 0.75 }, disableForReducedMotion: true });
      const emailOn = userProfile.emailSettings?.enabled !== false && userProfile.emailSettings?.notifyOnRsvp !== false;
      if (emailOn && activeEmail) {
        sendRsvpConfirmationEmail(userProfile, target, activeEmail);
        showToast('RSVP confirmed. Your ticket is in the email center.');
      } else {
        showToast('RSVP confirmed.');
      }
    },
    [events, userProfile, activeEmail, showToast, signedInUid]
  );

  const handleToggleJoinClub = useCallback(
    (clubId: string) => {
      const target = clubs.find((c) => c.id === clubId);
      if (!target) return;
      const wasMember = userProfile.joinedClubs.includes(clubId);

      setUserProfile((prev) => ({
        ...prev,
        joinedClubs: wasMember
          ? prev.joinedClubs.filter((id) => id !== clubId)
          : Array.from(new Set([...prev.joinedClubs, clubId])),
      }));
      setClubs((prev) =>
        prev.map((c) => (c.id === clubId ? { ...c, membersCount: Math.max(0, c.membersCount + (wasMember ? -1 : 1)) } : c))
      );

      if (wasMember) {
        showToast(`You left ${target.name}.`);
        return;
      }

      confetti({ particleCount: 40, spread: 60, origin: { y: 0.75 }, disableForReducedMotion: true });
      const emailOn =
        userProfile.emailSettings?.enabled !== false && userProfile.emailSettings?.notifyClubAnnouncements !== false;
      if (emailOn && activeEmail) sendClubWelcomeEmail(userProfile, target, activeEmail);
      showToast(`You joined ${target.name}.`);
    },
    [clubs, userProfile, activeEmail, showToast]
  );

  const handleToggleSaveResource = useCallback(
    (resId: string) => {
      const wasSaved = userProfile.savedResources.includes(resId);
      setUserProfile((prev) => ({
        ...prev,
        savedResources: wasSaved
          ? prev.savedResources.filter((id) => id !== resId)
          : Array.from(new Set([...prev.savedResources, resId])),
      }));
      showToast(wasSaved ? 'Bookmark removed.' : 'Saved to your profile.');
    },
    [userProfile.savedResources, showToast]
  );

  const postMessage = useCallback(
    async (target: { id: string; type: 'event' | 'club' }, text: string, tag?: ChatMessage['tag']) => {
      const senderName = userProfile.name || (activeEmail ? activeEmail.split('@')[0] : 'Student');
      const message: ChatMessage = {
        id: newId('msg'),
        targetId: target.id,
        targetType: target.type,
        senderName,
        senderAvatar: initialsAvatar(senderName),
        senderRole: userProfile.role === 'organizer' ? 'organizer' : 'student',
        text,
        timestamp: 'Just now',
        createdAt: syncedNow(),
        likes: 0,
        tag: tag || 'general',
      };
      // Show it immediately, then save it for everyone else.
      setMessages((prev) => [message, ...prev]);
      await sendChatMessageToFirestore(message);
    },
    [userProfile.name, userProfile.role, activeEmail]
  );

  const handleToggleLikeMessage = useCallback(
    (msgId: string) => {
      const target = messages.find((m) => m.id === msgId);
      if (!target) return;
      const likes = Math.max(0, target.likes + (target.isLikedByMe ? -1 : 1));
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, isLikedByMe: !target.isLikedByMe, likes } : m)));
      void updateChatLikeInFirestore(msgId, likes);
    },
    [messages]
  );

  const requireOrganizer = (): boolean => {
    if (userProfile.role === 'organizer') return true;
    setIsRestrictedModalOpen(true);
    return false;
  };

  const handleCreateEvent = (draft: Partial<CampusEvent>) => {
    if (!requireOrganizer()) return;

    const created: CampusEvent = {
      shortDesc: '',
      description: '',
      category: 'Academic & STEM',
      organizer: 'Student Organization',
      organizerRole: 'student_club',
      building: 'Student Union Center',
      room: 'Room 101',
      mapCoords: { x: 50, y: 50 },
      startTime: '17:00',
      endTime: '19:00',
      perks: [],
      tags: ['Campus'],
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
      gradient: 'from-indigo-800 to-slate-900',
      rsvpCount: 0,
      capacity: 100,
      isHot: false,
      facultyApproved: true,
      eligibility: 'All students',
      attendeeAvatars: [],
      campusZone: 'Central Hub',
      ...draft,
      createdBy: signedInUid,
      createdAt: syncedNow(),
      id: newId('ev'),
      title: (draft.title || 'Campus event').trim(),
      date: draft.date || '',
    };

    // Saved to the shared database, so it appears for every student straight away.
    saveEventToFirestore(created)
      .then(() => {
        addNotification({
          id: newId('notif'),
          title: `New event: ${created.title}`,
          body: `Hosted by ${created.organizer} in ${created.building} (${created.room}).`,
          timestamp: 'Just now',
          createdAt: syncedNow(),
          type: 'reminder',
          eventId: created.id,
          isRead: false,
        });
        showToast('Event published.');
      })
      .catch((err) => {
        console.warn('Publish failed:', err);
        showToast('Could not publish the event. Check your connection and try again.');
      });
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!requireOrganizer()) return;
    if (SEED_EVENT_IDS.has(eventId)) {
      showToast('Built-in sample events cannot be deleted.');
      return;
    }
    deleteEventFromFirestore(eventId)
      .then(() => {
        setSelectedEventId((current) => (current === eventId ? null : current));
        showToast('Event deleted.');
      })
      .catch((err) => {
        console.warn('Delete failed:', err);
        showToast('Only the organizer who published this event can delete it.');
      });
  };

  const handleBroadcastNotification = (title: string, body: string, urgent: boolean) => {
    if (!requireOrganizer()) return;
    addNotification({
      id: newId('notif-broadcast'),
      title,
      body,
      timestamp: 'Just now',
      createdAt: syncedNow(),
      type: 'faculty_note',
      isRead: false,
      urgent,
    });
    showToast('Announcement sent.');
  };

  const openEventChat = useCallback(
    (eventId: string) => {
      const ev = events.find((e) => e.id === eventId);
      if (ev) setChatTarget({ id: ev.id, type: 'event', title: ev.title });
    },
    [events]
  );

  const openClubChat = useCallback(
    (clubId: string) => {
      const club = clubs.find((c) => c.id === clubId);
      if (club) setChatTarget({ id: club.id, type: 'club', title: club.name });
    },
    [clubs]
  );

  const selectEvent = useCallback((event: CampusEvent) => setSelectedEventId(event.id), []);
  const selectClub = useCallback((club: CampusClub) => setSelectedClubId(club.id), []);

  const openNotification = (notif: NotificationItem) => {
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
    if (notif.eventId && events.some((e) => e.id === notif.eventId)) {
      setIsNotificationOpen(false);
      setSelectedEventId(notif.eventId);
    } else {
      setIsNotificationOpen(true);
    }
  };

  const closeRestricted = useCallback(() => setIsRestrictedModalOpen(false), []);
  useModal(isRestrictedModalOpen, closeRestricted);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;
  const chatMessages = useMemo(
    () => (chatTarget ? messages.filter((m) => m.targetId === chatTarget.id) : []),
    [messages, chatTarget]
  );

  // ---- Render ------------------------------------------------------------

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center" role="status" aria-live="polite">
        <div className="text-center space-y-4">
          <div className="cc-btn-brand cc-loader-mark w-12 h-12 rounded-2xl flex items-center justify-center mx-auto">
            <Network className="w-6 h-6" />
          </div>
          <p className="text-sm text-ink-600 font-medium">Opening CampusConnect</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <>
        <AuthScreen
          onRoleVerified={(role) => {
            pendingRoleRef.current = role;
          }}
        />
        <Toast toast={toast} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink-900 flex flex-col">
      <a href="#main" className="cc-skip-link">
        Skip to content
      </a>

      <Toast toast={toast} onDismiss={dismissToast} />

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={notifications}
        unreadCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
        onOpenFacultyModal={() => {
          if (requireOrganizer()) setIsFacultyModalOpen(true);
        }}
        userProfile={userProfile}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        firebaseUser={firebaseUser}
        onLogout={handleLogout}
        onRoleRestrictedNotice={() => setIsRestrictedModalOpen(true)}
        onOpenVideoShowcase={() => setIsVideoShowcaseOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      />

      <LiveCampusTicker notifications={notifications} onSelectNotification={openNotification} />

      {sharedDataError && (
        <div role="alert" className="bg-rose-50 border-b border-rose-200 text-rose-800 text-sm px-4 py-2 text-center">
          Live event data could not be loaded, so registrations are unavailable. Check your connection and that the
          database rules are deployed, then reload.
        </div>
      )}

      <main id="main" className="flex-1">
        <div key={activeTab} className="cc-page">
          {activeTab === 'explore' && (
            <ExploreView
              events={upcomingEvents}
              allEvents={events}
              clubs={clubs}
              resources={resources}
              userProfile={userProfile}
              onSelectEvent={selectEvent}
              onSelectClub={selectClub}
              onSelectResource={setSelectedResource}
              onToggleRsvp={handleToggleRsvp}
              onToggleJoinClub={handleToggleJoinClub}
              onToggleSaveResource={handleToggleSaveResource}
              onOpenEventChat={openEventChat}
              onOpenClubChat={openClubChat}
              onSearchAI={handleAIMatchSearch}
              isAiMatching={isAiMatching}
              aiMatchResult={aiMatchResult}
              onClearMatchResult={() => setAiMatchResult(null)}
              onNavigateTab={setActiveTab}
              onOpenVideoShowcase={() => setIsVideoShowcaseOpen(true)}
            />
          )}

          {activeTab === 'events' && (
            <EventsView
              events={events}
              userProfile={userProfile}
              onSelectEvent={selectEvent}
              onToggleRsvp={handleToggleRsvp}
              onOpenChat={openEventChat}
              onOpenCreateModal={() => setIsFacultyModalOpen(true)}
              onDeleteEvent={handleDeleteEvent}
            />
          )}

          {activeTab === 'clubs' && (
            <ClubsView
              clubs={clubs}
              userProfile={userProfile}
              onSelectClub={selectClub}
              onToggleJoinClub={handleToggleJoinClub}
              onOpenChat={openClubChat}
            />
          )}

          {activeTab === 'resources' && (
            <ResourcesView
              resources={resources}
              userProfile={userProfile}
              onSelectResource={setSelectedResource}
              onToggleSaveResource={handleToggleSaveResource}
            />
          )}

          {activeTab === 'map' && (
            <InteractiveCampusMap
              events={upcomingEvents}
              resources={resources}
              onSelectEvent={selectEvent}
              onSelectResource={setSelectedResource}
            />
          )}

          {activeTab === 'calendar' && (
            <SocialCalendarView
              allEvents={events}
              rsvpdEvents={userProfile.rsvpdEvents}
              onSelectEvent={selectEvent}
              onRemoveRsvp={handleToggleRsvp}
              onNavigateExplore={() => setActiveTab('events')}
            />
          )}
        </div>
      </main>

      <EventDetailModal
        event={selectedEvent}
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEventId(null)}
        isRsvpd={selectedEvent ? userProfile.rsvpdEvents.includes(selectedEvent.id) : false}
        onRsvp={handleToggleRsvp}
        onOpenChat={openEventChat}
        allEvents={events}
        rsvpdEvents={userProfile.rsvpdEvents}
        userProfile={userProfile}
        messages={messages}
        onSendMessage={(text, tag) => {
          if (selectedEvent) void postMessage({ id: selectedEvent.id, type: 'event' }, text, tag);
        }}
        onDeleteEvent={handleDeleteEvent}
      />

      <ClubDetailModal
        club={selectedClub}
        isOpen={Boolean(selectedClub)}
        onClose={() => setSelectedClubId(null)}
        isJoined={selectedClub ? userProfile.joinedClubs.includes(selectedClub.id) : false}
        onToggleJoin={handleToggleJoinClub}
        onOpenChat={openClubChat}
      />

      <ResourceDetailModal
        resource={selectedResource}
        isOpen={Boolean(selectedResource)}
        onClose={() => setSelectedResource(null)}
        isSaved={selectedResource ? userProfile.savedResources.includes(selectedResource.id) : false}
        onToggleSave={handleToggleSaveResource}
        onLocateOnMap={() => setActiveTab('map')}
      />

      <LiveChatModal
        isOpen={Boolean(chatTarget)}
        onClose={() => setChatTarget(null)}
        targetTitle={chatTarget?.title || 'Discussion'}
        targetType={chatTarget?.type || 'event'}
        messages={chatMessages}
        onSendMessage={(text, tag) => {
          if (chatTarget) void postMessage(chatTarget, text, tag);
        }}
        onToggleLikeMessage={handleToggleLikeMessage}
        userProfile={userProfile}
      />

      <FacultyDashboardModal
        isOpen={isFacultyModalOpen}
        onClose={() => setIsFacultyModalOpen(false)}
        onPostEvent={handleCreateEvent}
        onBroadcastNotification={handleBroadcastNotification}
        existingEvents={upcomingEvents}
        attendeesFor={(ev) => registrationsByOccurrence.get(occurrenceKey(ev.id, ev.date)) || []}
      />

      <EmailNotificationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        userProfile={userProfile}
        emailSettings={{
          ...DEFAULT_EMAIL_SETTINGS,
          ...userProfile.emailSettings,
          recipientEmail: userProfile.emailSettings?.recipientEmail || activeEmail,
        }}
        onUpdateEmailSettings={(next: EmailNotificationSettings) => {
          setUserProfile((prev) => ({ ...prev, emailSettings: next }));
          showToast('Email preferences saved.');
        }}
        userEmail={activeEmail || undefined}
      />

      <CampusVideoShowcase
        isOpen={isVideoShowcaseOpen}
        onClose={() => setIsVideoShowcaseOpen(false)}
        onExploreEvents={() => setActiveTab('events')}
        isOrganizer={userProfile.role === 'organizer'}
        onRoleRestrictedNotice={() => setIsRestrictedModalOpen(true)}
      />

      {isRestrictedModalOpen && (
        <div
          className="cc-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-xs"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeRestricted();
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="restricted-title"
            className="cc-dialog bg-white border border-ink-200 rounded-2xl p-6 max-w-md shadow-2xl text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 id="restricted-title" className="font-display font-semibold text-lg text-ink-900">
                Only organizers can do this
              </h3>
              <p className="text-sm text-ink-600 mt-1.5 leading-relaxed">
                Publishing, deleting and announcing events is limited to event organizers and faculty. If that is you,
                sign out and sign back in as an organizer with your passcode.
              </p>
            </div>
            <button
              autoFocus
              onClick={closeRestricted}
              className="cc-btn-ink w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <NotificationDropdown
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))}
        onClearAll={() => setNotifications([])}
        onSelectNotification={openNotification}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={(updated) => {
          setUserProfile((prev) => normalizeProfile(prev, { ...updated, role: prev.role }));
          showToast('Profile saved.');
        }}
        allEvents={events}
        allClubs={clubs}
        allResources={resources}
        onSelectEvent={selectEvent}
        onSelectClub={selectClub}
        onSelectResource={setSelectedResource}
        onRemoveRsvp={handleToggleRsvp}
        onRemoveClub={handleToggleJoinClub}
        onRemoveResource={handleToggleSaveResource}
      />

      <footer className="bg-white border-t border-ink-200 py-8 px-4 text-sm text-ink-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="cc-btn-brand w-7 h-7 rounded-lg flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
            <span className="font-display font-semibold text-ink-900">CampusConnect</span>
            <span className="text-ink-500">Vellore Institute of Technology</span>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-ink-600 font-medium">
            {(
              [
                ['explore', 'Explore'],
                ['events', 'Events'],
                ['clubs', 'Clubs'],
                ['resources', 'Resources'],
                ['map', 'Map'],
                ['calendar', 'My schedule'],
              ] as [Tab, string][]
            ).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0 });
                }}
                className="hover:text-ink-900 transition-colors cursor-pointer"
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
