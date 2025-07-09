// src/app/api/notify-bulk/route.ts
import { adminDb, firebaseAdminApp } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import admin from 'firebase-admin';

type NotificationPayload = {
  userId: string;
  orderId: string;
  status: string;
};

export async function POST(req: NextRequest) {
  try {
    if (!firebaseAdminApp) {
      throw new Error('Firebase Admin SDK failed to initialize.');
    }

    const { notifications } = (await req.json()) as { notifications: NotificationPayload[] };

    if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
      return NextResponse.json({ error: 'Missing or empty notifications array' }, { status: 400 });
    }

    let totalSent = 0;
    let totalFailed = 0;

    const promises = notifications.map(async ({ userId, orderId, status }) => {
      try {
        const tokenDocRef = adminDb.collection('fcmTokens').doc(userId);
        const tokenDoc = await tokenDocRef.get();

        if (!tokenDoc.exists) {
            console.log(`[API/NOTIFY-BULK] No FCM token document for user ${userId}.`);
            totalFailed++;
            return;
        }

        const data = tokenDoc.data();
        const tokens = data?.tokens;

        if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
            console.log(`[API/NOTIFY-BULK] No FCM tokens found for user ${userId}.`);
            totalFailed++;
            return;
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
        
        totalSent += response.successCount;
        totalFailed += response.failureCount;

        const tokensToRemove: string[] = [];
        response.responses.forEach((result, index) => {
          if (!result.success) {
            const error = result.error;
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
        }
      } catch (e: any) {
        console.error(`[API/NOTIFY-BULK] Failed to process notification for user ${userId}:`, e.message);
        totalFailed++;
      }
    });

    await Promise.all(promises);

    return NextResponse.json({ success: true, totalSent, totalFailed });

  } catch (error: any) {
    console.error('[API/NOTIFY-BULK] An unhandled error occurred:', error);
    let errorDetails = error.message || 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
  }
}
