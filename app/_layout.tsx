import {Stack,useRouter,useSegments,} from "expo-router";
import { useEffect, useState } from "react";
import {ActivityIndicator,View,} from "react-native";

import {
  onAuthStateChanged,
  reload,
} from "firebase/auth";

import * as SplashScreen from "expo-splash-screen";

import { auth } from "../services/firebase";
import { obtenerRolUsuario } from "../services/rolService";

import { ThemeProvider } from "../hooks/useTheme";

/*
 * Mantiene la pantalla inicial de Expo visible
 * mientras Firebase determina si existe una sesión.
 *
 * Esto evita que al abrir la aplicación aparezca
 * momentáneamente Perfil antes de saber quién inició sesión.
 */
SplashScreen.preventAutoHideAsync().catch(() => {});

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

  /*
   * Indica que ya llegamos a la ruta correcta.
   */
  const [rutaLista, setRutaLista] =
    useState(false);

  /* ============================================================
     AUTENTICACIÓN + VERIFICACIÓN + ROL
  ============================================================ */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        try {
          /*
       * ======================================================
       * IMPORTANTE
       *
       * Cuando Firebase detecta un nuevo inicio de sesión,
       * bloqueamos temporalmente las redirecciones.
       *
       * Así RootLayout no intenta mandar al usuario a "/"
       * mientras todavía estamos consultando su rol.
       * ======================================================
       */
      setCargando(true);
      setRutaLista(false);

          setUsuario(user);

          /*
           * ======================================================
           * NO HAY USUARIO
           * ======================================================
           */
          if (!user) {
            setRol("usuario");
            setEmailNoVerificado(false);

            setCargando(false);

            return;
          }

          /*
           * ======================================================
           * ACTUALIZAR ESTADO DE FIREBASE AUTH
           * ======================================================
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
           * ======================================================
           * CORREO VERIFICADO
           * ======================================================
           */
          setEmailNoVerificado(false);

          /*
           * ======================================================
           * OBTENER ROL DESDE FIRESTORE
           * ======================================================
           */
          const rolFirestore =
            await obtenerRolUsuario(
              user.uid
            );

          console.log(
            "ROL FIRESTORE:",
            rolFirestore
          );

          if (
            rolFirestore === "admin" ||
            rolFirestore === "moderador" ||
            rolFirestore === "usuario"
          ) {
            setRol(
              rolFirestore
            );
          } else {
            setRol("usuario");
          }
        } catch (error) {
          console.error(
            "Error obteniendo datos del usuario:",
            error
          );

          /*
           * Ante cualquier error:
           * no damos privilegios administrativos.
           */
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
        router.replace(
          "/auth/login"
        );

        return;
      }

      /*
       * Login ya es la ruta correcta.
       */
      setRutaLista(true);

      return;
    }

    /*
     * ==========================================================
     * CORREO NO VERIFICADO
     * ==========================================================
     */
    if (emailNoVerificado) {
      if (!enVerificar) {
        router.replace(
          "/auth/verificar"
        );

        return;
      }

      setRutaLista(true);

      return;
    }

    /*
     * ==========================================================
     * USUARIO AUTENTICADO EN /auth
     * ==========================================================
     */
    if (enAuth) {
      if (rol === "admin") {
        router.replace(
          "/admin"
        );
      } else {
        router.replace(
          "/"
        );
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
      router.replace(
        "/admin"
      );

      return;
    }

    /*
     * ==========================================================
     * NO ADMIN EN /admin
     * ==========================================================
     */
    if (
      enAdmin &&
      rol !== "admin"
    ) {
      router.replace(
        "/"
      );

      return;
    }

    /*
     * ==========================================================
     * RUTA CORRECTA
     * ==========================================================
     */
    setRutaLista(true);

  }, [
    usuario,
    rol,
    emailNoVerificado,
    cargando,
    segments,
    router,
  ]);

  /* ============================================================
     OCULTAR SPLASH INICIAL
  ============================================================ */

  useEffect(() => {
    /*
     * Solo ocultamos la pantalla inicial cuando:
     *
     * 1. Firebase terminó de comprobar la sesión.
     * 2. Ya sabemos cuál es la ruta correcta.
     */
    if (
      !cargando &&
      rutaLista
    ) {
      SplashScreen.hideAsync().catch(
        () => {}
      );
    }
  }, [
    cargando,
    rutaLista,
  ]);

  /*
   * ============================================================
   * PANTALLA DE CARGA INTERNA
   *
   * IMPORTANTE:
   *
   * "usuario &&" evita mostrarla antes del Login.
   *
   * Por eso:
   *
   * Sin sesión → Login
   *
   * Con sesión → Cargando → Admin/Inicio
   * ============================================================
   */

  const mostrarCarga =
    usuario !== null &&
    (cargando || !rutaLista);

  return (
    <ThemeProvider>
      <View
        style={styles.container}
      >
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />

        {mostrarCarga && (
          <View
            style={styles.loadingOverlay}
          >
            <View
              style={
                styles.loadingContent
              }
            >
              <Image
                source={require(
                  "../assets/images/icon.png"
                )}
                style={styles.logo}
                resizeMode="contain"
              />

              <ActivityIndicator
                size="large"
                color="#2563EB"
                style={
                  styles.spinner
                }
              />

              <Text
                style={
                  styles.loadingTitle
                }
              >
                Cargando...
              </Text>

              <Text
                style={
                  styles.loadingSubtitle
                }
              >
                Preparando tu espacio
              </Text>
            </View>
          </View>
        )}
      </View>
    </ThemeProvider>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },

    loadingOverlay: {
      ...StyleSheet.absoluteFill,

      backgroundColor:
        "#FFFFFF",

      justifyContent:
        "center",

      alignItems:
        "center",

      zIndex: 9999,

      elevation: 9999,
    },

    loadingContent: {
      width: "100%",

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal: 30,
    },

    logo: {
      width: 280,
      height: 110,

      marginBottom: 20,
    },

    spinner: {
      marginBottom: 14,
    },

    loadingTitle: {
      fontSize: 20,
      fontWeight: "800",

      color:
        "#2563EB",

      marginBottom: 5,
    },

    loadingSubtitle: {
      fontSize: 14,

      color:
        "#64748B",

      textAlign:
        "center",
    },
  });