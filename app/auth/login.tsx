/* ============================================================
   IMPORTACIONES
============================================================ */

import { useState } from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  signInWithEmailAndPassword,
} from "firebase/auth";

import { Ionicons } from "@expo/vector-icons";

import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";

import { auth } from "../../services/firebase";


/* ============================================================
   LOGIN
============================================================ */

export default function Login() {

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

     Mantiene la autenticación existente con Firebase y la
     detección del rol mediante Custom Claims.
  ========================================================== */

  const login = async () => {

    const correo =
      email.trim();

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


    /* --------------------------------------------------------
       VALIDAR CORREO
    -------------------------------------------------------- */

    if (!correo.includes("@")) {

      Alert.alert(
        "Correo inválido",
        "Ingresa un correo electrónico válido."
      );

      return;
    }


    try {

      setLoading(true);


      /* ------------------------------------------------------
         AUTENTICAR CON FIREBASE
      ------------------------------------------------------ */

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


      /* ------------------------------------------------------
         OBTENER CUSTOM CLAIMS

         true fuerza la renovación del token para obtener
         información actualizada del rol.
      ------------------------------------------------------ */

      const token =
        await resultado.user.getIdTokenResult(
          true
        );

      const rol =
        token.claims.role;


      console.log(
        "Rol detectado:",
        rol
      );


      /* ------------------------------------------------------
         ADMINISTRADOR
      ------------------------------------------------------ */

      if (rol === "admin") {

        router.replace("/admin");

        return;
      }


      /* ------------------------------------------------------
         MODERADOR

         Como todavía no existe una pantalla independiente
         para moderadores, se utiliza la aplicación normal.
      ------------------------------------------------------ */

      if (rol === "moderador") {

        router.replace("/(tabs)");

        return;
      }


      /* ------------------------------------------------------
         USUARIO NORMAL
      ------------------------------------------------------ */

      router.replace("/(tabs)");

    } catch (error: any) {

      console.log(
        "Firebase error:",
        error?.code
      );


      /* ------------------------------------------------------
         MENSAJES DE ERROR
      ------------------------------------------------------ */

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
            "No fue posible iniciar sesión. Intenta nuevamente."
          );

          break;
      }

    } finally {

      setLoading(false);

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
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >

        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          <View
            style={styles.formWrapper}
          >

            {/* ==================================================
                ENCABEZADO
            ================================================== */}

            <View
              style={styles.header}
            >

              <View
                style={styles.logoCircle}
              >
                <Ionicons
                  name="heart"
                  size={28}
                  color="#2563EB"
                />
              </View>

              <Text
                style={styles.title}
              >
                Iniciar sesión
              </Text>

              <Text
                style={styles.subtitle}
              >
                Accede a tu cuenta de Recomedi
              </Text>

            </View>


            {/* ==================================================
                FORMULARIO
            ================================================== */}

            <View
              style={styles.formCard}
            >

              {/* ------------------------------------------------
                  CORREO
              ------------------------------------------------ */}

              <View
                style={styles.field}
              >

                <Text
                  style={styles.label}
                >
                  Correo electrónico
                </Text>

                <View
                  style={styles.inputContainer}
                >

                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#64748B"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
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
                style={styles.field}
              >

                <Text
                  style={styles.label}
                >
                  Contraseña
                </Text>

                <View
                  style={styles.inputContainer}
                >

                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#64748B"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
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
                      BOTÓN MOSTRAR / OCULTAR
                  -------------------------------------------- */}

                  <Pressable
                    onPress={() =>
                      setMostrarPassword(
                        !mostrarPassword
                      )
                    }
                    style={styles.eyeButton}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    disabled={loading}
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
                onPress={login}
                disabled={loading}
              >

                <Text
                  style={styles.buttonText}
                >
                  {loading
                    ? "Ingresando..."
                    : "Ingresar"}
                </Text>

              </Pressable>


              {/* ==================================================
                  REGISTRO
              ================================================== */}

              <View
                style={styles.bottomLink}
              >

                <Text
                  style={styles.bottomText}
                >
                  ¿No tienes una cuenta?
                </Text>

                <Pressable
                  onPress={() =>
                    router.push(
                      "/auth/register"
                    )
                  }
                  disabled={loading}
                  hitSlop={6}
                >

                  <Text
                    style={styles.link}
                  >
                    Crear cuenta
                  </Text>

                </Pressable>

              </View>

            </View>

          </View>

        </ScrollView>

      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}


/* ============================================================
   ESTILOS
============================================================ */

const styles =
  StyleSheet.create({

    /* ========================================================
       CONTENEDOR GENERAL
    ======================================================== */

    container: {
      flex: 1,
      backgroundColor: "#F3F4F6",
    },

    keyboardContainer: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
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
      backgroundColor: "#E8F0FE",

      justifyContent: "center",
      alignItems: "center",

      marginBottom: 14,
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
       TARJETA DEL FORMULARIO
    ======================================================== */

    formCard: {
      width: "100%",
      backgroundColor: "#FFFFFF",

      borderRadius: 22,

      paddingHorizontal: 20,
      paddingVertical: 22,

      shadowColor: "#000",
      shadowOpacity: 0.07,
      shadowRadius: 12,

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

      flexDirection: "row",
      alignItems: "center",

      backgroundColor: "#F8FAFC",

      borderWidth: 1,
      borderColor: "#CBD5E1",

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

      backgroundColor: "#2563EB",

      justifyContent: "center",
      alignItems: "center",

      marginTop: 2,
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    buttonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "800",
    },


    /* ========================================================
       ENLACE INFERIOR
    ======================================================== */

    bottomLink: {
      flexDirection: "row",
      flexWrap: "wrap",

      justifyContent: "center",
      alignItems: "center",

      marginTop: 20,
      gap: 5,
    },

    bottomText: {
      fontSize: 13,
      color: "#64748B",
    },

    link: {
      fontSize: 13,
      fontWeight: "800",
      color: "#2563EB",
    },

  });