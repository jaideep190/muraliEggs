// src/app/api/notify/route.ts
import { adminDb, firebaseAdminApp } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import admin from 'firebase-admin';

export async function POST(req: NextRequest) {
  try {
    if (!firebaseAdminApp) {
      // This case should ideally not be hit if initialization fails, as it would throw an error.
      // But as a safeguard:
      throw new Error('Firebase Admin SDK failed to initialize. Check server logs for details.');
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
    
    const response = await admin.messaging().sendEachForMulticast(message);
    
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
    
    let errorDetails = error.message || 'An unknown error occurred.';

    // This error indicates the API is likely disabled in the Google Cloud Console.
    if (error.code === 'messaging/authentication-error') {
        errorDetails = `Authentication failed with Firebase Cloud Messaging. This often means the FCM API is disabled for your project. Please go to the Google Cloud Console for your project ('${firebaseAdminApp?.options?.projectId}') and ensure it is enabled.`;
    }

    return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
  }
}
