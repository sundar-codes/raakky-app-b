import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

/**
 * Firebase Client Configuration for Raakky Customer App (App B)
 * Loaded from Vite environment variables (.env.local in dev / Cloudflare Pages in prod)
 */
const viteEnv = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env) || {};

export const firebaseConfig = {
  apiKey: viteEnv.VITE_FIREBASE_API_KEY,
  authDomain: viteEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: viteEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: viteEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: viteEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: viteEnv.VITE_FIREBASE_APP_ID,
};

const requiredEnvEntries: Array<[string, string | undefined]> = [
  ['VITE_FIREBASE_API_KEY', firebaseConfig.apiKey],
  ['VITE_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
  ['VITE_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
  ['VITE_FIREBASE_APP_ID', firebaseConfig.appId],
];

const missingEnvKeys = requiredEnvEntries
  .filter(([, value]) => typeof value !== 'string' || value.trim().length === 0)
  .map(([key]) => key);

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let initError: string | null = null;

if (missingEnvKeys.length > 0) {
  initError = `Authentication service is not configured for this build (missing: ${missingEnvKeys.join(', ')}).`;
} else {
  try {
    // Initialize Firebase exactly once across hot reloads and render cycles
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
  } catch (err: any) {
    initError = err?.message || 'Failed to initialize Firebase Authentication.';
    authInstance = null;
  }
}

export const app: FirebaseApp | null = appInstance;
export const auth: Auth | null = authInstance;
export const isFirebaseConfigured: boolean = Boolean(appInstance && authInstance && !initError);
export const firebaseConfigError: string | null = initError;

export default appInstance;
