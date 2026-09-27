import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import {
  Redirect,
  Stack,
  useSegments,
} from "expo-router";

import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../../services/firebase";
import { obtenerRolUsuario } from "../../services/rolService";

export default function AdminLayout() {
  const segments = useSegments();

  const [usuarioCargado, setUsuarioCargado] =
    useState(false);

  const [esAdmin, setEsAdmin] =
    useState(false);

  const [verificando, setVerificando] =
    useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        try {
          setUsuarioCargado(!!user);

          /*
           * No hay usuario autenticado
           */
          if (!user) {
            setEsAdmin(false);
            return;
          }

          /*
           * Obtener rol directamente desde Firestore:
           *
           * usuarios/{uid}
           *      rol: "admin"
           */
          const rol = await obtenerRolUsuario(
            user.uid
          );

          console.log("ROL:", rol);

          /*
           * Solo admin puede entrar a /admin
           */
          if (rol === "admin") {
            setEsAdmin(true);
          } else {
            setEsAdmin(false);
          }
        } catch (error) {
          console.error(
            "Error verificando rol de administrador:",
            error
          );

          setEsAdmin(false);
        } finally {
          setVerificando(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  /*
   * ==========================================================
   * CARGANDO
   * ==========================================================
   */

  if (verificando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />

        <View style={styles.loadingSpacing} />
      </View>
    );
  }

  /*
   * ==========================================================
   * NO AUTENTICADO
   * ==========================================================
   */

  if (!usuarioCargado) {
    return (
      <Redirect href="/auth/login" />
    );
  }

  /*
   * ==========================================================
   * NO ES ADMIN
   * ==========================================================
   */

  if (!esAdmin) {
    return (
      <Redirect href="/" />
    );
  }

  /*
   * ==========================================================
   * ADMIN AUTORIZADO
   * ==========================================================
   */

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingSpacing: {
    height: 1,
  },
});