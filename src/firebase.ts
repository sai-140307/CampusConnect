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
  serverTimestamp
} from "firebase/firestore";
import firebaseConfigData from "../firebase-applet-config.json";
import { ChatMessage, CampusEvent, UserProfile } from "./types";

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

/**
 * Removes an expired event from Firestore database permanently
 */
export async function removeExpiredEventFromFirestore(eventId: string): Promise<void> {
  try {
    const eventRef = doc(db, 'events', eventId);
    await deleteDoc(eventRef);
  } catch (err) {
    console.warn("Firestore remove event error:", err);
  }
}

export { onAuthStateChanged };
export type { FirebaseUser };
