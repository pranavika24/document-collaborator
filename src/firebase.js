import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBnr8ooQ37poxSJ7Z4Bl3sybcJmmF1l5us",
  authDomain: "document-collaboration-system.firebaseapp.com",
  projectId: "document-collaboration-system",
  storageBucket: "document-collaboration-system.firebasestorage.app",
  messagingSenderId: "465138729599",
  appId: "1:465138729599:web:57c0e680a5f04a66bbb54a"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;