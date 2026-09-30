/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
import {Stack,useRouter,useSegments} from "expo-router";

import {useEffect,useState} from "react";
//Componentes visuales de React Native utilizados paraconstruir la pantalla de carga.
import {ActivityIndicator,Image,StyleSheet,Text,View} from "react-native";

import {onAuthStateChanged,reload} from "firebase/auth";

import * as SplashScreen from "expo-splash-screen";
// Instancias de autenticación configurada de Firebase
import {auth} from "../services/firebase";

import {obtenerRolUsuario} from "../services/rolService";

import {ThemeProvider} from "../hooks/useTheme";

import { iniciarEscuchaNotificaciones } from "../services/notificationService";

/*
 * Mantiene visible el Splash Screen mientras
 * Firebase determina el estado de autenticación.
 */
SplashScreen.preventAutoHideAsync().catch(() => {});

type Rol =
  | "usuario"
  | "moderador"
  | "admin";
// export default indica que este es el componente principal que se exporta desde este archivo.
export default function RootLayout() {
/*const: declara una variable cuyo valor no se reasigna.
Se utiliza para guardar valores, funciones, resultados de
hooks o referencias que serán utilizados posteriormente por el componente.
*/   // useRouter permite al usuario navegar desde botones o eventos hacia otras rutas de la aplicación.
  const router = useRouter();

  const segments =
    useSegments();

  /* ============================================================
     ESCUCHA DE NOTIFICACIONES
  ============================================================ */

  useEffect(() => {
    let limpiarListener:
      | (() => void)
      | undefined;

    const iniciar = async () => {
      limpiarListener =
        await iniciarEscuchaNotificaciones(
          (tipo, data) => {
            console.log(
              "================================="
            );

            console.log(
              "Navegación de notificación"
            );

            console.log(
              "Tipo:",
              tipo
            );

            console.log(
              "Datos:",
              data
            );

            console.log(
              "================================="
            );

            /*
             * IMPORTANTE:
             *
             * Si no hay sesión, NO navegamos.
             *
             * notificationService.ts ya guardó
             * la notificación como pendiente.
             *
             * Después del login, login.tsx se encargará
             * de consumirla y llevar al usuario a la
             * sección correspondiente.
             */
            if (!auth.currentUser) {
              console.log(
                "No hay sesión. Se esperará al login."
              );

              return;
            }

            /* ==================================================
               NOTICIA
            ================================================== */

            if (
              tipo === "noticia"
            ) {
              console.log(
                "Abriendo sección de noticias."
              );

              router.push(
                "/(tabs)/noticias"
              );

              return;
            }

            /* ==================================================
               ALERTA
               
               La pantalla existente para las alertas
               está en epidemia.tsx
            ================================================== */

            if (
              tipo === "alerta"
            ) {
              console.log(
                "Abriendo sección de alertas."
              );

              router.push(
                "/(tabs)/epidemia"
              );

              return;
            }

            /* ==================================================
               ACTIVIDAD
            ================================================== */

            if (
              tipo === "actividad"
            ) {
              console.log(
                "Abriendo sección de actividad."
              );

              router.push(
                "/(tabs)/actividad"
              );

              return;
            }

            /* ==================================================
               HIDRATACIÓN
            ================================================== */

            if (
              tipo === "hidratacion"
            ) {
              console.log(
                "Recordatorio de hidratación recibido."
              );

              router.push(
                "/(tabs)"
              );

              return;
            }

            /* ==================================================
               CUIDADO PERSONAL
            ================================================== */

            if (
              tipo === "cuidado"
            ) {
              console.log(
                "Recordatorio de cuidado personal recibido."
              );

              router.push(
                "/(tabs)"
              );

              return;
            }

            /* ==================================================
               CHEQUEO
            ================================================== */

            if (
              tipo === "chequeo"
            ) {
              console.log(
                "Recordatorio de chequeo recibido."
              );

              router.push(
                "/(tabs)"
              );

              return;
            }

            /* ==================================================
               TIPO DESCONOCIDO
            ================================================== */

            console.log(
              "Tipo de notificación desconocido."
            );

            router.push(
              "/(tabs)"
            );
          }
        );
    };

    void iniciar();

    return () => {
      if (limpiarListener) {
        limpiarListener();
      }
    };
  }, [router]);

  /*
   * Usuario actualmente autenticado.
   */
  const [usuario, setUsuario] =
    useState(auth.currentUser);

  /*
   * Rol obtenido desde Firestore.
   */
  const [rol, setRol] =
    useState<Rol>("usuario");

  /*
   * Indica si el correo necesita verificación.
   */
  const [
    emailNoVerificado,
    setEmailNoVerificado,
  ] = useState(false);

  /*
   * Indica si Firebase todavía está comprobando
   * la sesión y los datos del usuario.
   */
  const [cargando, setCargando] =
    useState(true);

  /*
   * Indica que ya se realizó la redirección
   * correspondiente.
   */
  const [rutaLista, setRutaLista] =
    useState(false);

  /* ============================================================
     AUTENTICACIÓN + VERIFICACIÓN + ROL
  ============================================================ */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          /*
           * Cada vez que cambia la autenticación,
           * volvemos a bloquear las redirecciones.
           */
          setCargando(true);
          setRutaLista(false);

          setUsuario(user);

          /* ====================================================
             NO HAY USUARIO
          ==================================================== */

          if (!user) {
            setRol("usuario");
            setEmailNoVerificado(false);

            setCargando(false);

            return;
          }

          try {
            /*
             * Actualizamos los datos del usuario
             * desde Firebase.
             */
            await reload(user);

            /* ==================================================
               CORREO NO VERIFICADO
            ================================================== */

            if (!user.emailVerified) {
              setEmailNoVerificado(true);
              setRol("usuario");

              setCargando(false);

              return;
            }

            /* ==================================================
               CORREO VERIFICADO
            ================================================== */

            setEmailNoVerificado(false);

            /* ==================================================
               OBTENER ROL DESDE FIRESTORE
            ================================================== */

            const rolFirestore =
              await obtenerRolUsuario(
                user.uid
              );

            console.log(
              "ROL FIRESTORE:",
              rolFirestore
            );

            /*
            Solo aceptamos roles conocidos.
            */
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

            /*En caso de error nunca otorgamos
              permisos administrativos.
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
    /*Mientras Firebase esté comprobando
      el usuario y su rol, no redireccionamos.
     */
    if (cargando) {
      return;
    }
    // Determinamos la sección actual.
    const enAuth =
      segments[0] === "auth";

    const enAdmin =
      segments[0] === "admin";

    const enModerador =
      segments[0] === "moderador";

    const enVerificar =
      segments[0] === "auth" &&
      segments[1] === "verificar";

    /* ========================================================
       NO AUTENTICADO
    ======================================================== */

    if (!usuario) {
      /*
       * Si no hay sesión y no estamos
       * en auth, vamos al login.
       */
      if (!enAuth) {
        router.replace(
          "/auth/login"
        );

        return;
      }

      setRutaLista(true);

      return;
    }
    /* ========================================================
       CORREO NO VERIFICADO
    ======================================================== */
    if (
      emailNoVerificado
    ) {
      /*Todo usuario no verificado permanece
        en la pantalla de verificación.
       */
      if (!enVerificar) {
        router.replace(
          "/auth/verificar"
        );

        return;
      }

      setRutaLista(true);

      return;
    }

    /* ========================================================
       USUARIO AUTENTICADO DENTRO DE AUTH
    ======================================================== */

    if (enAuth) {
      /*
       * ADMIN
       */
      if (rol === "admin") {
        router.replace(
          "/admin"
        );

        return;
      }

      /*
       * MODERADOR
       */
      if (rol === "moderador") {
        router.replace(
          "/moderador"
        );

        return;
      }

      /*
       * USUARIO NORMAL
       */
      router.replace(
        "/"
      );

      return;
    }

    /* ========================================================
       ADMIN
    ======================================================== */

    if (
      rol === "admin" &&
      !enAdmin
    ) {
      /*
       * El admin debe permanecer dentro
       * de su área administrativa.
       */
      router.replace(
        "/admin"
      );

      return;
    }

    /* ==========================================================
       MODERADOR
    ========================================================== */

    if (
      rol === "moderador" &&
      !enModerador
    ) {
      /*
       * El moderador debe permanecer dentro
       * de su área de moderación.
       */
      router.replace(
        "/moderador"
      );

      return;
    }

    /* ========================================================
       MODERADOR
    ======================================================== */

    if (
      rol === "moderador" &&
      !enModerador
    ) {
      /*
       * El moderador debe permanecer
       * dentro de /moderador.
       */
      router.replace(
        "/moderador"
      );

      return;
    }

    /* ========================================================
       NO ADMIN EN /admin
    ======================================================== */

    if (
      enAdmin &&
      rol !== "admin"
    ) {
      /*
       * Usuario o moderador
       * no pueden entrar a /admin.
       */
      router.replace(
        "/"
      );

      return;
    }

    /* ==========================================================
       NO MODERADOR EN /moderador
    ========================================================== */

    if (
      enModerador &&
      rol !== "moderador"
    ) {
      /*
       * Usuario o admin no pueden acceder
       * al panel de moderación.
       */
      router.replace(
        "/"
      );

      return;
    }

    /* ========================================================
       NO MODERADOR EN /moderador
    ======================================================== */

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
     * El Splash desaparece cuando:
     *
     * 1. Firebase terminó de comprobar la sesión.
     * 2. La ruta correcta ya fue determinada.
     */
    if (
      !cargando &&
      rutaLista
    ) {
      SplashScreen.hideAsync()
        .catch(() => {});
    }
  }, [
    cargando,
    rutaLista,
  ]);

  /* ============================================================
     PANTALLA DE CARGA
  ============================================================ */

  const mostrarCarga =
    usuario !== null &&
    (
      cargando ||
      !rutaLista
    );

  return (
    <ThemeProvider>
      <View
        style={styles.container}
      >
        <Stack
          screenOptions={{
            headerShown:
              false,
          }}
        />

        {mostrarCarga && (
          <View
            style={styles.loadingOverlay}
          >
            <View
              style={styles.loadingContent}
            >
              <Image
                source={require(
                  "../assets/images/icon.png"
                )}
                style={
                  styles.logo
                }
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
                style={styles.loadingTitle}
              >
                Cargando...
              </Text>

              <Text
                style={styles.loadingSubtitle}
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
/* StyleSheet.create permite agrupar los estilos utilizados por los componentes de este archivo.
 Cada propiedad dentro de styles representa un conjunto de 
 características visuales que puede aplicarse mediante:
 style={styles.nombre}
 */
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

      color: "#2563EB",

      marginBottom: 5,
    },

    loadingSubtitle: {
      fontSize: 14,

      color: "#64748B",

      textAlign: "center",
    },
  });