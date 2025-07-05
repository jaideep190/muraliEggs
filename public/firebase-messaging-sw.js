// public/firebase-messaging-sw.js

// Using compat scripts for service worker simplicity as recommended for background tasks.
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// IMPORTANT: This config must match your client-side config
const firebaseConfig = {
  apiKey: "AIzaSyCXqUU7PErk_vdkVzlwY2zUa3gg4Be6yyY",
  authDomain: "muralieggs-d67b5.firebaseapp.com",
  projectId: "muralieggs-d67b5",
  storageBucket: "muralieggs-d67b5.firebasestorage.app",
  messagingSenderId: "863297401918",
  appId: "1:863297401918:web:5e4d70f187214c7e318d6f",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// This handler will be triggered when the app is in the background or closed.
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  
  if (payload.notification) {
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || '/favicon.ico' // Use sent icon or a default
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
  }
});
