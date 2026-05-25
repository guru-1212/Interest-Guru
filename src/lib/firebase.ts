import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBMJ7xUnb3Z3OvtW2jjQubW8dThMsUMHyA",
  authDomain: "intrest-tracker.firebaseapp.com",
  projectId: "intrest-tracker",
  storageBucket: "intrest-tracker.firebasestorage.app",
  messagingSenderId: "767859347531",
  appId: "1:767859347531:web:825377b7b407195f873dce",
  measurementId: "G-5LCGQ6C3T8",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
