export type EventCategory = 
  | 'Academic & STEM'
  | 'Free Food & Social'
  | 'Career & Professional'
  | 'Arts, Music & Culture'
  | 'Health & Wellness'
  | 'Tech & Hackathons'
  | 'Sports & Outdoors'
  | 'Leadership & Civic';

export type PerkType =
  | 'Free Food 🍕'
  | 'Free Swag 👕'
  | 'Resume Drop 💼'
  | 'Free Coffee ☕'
  | 'Free Drinks ☕'
  | 'Pet Therapy 🐶'
  | 'Networking 🤝'
  | 'Live Music / DJ 🎵'
  | 'Hardware / 3D Print 🛠️'
  | 'Certificates 📜'
  | 'Tutors On-Duty 📚';

export interface CampusEvent {
  id: string;
  title: string;
  shortDesc: string;
  description: string;
  category: EventCategory;
  organizer: string;
  organizerRole: 'student_club' | 'faculty_dept' | 'university_office' | 'career_services';
  clubId?: string;
  campusZone: 'North Campus' | 'Central Hub' | 'South Quad' | 'West Tech Park';
  building: string;
  room: string;
  mapCoords: { x: number; y: number }; // percentage 0-100 for campus map
  date: string; // YYYY-MM-DD, campus calendar day
  startTime: string; // "17:00", campus wall-clock time
  endTime: string; // "19:00"; earlier than startTime means it ends after midnight
  /** @deprecated Stale by design. Use formatEventWhen() from utils/campusTime. */
  displayTime?: string;
  /** @deprecated Use isEventToday() from utils/campusTime. */
  isToday?: boolean;
  perks: PerkType[];
  foodDetails?: string;
  tags: string[];
  image: string;
  gradient: string;
  rsvpCount: number;
  capacity: number;
  isHot?: boolean;
  facultyApproved?: boolean;
  coHosts?: string[];
  dressCode?: string;
  eligibility: string; // e.g. "Open to all students"
  attendeeAvatars: string[];
  /** User id of the organizer or admin who published it. */
  createdBy?: string;
  /** True for events loaded in bulk by an admin from the built-in schedule. */
  seeded?: boolean;
  createdAt?: number;
}

/** One person's registration for one occurrence of an event, stored in the shared database. */
export interface EventRegistration {
  /** `${eventId}__${date}__${uid}` */
  id: string;
  eventId: string;
  eventDate: string;
  uid: string;
  name: string;
  major?: string;
  year?: string;
  createdAt: number;
}

export interface CampusClub {
  id: string;
  name: string;
  category: EventCategory;
  shortDesc: string;
  description: string;
  meetingSchedule: string;
  location: string;
  building: string;
  membersCount: number;
  tags: string[];
  perks: PerkType[];
  president: string;
  contactEmail: string;
  instagram?: string;
  discord?: string;
  banner: string;
  gradient: string;
  facultyAdvisor?: string;
  upcomingEventIds: string[];
  verifiedBadge?: boolean;
}

export type ResourceCategory = 
  | 'Academic & Tutoring'
  | 'Health & Wellness'
  | 'Career & Jobs'
  | 'Makerspace & Tech'
  | 'Financial & Food Aid'
  | 'Legal & Advocacy'
  | 'Recreation & Fitness';

export interface CampusResource {
  id: string;
  name: string;
  category: ResourceCategory;
  shortDesc: string;
  description: string;
  location: string;
  building: string;
  campusZone: 'North Campus' | 'Central Hub' | 'South Quad' | 'West Tech Park';
  openHours: string;
  /** @deprecated Stale by design. Use getOpenStatus(openHours) from utils/openHours. */
  currentStatus: 'Open Now' | 'Drop-in Ready' | 'Closing Soon' | 'By Appointment';
  walkInsAllowed: boolean;
  contactInfo: string;
  servicesOffered: string[];
  perks: PerkType[];
  iconName: string;
  badgeColor: string;
  mapCoords: { x: number; y: number };
}

export interface AIMatchResult {
  query: string;
  summary: string;
  personaMatch: string;
  suggestedActionPlan: {
    step: number;
    action: string;
    targetTitle: string;
    type: 'event' | 'club' | 'resource';
    timeOrLocation: string;
    why: string;
  }[];
  matchedEvents: {
    event: CampusEvent;
    matchScore: number;
    reason: string;
  }[];
  matchedClubs: {
    club: CampusClub;
    matchScore: number;
    reason: string;
  }[];
  matchedResources: {
    resource: CampusResource;
    matchScore: number;
    reason: string;
  }[];
  topPerksFound: PerkType[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  /** @deprecated Display label only. `createdAt` is the source of truth. */
  timestamp: string;
  createdAt?: number;
  type: 'food_drop' | 'reminder' | 'club_broadcast' | 'match_alert' | 'faculty_note';
  eventId?: string;
  isRead: boolean;
  urgent?: boolean;
  actionUrl?: string;
}

export interface ChatMessage {
  id: string;
  targetId: string; // event id or club id
  targetType: 'event' | 'club';
  senderName: string;
  senderAvatar: string;
  senderRole: 'student' | 'organizer' | 'faculty' | 'tutor';
  text: string;
  timestamp: string;
  createdAt?: number;
  likes: number;
  isLikedByMe?: boolean;
  isPinned?: boolean;
  tag?: 'looking_for_team' | 'rideshare' | 'qa' | 'general' | 'food_update';
}

export type UserRole = 'student' | 'organizer';

export interface EmailNotificationSettings {
  enabled: boolean;
  recipientEmail: string;
  notifyOnRsvp: boolean;
  notifyOnMissedEvent: boolean;
  notify24hBefore: boolean;
  notify1hBefore: boolean;
  notifyClubAnnouncements: boolean;
  notifyAiDigest: boolean;
}

export interface DispatchedEmail {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  previewText: string;
  sentAt: string;
  createdAt?: number;
  category: 'rsvp_confirmation' | 'missed_event_alert' | 'event_reminder' | 'club_welcome' | 'organizer_broadcast' | 'ai_digest';
  eventTitle?: string;
  eventDate?: string;
  eventLocation?: string;
  htmlContent: string;
  isRead?: boolean;
}

export interface UserProfile {
  name: string;
  email?: string;
  major: string;
  year: 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate';
  graduationYear?: string;
  interests: string[];
  preferredPerks: PerkType[];
  campusZone: string;
  rsvpdEvents: string[];
  savedEvents: string[];
  joinedClubs: string[];
  savedResources: string[];
  role: UserRole;
  organizerDepartment?: string;
  emailSettings?: EmailNotificationSettings;
}

export interface OrganizerRequest {
  uid: string;
  email: string;
  name: string;
  department?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: number;
  decidedAt?: number;
  decidedBy?: string;
}

/** A row in the organizers or admins collection. `id` is the person's user id. */
export interface StaffMember {
  id: string;
  email?: string;
  name?: string;
  department?: string;
  grantedAt?: number;
}

export interface AuditEntry {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  detail: string;
  at: number;
}
