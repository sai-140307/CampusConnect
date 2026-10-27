// Firebase initialization and configuration
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  onSnapshot, 
  addDoc, 
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import firebaseConfigData from "../firebase-applet-config.json";
import { ChatMessage, CampusEvent, EventRegistration, UserProfile, OrganizerRequest, AuditEntry, StaffMember } from "./types";

// Web app's Firebase configuration from provisioning
const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey || "AIzaSyBq6ryb145KrV4OqNBig2m9c4VEhIpg1sg",
  authDomain: firebaseConfigData.authDomain || "campus-connect-825d2.firebaseapp.com",
  projectId: firebaseConfigData.projectId || "campus-connect-825d2",
  storageBucket: firebaseConfigData.storageBucket || "campus-connect-825d2.firebasestorage.app",
  messagingSenderId: firebaseConfigData.messagingSenderId || "83840379857",
  appId: firebaseConfigData.appId || "1:83840379857:web:90c18f028720b1b148cef0"
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Initialize Firestore with custom databaseId if provisioned, else default
export const db = firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Google Sign-In helper
export async function signInWithGoogle(): Promise<{ user: FirebaseUser | null; error: string | null; unauthorizedDomain?: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return { user: null, error: null };
    }
    if (code === 'auth/popup-blocked') {
      return { user: null, error: "Popup was blocked by your browser. Please allow popups for Google Sign-In." };
    }
    if (code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
      return { 
        user: null, 
        error: `Unauthorized domain (${currentHost}). Add this domain in Firebase Console under Authentication > Settings > Authorized domains.`,
        unauthorizedDomain: currentHost
      };
    }
    return { user: null, error: err?.message || "Failed to sign in with Google" };
  }
}

// Map Firebase error codes to friendly messages
export function formatFirebaseAuthError(error: any, action: 'signin' | 'signup' | 'google'): string {
  const code = error?.code || '';
  
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email format. Please enter a valid student email address.';
    case 'auth/weak-password':
      return 'Weak password. Passwords must be at least 6 characters long.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in.';
    case 'auth/user-not-found':
      return 'No registered account found with this email. Please sign up first.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials.';
    case 'auth/user-disabled':
      return 'This student account has been disabled. Please contact the campus admin.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Access temporarily locked. Please wait a few minutes.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    default:
      if (error?.message) {
        const cleanMsg = error.message.replace(/^Firebase:\s*/i, '').replace(/\s*\(auth\/[^)]+\)\.?$/i, '');
        return cleanMsg || 'Authentication failed. Please check your details and try again.';
      }
      return 'Authentication failed. Please check your details and try again.';
  }
}

// Authentication helper functions
export async function signInUser(email: string, pass: string): Promise<{ user: FirebaseUser | null; error: string | null; errorCode?: string }> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return { user: userCredential.user, error: null };
  } catch (err: any) {
    const code = err?.code || '';
    const errorMsg = formatFirebaseAuthError(err, 'signin');
    return { user: null, error: errorMsg, errorCode: code };
  }
}

export async function signUpUser(email: string, pass: string): Promise<{ user: FirebaseUser | null; error: string | null; errorCode?: string }> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    return { user: userCredential.user, error: null };
  } catch (err: any) {
    const code = err?.code || '';
    const errorMsg = formatFirebaseAuthError(err, 'signup');
    return { user: null, error: errorMsg, errorCode: code };
  }
}

export async function logOutUser(): Promise<{ success: boolean; error?: string }> {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to log out" };
  }
}

// Profile Sync helper
export async function syncUserProfileToFirestore(userId: string, profileData: any): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      ...profileData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn("Firestore user sync error:", err);
  }
}

export async function fetchUserProfileFromFirestore(userId: string): Promise<any | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.warn("Firestore fetch profile error:", err);
    return null;
  }
}

/**
 * Real-Time Multi-Student Live Chat Synchronization
 * Subscribes to the Firestore campus_chats collection
 */
export function subscribeToCampusChats(
  onUpdate: (messages: ChatMessage[]) => void
): () => void {
  try {
    const chatsRef = collection(db, 'campus_chats');
    const q = query(chatsRef, orderBy('createdAt', 'desc'), limit(150));
    
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const remoteMsgs: ChatMessage[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          remoteMsgs.push({
            id: d.id,
            targetId: data.targetId,
            targetType: data.targetType || 'event',
            senderName: data.senderName || 'Student',
            senderAvatar: data.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            senderRole: data.senderRole || 'student',
            text: data.text || '',
            timestamp: data.timestamp || 'Just now',
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
            likes: data.likes || 0,
            isPinned: data.isPinned || false,
            tag: data.tag || 'general',
          });
        });
        onUpdate(remoteMsgs);
      }
    }, (error) => {
      console.warn("Firestore chat subscription error (falling back to local):", error);
    });
  } catch (err) {
    console.warn("Firestore chats listener setup error:", err);
    return () => {};
  }
}

/**
 * Saves a new chat message to Firestore for instant real-time delivery to all students
 */
export async function sendChatMessageToFirestore(msg: ChatMessage): Promise<void> {
  try {
    const docRef = doc(db, 'campus_chats', msg.id);
    await setDoc(docRef, {
      ...msg,
      createdAt: msg.createdAt || Date.now(),
      syncedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Error sending chat to Firestore:", err);
  }
}

/**
 * Updates likes in Firestore for a chat message
 */
export async function updateChatLikeInFirestore(msgId: string, newLikes: number): Promise<void> {
  try {
    const docRef = doc(db, 'campus_chats', msgId);
    await updateDoc(docRef, {
      likes: Math.max(0, newLikes)
    });
  } catch (err) {
    console.warn("Error updating chat like in Firestore:", err);
  }
}

// ---------------------------------------------------------------------------
// Shared events and registrations
// ---------------------------------------------------------------------------

/** Firestore rejects `undefined`, so drop those fields before writing. */
function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

/**
 * Live list of every event organizers have published. Calls `onUpdate` again
 * whenever anyone adds, edits or deletes one.
 */
export function subscribeToEvents(
  onUpdate: (events: CampusEvent[]) => void,
  onError?: (error: unknown) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, 'events'),
      (snapshot: any) => {
        const list: CampusEvent[] = [];
        snapshot.forEach((d: any) => {
          const data = d.data();
          if (data && data.title && data.date && data.startTime) list.push({ ...data, id: d.id } as CampusEvent);
        });
        onUpdate(list);
      },
      (error: unknown) => {
        console.warn("Events sync paused:", error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn("Events listener setup error:", err);
    if (onError) onError(err);
    return () => {};
  }
}

/** Publish an event for everyone. Throws if the database refuses the write. */
export async function saveEventToFirestore(event: CampusEvent): Promise<void> {
  await setDoc(doc(db, 'events', event.id), withoutUndefined(event));
}

/** Delete a published event. Throws if the database refuses. */
export async function deleteEventFromFirestore(eventId: string): Promise<void> {
  // Allowed by the rules only for the organizer who published it, or an admin.
  await deleteDoc(doc(db, 'events', eventId));
}

export function registrationId(eventId: string, eventDate: string, uid: string): string {
  return `${eventId}__${eventDate}__${uid}`;
}

/**
 * Live list of every registration. Used for the real "going" count on each
 * event, for each person's own schedule, and for the organizer's attendee list.
 */
export function subscribeToRegistrations(
  onUpdate: (registrations: EventRegistration[]) => void,
  onError?: (error: unknown) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, 'registrations'),
      (snapshot: any) => {
        const list: EventRegistration[] = [];
        snapshot.forEach((d: any) => {
          const data = d.data();
          if (data && data.eventId && data.uid) list.push({ ...data, id: d.id } as EventRegistration);
        });
        onUpdate(list);
      },
      (error: unknown) => {
        console.warn("Registrations sync paused:", error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn("Registrations listener setup error:", err);
    if (onError) onError(err);
    return () => {};
  }
}

/** Register the signed-in person for an event. Throws if the database refuses. */
export async function registerForEvent(registration: EventRegistration): Promise<void> {
  const { id, ...data } = registration;
  await setDoc(doc(db, 'registrations', id), withoutUndefined(data));
}

/** Cancel a registration. Throws if the database refuses. */
export async function cancelRegistration(id: string): Promise<void> {
  await deleteDoc(doc(db, 'registrations', id));
}

// ---------------------------------------------------------------------------
// Account security
// ---------------------------------------------------------------------------

/** Email a verification link to the signed-in user. */
export async function sendVerificationEmail(user: FirebaseUser): Promise<void> {
  await sendEmailVerification(user);
}

/**
 * Re-check the signed-in user's account after they click the verification link.
 * Refreshes the sign-in token too, so the database sees the new verified status.
 */
export async function refreshVerification(user: FirebaseUser): Promise<boolean> {
  await user.reload();
  await user.getIdToken(true);
  return Boolean(auth.currentUser?.emailVerified);
}

/** Send a password reset link. Resolves without saying whether the account exists. */
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (err: any) {
    // Do not reveal which emails have accounts.
    if (err?.code === 'auth/user-not-found') return;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Roles
//
// Roles live in their own collections, which only an admin can write (see
// firestore.rules). A person cannot make themselves an organizer or an admin
// from the browser. The first admin is added by hand in the Firebase console.
// ---------------------------------------------------------------------------

export interface RoleState {
  isAdmin: boolean;
  isOrganizer: boolean;
  loaded: boolean;
}

/** Live role of the signed-in user, read from the admins and organizers collections. */
export function subscribeToRoles(uid: string, onUpdate: (roles: RoleState) => void): () => void {
  let isAdmin: boolean | null = null;
  let isOrganizer: boolean | null = null;
  const emit = () => {
    if (isAdmin === null || isOrganizer === null) return;
    onUpdate({ isAdmin, isOrganizer, loaded: true });
  };
  const stopAdmin = onSnapshot(
    doc(db, 'admins', uid),
    (snap: any) => { isAdmin = snap.exists(); emit(); },
    () => { isAdmin = false; emit(); }
  );
  const stopOrganizer = onSnapshot(
    doc(db, 'organizers', uid),
    (snap: any) => { isOrganizer = snap.exists(); emit(); },
    () => { isOrganizer = false; emit(); }
  );
  return () => {
    stopAdmin();
    stopOrganizer();
  };
}

/** The signed-in user's own organizer request, if any. */
export function subscribeToMyOrganizerRequest(
  uid: string,
  onUpdate: (request: OrganizerRequest | null) => void
): () => void {
  return onSnapshot(
    doc(db, 'organizerRequests', uid),
    (snap: any) => onUpdate(snap.exists() ? ({ ...snap.data(), uid } as OrganizerRequest) : null),
    () => onUpdate(null)
  );
}

/** Ask an admin for organizer access. Needs a verified email. */
export async function requestOrganizerAccess(request: Omit<OrganizerRequest, 'status' | 'decidedAt' | 'decidedBy'>): Promise<void> {
  await setDoc(doc(db, 'organizerRequests', request.uid), withoutUndefined({ ...request, status: 'pending' }));
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

function subscribeToCollection<T>(name: string, onUpdate: (items: T[]) => void, onError?: (e: unknown) => void): () => void {
  return onSnapshot(
    collection(db, name),
    (snapshot: any) => {
      const list: T[] = [];
      snapshot.forEach((d: any) => list.push({ ...d.data(), id: d.id } as T));
      onUpdate(list);
    },
    (error: unknown) => {
      console.warn(`${name} sync paused:`, error);
      if (onError) onError(error);
    }
  );
}

export const subscribeToOrganizerRequests = (cb: (items: (OrganizerRequest & { id: string })[]) => void, onError?: (e: unknown) => void) =>
  subscribeToCollection('organizerRequests', cb, onError);

export const subscribeToOrganizers = (cb: (items: StaffMember[]) => void, onError?: (e: unknown) => void) =>
  subscribeToCollection('organizers', cb, onError);

export const subscribeToAdmins = (cb: (items: StaffMember[]) => void, onError?: (e: unknown) => void) =>
  subscribeToCollection('admins', cb, onError);

export const subscribeToAuditLog = (cb: (items: AuditEntry[]) => void, onError?: (e: unknown) => void) =>
  subscribeToCollection('auditLog', cb, onError);

/** Number of user profiles. Admin only. */
export async function countUsers(): Promise<number> {
  const snap: any = await getDocs(collection(db, 'users'));
  let n = 0;
  snap.forEach(() => { n += 1; });
  return n;
}

/** Record an admin action. Entries can be added but never changed or deleted. */
async function writeAudit(actor: { uid: string; email: string }, action: string, detail: string): Promise<void> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await setDoc(doc(db, 'auditLog', id), { actorUid: actor.uid, actorEmail: actor.email, action, detail, at: Date.now() });
}

export async function approveOrganizer(actor: { uid: string; email: string }, request: OrganizerRequest): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, 'organizers', request.uid), {
    email: request.email,
    name: request.name,
    department: request.department || '',
    grantedBy: actor.uid,
    grantedAt: Date.now(),
  });
  batch.update(doc(db, 'organizerRequests', request.uid), { status: 'approved', decidedBy: actor.uid, decidedAt: Date.now() });
  await batch.commit();
  await writeAudit(actor, 'organizer.approve', `${request.name} <${request.email}>`);
}

export async function rejectOrganizer(actor: { uid: string; email: string }, request: OrganizerRequest): Promise<void> {
  await updateDoc(doc(db, 'organizerRequests', request.uid), { status: 'rejected', decidedBy: actor.uid, decidedAt: Date.now() });
  await writeAudit(actor, 'organizer.reject', `${request.name} <${request.email}>`);
}

export async function revokeOrganizer(actor: { uid: string; email: string }, member: StaffMember): Promise<void> {
  await deleteDoc(doc(db, 'organizers', member.id));
  await writeAudit(actor, 'organizer.revoke', `${member.name || ''} <${member.email || member.id}>`);
}

export async function adminDeleteEvent(actor: { uid: string; email: string }, event: CampusEvent): Promise<void> {
  await deleteDoc(doc(db, 'events', event.id));
  await writeAudit(actor, 'event.delete', `${event.title} (${event.date})`);
}

/**
 * Write many events at once, in batches of 400 (Firestore allows 500 per batch).
 * Calls `onProgress` after each batch.
 */
export async function saveEventsInBulk(
  actor: { uid: string; email: string },
  events: CampusEvent[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  for (let i = 0; i < events.length; i += 400) {
    const batch = writeBatch(db);
    events.slice(i, i + 400).forEach((e) => batch.set(doc(db, 'events', e.id), withoutUndefined(e)));
    await batch.commit();
    if (onProgress) onProgress(Math.min(i + 400, events.length), events.length);
  }
  await writeAudit(actor, 'events.load', `${events.length} events added`);
}

export { onAuthStateChanged };
export type { FirebaseUser };
