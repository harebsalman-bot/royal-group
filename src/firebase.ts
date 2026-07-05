/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, FirebaseApp, deleteApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';

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

// Initialize Firebase only from environment variables
const envConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: (import.meta as any).env.VITE_FIREBASE_DATABASE_ID || (import.meta as any).env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-royalgroup-9ad9c5e1-ff84-4044-be12-d1feb03a7592",
};

const missingVars: string[] = [];
if (!envConfig.apiKey || envConfig.apiKey.trim() === "" || envConfig.apiKey === "undefined" || envConfig.apiKey === "null") {
  missingVars.push("VITE_FIREBASE_API_KEY");
}
if (!envConfig.authDomain || envConfig.authDomain.trim() === "" || envConfig.authDomain === "undefined" || envConfig.authDomain === "null") {
  missingVars.push("VITE_FIREBASE_AUTH_DOMAIN");
}
if (!envConfig.projectId || envConfig.projectId.trim() === "" || envConfig.projectId === "undefined" || envConfig.projectId === "null") {
  missingVars.push("VITE_FIREBASE_PROJECT_ID");
}
if (!envConfig.storageBucket || envConfig.storageBucket.trim() === "" || envConfig.storageBucket === "undefined" || envConfig.storageBucket === "null") {
  missingVars.push("VITE_FIREBASE_STORAGE_BUCKET");
}
if (!envConfig.messagingSenderId || envConfig.messagingSenderId.trim() === "" || envConfig.messagingSenderId === "undefined" || envConfig.messagingSenderId === "null") {
  missingVars.push("VITE_FIREBASE_MESSAGING_SENDER_ID");
}
if (!envConfig.appId || envConfig.appId.trim() === "" || envConfig.appId === "undefined" || envConfig.appId === "null") {
  missingVars.push("VITE_FIREBASE_APP_ID");
}

if (missingVars.length > 0) {
  throw new Error(
    `Firebase configuration error: Missing or invalid environment variable(s): ${missingVars.join(", ")}. ` +
    `Please set these environment variables in your settings panel.`
  );
}

let activeConfig = envConfig;

console.log("Firebase Active Initialization Config:", {
  projectId: activeConfig.projectId,
  authDomain: activeConfig.authDomain,
  appId: activeConfig.appId,
  apiKey: activeConfig.apiKey ? `${activeConfig.apiKey.slice(0, 6)}... (length: ${activeConfig.apiKey.length})` : "MISSING",
  isFromEnv: true
});

try {
  firebaseApp = initializeApp(activeConfig);
  dbInstance = getFirestore(firebaseApp, import.meta.env.VITE_FIREBASE_DATABASE_ID);
  authInstance = getAuth(firebaseApp);
} catch (error) {
  console.error("Failed to initialize Firebase with environment config:", error);
  throw error;
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
    dbInstance = getFirestore(firebaseApp, import.meta.env.VITE_FIREBASE_DATABASE_ID);
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
    const tempDb = getFirestore(tempApp, import.meta.env.VITE_FIREBASE_DATABASE_ID);
    
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

export function getFirebaseApp(): FirebaseApp {
  if (!firebaseApp) {
    throw new Error("Firebase App is not initialized.");
  }
  return firebaseApp;
}

export function getActiveConfig(): any {
  return activeConfig;
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
