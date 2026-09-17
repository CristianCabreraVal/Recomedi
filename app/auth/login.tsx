import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from "react-native";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebase";

import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    const correo = email.trim();

    // Validar campos
    if (!correo || !password) {
      Alert.alert(
        "Campos incompletos",
        "Ingresa tu correo y contraseña."
      );
      return;
    }

    // Validar formato básico del correo
    if (!correo.includes("@")) {
      Alert.alert(
        "Correo inválido",
        "Ingresa un correo electrónico válido."
      );
      return;
    }

    try {
      setLoading(true);

      const resultado = await signInWithEmailAndPassword(
        auth,
        correo,
        password
      );

      console.log("Inicio de sesión correcto");
      console.log("Usuario:", resultado.user.email);

      Alert.alert(
        "Correcto",
        "Inicio de sesión exitoso.",
        [
          {
            text: "Continuar",
            onPress: () => {
              // El _layout.tsx puede encargarse
              // de detectar al usuario autenticado.
            },
          },
        ]
      );

    } catch (error: any) {
      console.log("Firebase error:", error?.code);

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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>

      <TextInput
        placeholder="Correo"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.buttonDisabled,
        ]}
        onPress={login}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Ingresando..." : "Ingresar"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/auth/register")}
        disabled={loading}
      >
        <Text style={styles.link}>Crear cuenta</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
    backgroundColor: "#F3F4F6",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#2563EB",
    textAlign: "center",
  },

  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 14,
    marginBottom: 15,
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  link: {
    textAlign: "center",
    marginTop: 20,
    color: "#2563EB",
  },
});