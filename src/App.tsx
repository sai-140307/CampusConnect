import React, { useState, useEffect, useCallback } from 'react';
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
  EmailNotificationSettings
} from './types';

import { 
  MOCK_EVENTS, 
  MOCK_CLUBS, 
  MOCK_RESOURCES, 
  INITIAL_USER, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_CHAT_MESSAGES 
} from './data/mockData';

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
  removeExpiredEventFromFirestore,
  FirebaseUser
} from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

import { 
  sendRsvpConfirmationEmail, 
  sendClubWelcomeEmail 
} from './services/emailService';

import { 
  processExpiredEventsAndNotify, 
  isEventExpired 
} from './utils/dateSyncUtils';

const STORAGE_KEYS = {
  EVENTS: 'campuspulse_events_v7',
  CLUBS: 'campuspulse_clubs_v7',
  RESOURCES: 'campuspulse_resources_v7',
  USER: 'campuspulse_user_v7',
  NOTIFICATIONS: 'campuspulse_notifications_v7',
  MESSAGES: 'campuspulse_messages_v7',
  ROLE: 'campuspulse_active_role_v7',
};

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'explore' | 'events' | 'clubs' | 'resources' | 'map' | 'calendar' | 'faculty'>('explore');
  
  // Firebase Auth State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Data State with Local Storage fallback
  const [events, setEvents] = useState<CampusEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return saved ? JSON.parse(saved) : MOCK_EVENTS;
  });

  const [clubs, setClubs] = useState<CampusClub[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLUBS);
    return saved ? JSON.parse(saved) : MOCK_CLUBS;
  });

  const [resources, setResources] = useState<CampusResource[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RESOURCES);
    return saved ? JSON.parse(saved) : MOCK_RESOURCES;
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    const savedRole = (localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole) || 'student';
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { 
          ...INITIAL_USER, 
          ...parsed, 
          role: parsed.role || savedRole,
          rsvpdEvents: Array.isArray(parsed.rsvpdEvents) ? parsed.rsvpdEvents : INITIAL_USER.rsvpdEvents,
          savedEvents: Array.isArray(parsed.savedEvents) ? parsed.savedEvents : INITIAL_USER.savedEvents,
          joinedClubs: Array.isArray(parsed.joinedClubs) ? parsed.joinedClubs : INITIAL_USER.joinedClubs,
          savedResources: Array.isArray(parsed.savedResources) ? parsed.savedResources : INITIAL_USER.savedResources,
          interests: Array.isArray(parsed.interests) ? parsed.interests : INITIAL_USER.interests,
          preferredPerks: Array.isArray(parsed.preferredPerks) ? parsed.preferredPerks : INITIAL_USER.preferredPerks,
          emailSettings: {
            ...INITIAL_USER.emailSettings,
            ...(parsed.emailSettings || {})
          }
        };
      } catch {
        return { ...INITIAL_USER, role: savedRole };
      }
    }
    return { ...INITIAL_USER, role: savedRole };
  });

  // Notifications State with deduplication
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          return parsed.filter((n) => {
            if (!n || !n.id || seen.has(n.id)) return false;
            seen.add(n.id);
            return true;
          });
        }
        return INITIAL_NOTIFICATIONS;
      } catch {
        return INITIAL_NOTIFICATIONS;
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  // Synchronized Multi-Student Chat State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return INITIAL_CHAT_MESSAGES;
      }
    }
    return INITIAL_CHAT_MESSAGES;
  });

  // AI Matchmaker State
  const [aiMatchResult, setAiMatchResult] = useState<AIMatchResult | null>(null);
  const [isAiMatching, setIsAiMatching] = useState(false);

  // Modals State
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);
  const [selectedClub, setSelectedClub] = useState<CampusClub | null>(null);
  const [selectedResource, setSelectedResource] = useState<CampusResource | null>(null);
  const [chatTarget, setChatTarget] = useState<{ id: string; type: 'event' | 'club'; title: string } | null>(null);
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isRestrictedModalOpen, setIsRestrictedModalOpen] = useState(false);
  const [isVideoShowcaseOpen, setIsVideoShowcaseOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist State locally
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(clubs));
  }, [clubs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
  }, [resources]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userProfile));
    if (userProfile.role) {
      localStorage.setItem(STORAGE_KEYS.ROLE, userProfile.role);
    }
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  // Real-Time Multi-Student Firestore Chat Sync
  useEffect(() => {
    const unsubChats = subscribeToCampusChats((remoteMsgs) => {
      if (remoteMsgs && remoteMsgs.length > 0) {
        setMessages((prev) => {
          // Merge remote with local seed to ensure full history
          const remoteIds = new Set(remoteMsgs.map((m) => m.id));
          const localExtras = prev.filter((m) => !remoteIds.has(m.id));
          return [...remoteMsgs, ...localExtras];
        });
      }
    });

    return () => {
      if (unsubChats) unsubChats();
    };
  }, []);

  // Periodic and on-mount Event Deadline Expiration Check & Database Cleanup
  useEffect(() => {
    const runExpirationSync = () => {
      const activeUserEmail = userProfile.email || firebaseUser?.email || 'saikanala1403@gmail.com';
      
      const expiredIdsToRemove = processExpiredEventsAndNotify(
        events,
        userProfile.rsvpdEvents,
        activeUserEmail,
        userProfile,
        (notif) => {
          setNotifications((prev) => {
            // Deduplicate by ID and semantic title
            if (prev.some((n) => n.id === notif.id || (n.eventId === notif.eventId && n.type === notif.type))) {
              return prev;
            }
            return [notif, ...prev];
          });
        }
      );

      // If any events expired, remove them permanently from active database & state
      if (expiredIdsToRemove.length > 0) {
        setEvents((prev) => (prev || []).filter((ev) => !expiredIdsToRemove.includes(ev.id)));
        
        // Remove from RSVP list as well
        setUserProfile((prev) => ({
          ...prev,
          rsvpdEvents: (prev.rsvpdEvents || []).filter((id) => !expiredIdsToRemove.includes(id)),
          savedEvents: (prev.savedEvents || []).filter((id) => !expiredIdsToRemove.includes(id)),
        }));

        // Clean up each from Firestore
        expiredIdsToRemove.forEach((id) => {
          removeExpiredEventFromFirestore(id);
        });
      }
    };

    runExpirationSync();
    const interval = setInterval(runExpirationSync, 45000); // Check every 45s
    return () => clearInterval(interval);
  }, [events, userProfile.rsvpdEvents, userProfile.email, firebaseUser?.email]);

  // Firebase Auth State Listener & Firestore Profile Sync
  useEffect(() => {
    let firestoreUnsub: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user && user.email) {
        // Fetch existing cloud profile from Firestore
        const cloudData = await fetchUserProfileFromFirestore(user.uid);
        if (cloudData) {
          setUserProfile((prev) => ({
            ...prev,
            ...cloudData,
            rsvpdEvents: Array.isArray(cloudData.rsvpdEvents) ? cloudData.rsvpdEvents : (prev.rsvpdEvents || []),
            savedEvents: Array.isArray(cloudData.savedEvents) ? cloudData.savedEvents : (prev.savedEvents || []),
            joinedClubs: Array.isArray(cloudData.joinedClubs) ? cloudData.joinedClubs : (prev.joinedClubs || []),
            savedResources: Array.isArray(cloudData.savedResources) ? cloudData.savedResources : (prev.savedResources || []),
            interests: Array.isArray(cloudData.interests) ? cloudData.interests : (prev.interests || []),
            preferredPerks: Array.isArray(cloudData.preferredPerks) ? cloudData.preferredPerks : (prev.preferredPerks || []),
            email: user.email || prev.email,
            name: user.displayName || cloudData.name || prev.name,
            emailSettings: {
              ...prev.emailSettings,
              recipientEmail: user.email || prev.emailSettings?.recipientEmail || 'saikanala1403@gmail.com'
            }
          }));
        } else {
          // Sync current profile to Firestore with real email
          syncUserProfileToFirestore(user.uid, {
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            major: userProfile.major || 'Computer Science & Engineering',
            graduationYear: userProfile.graduationYear || '2026',
            role: userProfile.role || 'student',
            emailSettings: {
              recipientEmail: user.email,
              enabled: true
            }
          });
        }

        // Setup real-time listener for user profile updates
        try {
          firestoreUnsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUserProfile((prev) => ({
                ...prev,
                ...data,
                rsvpdEvents: Array.isArray(data.rsvpdEvents) ? data.rsvpdEvents : (prev.rsvpdEvents || []),
                savedEvents: Array.isArray(data.savedEvents) ? data.savedEvents : (prev.savedEvents || []),
                joinedClubs: Array.isArray(data.joinedClubs) ? data.joinedClubs : (prev.joinedClubs || []),
                savedResources: Array.isArray(data.savedResources) ? data.savedResources : (prev.savedResources || []),
                interests: Array.isArray(data.interests) ? data.interests : (prev.interests || []),
                preferredPerks: Array.isArray(data.preferredPerks) ? data.preferredPerks : (prev.preferredPerks || []),
                email: user.email || prev.email,
              }));
            }
          });
        } catch (e) {
          console.warn("Firestore snapshot error:", e);
        }
      }
      setIsAuthChecking(false);
    });

    return () => {
      unsubscribe();
      if (firestoreUnsub) firestoreUnsub();
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const handleLogout = async () => {
    await logOutUser();
    setFirebaseUser(null);
    showToast('Signed out of account');
  };

  // AI Match Search Handler
  const handleAIMatchSearch = async (query: string) => {
    setIsAiMatching(true);
    try {
      const result = await requestAIMatch(query, events, clubs, resources, userProfile);
      setAiMatchResult(result);
      showToast(`AI Matchmaker found ${result.matchedEvents.length} events & ${result.matchedClubs.length} clubs.`);
    } catch (e) {
      console.error(e);
      showToast('Error generating AI match results. Please try again.');
    } finally {
      setIsAiMatching(false);
    }
  };

  // RSVP Toggle Handler with Email confirmation
  const handleToggleRsvp = (eventId: string) => {
    const targetEvent = events.find((e) => e.id === eventId);
    const isCurrentlyRsvpd = (userProfile.rsvpdEvents || []).includes(eventId);
    let updatedRsvps: string[];

    if (isCurrentlyRsvpd) {
      updatedRsvps = (userProfile.rsvpdEvents || []).filter((id) => id !== eventId);
      setEvents((prev) =>
        (prev || []).map((e) => (e.id === eventId ? { ...e, rsvpCount: Math.max(0, e.rsvpCount - 1) } : e))
      );
      showToast('RSVP removed from your schedule.');
    } else {
      updatedRsvps = [...(userProfile.rsvpdEvents || []), eventId];
      setEvents((prev) =>
        (prev || []).map((e) => (e.id === eventId ? { ...e, rsvpCount: e.rsvpCount + 1 } : e))
      );
      confetti({ particleCount: 35, spread: 50 });
      showToast('RSVP confirmed! Digital ticket dispatched.');

      // Dispatch Email Confirmation to user's real email
      if (targetEvent && userProfile.emailSettings?.notifyOnRsvp !== false) {
        const destEmail = userProfile.email || firebaseUser?.email || userProfile.emailSettings?.recipientEmail || 'saikanala1403@gmail.com';
        sendRsvpConfirmationEmail(userProfile, targetEvent, destEmail);
      }
    }

    setUserProfile((prev) => ({
      ...prev,
      rsvpdEvents: updatedRsvps,
    }));
  };

  // Club Join Handler with Email welcome
  const handleToggleJoinClub = (clubId: string) => {
    const targetClub = clubs.find((c) => c.id === clubId);
    const isJoined = (userProfile.joinedClubs || []).includes(clubId);
    let updatedClubs: string[];

    if (isJoined) {
      updatedClubs = (userProfile.joinedClubs || []).filter((id) => id !== clubId);
      setClubs((prev) =>
        (prev || []).map((c) => (c.id === clubId ? { ...c, membersCount: Math.max(0, c.membersCount - 1) } : c))
      );
      showToast('Left club community.');
    } else {
      updatedClubs = [...(userProfile.joinedClubs || []), clubId];
      setClubs((prev) =>
        (prev || []).map((c) => (c.id === clubId ? { ...c, membersCount: c.membersCount + 1 } : c))
      );
      confetti({ particleCount: 35, spread: 50 });
      showToast('Joined club! Welcome packet dispatched to your email.');

      // Dispatch Club Welcome Email
      if (targetClub && userProfile.emailSettings?.notifyClubAnnouncements !== false) {
        const destEmail = userProfile.email || firebaseUser?.email || userProfile.emailSettings?.recipientEmail || 'saikanala1403@gmail.com';
        sendClubWelcomeEmail(userProfile, targetClub, destEmail);
      }
    }

    setUserProfile((prev) => ({
      ...prev,
      joinedClubs: updatedClubs,
    }));
  };

  // Save Resource Handler
  const handleToggleSaveResource = (resId: string) => {
    const isSaved = (userProfile.savedResources || []).includes(resId);
    let updatedRes: string[];

    if (isSaved) {
      updatedRes = (userProfile.savedResources || []).filter((id) => id !== resId);
      showToast('Removed resource bookmark.');
    } else {
      updatedRes = [...(userProfile.savedResources || []), resId];
      showToast('Resource bookmarked to your profile.');
    }

    setUserProfile((prev) => ({
      ...prev,
      savedResources: updatedRes,
    }));
  };

  // Real-time Chat message send handler - saved to Cloud Firestore
  const handleSendMessage = async (text: string, tag?: ChatMessage['tag']) => {
    if (!chatTarget) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      targetId: chatTarget.id,
      targetType: chatTarget.type,
      senderName: userProfile.name || (userProfile.email ? userProfile.email.split('@')[0] : 'Student'),
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      senderRole: userProfile.role === 'organizer' ? 'organizer' : 'student',
      text,
      timestamp: 'Just now',
      createdAt: Date.now(),
      likes: 0,
      tag: tag || 'general',
    };
    
    // Update local state instantly for zero-latency feedback
    setMessages((prev) => [newMsg, ...prev]);
    
    // Persist to Cloud Firestore for multi-student live broadcast
    await sendChatMessageToFirestore(newMsg);
    
    showToast('Message posted to attendee discussion.');
  };

  const handleToggleLikeMessage = async (msgId: string) => {
    let targetNewLikes = 0;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          const isLiked = m.isLikedByMe;
          targetNewLikes = isLiked ? Math.max(0, m.likes - 1) : m.likes + 1;
          return {
            ...m,
            isLikedByMe: !isLiked,
            likes: targetNewLikes,
          };
        }
        return m;
      })
    );

    // Sync likes to Cloud Firestore
    await updateChatLikeInFirestore(msgId, targetNewLikes);
  };

  // Create Event Handler (Organizer Only)
  const handleCreateEvent = (newEventData: Partial<CampusEvent>) => {
    if (userProfile.role !== 'organizer') {
      setIsRestrictedModalOpen(true);
      return;
    }

    const created: CampusEvent = {
      id: `ev-${Date.now()}`,
      title: newEventData.title || 'Campus Event',
      shortDesc: newEventData.shortDesc || '',
      description: newEventData.description || '',
      category: newEventData.category || 'Academic & STEM',
      organizer: newEventData.organizer || 'Student Organization',
      organizerRole: 'faculty',
      building: newEventData.building || 'Student Union',
      room: newEventData.room || 'Room 101',
      mapCoords: { x: 50, y: 50 },
      date: newEventData.date || '2026-08-20',
      startTime: newEventData.startTime || '17:00',
      endTime: newEventData.endTime || '19:00',
      displayTime: newEventData.displayTime || 'Upcoming',
      isToday: false,
      perks: newEventData.perks || ['Free Food 🍕'],
      foodDetails: newEventData.foodDetails,
      tags: newEventData.tags || ['Campus'],
      image: newEventData.image || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
      gradient: 'from-orange-800 to-amber-900',
      rsvpCount: 1,
      capacity: newEventData.capacity || 100,
      isHot: true,
      facultyApproved: true,
      eligibility: 'All Students',
      attendeeAvatars: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'],
      campusZone: 'Central Hub',
      ...newEventData,
    } as CampusEvent;

    setEvents((prev) => [created, ...prev]);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `New Event: ${created.title}`,
      body: `Hosted by ${created.organizer} in ${created.building} (${created.room}).`,
      timestamp: 'Just now',
      createdAt: Date.now(),
      type: 'reminder',
      eventId: created.id,
      isRead: false,
      urgent: created.isHot,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    showToast('Event published live to campus.');
  };

  // Delete Event Handler (Organizer Only)
  const handleDeleteEvent = (eventId: string) => {
    if (userProfile.role !== 'organizer') {
      setIsRestrictedModalOpen(true);
      return;
    }

    setEvents((prev) => (prev || []).filter((e) => e.id !== eventId));
    // Also remove from RSVPs
    setUserProfile((prev) => ({
      ...prev,
      rsvpdEvents: (prev.rsvpdEvents || []).filter((id) => id !== eventId),
      savedEvents: (prev.savedEvents || []).filter((id) => id !== eventId),
    }));
    removeExpiredEventFromFirestore(eventId);
    showToast('Event deleted from platform.');
  };

  // Broadcast Notification Handler
  const handleBroadcastNotification = (title: string, body: string, urgent: boolean) => {
    const notif: NotificationItem = {
      id: `notif-broadcast-${Date.now()}`,
      title,
      body,
      timestamp: 'Just now',
      createdAt: Date.now(),
      type: 'faculty_note',
      isRead: false,
      urgent,
    };
    setNotifications((prev) => [notif, ...prev]);
    showToast('Announcement broadcasted.');
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  // Show loading spinner while checking initial Firebase auth state
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] flex items-center justify-center font-sans">
        <div className="text-center space-y-3 animate-in fade-in duration-200">
          <div className="w-11 h-11 rounded-2xl bg-orange-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Network className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-xs text-orange-950 font-bold tracking-wide">Connecting to CampusConnect...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show the Auth Screen
  if (!firebaseUser) {
    return (
      <AuthScreen 
        onAuthSuccess={(user, role) => {
          setFirebaseUser(user);
          setUserProfile((prev) => ({
            ...prev,
            email: user.email || prev.email,
            role: role || prev.role || 'student',
            name: user.displayName || user.email?.split('@')[0] || prev.name,
            emailSettings: {
              ...prev.emailSettings,
              recipientEmail: user.email || 'saikanala1403@gmail.com'
            }
          }));
          localStorage.setItem(STORAGE_KEYS.ROLE, role || 'student');
          showToast(`Welcome, ${user.email} (${role === 'organizer' ? 'Organizer' : 'Student'})!`);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-stone-900 flex flex-col font-sans selection:bg-orange-600 selection:text-white">
      
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs sm:text-sm shadow-xl flex items-center gap-2 animate-in fade-in duration-150 border border-orange-500/30">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar with Role badge & Email Center */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={notifications}
        unreadCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
        onOpenFacultyModal={() => {
          if (userProfile.role === 'organizer') {
            setIsFacultyModalOpen(true);
          } else {
            setIsRestrictedModalOpen(true);
          }
        }}
        userProfile={userProfile}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        firebaseUser={firebaseUser}
        onLogout={handleLogout}
        onRoleRestrictedNotice={() => setIsRestrictedModalOpen(true)}
        onOpenVideoShowcase={() => setIsVideoShowcaseOpen(true)}
      />

      {/* Urgent Live Campus Ticker */}
      <LiveCampusTicker
        notifications={notifications}
        onSelectNotification={(notif) => {
          if (notif.eventId) {
            const ev = events.find((e) => e.id === notif.eventId);
            if (ev) setSelectedEvent(ev);
          } else {
            setIsNotificationOpen(true);
          }
        }}
      />

      {/* Main Pages Content */}
      <main className="flex-1">
        {activeTab === 'explore' && (
          <ExploreView
            events={events}
            clubs={clubs}
            resources={resources}
            userProfile={userProfile}
            onSelectEvent={setSelectedEvent}
            onSelectClub={setSelectedClub}
            onSelectResource={setSelectedResource}
            onToggleRsvp={handleToggleRsvp}
            onToggleJoinClub={handleToggleJoinClub}
            onToggleSaveResource={handleToggleSaveResource}
            onOpenChat={(id, type, title) => setChatTarget({ id, type, title })}
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
            onSelectEvent={setSelectedEvent}
            onToggleRsvp={handleToggleRsvp}
            onOpenChat={(id, type, title) => setChatTarget({ id, type, title })}
            onCreateEvent={handleCreateEvent}
            onDeleteEvent={handleDeleteEvent}
            onOpenOrganizerAuth={() => setIsRestrictedModalOpen(true)}
          />
        )}

        {activeTab === 'clubs' && (
          <ClubsView
            clubs={clubs}
            userProfile={userProfile}
            onSelectClub={setSelectedClub}
            onToggleJoin={handleToggleJoinClub}
            onOpenChat={(id, type, title) => setChatTarget({ id, type, title })}
          />
        )}

        {activeTab === 'resources' && (
          <ResourcesView
            resources={resources}
            userProfile={userProfile}
            onSelectResource={setSelectedResource}
            onToggleSave={handleToggleSaveResource}
            onLocateOnMap={() => {
              setActiveTab('map');
            }}
          />
        )}

        {activeTab === 'map' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Campus Interactive Map</h1>
                <p className="text-xs text-stone-500 mt-1">Explore engineering labs, student union dining, quiet study halls, and active perk zones</p>
              </div>
            </div>
            <InteractiveCampusMap
              events={events}
              resources={resources}
              onSelectBuilding={(building) => {
                showToast(`Viewing ${building.name}`);
              }}
            />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <SocialCalendarView
              events={events}
              rsvpdEvents={userProfile.rsvpdEvents}
              onSelectEvent={setSelectedEvent}
              onToggleRsvp={handleToggleRsvp}
            />
          </div>
        )}
      </main>

      {/* Event Details Dialog */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        isRsvpd={selectedEvent ? userProfile.rsvpdEvents.includes(selectedEvent.id) : false}
        onToggleRsvp={handleToggleRsvp}
        onOpenChat={(id) => {
          const ev = events.find((e) => e.id === id);
          if (ev) setChatTarget({ id, type: 'event', title: ev.title });
        }}
      />

      {/* Club Details Dialog */}
      <ClubDetailModal
        club={selectedClub}
        isOpen={Boolean(selectedClub)}
        onClose={() => setSelectedClub(null)}
        isJoined={selectedClub ? userProfile.joinedClubs.includes(selectedClub.id) : false}
        onToggleJoin={handleToggleJoinClub}
        onOpenChat={(id) => {
          const cl = clubs.find((c) => c.id === id);
          if (cl) setChatTarget({ id, type: 'club', title: cl.name });
        }}
      />

      {/* Resource Details Dialog */}
      <ResourceDetailModal
        resource={selectedResource}
        isOpen={Boolean(selectedResource)}
        onClose={() => setSelectedResource(null)}
        isSaved={selectedResource ? userProfile.savedResources.includes(selectedResource.id) : false}
        onToggleSave={handleToggleSaveResource}
        onLocateOnMap={() => {
          setActiveTab('map');
        }}
      />

      {/* Live Discussion Modal with Real-time Firestore Sync */}
      <LiveChatModal
        isOpen={Boolean(chatTarget)}
        onClose={() => setChatTarget(null)}
        targetTitle={chatTarget?.title || 'Discussion'}
        targetType={chatTarget?.type || 'event'}
        messages={messages.filter((m) => m.targetId === chatTarget?.id)}
        onSendMessage={handleSendMessage}
        onToggleLikeMessage={handleToggleLikeMessage}
        userProfile={userProfile}
      />

      {/* Faculty Post Event & Broadcast Modal */}
      <FacultyDashboardModal
        isOpen={isFacultyModalOpen}
        onClose={() => setIsFacultyModalOpen(false)}
        onPostEvent={handleCreateEvent}
        onBroadcastNotification={handleBroadcastNotification}
        existingEvents={events}
      />

      {/* Email Notifications & Sent Tickets Modal */}
      <EmailNotificationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        userProfile={userProfile}
        emailSettings={userProfile.emailSettings || {
          enabled: true,
          recipientEmail: userProfile.email || firebaseUser?.email || 'saikanala1403@gmail.com',
          notifyOnRsvp: true,
          notifyOnMissedEvent: true,
          notify24hBefore: true,
          notify1hBefore: true,
          notifyClubAnnouncements: true,
          notifyAiDigest: true,
        }}
        onUpdateEmailSettings={(newSettings: EmailNotificationSettings) => {
          setUserProfile((prev) => ({
            ...prev,
            emailSettings: newSettings,
          }));
          showToast('Email preferences updated.');
        }}
        userEmail={userProfile.email || firebaseUser?.email}
      />

      {/* Campus Infrastructure Video Showcase Modal */}
      <CampusVideoShowcase
        isOpen={isVideoShowcaseOpen}
        onClose={() => setIsVideoShowcaseOpen(false)}
        onExploreEvents={() => setActiveTab('events')}
        isOrganizer={userProfile.role === 'organizer'}
        onRoleRestrictedNotice={() => setIsRestrictedModalOpen(true)}
      />

      {/* Role Security Notice Modal */}
      {isRestrictedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-amber-300 rounded-2xl p-6 max-w-md shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900">Organizer Permissions Required</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Students cannot publish or delete campus events. To maintain verified academic and club integrity, only authorized <strong>Event Organizers & Faculty</strong> can create or delete events.
              </p>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl text-xs text-amber-900 text-left border border-amber-200">
              🔑 <strong>Organizer Access:</strong> If you are a campus organizer, sign out and select &ldquo;Event Organizer&rdquo; on the login screen using the organizer passcode.
            </div>
            <button
              onClick={() => setIsRestrictedModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      <NotificationDropdown
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
          showToast('All notifications marked as read.');
        }}
        onClearAll={() => {
          setNotifications([]);
          showToast('Notifications cleared.');
        }}
        onSelectNotification={(notif) => {
          setIsNotificationOpen(false);
          if (notif.eventId) {
            const ev = events.find((e) => e.id === notif.eventId);
            if (ev) setSelectedEvent(ev);
          }
        }}
      />

      {/* Student Profile & Preferences Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={(updated) => {
          setUserProfile((prev) => {
            const next = { ...prev, ...updated };
            if (firebaseUser?.uid) {
              syncUserProfileToFirestore(firebaseUser.uid, next);
            }
            return next;
          });
          showToast('Preferences updated and synced.');
        }}
        allEvents={events}
        allClubs={clubs}
        allResources={resources}
        onSelectEvent={setSelectedEvent}
        onSelectClub={setSelectedClub}
        onSelectResource={setSelectedResource}
        onRemoveRsvp={handleToggleRsvp}
        onRemoveClub={handleToggleJoinClub}
        onRemoveResource={handleToggleSaveResource}
      />

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-orange-200/80 py-8 px-4 text-xs text-stone-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-2xs">
              <Network className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-stone-900">CampusConnect</span>
            <span className="text-orange-900/60">• Vellore Institute of Technology</span>
          </div>

          <div className="flex items-center gap-5 text-stone-600 font-semibold">
            <button onClick={() => setActiveTab('explore')} className="hover:text-stone-900 cursor-pointer">Explore</button>
            <button onClick={() => setActiveTab('events')} className="hover:text-stone-900 cursor-pointer">Events</button>
            <button onClick={() => setActiveTab('clubs')} className="hover:text-stone-900 cursor-pointer">Clubs</button>
            <button onClick={() => setActiveTab('resources')} className="hover:text-stone-900 cursor-pointer">Resources</button>
            <button onClick={() => setActiveTab('map')} className="hover:text-stone-900 cursor-pointer">Map</button>
            <button onClick={() => setActiveTab('calendar')} className="hover:text-stone-900 cursor-pointer">My Schedule</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
