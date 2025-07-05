// public/firebase-messaging-sw.js
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// IMPORTANT: This file needs to be in the `public` directory.

const firebaseConfig = {
    apiKey: "AIzaSyCXqUU7PErk_vdkVzlwY2zUa3gg4Be6yyY",
    authDomain: "muralieggs-d67b5.firebaseapp.com",
    projectId: "muralieggs-d67b5",
    storageBucket: "muralieggs-d67b5.firebasestorage.app",
    messagingSenderId: "863297401918",
    appId: "1:863297401918:web:5e4d70f187214c7e318d6f",
    measurementId: "G-VRXPL6SMGG"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title;
  const notificationOptions = {
    body: payload.notification?.body,
    // No icon specified, to avoid errors if the image doesn't exist.
    // The browser will use a default icon.
  };

  if (notificationTitle) {
    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});
