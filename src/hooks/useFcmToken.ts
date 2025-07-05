'use client';

import { useEffect, useState, useCallback } from 'react';
import { getToken } from 'firebase/messaging';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { messaging, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export const useFcmToken = () => {
  const { user } = useAuth();
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<NotificationPermission | null>(null);

  const getPermissionStatus = useCallback(() => {
     if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermissionStatus(Notification.permission);
    }
  }, []);

  useEffect(() => {
    getPermissionStatus();
  }, [getPermissionStatus]);

  const requestPermission = useCallback(() => {
     if (typeof window !== 'undefined' && 'Notification' in window) {
       Notification.requestPermission().then(permission => {
         setNotificationPermissionStatus(permission);
       });
     }
  }, []);

  useEffect(() => {
    if (!user || !messaging) return;

    const retrieveToken = async () => {
      if (notificationPermissionStatus === 'granted') {
        try {
          // VAPID key is required for web push notifications
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
          if (!vapidKey) {
            console.error('VAPID key is not configured. Please set NEXT_PUBLIC_VAPID_KEY environment variable.');
            return;
          }

          const currentToken = await getToken(messaging, { vapidKey: vapidKey });
          if (currentToken) {
            const tokenDocRef = doc(db, 'fcmTokens', user.uid);
            await setDoc(tokenDocRef, { tokens: arrayUnion(currentToken) }, { merge: true });
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } catch (error) {
          console.error('FCM Token Error: An error occurred while retrieving token. This is often due to an invalid VAPID key or a disabled Firebase Cloud Messaging API.', error);
        }
      }
    };

    retrieveToken();
  }, [user, notificationPermissionStatus, messaging]);
  
  return { notificationPermissionStatus, requestPermission };
};
