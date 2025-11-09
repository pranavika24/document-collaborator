import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBnr8ooQ37poxSJ7Z4Bl3sybcJmmF1l5us",
  authDomain: "document-collaboration-system.firebaseapp.com",
  projectId: "document-collaboration-system",
  storageBucket: "document-collaboration-system.firebasestorage.app",
  messagingSenderId: "465138729599",
  appId: "1:465138729599:web:57c0e680a5f04a66bbb54a"
};


const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

// Enhanced offline persistence
enableIndexedDbPersistence(db, { 
  cacheSizeBytes: CACHE_SIZE_UNLIMITED 
})
  .then(() => {
    console.log("✅ Offline support enabled - Full functionality available offline!");
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log("⚠️ Multiple tabs open - offline enabled in first tab only");
    } else if (err.code === 'unimplemented') {
      console.log("❌ Browser doesn't support offline persistence");
    }
  });

export default app;