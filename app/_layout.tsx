import {Stack,useRouter,useSegments,} from "expo-router";
import { useEffect, useState } from "react";
import {ActivityIndicator,View,} from "react-native";

import {
  onAuthStateChanged,
  reload,
} from "firebase/auth";

import { auth } from "../services/firebase";
import { obtenerRolUsuario } from "../services/rolService";

import {
  ActivityIndicator,
  StyleSheet,
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

  const [emailNoVerificado, setEmailNoVerificado] =
    useState(false);

  const [cargando, setCargando] =
    useState(true);

  /* ============================================================
     AUTENTICACIÓN + VERIFICACIÓN DE CORREO + ROL
  ============================================================ */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        try {
          setUsuario(user);

          /*
           * No hay usuario autenticado
           */
          if (!user) {
            setRol("usuario");
            setEmailNoVerificado(false);
            setCargando(false);
            return;
          }

          /*
           * Actualizar información de Firebase Authentication.
           *
           * Esto permite obtener el estado actual de
           * emailVerified después de que el usuario haya
           * verificado su correo.
           */
          await reload(user);

          /*
           * ======================================================
           * CORREO NO VERIFICADO
           * ======================================================
           */
          if (!user.emailVerified) {
            setEmailNoVerificado(true);
            setRol("usuario");
            setCargando(false);
            return;
          }

          /*
           * El correo sí está verificado
           */
          setEmailNoVerificado(false);

          /*
           * ======================================================
           * OBTENER ROL DESDE FIRESTORE
           *
           * usuarios/{uid}.rol
           * ======================================================
           */
          const rolFirestore =
            await obtenerRolUsuario(user.uid);

          if (
            rolFirestore === "admin" ||
            rolFirestore === "moderador" ||
            rolFirestore === "usuario"
          ) {
            setRol(rolFirestore);
          } else {
            setRol("usuario");
          }
        } catch (error) {
          console.error(
            "Error obteniendo datos del usuario:",
            error
          );

          setRol("usuario");
          setEmailNoVerificado(false);
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

    /*
     * Evitamos redirecciones cuando todavía
     * no tenemos una ruta montada.
     */
    if (!segments) {
      return;
    }

    const enAuth =
      segments[0] === "auth";

    const enAdmin =
      segments[0] === "admin";

    const enVerificar =
      segments[0] === "auth" &&
      segments[1] === "verificar";

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
     * CORREO NO VERIFICADO
     *
     * Puede permanecer únicamente en:
     *
     * /auth/verificar
     * ==========================================================
     */
    if (emailNoVerificado) {
      if (!enVerificar) {
        router.replace("/auth/verificar");
      }

      return;
    }

    /*
     * ==========================================================
     * USUARIO AUTENTICADO DENTRO DE /auth
     * ==========================================================
     */
    if (enAuth) {
      /*
       * Si ya está verificado y entra a /auth,
       * enviamos al lugar correspondiente.
       */
      if (rol === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }

      return;
    }

    /*
     * ==========================================================
     * ADMIN
     * ==========================================================
     */
    if (
      rol === "admin" &&
      !enAdmin
    ) {
      router.replace("/admin");
      return;
    }

    /*
     * ==========================================================
     * NO ADMIN INTENTANDO ENTRAR A /admin
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
    emailNoVerificado,
    cargando,
    segments,
    router,
  ]);

  /* ============================================================
     NAVEGACIÓN

     El Stack se monta siempre.
     Mientras se comprueba autenticación/rol/verificación,
     mostramos la capa de carga.
  ============================================================ */

  return (
    <ThemeProvider>
      <View style={styles.container}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />

        {cargando && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" />
          </View>
        )}
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
});