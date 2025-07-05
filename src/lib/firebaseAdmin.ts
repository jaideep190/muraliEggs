// src/lib/firebaseAdmin.ts
import admin from 'firebase-admin';

function initializeFirebaseAdmin() {
  // Prevent re-initialization
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!serviceAccountJson) {
    console.error('================================================================');
    console.error('ERROR: Firebase Admin SDK credentials not found.');
    console.error('Please set the GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable.');
    console.error('The value should be the JSON content of your service account key.');
    console.error('================================================================');
    throw new Error('Firebase Admin SDK credentials environment variable not set.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    console.log(`Initializing Firebase Admin SDK for project: ${serviceAccount.project_id}`);
    
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  } catch (error: any)
  {
    console.error("Failed to parse service account JSON from GOOGLE_APPLICATION_CREDENTIALS_JSON.", error);
    throw new Error(`Failed to initialize Firebase Admin. Original error: ${error.message}`);
  }
}

// Initialize and export the admin app instance and its services
export const firebaseAdminApp = initializeFirebaseAdmin();
export const adminDb = admin.firestore();
