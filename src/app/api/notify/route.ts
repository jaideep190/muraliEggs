// src/app/api/notify/route.ts
import { adminDb, firebaseAdminApp } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import admin from 'firebase-admin';

export async function POST(req: NextRequest) {
  try {
    if (!firebaseAdminApp) {
      throw new Error('Firebase Admin SDK failed to initialize. Check server logs for details.');
    }
    
    const configuredProjectId = firebaseAdminApp.options.projectId;
    console.log(`[API/NOTIFY] Firebase Admin SDK initialized for project: ${configuredProjectId}`);
    if (!configuredProjectId) {
      console.error("[API/NOTIFY] CRITICAL: Firebase Admin SDK is missing Project ID in its configuration.");
    }

    const { userId, orderId, status } = await req.json();

    if (!userId || !orderId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tokenDocRef = adminDb.collection('fcmTokens').doc(userId);
    const tokenDoc = await tokenDocRef.get();

    if (!tokenDoc.exists) {
      return NextResponse.json({ success: false, details: 'No FCM token found for user.' }, { status: 404 });
    }

    const data = tokenDoc.data();
    const tokens = data?.tokens;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json({ success: false, details: 'No FCM tokens found for user.' }, { status: 404 });
    }

    const message: admin.messaging.MulticastMessage = {
      tokens: tokens,
      notification: {
        title: 'Order Status Update',
        body: `The status of your order #${orderId.substring(0, 6)} is now: ${status}`,
      },
      webpush: {
        fcmOptions: {
          link: `${new URL(req.url).origin}/track-order`
        }
      }
    };
    
    console.log(`[API/NOTIFY] Attempting to send notification to ${tokens.length} token(s) for user ${userId}.`);
    const response = await admin.messaging().sendMulticast(message);
    console.log(`[API/NOTIFY] Successfully sent multicast message. Success: ${response.successCount}, Failure: ${response.failureCount}`);
    
    const tokensToRemove: string[] = [];
    response.responses.forEach((result, index) => {
      if (!result.success) {
        const error = result.error;
        console.error('[API/NOTIFY] Failure sending notification to', tokens[index], error);
        if (error && (
            error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered'
        )) {
            tokensToRemove.push(tokens[index]);
        }
      }
    });

    if (tokensToRemove.length > 0) {
      await tokenDocRef.update({
        tokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove),
      });
      console.log('[API/NOTIFY] Removed invalid tokens:', tokensToRemove);
    }
    
    return NextResponse.json({ success: true, sent: response.successCount, failed: response.failureCount });

  } catch (error: any) {
    console.error('[API/NOTIFY] An unhandled error occurred:', error);
    
    const configuredProjectId = firebaseAdminApp?.options?.projectId || 'Not Available';
    let errorDetails = error.message || 'An unknown error occurred.';

    if (error.message?.includes('404')) {
        errorDetails = `The FCM server returned a 404 Not Found error. This strongly indicates a mismatch between the Project ID your server is using ('${configuredProjectId}') and the project where the FCM API is enabled. Please ensure your 'credentials.json' file is from the correct Firebase project ('muralieggs-d67b5').`;
    } else if (error.message?.includes('credentials.json')) {
        errorDetails = `Firebase Admin Configuration Error. Please ensure 'credentials.json' is in the project root and is a valid service account file.`;
    }

    return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
  }
}
