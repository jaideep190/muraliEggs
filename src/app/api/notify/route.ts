// src/app/api/notify/route.ts
import { adminDb, firebaseAdminApp } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import admin from 'firebase-admin';

export async function POST(req: NextRequest) {
  try {
    // This will throw a specific error if the admin credentials in .env.local are bad
    if (!firebaseAdminApp) {
      throw new Error('Firebase Admin SDK failed to initialize.');
    }

    const { userId, orderId, status } = await req.json();

    if (!userId || !orderId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tokenDocRef = adminDb.collection('fcmTokens').doc(userId);
    const tokenDoc = await tokenDocRef.get();

    if (!tokenDoc.exists) {
      return NextResponse.json({ success: false, message: 'No FCM token found for user.' }, { status: 404 });
    }

    const data = tokenDoc.data();
    const tokens = data?.tokens;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json({ success: false, message: 'No FCM tokens found for user.' }, { status: 404 });
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

    const response = await admin.messaging().sendMulticast(message);
    
    const tokensToRemove: string[] = [];
    response.responses.forEach((result, index) => {
      if (!result.success) {
        const error = result.error;
        console.error('Failure sending notification to', tokens[index], error);
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
      console.log('Removed invalid tokens:', tokensToRemove);
    }
    
    return NextResponse.json({ success: true, sent: response.successCount, failed: response.failureCount });

  } catch (error: any) {
    console.error('Error in /api/notify:', error);
    // Provide a more specific error message if it's a known initialization issue.
    if (error.message.includes('GOOGLE_APPLICATION_CREDENTIALS_JSON')) {
        return NextResponse.json({ error: 'Firebase Admin Configuration Error', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
