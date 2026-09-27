import { useState } from "react";

import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from "react-native";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";

import {
  doc,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "../../services/firebase";

import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Register() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
  const correo = email.trim().toLowerCase();

  if (!correo || !password) {
    Alert.alert(
      "Error",
      "Completa todos los campos"
    );
    return;
  }

  try {
    console.log("1. Creando cuenta...");

    const resultado =
      await createUserWithEmailAndPassword(
        auth,
        correo,
        password
      );

    console.log(
      "2. Cuenta creada:",
      resultado.user.uid
    );

    console.log(
      "3. Enviando correo de verificación..."
    );

    await sendEmailVerification(
      resultado.user
    );

    console.log(
      "4. Correo de verificación enviado correctamente"
    );

    console.log(
      "5. Guardando usuario en Firestore..."
    );

    await setDoc(
      doc(
        db,
        "usuarios",
        resultado.user.uid
      ),
      {
        uid: resultado.user.uid,
        email:
          resultado.user.email || correo,
        rol: "usuario",
        activo: true,
        emailVerificado:
          resultado.user.emailVerified,
      }
    );

    console.log(
      "6. Usuario guardado en Firestore"
    );

    await signOut(auth);

    console.log(
      "7. Sesión cerrada"
    );

    Alert.alert(
      "Cuenta creada",
      "Cuenta creada correctamente. Revisa tu correo para verificar la dirección."
    );

    router.replace("/auth/login");
  } catch (error: any) {
    console.error(
      "ERROR EN REGISTRO:",
      error
    );

    console.error(
      "CODIGO DEL ERROR:",
      error?.code
    );

    console.error(
      "MENSAJE DEL ERROR:",
      error?.message
    );

    Alert.alert(
      "Error",
      error?.message ||
        "No fue posible crear la cuenta."
    );
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Crear Cuenta
      </Text>

      <TextInput
        placeholder="Correo"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={register}
      >
        <Text style={styles.buttonText}>
          Registrarse
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
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});