// src/lib/firebaseAdmin.ts
import admin from 'firebase-admin';

function initializeFirebaseAdmin() {
  // Prevent re-initialization
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!serviceAccountJson) {
    const errorMessage = 'Firebase Admin SDK credentials environment variable not set. GOOGLE_APPLICATION_CREDENTIALS_JSON is missing from your .env.local file.';
    console.error(`ERROR: ${errorMessage}`);
    throw new Error(errorMessage);
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    // Add a check for the project_id to give a better error message.
    if (!serviceAccount.project_id) {
        throw new Error("The 'project_id' is missing from your service account JSON. Please re-download the file from Firebase.");
    }

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  } catch (error: any)
  {
    const errorMessage = `Failed to parse or initialize with GOOGLE_APPLICATION_CREDENTIALS_JSON. Please ensure it's a valid JSON string in your .env.local file. Original error: ${error.message}`;
    console.error(`ERROR: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

// Initialize and export the admin app instance and its services
export const firebaseAdminApp = initializeFirebaseAdmin();
export const adminDb = admin.firestore();
