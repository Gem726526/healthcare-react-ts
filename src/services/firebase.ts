// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAyFR-nSdcJietSGLlg2kGTqqUXMyfMc9Q",
  authDomain: "health-care-typescript.firebaseapp.com",
  projectId: "health-care-typescript",
  storageBucket: "health-care-typescript.firebasestorage.app",
  messagingSenderId: "683017152170",
  appId: "1:683017152170:web:60f7190d935c9519cfd2d3",
  measurementId: "G-WK4W7L7WE3",
};

const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
