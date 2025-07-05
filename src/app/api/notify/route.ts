// src/app/api/notify/route.ts
import { adminDb, firebaseAdminApp } from '@/lib/firebaseAdmin'; // Ensure firebaseAdminApp is initialized
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import admin from 'firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { userId, orderId, status } = await req.json();

    if (!userId || !orderId || !status) {
      return NextResponse.json({ error: 'Missing required fields: userId, orderId, status' }, { status: 400 });
    }

    const tokenDocRef = adminDb.collection('fcmTokens').doc(userId);
    const tokenDoc = await tokenDocRef.get();

    if (!tokenDoc.exists) {
      return NextResponse.json({ success: false, message: 'No FCM tokens found for this user.' }, { status: 404 });
    }

    const data = tokenDoc.data();
    const tokens = data?.tokens;

    if (!tokens || tokens.length === 0) {
       return NextResponse.json({ success: false, message: 'No FCM tokens found for this user.' }, { status: 404 });
    }
    
    const payload: admin.messaging.MessagingPayload = {
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
    
    const response = await admin.messaging().sendToDevice(tokens, payload);
    
    const tokensToRemove: string[] = [];
    response.results.forEach((result, index) => {
      const error = result.error;
      if (error) {
        console.error('Failure sending notification to', tokens[index], error);
        // Cleanup the invalid tokens from the database
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
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
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
