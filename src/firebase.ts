/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, FirebaseApp, deleteApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigRaw from './firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
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
  };
}

let firebaseApp: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

// Try loading configuration from environment variables first, then fallback to local JSON file
const envConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
};

const isEnvConfigValid = 
  envConfig.apiKey && 
  envConfig.apiKey.trim() !== "" && 
  envConfig.apiKey !== "undefined" &&
  envConfig.projectId && 
  envConfig.projectId.trim() !== "" &&
  envConfig.projectId !== "undefined";

let activeConfig = isEnvConfigValid ? envConfig : firebaseConfigRaw;

console.log("Firebase Active Initialization Config:", {
  projectId: activeConfig.projectId,
  authDomain: activeConfig.authDomain,
  appId: activeConfig.appId,
  apiKey: activeConfig.apiKey ? `${activeConfig.apiKey.slice(0, 6)}... (length: ${activeConfig.apiKey.length})` : "MISSING",
  isFromEnv: isEnvConfigValid
});

// Check if we have a valid configuration
const isConfigValid = 
  activeConfig && 
  activeConfig.apiKey && 
  activeConfig.apiKey.trim() !== "" &&
  activeConfig.apiKey !== "undefined" &&
  activeConfig.projectId &&
  activeConfig.projectId.trim() !== "" &&
  activeConfig.projectId !== "undefined";

if (isConfigValid) {
  try {
    firebaseApp = initializeApp(activeConfig);
    dbInstance = (activeConfig as any).firestoreDatabaseId 
      ? getFirestore(firebaseApp, (activeConfig as any).firestoreDatabaseId)
      : getFirestore(firebaseApp);
    authInstance = getAuth(firebaseApp);
  } catch (error) {
    console.error("Failed to initialize Firebase with config:", error);
  }
}

/**
 * Dynamically initialize Firebase with a custom configuration.
 * Returns true if successful, false otherwise.
 */
export function initializeDynamicFirebase(config: any): boolean {
  if (!config || !config.apiKey || config.apiKey.trim() === "") {
    return false;
  }
  try {
    firebaseApp = initializeApp(config);
    dbInstance = config.firestoreDatabaseId 
      ? getFirestore(firebaseApp, config.firestoreDatabaseId)
      : getFirestore(firebaseApp);
    authInstance = getAuth(firebaseApp);
    
    return true;
  } catch (error) {
    console.error("Dynamic Firebase initialization failed:", error);
    return false;
  }
}

/**
 * Test a specific Firebase configuration by trying to fetch from Firestore.
 */
export async function testFirebaseConnection(config: any): Promise<{ success: boolean; error?: string }> {
  if (!config || !config.apiKey || config.apiKey.trim() === "") {
    return { success: false, error: "الرجاء إدخال الـ apiKey" };
  }
  if (!config.projectId || config.projectId.trim() === "") {
    return { success: false, error: "الرجاء إدخال الـ projectId" };
  }

  let tempApp: FirebaseApp | null = null;
  try {
    const tempAppName = `temp-test-${Date.now()}`;
    tempApp = initializeApp(config, tempAppName);
    const tempDb = config.firestoreDatabaseId 
      ? getFirestore(tempApp, config.firestoreDatabaseId)
      : getFirestore(tempApp);
    
    // Attempt a live server read
    await getDocFromServer(doc(tempDb, 'test', 'connection'));
    
    // Clean up
    await deleteApp(tempApp);
    return { success: true };
  } catch (error: any) {
    if (tempApp) {
      try {
        await deleteApp(tempApp);
      } catch (e) {
        // ignore cleanup error
      }
    }
    
    const errMsg = error?.message || '';
    const errCode = error?.code || '';
    
    // In Firebase, permission-denied is actually a SUCCESS indicator for credentials check.
    // It means we reached Firestore successfully, authenticated the project and API Key,
    // and was rejected strictly due to security rules (which is expected because 'test/connection' doesn't exist or is locked).
    if (
      errCode === 'permission-denied' ||
      errMsg.includes('permission-denied') ||
      errMsg.includes('PERMISSION_DENIED')
    ) {
      return { success: true };
    }
    
    return { 
      success: false, 
      error: `فشل الاتصال: ${errMsg}` 
    };
  }
}

async function testConnection(firestoreDb: Firestore) {
  try {
    await getDocFromServer(doc(firestoreDb, 'test', 'connection'));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase check: client is offline or configuration is invalid.");
    }
  }
}

export function getDb(): Firestore {
  if (!dbInstance) {
    throw new Error("Firebase Firestore is not initialized. Please configure Firebase.");
  }
  return dbInstance;
}

export function getAuthService(): Auth {
  if (!authInstance) {
    throw new Error("Firebase Auth is not initialized. Please configure Firebase.");
  }
  return authInstance;
}

export function isFirebaseReady(): boolean {
  return dbInstance !== null && authInstance !== null;
}

/**
 * Strict error handler for Firestore operations to log and format error details.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuth = authInstance;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid || null,
      email: currentAuth?.currentUser?.email || null,
      emailVerified: currentAuth?.currentUser?.emailVerified || null,
      isAnonymous: currentAuth?.currentUser?.isAnonymous || null,
      tenantId: currentAuth?.currentUser?.tenantId || null,
      providerInfo: currentAuth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  console.error('Firestore Error Detailed:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
