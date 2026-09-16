import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [usuario, setUsuario] = useState(auth.currentUser);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCargando(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (cargando) return;

    const enAuth = segments[0] === "auth";

    if (!usuario && !enAuth) {
      router.replace("/auth/login");
      return;
    }

    if (usuario && enAuth) {
      router.replace("/");
    }
  }, [usuario, cargando, segments]);

  if (cargando) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}