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
    console.error("================================================================");
    console.error("ERROR: Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON.");
    console.error("Please ensure the variable contains valid JSON.");
    console.error("Tip: Copy the entire contents of the file and wrap it in single quotes in your .env.local file.");
    console.error("Original error:", error.message);
    console.error("================================================================");
    throw new Error(`Failed to initialize Firebase Admin. Check your environment variable. Original error: ${error.message}`);
  }
}

// Initialize and export the admin app instance and its services
export const firebaseAdminApp = initializeFirebaseAdmin();
export const adminDb = admin.firestore();
