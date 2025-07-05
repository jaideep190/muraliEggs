importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCXqUU7PErk_vdkVzlwY2zUa3gg4Be6yyY",
  authDomain: "muralieggs-d67b5.firebaseapp.com",
  projectId: "muralieggs-d67b5",
  storageBucket: "muralieggs-d67b5.appspot.com",
  messagingSenderId: "863297401918",
  appId: "1:863297401918:web:5e4d70f187214c7e318d6f",
  measurementId: "G-VRXPL6SMGG"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'Notification';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/egg-icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
