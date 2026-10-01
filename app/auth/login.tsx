/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
import { useState } from "react";
 // importa los componentes de React Native que se van a utilizar en la pantalla
import {ActivityIndicator,Alert,Image,KeyboardAvoidingView,Platform,
  Pressable,ScrollView,StyleSheet,Text,TextInput,View} from "react-native";
import {reload,signInWithEmailAndPassword} from "firebase/auth";
// Ionicons: permite usar iconos para complementar la interfaz de usuario
import { Ionicons } from "@expo/vector-icons";
// Componente para evitar que el contenido se solape con los bordes físicos del dispositivo (notch, barra de estado)
import {SafeAreaView,} from "react-native-safe-area-context";
import {useRouter,} from "expo-router";
// Instancias de autenticación configurada de Firebase
import {auth} from "../../services/firebase";
import {obtenerRolUsuario,} from "../../services/rolService";
import {registrarTokenFCMEnFirestore,} from "../../services/notificationTokenService";
import {consumirNotificacionPendiente,} from "../../services/notificationService";
// export permite utilizar este componente desde otros archivos.
// function declara el componente.
// export default indica que este es el componente principal que se exporta desde este archivo.
export default function Login() {
/*const: declara una variable cuyo valor no se reasigna.
Se utiliza para guardar valores, funciones, resultados de
hooks o referencias que serán utilizados posteriormente por el componente.
*/  // useRouter permite al usuario navegar desde botones o eventos hacia otras rutas de la aplicación.
  const router = useRouter();

  /* ==========================================================
     ESTADOS
  ========================================================== */

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [mostrarPassword, setMostrarPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  /* ==========================================================
     INICIAR SESIÓN
  ========================================================== */

  const login = async () => {
    const correo =
      email.trim().toLowerCase();

    /* --------------------------------------------------------
       VALIDAR CAMPOS
    -------------------------------------------------------- */

    if (!correo || !password) {
      Alert.alert(
        "Campos incompletos",
        "Ingresa tu correo y contraseña."
      );

      return;
    }

    if (!correo.includes("@")) {
      Alert.alert(
        "Correo inválido",
        "Ingresa un correo electrónico válido."
      );

      return;
    }

    /*
     * Indica si el proceso llegó correctamente
     * a una redirección.
     *
     * Si es true, NO quitamos la pantalla de carga
     * en finally porque la ruta actual está a punto
     * de desmontarse.
     */
    let redireccionando = false;

    try {
      /*
       * ======================================================
       * MOSTRAR CARGA INMEDIATAMENTE
       * ======================================================
       */
      setLoading(true);

      /*
       * ======================================================
       * AUTENTICAR CON FIREBASE
       * ======================================================
       */

      const resultado =
        await signInWithEmailAndPassword(
          auth,
          correo,
          password
        );

      console.log(
        "Inicio de sesión correcto"
      );

      console.log(
        "Usuario:",
        resultado.user.email
      );

      /*
       * ======================================================
       * ACTUALIZAR DATOS DE FIREBASE AUTH
       * ======================================================
       */

      await reload(
        resultado.user
      );

      /*
       * ======================================================
       * VERIFICAR CORREO
       * ======================================================
       */

      if (
        !resultado.user.emailVerified
      ) {
        /*
         * Mantenemos la pantalla de carga
         * hasta que /auth/verificar se monte.
         */
        redireccionando = true;

        router.replace(
          "/auth/verificar"
        );

        return;
      }

      /*
       * ======================================================
       * OBTENER ROL DESDE FIRESTORE
       *
       * usuarios/{uid}.rol
       * ======================================================
       */
/* ------------------------------------------------------
   OBTENER ROL DESDE FIRESTORE
------------------------------------------------------ */
const rol = await obtenerRolUsuario(
  resultado.user.uid
);

console.log(
  "ROL:",
  rol
);

try {
  await registrarTokenFCMEnFirestore();

  console.log(
    "Dispositivo preparado para recibir notificaciones."
  );
} catch (error) {
  console.log(
    "No se pudo registrar el dispositivo para notificaciones:",
    error
  );
}

/*
 * Comprobar si el usuario llegó a la aplicación
 * tocando una notificación.
 */
const notificacionPendiente =
  await consumirNotificacionPendiente();

if (notificacionPendiente) {
  const tipo =
    notificacionPendiente.tipo;

  console.log(
    "================================="
  );

  console.log(
    "NOTIFICACIÓN PENDIENTE DESPUÉS DEL LOGIN"
  );

  console.log(
    "Tipo:",
    tipo
  );

  console.log(
    "Datos:",
    notificacionPendiente.data
  );

  console.log(
    "================================="
  );

  /*
   * ============================
   * NOTICIA
   * ============================
   */
  if (tipo === "noticia") {
    router.replace(
      "/(tabs)/noticias"
    );

    return;
  }

  /*
   * ============================
   * ALERTA
   * ============================
   */
  if (tipo === "alerta") {
    router.replace(
      "/(tabs)/epidemia"
    );

    return;
  }

  /*
   * ============================
   * ACTIVIDAD
   * ============================
   */
  if (tipo === "actividad") {
    router.replace(
      "/(tabs)/actividad"
    );

    return;
  }

  /*
   * ============================
   * RECORDATORIOS DE SALUD
   * ============================
   */
  if (
    tipo === "hidratacion" ||
    tipo === "cuidado" ||
    tipo === "chequeo"
  ) {
    router.replace(
      "/(tabs)"
    );

    return;
  }
}

      /*
       * ======================================================
       * MODERADOR
       * ======================================================
       *
       * Todavía no tiene panel propio.
       *
       * Cuando lo creemos podremos cambiar
       * solamente esta ruta.
       * ======================================================
       */

      if (rol === "moderador") {
        redireccionando = true;

        router.replace("/moderador");

        return;
      }

      /*
       * ======================================================
       * USUARIO NORMAL
       * ======================================================
       */

      redireccionando = true;

      router.replace(
        "/(tabs)"
      );

    } catch (error: any) {
      console.error(
        "Error iniciando sesión:",
        error
      );

      /*
       * ======================================================
       * MENSAJES DE ERROR
       * ======================================================
       */

      switch (error?.code) {
        case "auth/invalid-credential":
          Alert.alert(
            "No se pudo iniciar sesión",
            "El correo o la contraseña no son correctos."
          );
          break;

        case "auth/invalid-email":
          Alert.alert(
            "Correo inválido",
            "El formato del correo electrónico no es válido."
          );
          break;

        case "auth/user-disabled":
          Alert.alert(
            "Cuenta deshabilitada",
            "Esta cuenta ha sido deshabilitada."
          );
          break;

        case "auth/too-many-requests":
          Alert.alert(
            "Demasiados intentos",
            "Se han realizado demasiados intentos. Intenta nuevamente más tarde."
          );
          break;

        case "auth/network-request-failed":
          Alert.alert(
            "Error de conexión",
            "No se pudo conectar con Firebase. Comprueba tu conexión a Internet."
          );
          break;

        default:
          Alert.alert(
            "Error",
            error?.message ||
              "No fue posible iniciar sesión. Intenta nuevamente."
          );
          break;
      }

    } finally {
      /*
       * ======================================================
       * OCULTAR CARGA SOLO SI NO HUBO REDIRECCIÓN
       * ======================================================
       *
       * Si el login fue correcto, dejamos la pantalla
       * encima hasta abandonar esta pantalla.
       *
       * Si ocurrió un error, vuelve a mostrarse el login.
       * ======================================================
       */

      if (!redireccionando) {
        setLoading(false);
      }
    }
  };

  /* ==========================================================
     INTERFAZ
  ========================================================== */

  return (
    <SafeAreaView
      style={styles.container}
    >
      <KeyboardAvoidingView
  style={
    styles.keyboardContainer
  }
  behavior={
    Platform.OS === "ios"
      ? "padding"
      : "height"
  }
  keyboardVerticalOffset={
    Platform.OS === "ios"
      ? 0
      : 20
  }
>
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={
              styles.formWrapper
            }
          >
            {/* ==================================================
                ENCABEZADO
            ================================================== */}

            <View
              style={
                styles.header
              }
            >
              <View
  style={
    styles.logoCircle
  }
>
  <Image
    source={require(
      "../../assets/images/icon.png"
    )}
    style={
      styles.logoImage
    }
    resizeMode="contain"
  />
</View>

              <Text
                style={
                  styles.title
                }
              >
                Iniciar sesión
              </Text>

              <Text
                style={
                  styles.subtitle
                }
              >
                Accede a tu cuenta de
                Recomedi
              </Text>
            </View>

            {/* ==================================================
                FORMULARIO
            ================================================== */}

            <View
              style={
                styles.formCard
              }
            >
              {/* ------------------------------------------------
                  CORREO
              ------------------------------------------------ */}

              <View
                style={
                  styles.field
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  Correo electrónico
                </Text>

                <View
                  style={
                    styles.inputContainer
                  }
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#64748B"
                    style={
                      styles.inputIcon
                    }
                  />

                  <TextInput
                    style={
                      styles.input
                    }
                    value={email}
                    onChangeText={
                      setEmail
                    }
                    placeholder="tu@correo.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* ------------------------------------------------
                  CONTRASEÑA
              ------------------------------------------------ */}

              <View
                style={
                  styles.field
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  Contraseña
                </Text>

                <View
                  style={
                    styles.inputContainer
                  }
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#64748B"
                    style={
                      styles.inputIcon
                    }
                  />

                  <TextInput
                    style={
                      styles.passwordInput
                    }
                    value={
                      password
                    }
                    onChangeText={
                      setPassword
                    }
                    placeholder="Ingresa tu contraseña"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={
                      !mostrarPassword
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password"
                    editable={!loading}
                  />

                  {/* --------------------------------------------
                      MOSTRAR / OCULTAR CONTRASEÑA
                  -------------------------------------------- */}

                  <Pressable
                    onPress={() =>
                      setMostrarPassword(
                        !mostrarPassword
                      )
                    }
                    style={
                      styles.eyeButton
                    }
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    disabled={
                      loading
                    }
                  >
                    <Ionicons
                      name={
                        mostrarPassword
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={22}
                      color="#64748B"
                    />
                  </Pressable>
                </View>
              </View>

              {/* ==================================================
                  BOTÓN INGRESAR
              ================================================== */}

              <Pressable
                style={[
                  styles.button,
                  loading &&
                    styles.buttonDisabled,
                ]}
                onPress={
                  login
                }
                disabled={
                  loading
                }
              >
                {loading ? (
                  <View
                    style={
                      styles.buttonLoading
                    }
                  >
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.buttonText
                      }
                    >
                      Verificando...
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={
                      styles.buttonText
                    }
                  >
                    Ingresar
                  </Text>
                )}
              </Pressable>

              {/* ==================================================
                  REGISTRO
              ================================================== */}

              <View
                style={
                  styles.bottomLink
                }
              >
                <Text
                  style={
                    styles.bottomText
                  }
                >
                  ¿No tienes una cuenta?
                </Text>

                <Pressable
                  onPress={() =>
                    router.push(
                      "/auth/register"
                    )
                  }
                  disabled={
                    loading
                  }
                  hitSlop={6}
                >
                  <Text
                    style={
                      styles.link
                    }
                  >
                    Crear cuenta
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ========================================================
          PANTALLA DE TRANSICIÓN

          Aparece ÚNICAMENTE después de pulsar "Ingresar".

          El logo es el mismo recurso
      ======================================================== */}

      {loading && (
        <View
          style={
            styles.loadingOverlay
          }
        >
          <View
            style={
              styles.loadingContent
            }
          >
            <Image
              source={require(
                "../../assets/images/icon.png"
              )}
              style={
                styles.loadingLogo
              }
              resizeMode="contain"
            />

            <ActivityIndicator
              size="large"
              color="#2563EB"
              style={
                styles.loadingSpinner
              }
            />

            <Text
              style={
                styles.loadingTitle
              }
            >
              Iniciando sesión...
            </Text>

            <Text
              style={
                styles.loadingSubtitle
              }
            >
              Verificando tu cuenta
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
/* StyleSheet.create permite agrupar los estilos utilizados por los componentes de este archivo.
 Cada propiedad dentro de styles representa un conjunto de 
 características visuales que puede aplicarse mediante:
 style={styles.nombre}
 */
const styles =
  StyleSheet.create({
    /* ========================================================
       CONTENEDOR GENERAL
    ======================================================== */

    container: {
      flex: 1,
      backgroundColor:
        "#F3F4F6",
    },

    keyboardContainer: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,
      justifyContent:
        "center",
      paddingHorizontal: 20,
      paddingVertical: 30,
    },

    formWrapper: {
      width: "100%",
      maxWidth: 460,
      alignSelf: "center",
    },

    /* ========================================================
       ENCABEZADO
    ======================================================== */

    header: {
      alignItems: "center",
      marginBottom: 22,
    },

    logoCircle: {
      width: 58,
      height: 58,
      borderRadius: 18,
      backgroundColor:
        "#E8F0FE",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginBottom: 14,
    },
    logoImage: {
  width: 42,
  height: 42,
},

    title: {
      fontSize: 30,
      fontWeight: "800",
      color: "#2563EB",
      textAlign: "center",
    },

    subtitle: {
      marginTop: 6,
      fontSize: 14,
      color: "#64748B",
      textAlign: "center",
    },

    /* ========================================================
       TARJETA
    ======================================================== */

    formCard: {
      width: "100%",
      backgroundColor:
        "#FFFFFF",
      borderRadius: 22,
      paddingHorizontal: 20,
      paddingVertical: 22,

      shadowColor:
        "#000",
      shadowOpacity:
        0.07,
      shadowRadius:
        12,
      shadowOffset: {
        width: 0,
        height: 4,
      },

      elevation: 4,
    },

    /* ========================================================
       CAMPOS
    ======================================================== */

    field: {
      width: "100%",
      marginBottom: 17,
    },

    label: {
      fontSize: 13,
      fontWeight: "700",
      color: "#334155",
      marginBottom: 7,
    },

    inputContainer: {
      width: "100%",
      minHeight: 54,

      flexDirection:
        "row",
      alignItems:
        "center",

      backgroundColor:
        "#F8FAFC",

      borderWidth: 1,
      borderColor:
        "#CBD5E1",

      borderRadius: 14,
    },

    inputIcon: {
      marginLeft: 14,
    },

    input: {
      flex: 1,
      minWidth: 0,
      paddingHorizontal: 11,
      paddingVertical: 14,
      color: "#0F172A",
      fontSize: 15,
    },

    passwordInput: {
      flex: 1,
      minWidth: 0,
      paddingLeft: 11,
      paddingRight: 4,
      paddingVertical: 14,
      color: "#0F172A",
      fontSize: 15,
    },

    eyeButton: {
      paddingHorizontal: 12,
      paddingVertical: 10,
    },

    /* ========================================================
       BOTÓN
    ======================================================== */

    button: {
      minHeight: 54,
      borderRadius: 14,
      backgroundColor:
        "#2563EB",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginTop: 2,
    },

    buttonDisabled: {
      opacity: 0.85,
    },

    buttonLoading: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 10,
    },

    buttonText: {
      color:
        "#FFFFFF",
      fontSize: 15,
      fontWeight:
        "800",
    },

    /* ========================================================
       ENLACE INFERIOR
    ======================================================== */

    bottomLink: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginTop: 20,
      gap: 5,
    },

    bottomText: {
      fontSize: 13,
      color:
        "#64748B",
    },

    link: {
      fontSize: 13,
      fontWeight: "800",
      color:
        "#2563EB",
    },

    /* ========================================================
       PANTALLA DE CARGA
    ======================================================== */

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

    loadingLogo: {
      width: 280,
      height: 110,

      marginBottom: 22,
    },

    loadingSpinner: {
      marginBottom: 14,
    },

    loadingTitle: {
      fontSize: 20,
      fontWeight: "800",

      color:
        "#2563EB",

      marginBottom: 5,

      textAlign:
        "center",
    },

    loadingSubtitle: {
      fontSize: 14,

      color:
        "#64748B",

      textAlign:
        "center",
    },
  });