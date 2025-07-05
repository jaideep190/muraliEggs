// src/lib/firebaseAdmin.ts
import admin from 'firebase-admin';

function initializeFirebaseAdmin() {
  // Prevent re-initialization
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Construct credentials from environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    const errorMessage = `Firebase Admin SDK configuration error. Please ensure FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL are set in your .env.local file.`;
    console.error(`ERROR: ${errorMessage}`);
    throw new Error(errorMessage);
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      }),
      projectId: projectId,
    });
  } catch (error: any)
  {
    const errorMessage = `Failed to initialize Firebase Admin SDK with the provided environment variables. Please check their values. Original error: ${error.message}`;
    console.error(`ERROR: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

// Initialize and export the admin app instance and its services
export const firebaseAdminApp = initializeFirebaseAdmin();
export const adminDb = admin.firestore();
