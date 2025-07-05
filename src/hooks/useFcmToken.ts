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
    if (!user) return;

    const retrieveToken = async () => {
      const msg = await messaging;
      if (!msg) return;

      if (notificationPermissionStatus === 'granted') {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
        if (!vapidKey) {
          console.error('VAPID key missing');
          return;
        }

        try {
          const currentToken = await getToken(msg, { vapidKey });
          if (currentToken) {
            const tokenDocRef = doc(db, 'fcmTokens', user.uid);
            await setDoc(tokenDocRef, { tokens: arrayUnion(currentToken) }, { merge: true });
          } else {
            console.log('No FCM token available');
          }
        } catch (error) {
          console.error('Failed to get FCM token:', error);
        }
      }
    };

    retrieveToken();
  }, [user, notificationPermissionStatus]);

  return { notificationPermissionStatus, requestPermission };
};
