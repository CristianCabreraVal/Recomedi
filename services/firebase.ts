import { getApp, getApps, initializeApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import {
  getAuth,
  initializeAuth,
} from "firebase/auth";

// Firebase 12 + Expo/React Native puede mostrar TS2305
// aunque la función exista en el bundle nativo.
// @ts-ignore
import { getReactNativePersistence } from "firebase/auth";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyC7jxu5mV-VbIKzj9CeZFCw54dI_LK_IVE",
  authDomain: "recomedi-3fcef.firebaseapp.com",
  projectId: "recomedi-3fcef",
  storageBucket: "recomedi-3fcef.firebasestorage.app",
  messagingSenderId: "678223643943",
  appId: "1:678223643943:web:75e173e927d5d68b0ed502",
  measurementId: "G-BBD04HXZPS",
};

const app = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig);

let auth: Auth;

if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error: any) {
    if (error?.code === "auth/already-initialized") {
      auth = getAuth(app);
    } else {
      throw error;
    }
  }
}

const db = getFirestore(app);

export { app, auth, db };
