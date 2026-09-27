import { useState } from "react";

import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";

import {
  reload,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "../../services/firebase";

import { useRouter } from "expo-router";

import { SafeAreaView } from "react-native-safe-area-context";

import { obtenerRolUsuario } from "../../services/rolService";



export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
  const correo = email.trim().toLowerCase();

  if (!correo || !password) {
    Alert.alert(
      "Error",
      "Completa todos los campos"
    );
    return;
  }

  if (!correo.includes("@")) {
    Alert.alert(
      "Error",
      "Ingresa un correo válido"
    );
    return;
  }

  try {
    setLoading(true);

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
     * Actualizar los datos de Firebase Authentication
     */
    await reload(resultado.user);

    /*
     * BLOQUEAR EL ACCESO SI EL CORREO
     * TODAVÍA NO ESTÁ VERIFICADO
     */
    if (!resultado.user.emailVerified) {
      router.replace("/auth/verificar");
      return;
    }

    /*
     * Obtener rol desde Firestore
     */
    const rol = await obtenerRolUsuario(
      resultado.user.uid
    );

    console.log(
      "ROL:",
      rol
    );

    /*
     * Administrador
     */
    if (rol === "admin") {
      router.replace("/admin");
      return;
    }

    /*
     * Usuario normal o moderador
     */
    router.replace("/(tabs)");
  } catch (error: any) {
    console.error(
      "Error iniciando sesión:",
      error
    );

    Alert.alert(
      "Error",
      error?.message ||
        "No fue posible iniciar sesión."
    );
  } finally {
    setLoading(false);
  }
};
  

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Iniciar Sesión
      </Text>

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
          {loading
            ? "Ingresando..."
            : "Ingresar"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          router.push("/auth/register")
        }
        disabled={loading}
      >
        <Text style={styles.link}>
          Crear cuenta
        </Text>
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