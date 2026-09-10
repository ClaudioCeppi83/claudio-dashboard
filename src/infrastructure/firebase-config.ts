import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

// Firebase configuration from environment variables
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || "";

const firebaseConfig = {
  apiKey: apiKey || "AIzaSyDemoKeyForClaudioDashboardLocalDev",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "claudio-dashboard.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "claudio-dashboard",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "claudio-dashboard.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:demo1234567890",
};

// Initialize Firebase App singleton
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Modern Firestore initialization with persistent multi-tab cache (removes deprecation warning)
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const googleProvider = new GoogleAuthProvider();

export function isFirebaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== "AIzaSyDemoKeyForClaudioDashboardLocalDev");
}

export async function loginWithGoogle(): Promise<User> {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Por favor, añade tus credenciales de Firebase en el archivo .env (copia .env.example a .env e introduce tu VITE_FIREBASE_API_KEY)."
    );
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    const error = err as { code?: string; message?: string };
    if (error.code === "auth/configuration-not-found" || error.message?.includes("CONFIGURATION_NOT_FOUND")) {
      throw new Error(
        `Debes habilitar Google Auth en Firebase Console: Ve a https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication -> Comenzar -> Métodos de inicio de sesión -> Habilitar Google.`
      );
    }
    throw err;
  }
}

export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
