// src/lib/firebaseAdmin.ts
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

function initializeFirebaseAdmin() {
  // Prevent re-initialization
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // The path to the credentials file, assuming it's in the project root
  const serviceAccountPath = path.resolve(process.cwd(), 'credentials.json');

  if (!fs.existsSync(serviceAccountPath)) {
    const errorMessage = `Firebase Admin SDK credentials file not found. Please ensure 'credentials.json' is in the root directory of your project.`;
    console.error(`ERROR: ${errorMessage}`);
    throw new Error(errorMessage);
  }

  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    // Add a check for the project_id to give a better error message.
    if (!serviceAccount.project_id) {
        throw new Error("The 'project_id' is missing from your credentials.json file. Please re-download the file from Firebase.");
    }

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  } catch (error: any)
  {
    const errorMessage = `Failed to parse or initialize with credentials.json. Please ensure it's a valid JSON file. Original error: ${error.message}`;
    console.error(`ERROR: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

// Initialize and export the admin app instance and its services
export const firebaseAdminApp = initializeFirebaseAdmin();
export const adminDb = admin.firestore();
