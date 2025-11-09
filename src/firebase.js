// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBnr8ooQ37poxSJ7Z4Bl3sybcJmmF1l5us",
  authDomain: "document-collaboration-system.firebaseapp.com",
  projectId: "document-collaboration-system",
  storageBucket: "document-collaboration-system.firebasestorage.app",
  messagingSenderId: "465138729599",
  appId: "1:465138729599:web:57c0e680a5f04a66bbb54a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .then(() => {
    console.log("Offline support enabled!");
  })
  .catch((err) => {
    console.log("Offline support error:", err);
  });

export default app;
