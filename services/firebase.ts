import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "recomedi-3fcef.firebaseapp.com",
  projectId: "recomedi-3fcef",
  storageBucket: "recomedi-3fcef.firebasestorage.app",
  messagingSenderId: "678223643943",
  appId: "1:678223643943:web:75e173e927d5d68b0ed502",
  measurementId: "G-BBD04HXZPS",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);