// public/firebase-messaging-sw.js
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// IMPORTANT: This file must be in the `public` directory.

// This config can be sourced from a separate file or environment variables
const firebaseConfig = {
  apiKey: "AIzaSyCXqUU7PErk_vdkVzlwY2zUa3gg4Be6yyY",
  authDomain: "muralieggs-d67b5.firebaseapp.com",
  projectId: "muralieggs-d67b5",
  storageBucket: "muralieggs-d67b5.firebasestorage.app",
  messagingSenderId: "863297401918",
  appId: "1:863297401918:web:5e4d70f187214c7e318d6f",
  measurementId: "G-VRXPL6SMGG"
};

initializeApp(firebaseConfig);

const messaging = getMessaging();

onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png' // Ensure you have this icon in your /public directory
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
