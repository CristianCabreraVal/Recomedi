import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import {
  getFirestore,
} from "firebase/firestore";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "recomedi-3fcef.firebaseapp.com",
  projectId: "recomedi-3fcef",
  storageBucket: "recomedi-3fcef.firebasestorage.app",
  messagingSenderId: "678223643943",
  appId: "1:678223643943:web:75e173e927d5d68b0ed502",
  measurementId: "G-BBD04HXZPS",
};

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

let auth;

if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = getAuth(app);
  }
}

export { auth };

export const db = getFirestore(app);