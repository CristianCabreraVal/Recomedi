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
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth, db } from "../../services/firebase";

/* ============================================================
   REGISTRO
============================================================ */

export default function Register() {
  const router = useRouter();

  /* ==========================================================
     ESTADOS
  ========================================================== */

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ==========================================================
     CREAR CUENTA (Lógica del Archivo 1 + Validaciones Archivo 2)
  ========================================================== */

  const register = async () => {
    const correo = email.trim().toLowerCase();

    /* --------------------------------------------------------
       VALIDAR CAMPOS
    -------------------------------------------------------- */
    if (!correo || !password) {
      Alert.alert(
        "Campos incompletos",
        "Completa el correo y la contraseña."
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

    if (password.length < 6) {
      Alert.alert(
        "Contraseña inválida",
        "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    try {
      setLoading(true);

      console.log("1. Creando cuenta...");
      const resultado = await createUserWithEmailAndPassword(
        auth,
        correo,
        password
      );
      console.log("2. Cuenta creada:", resultado.user.uid);

      console.log("3. Enviando correo de verificación...");
      await sendEmailVerification(resultado.user);
      console.log("4. Correo de verificación enviado correctamente");

      console.log("5. Guardando usuario en Firestore...");
      await setDoc(doc(db, "usuarios", resultado.user.uid), {
        uid: resultado.user.uid,
        email: resultado.user.email || correo,
        rol: "usuario",
        activo: true,
        emailVerificado: resultado.user.emailVerified,
      });
      console.log("6. Usuario guardado en Firestore");

      await signOut(auth);
      console.log("7. Sesión cerrada");

      Alert.alert(
        "Cuenta creada",
        "Cuenta creada correctamente. Revisa tu correo para verificar la dirección.",
        [
          {
            text: "Continuar",
            onPress: () => router.replace("/auth/login"),
          },
        ]
      );
    } catch (error: any) {
      console.error("ERROR EN REGISTRO:", error);
      console.log("Firebase register error code:", error?.code);

      /* ------------------------------------------------------
         ERRORES CONOCIDOS (Del Archivo 2)
      ------------------------------------------------------ */
      switch (error?.code) {
        case "auth/email-already-in-use":
          Alert.alert(
            "Correo en uso",
            "Ya existe una cuenta registrada con este correo."
          );
          break;
        case "auth/invalid-email":
          Alert.alert(
            "Correo inválido",
            "El formato del correo electrónico no es válido."
          );
          break;
        case "auth/weak-password":
          Alert.alert(
            "Contraseña débil",
            "La contraseña debe tener al menos 6 caracteres."
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
            error?.message || "No fue posible crear la cuenta. Intenta nuevamente."
          );
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     INTERFAZ (Diseño del Archivo 2)
  ========================================================== */

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formWrapper}>
            
            {/* ==================================================
                ENCABEZADO
            ================================================== */}
            <View style={styles.header}>
              <View style={styles.logoCircle}>
                <Ionicons
                  name="person-add"
                  size={28}
                  color="#2563EB"
                />
              </View>
              <Text style={styles.title}>Crear cuenta</Text>
              <Text style={styles.subtitle}>
                Regístrate para comenzar a usar Recomedi
              </Text>
            </View>

            {/* ==================================================
                FORMULARIO
            ================================================== */}
            <View style={styles.formCard}>
              
              {/* ------------------------------------------------
                  CORREO
              ------------------------------------------------ */}
              <View style={styles.field}>
                <Text style={styles.label}>Correo electrónico</Text>
                <View style={styles.inputContainer}>
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
              <View style={styles.field}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.inputContainer}>
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
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!mostrarPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    editable={!loading}
                  />

                  {/* --------------------------------------------
                      MOSTRAR / OCULTAR CONTRASEÑA
                  -------------------------------------------- */}
                  <Pressable
                    onPress={() => setMostrarPassword(!mostrarPassword)}
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
                  BOTÓN REGISTRARSE
              ================================================== */}
              <Pressable
                style={[
                  styles.button,
                  loading && styles.buttonDisabled,
                ]}
                onPress={register}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Creando cuenta..." : "Registrarse"}
                </Text>
              </Pressable>

              {/* ==================================================
                  VOLVER AL LOGIN
              ================================================== */}
              <View style={styles.bottomLink}>
                <Text style={styles.bottomText}>
                  ¿Ya tienes una cuenta?
                </Text>
                <Pressable
                  onPress={() => router.replace("/auth/login")}
                  disabled={loading}
                  hitSlop={6}
                >
                  <Text style={styles.link}>Iniciar sesión</Text>
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
   ESTILOS (Diseño del Archivo 2)
============================================================ */

const styles = StyleSheet.create({
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
    lineHeight: 20,
  },

  /* ========================================================
     TARJETA
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
     ENLACE
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