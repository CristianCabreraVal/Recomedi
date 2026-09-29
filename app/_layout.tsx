import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  onAuthStateChanged,
  reload,
} from "firebase/auth";

import * as SplashScreen from "expo-splash-screen";

import { auth } from "../services/firebase";
import { obtenerRolUsuario } from "../services/rolService";

import { ThemeProvider } from "../hooks/useTheme";

/*
 * Mantiene visible el Splash Screen mientras
 * Firebase determina el estado de autenticación.
 */
SplashScreen.preventAutoHideAsync().catch(() => {});

type Rol =
  | "usuario"
  | "moderador"
  | "admin";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  /*
   * Usuario actualmente autenticado.
   *
   * Se inicia con auth.currentUser para evitar
   * un estado undefined durante el primer render.
   */
  const [usuario, setUsuario] = useState(auth.currentUser);

  /*
   * Rol obtenido desde Firestore.
   */
  const [rol, setRol] = useState<Rol>("usuario");

  /*
   * Indica si el correo del usuario necesita
   * ser verificado.
   */
  const [emailNoVerificado, setEmailNoVerificado] =
    useState(false);

  /*
   * Indica si Firebase todavía está comprobando
   * la sesión y la información del usuario.
   */
  const [cargando, setCargando] = useState(true);

  /*
   * Indica que ya se realizó la redirección
   * correspondiente y la ruta actual es válida.
   */
  const [rutaLista, setRutaLista] = useState(false);

  /* ============================================================
     AUTENTICACIÓN + VERIFICACIÓN + ROL
  ============================================================ */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        /*
         * Cada vez que cambia la autenticación,
         * volvemos a bloquear las redirecciones
         * hasta terminar de comprobar el usuario.
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

        try {
          /*
           * Actualizamos los datos del usuario desde Firebase.
           *
           * Esto permite comprobar correctamente si el correo
           * ya fue verificado después de volver desde el correo
           * de confirmación.
           */
          await reload(user);

          /*
           * ====================================================
           * CORREO NO VERIFICADO
           * ====================================================
           */

          if (!user.emailVerified) {
            setEmailNoVerificado(true);
            setRol("usuario");

            setCargando(false);

            return;
          }

          /*
           * ====================================================
           * CORREO VERIFICADO
           * ====================================================
           */

          setEmailNoVerificado(false);

          /*
           * ====================================================
           * OBTENER ROL DESDE FIRESTORE
           * ====================================================
           */

          const rolFirestore =
            await obtenerRolUsuario(user.uid);

          console.log(
            "ROL FIRESTORE:",
            rolFirestore
          );

          /*
           * Solo aceptamos roles conocidos.
           *
           * Cualquier valor desconocido termina como
           * usuario para evitar otorgar privilegios.
           */
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

          /*
           * En caso de error nunca otorgamos permisos
           * administrativos.
           */
          setRol("usuario");

          /*
           * No forzamos aquí un estado de correo no verificado,
           * porque no sabemos si Firebase pudo actualizar
           * correctamente la información.
           */
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
    /*
     * Mientras Firebase esté comprobando la sesión,
     * no hacemos ninguna redirección.
     */
    if (cargando) {
      return;
    }

    /*
     * Determinamos la sección actual de Expo Router.
     */
    const enAuth =
      segments[0] === "auth";

    const enAdmin =
      segments[0] === "admin";
      

    const enVerificar =
      segments[0] === "auth" &&
      segments[1] === "verificar";

    /* ==========================================================
       NO AUTENTICADO
    ========================================================== */

    if (!usuario) {
      /*
       * Si no hay usuario y no estamos dentro de auth,
       * mandamos al login.
       */
      if (!enAuth) {
        router.replace("/auth/login");
        return;
      }

      /*
       * Ya estamos dentro de auth.
       */
      setRutaLista(true);
      return;
    }

    /* ==========================================================
       CORREO NO VERIFICADO
    ========================================================== */

    if (emailNoVerificado) {
      /*
       * Todo usuario con correo no verificado debe
       * permanecer en la pantalla de verificación.
       */
      if (!enVerificar) {
        router.replace("/auth/verificar");
        return;
      }

      setRutaLista(true);
      return;
    }

    /* ==========================================================
       USUARIO AUTENTICADO DENTRO DE AUTH
    ========================================================== */

    if (enAuth) {
      /*
       * Un admin entra al panel administrativo.
       */
      if (rol === "admin") {
        router.replace("/admin");
      } else {
        /*
         * Usuario y moderador entran a la aplicación.
         */
        router.replace("/");
      }

      return;
    }

    /* ==========================================================
       ADMIN
    ========================================================== */

    if (rol === "admin" && !enAdmin) {
      /*
       * El admin debe permanecer dentro de su área.
       */
      router.replace("/admin");
      return;
    }

    /* ==========================================================
       NO ADMIN EN /admin
    ========================================================== */

    if (enAdmin && rol !== "admin") {
      /*
       * Usuario o moderador no pueden acceder
       * al panel administrativo.
       */
      router.replace("/");
      return;
    }

    /* ==========================================================
       RUTA CORRECTA
    ========================================================== */

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
     OCULTAR SPLASH
  ============================================================ */

  useEffect(() => {
    /*
     * El Splash solamente desaparece cuando:
     *
     * 1. Firebase terminó de comprobar la sesión.
     * 2. La aplicación ya determinó la ruta correcta.
     */
    if (!cargando && rutaLista) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [
    cargando,
    rutaLista,
  ]);

  /* ============================================================
     PANTALLA DE CARGA
  ============================================================ */

  /*
   * Solo mostramos esta pantalla cuando existe un usuario.
   *
   * Sin usuario:
   *    Login
   *
   * Con usuario:
   *    Cargando...
   *    ↓
   *    Inicio / Admin
   */
  const mostrarCarga =
    usuario !== null &&
    (cargando || !rutaLista);

  return (
    <ThemeProvider>
      <View style={styles.container}>

        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />

        {mostrarCarga && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContent}>

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
                style={styles.spinner}
              />

              <Text style={styles.loadingTitle}>
                Cargando...
              </Text>

              <Text style={styles.loadingSubtitle}>
                Preparando tu espacio
              </Text>

            </View>
          </View>
        )}

      </View>
    </ThemeProvider>
  );
}

/* ==============================================================
   ESTILOS
============================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFill,

    backgroundColor: "#FFFFFF",

    justifyContent: "center",
    alignItems: "center",

    zIndex: 9999,
    elevation: 9999,
  },

  loadingContent: {
    width: "100%",

    alignItems: "center",
    justifyContent: "center",

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

    color: "#2563EB",

    marginBottom: 5,
  },

  loadingSubtitle: {
    fontSize: 14,

    color: "#64748B",

    textAlign: "center",
  },
});