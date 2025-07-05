// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCXqUU7PErk_vdkVzlwY2zUa3gg4Be6yyY",
  authDomain: "muralieggs-d67b5.firebaseapp.com",
  projectId: "muralieggs-d67b5",
  storageBucket: "muralieggs-d67b5.firebasestorage.app",
  messagingSenderId: "863297401918",
  appId: "1:863297401918:web:5e4d70f187214c7e318d6f",
  measurementId: "G-VRXPL6SMGG"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export { app, auth, db, messaging };
