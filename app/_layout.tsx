import {
  Stack,
  useRouter,
  useSegments,
} from "expo-router";

import { useEffect, useState } from "react";

import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../services/firebase";

import {
  ActivityIndicator,
  View,
} from "react-native";

import { ThemeProvider } from "../hooks/useTheme";

type Rol =
  | "usuario"
  | "moderador"
  | "admin";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [usuario, setUsuario] =
    useState(auth.currentUser);

  const [rol, setRol] =
    useState<Rol>("usuario");

  const [cargando, setCargando] =
    useState(true);

  /* ============================================================
     AUTENTICACIÓN + OBTENER ROL
  ============================================================ */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          try {
            setUsuario(user);

            /*
             * No hay usuario autenticado
             */
            if (!user) {
              setRol("usuario");
              setCargando(false);
              return;
            }

            /*
             * Obtener Custom Claims de Firebase
             */
            const token =
              await user.getIdTokenResult(true);

            const rolFirebase =
              token.claims.role;

            console.log(
              "Usuario autenticado:",
              user.email
            );

            console.log(
              "Rol detectado:",
              rolFirebase
            );

            /*
             * Validar roles permitidos
             */
            if (
              rolFirebase === "admin" ||
              rolFirebase === "moderador" ||
              rolFirebase === "usuario"
            ) {
              setRol(rolFirebase);
            } else {
              /*
               * Si no tiene un rol válido,
               * se considera usuario normal.
               */
              setRol("usuario");
            }
          } catch (error) {
            console.error(
              "Error obteniendo el rol:",
              error
            );

            setRol("usuario");
          } finally {
            setCargando(false);
          }
        }
      );

    return unsubscribe;
  }, []);

  /* ============================================================
     REDIRECCIONES
  ============================================================ */

  useEffect(() => {
    if (cargando) {
      return;
    }

    const enAuth =
      segments[0] === "auth";

    const enAdmin =
      segments[0] === "admin";

    /*
     * ==========================================================
     * NO AUTENTICADO
     * ==========================================================
     */
    if (!usuario) {
      if (!enAuth) {
        router.replace("/auth/login");
      }

      return;
    }

    /*
     * ==========================================================
     * USUARIO AUTENTICADO DENTRO DE /auth
     * ==========================================================
     */
    if (usuario && enAuth) {
      if (rol === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }

      return;
    }

    /*
     * ==========================================================
     * ADMINISTRADOR
     *
     * Si el usuario es admin y está fuera del panel,
     * lo llevamos al panel administrativo.
     * ==========================================================
     */
    if (
      usuario &&
      rol === "admin" &&
      !enAdmin
    ) {
      router.replace("/admin");
      return;
    }

    /*
     * ==========================================================
     * USUARIO NO ADMIN
     *
     * Si intenta entrar a /admin, vuelve a la app.
     * ==========================================================
     */
    if (
      enAdmin &&
      rol !== "admin"
    ) {
      router.replace("/");
      return;
    }
  }, [
    usuario,
    rol,
    cargando,
    segments,
    router,
  ]);

  /* ============================================================
     PANTALLA DE CARGA
  ============================================================ */

  if (cargando) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator
          size="large"
        />
      </View>
    );
  }

  /* ============================================================
     NAVEGACIÓN PRINCIPAL
  ============================================================ */

  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </ThemeProvider>
  );
}