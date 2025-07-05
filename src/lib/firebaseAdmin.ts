// src/lib/firebaseAdmin.ts
import admin from 'firebase-admin';

function initializeFirebaseAdmin() {
  // Prevent re-initialization
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!serviceAccountJson) {
    console.error('ERROR: GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable not set.');
    throw new Error('Firebase Admin SDK credentials environment variable not set.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  } catch (error: any)
  {
    console.error("ERROR: Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON. Ensure it's a valid JSON string.", { originalError: error.message });
    throw new Error(`Failed to initialize Firebase Admin due to invalid credentials. Original error: ${error.message}`);
  }
}

// Initialize and export the admin app instance and its services
export const firebaseAdminApp = initializeFirebaseAdmin();
export const adminDb = admin.firestore();
