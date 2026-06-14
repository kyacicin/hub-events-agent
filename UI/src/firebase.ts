import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser,
  onAuthStateChanged
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  deleteDoc, 
  serverTimestamp,
  getDocFromServer
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Check if credentials are mock/placeholder
export const isDemoMode = !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("mock-api-key");

// Firestore Error Types as required by firebase-integration skill
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// Global handle error for Firestore operations as required
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = !isDemoMode ? getAuth() : null;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid || "mock-user",
      email: currentAuth?.currentUser?.email || "mock-user@astanahub.kz",
      emailVerified: currentAuth?.currentUser?.emailVerified || true,
      isAnonymous: currentAuth?.currentUser?.isAnonymous || false,
      tenantId: currentAuth?.currentUser?.tenantId || null,
      providerInfo: currentAuth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error logged: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Live or simulated Firebase
let firebaseApp;
export let auth: any = null;
export let db: any = null;

if (!isDemoMode) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(firebaseApp);
    console.log("Live Firebase is initialized and connected!");
    
    // Validate connection test as required by skill config
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, "test", "connection"));
      } catch (error: any) {
        if (error.message && error.message.includes("client is offline")) {
          console.error("Firebase is offline. Check credentials.");
        }
      }
    };
    testConnection();
  } catch (error) {
    console.warn("Failed to boot real Firebase SDK, falling back to Demo Mode:", error);
    (window as any)._demoForce = true;
  }
}

// Interfaces for our app logic
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  favoriteHubId?: string;
  astanaHubId?: string;
  astanaHubUrl?: string;
}

export interface HubEventRsvp {
  rsvpId: string;
  userId: string;
  eventId: string;
  hubId: string;
  eventTitle: string;
  registeredAt: string;
}

export interface HubEventLike {
  likeId: string;
  userId: string;
  eventId: string;
  hubId: string;
  likedAt: string;
}

export interface AppChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// -----------------------------------------------------
// DEMO/SANDBOXED STANDALONE STORAGE ENGINE (fallback)
// -----------------------------------------------------
const mockListeners: Array<(user: UserProfile | null) => void> = [];
let cachedMockUser: UserProfile | null = (() => {
  const saved = localStorage.getItem("ah_session_user") || localStorage.getItem("ah_mock_user");
  return saved ? JSON.parse(saved) : null;
})();

const getStorageArray = <T>(key: string): T[] => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : [];
};

const setStorageArray = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// -----------------------------------------------------
// UNIFIED AUTH METHODS (ASTANA HUB PROFILE FIRST)
// -----------------------------------------------------
export const subscribeToAuthChanges = (callback: (user: any) => void) => {
  mockListeners.push(callback);
  // Fire initially with either the stored Astana Hub session or empty
  callback(cachedMockUser);
  return () => {
    const idx = mockListeners.indexOf(callback);
    if (idx > -1) mockListeners.splice(idx, 1);
  };
};

// Universal Login with Astana Hub account link or numeric ID
export const loginWithAstanaHub = async (profileUrlOrId: string, customName?: string): Promise<UserProfile> => {
  const cleanStr = profileUrlOrId.trim();
  // Extract user ID from links like https://astanahub.com/account/v2/user/301374/profile/activity/ or account/v2/user/301374
  const numMatch = cleanStr.match(/\d+/);
  const userId = numMatch ? numMatch[0] : cleanStr;

  if (!userId || !/^\d+$/.test(userId)) {
    throw new Error("Неверный формат. Пожалуйста, введите корректный ID профиля Astana Hub (например, 301374) или полную ссылку (https://astanahub.com/account/v2/user/301374/profile/activity/)");
  }

  const profileUrl = cleanStr.includes("http") 
    ? cleanStr 
    : `https://astanahub.com/account/v2/user/${userId}/profile/activity/`;

  const uid = `astanahub_${userId}`;
  
  // Set beautiful default nickname based on ID or customized name
  const name = customName?.trim() || `IT Innovator #${userId}`;
  const email = `user_${userId}@astanahub.com`;
  
  // Unsplash abstract beautiful avatars for different ID hashes
  const images = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120"
  ];
  const avatarIndex = parseInt(userId) % images.length;
  const photoURL = images[avatarIndex];

  const profile: UserProfile = {
    uid,
    name,
    email,
    photoURL,
    favoriteHubId: "astana",
    astanaHubId: userId,
    astanaHubUrl: profileUrl
  };

  cachedMockUser = profile;
  localStorage.setItem("ah_session_user", JSON.stringify(profile));
  
  // If we are in live project database mode, store/update this Astana Hub profile in Firestore collection
  if (!isDemoMode && db) {
    try {
      await saveUserProfile(profile);
    } catch (e) {
      console.warn("Could not save Astana Hub profile document to Firestore", e);
    }
  }

  // Trigger reactive UI listeners immediately
  mockListeners.forEach(listener => listener(profile));
  return profile;
};

// Deprecated fallback helper for backwards compatibility during transition
export const loginWithGoogle = async (): Promise<UserProfile> => {
  return loginWithAstanaHub("301374", "Жан Көшбасшы");
};

export const logoutUser = async () => {
  cachedMockUser = null;
  localStorage.removeItem("ah_session_user");
  localStorage.removeItem("ah_mock_user");
  mockListeners.forEach(listener => listener(null));
};

// -----------------------------------------------------
// UNIFIED FIRESTORE / LOCAL STORAGE OPERATIONS
// -----------------------------------------------------

// User Profile
export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  if (isDemoMode) {
    cachedMockUser = { ...cachedMockUser, ...profile };
    localStorage.setItem("ah_mock_user", JSON.stringify(cachedMockUser));
    return;
  }

  const p = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, "users", profile.uid), {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, p);
  }
};

export const updateUserFavoriteHub = async (userId: string, hubId: string): Promise<void> => {
  if (isDemoMode) {
    if (cachedMockUser) {
      cachedMockUser.favoriteHubId = hubId;
      localStorage.setItem("ah_mock_user", JSON.stringify(cachedMockUser));
    }
    return;
  }

  const p = `users/${userId}`;
  try {
    await setDoc(doc(db, "users", userId), {
      favoriteHubId: hubId,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, p);
  }
};

// RSVPs
export const fetchUserRsvps = async (userId: string): Promise<HubEventRsvp[]> => {
  if (isDemoMode) {
    const rsvps = getStorageArray<HubEventRsvp>("ah_rsvps");
    return rsvps.filter(r => r.userId === userId);
  }

  const p = "rsvps";
  try {
    const q = query(collection(db, "rsvps"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const rsvps: HubEventRsvp[] = [];
    querySnapshot.forEach((d) => {
      const data = d.data();
      rsvps.push({
        rsvpId: data.rsvpId,
        userId: data.userId,
        eventId: data.eventId,
        hubId: data.hubId,
        eventTitle: data.eventTitle || "",
        registeredAt: data.registeredAt?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });
    return rsvps;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, p);
    return [];
  }
};

export const rsvpToEvent = async (userId: string, eventId: string, hubId: string, eventTitle: string): Promise<HubEventRsvp> => {
  const rsvpId = `${userId}_${eventId}`;
  const rsvpData: HubEventRsvp = {
    rsvpId,
    userId,
    eventId,
    hubId,
    eventTitle,
    registeredAt: new Date().toISOString()
  };

  if (isDemoMode) {
    const rsvps = getStorageArray<HubEventRsvp>("ah_rsvps");
    if (!rsvps.some(r => r.rsvpId === rsvpId)) {
      rsvps.push(rsvpData);
      setStorageArray("ah_rsvps", rsvps);
    }
    return rsvpData;
  }

  const p = `rsvps/${rsvpId}`;
  try {
    await setDoc(doc(db, "rsvps", rsvpId), {
      rsvpId,
      userId,
      eventId,
      hubId,
      eventTitle,
      registeredAt: serverTimestamp()
    });
    return rsvpData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, p);
    throw error;
  }
};

export const cancelRsvp = async (userId: string, eventId: string): Promise<void> => {
  const rsvpId = `${userId}_${eventId}`;

  if (isDemoMode) {
    const rsvps = getStorageArray<HubEventRsvp>("ah_rsvps");
    setStorageArray("ah_rsvps", rsvps.filter(r => r.rsvpId !== rsvpId));
    return;
  }

  const p = `rsvps/${rsvpId}`;
  try {
    await deleteDoc(doc(db, "rsvps", rsvpId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, p);
  }
};

// Likes
export const fetchUserLikes = async (userId: string): Promise<HubEventLike[]> => {
  if (isDemoMode) {
    const likes = getStorageArray<HubEventLike>("ah_likes");
    return likes.filter(l => l.userId === userId);
  }

  const p = "likes";
  try {
    const q = query(collection(db, "likes"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const likes: HubEventLike[] = [];
    querySnapshot.forEach((d) => {
      const data = d.data();
      likes.push({
        likeId: data.likeId,
        userId: data.userId,
        eventId: data.eventId,
        hubId: data.hubId,
        likedAt: data.likedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });
    return likes;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, p);
    return [];
  }
};

export const likeEvent = async (userId: string, eventId: string, hubId: string): Promise<HubEventLike> => {
  const likeId = `${userId}_${eventId}`;
  const likeData: HubEventLike = {
    likeId,
    userId,
    eventId,
    hubId,
    likedAt: new Date().toISOString()
  };

  if (isDemoMode) {
    const likes = getStorageArray<HubEventLike>("ah_likes");
    if (!likes.some(l => l.likeId === likeId)) {
      likes.push(likeData);
      setStorageArray("ah_likes", likes);
    }
    return likeData;
  }

  const p = `likes/${likeId}`;
  try {
    await setDoc(doc(db, "likes", likeId), {
      likeId,
      userId,
      eventId,
      hubId,
      likedAt: serverTimestamp()
    });
    return likeData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, p);
    throw error;
  }
};

export const unlikeEvent = async (userId: string, eventId: string): Promise<void> => {
  const likeId = `${userId}_${eventId}`;

  if (isDemoMode) {
    const likes = getStorageArray<HubEventLike>("ah_likes");
    setStorageArray("ah_likes", likes.filter(l => l.likeId !== likeId));
    return;
  }

  const p = `likes/${likeId}`;
  try {
    await deleteDoc(doc(db, "likes", likeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, p);
  }
};

// Chat Message Logs (Multi-turn session history)
export const fetchChatMessages = async (userId: string): Promise<AppChatMessage[]> => {
  if (isDemoMode) {
    return getStorageArray<AppChatMessage>(`ah_chat_${userId}`);
  }

  const p = `users/${userId}/chatHistory`;
  try {
    const docRef = collection(db, "users", userId, "chatHistory");
    const docSnap = await getDocs(docRef);
    const messages: AppChatMessage[] = [];
    docSnap.forEach((d) => {
      const data = d.data();
      messages.push({
        id: d.id,
        role: data.role,
        content: data.content,
        timestamp: data.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      });
    });
    
    // Sort chronologically
    return messages;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, p);
    return [];
  }
};

export const addChatMessage = async (userId: string, role: "user" | "assistant", content: string): Promise<AppChatMessage> => {
  const msgId = `msg_${Date.now()}`;
  const timestampStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const msg: AppChatMessage = {
    id: msgId,
    role,
    content,
    timestamp: timestampStr
  };

  if (isDemoMode) {
    const history = getStorageArray<AppChatMessage>(`ah_chat_${userId}`);
    history.push(msg);
    setStorageArray(`ah_chat_${userId}`, history.filter(m => !m.id.startsWith("init"))); // exclude welcome
    return msg;
  }

  const p = `users/${userId}/chatHistory/${msgId}`;
  try {
    await setDoc(doc(db, "users", userId, "chatHistory", msgId), {
      userId,
      role,
      content,
      timestamp: serverTimestamp()
    });
    return msg;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, p);
    throw error;
  }
};

export const clearChatMessages = async (userId: string): Promise<void> => {
  if (isDemoMode) {
    localStorage.removeItem(`ah_chat_${userId}`);
    return;
  }

  const p = `users/${userId}/chatHistory`;
  try {
    const colRef = collection(db, "users", userId, "chatHistory");
    const snap = await getDocs(colRef);
    const deletePromises: Promise<any>[] = [];
    snap.forEach((d) => {
      deletePromises.push(deleteDoc(doc(db, "users", userId, "chatHistory", d.id)));
    });
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, p);
  }
};
