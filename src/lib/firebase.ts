import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBCQP-GUUnNtVR9jE2SshdXQKhxNiWnfpY",
  authDomain: "limpaxfinance.firebaseapp.com",
  projectId: "limpaxfinance",
  storageBucket: "limpaxfinance.firebasestorage.app",
  messagingSenderId: "568547676351",
  appId: "1:568547676351:web:76a7884888ea5e776cb60a",
  measurementId: "G-FQYB1ETZ6X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Analytics
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
