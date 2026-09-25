import { Stack } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { auth } from "../../services/firebase";

export default function AdminLayout() {
  const [cargando, setCargando] = useState(true);
  const [esAdmin, setEsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuario) => {
      if (!usuario) {
        setEsAdmin(false);
        setCargando(false);
        return;
      }

      try {
        const token = await usuario.getIdTokenResult(true);

        console.log("ROL ADMIN:", token.claims.role);

        setEsAdmin(token.claims.role === "admin");
      } catch (error) {
        console.error("Error verificando rol:", error);
        setEsAdmin(false);
      } finally {
        setCargando(false);
      }
    });

    return unsubscribe;
  }, []);

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

  if (!esAdmin) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}