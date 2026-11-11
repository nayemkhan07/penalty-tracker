import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAL8w3RxOaSHLCx5hj8zWmBJNqnVvc78aI",
  authDomain: "penalty-tracker-6e06c.firebaseapp.com",
  projectId: "penalty-tracker-6e06c",
  storageBucket: "penalty-tracker-6e06c.firebasestorage.app",
  messagingSenderId: "68196835456",
  appId: "1:68196835456:web:80aab9021bd657153d4665",
  measurementId: "G-VDTQKJRW6D",
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firebase Authentication
export const auth = getAuth(app);

// Cloud Firestore
export const db = getFirestore(app);

export default app;
