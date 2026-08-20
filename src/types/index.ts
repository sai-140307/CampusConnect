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
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "17:00"
  endTime: string; // e.g. "19:00"
  displayTime: string; // e.g. "Today 5:00 PM - 7:00 PM"
  isToday: boolean;
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
