import { useEffect, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { useRouter } from "expo-router";

import {
    reload,
    sendEmailVerification,
    signOut,
} from "firebase/auth";

import { sincronizarVerificacionEmail } from "../../services/emailVerificationService";
import { auth } from "../../services/firebase";

export default function VerificarEmail() {
  const router = useRouter();

  const [correo, setCorreo] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  useEffect(() => {
    const usuario = auth.currentUser;

    if (!usuario) {
      router.replace("/auth/login");
      return;
    }

    setCorreo(usuario.email || "");
  }, []);

  const comprobarVerificacion = async () => {
    const usuario = auth.currentUser;

    if (!usuario) {
      router.replace("/auth/login");
      return;
    }

    try {
      setVerificando(true);

      await reload(usuario);

      if (!usuario.emailVerified) {
        Alert.alert(
          "Correo no verificado",
          "Todavía no hemos detectado la verificación. Abre el enlace del correo y vuelve a intentarlo."
        );

        return;
      }

      await sincronizarVerificacionEmail();

      Alert.alert(
        "Correo verificado",
        "Tu correo fue verificado correctamente."
      );

      router.replace("/");
    } catch (error: any) {
      console.error(
        "Error comprobando verificación:",
        error
      );

      Alert.alert(
        "Error",
        error?.message ||
          "No fue posible comprobar la verificación."
      );
    } finally {
      setVerificando(false);
    }
  };

  const reenviarCorreo = async () => {
    const usuario = auth.currentUser;

    if (!usuario) {
      router.replace("/auth/login");
      return;
    }

    try {
      setReenviando(true);

      await sendEmailVerification(usuario);

      Alert.alert(
        "Correo enviado",
        "Te enviamos nuevamente el correo de verificación."
      );
    } catch (error: any) {
      console.error(
        "Error reenviando correo:",
        error
      );

      Alert.alert(
        "Error",
        error?.message ||
          "No fue posible enviar el correo."
      );
    } finally {
      setReenviando(false);
    }
  };

  const salir = async () => {
    await signOut(auth);
    router.replace("/auth/login");
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✉</Text>
        </View>

        <Text style={styles.title}>
          Verifica tu correo
        </Text>

        <Text style={styles.description}>
          Para terminar de activar tu cuenta en Recomedi,
          debes verificar tu dirección de correo electrónico.
        </Text>

        <View style={styles.emailBox}>
          <Text style={styles.emailLabel}>
            Correo registrado
          </Text>

          <Text style={styles.email}>
            {correo}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={comprobarVerificacion}
          disabled={verificando}
        >
          {verificando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              Ya verifiqué mi correo
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={reenviarCorreo}
          disabled={reenviando}
        >
          {reenviando ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.secondaryButtonText}>
              Reenviar correo
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={salir}
        >
          <Text style={styles.logoutButtonText}>
            Volver al inicio de sesión
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F3F4F6",
  },

  card: {
    width: "100%",
    maxWidth: 460,
    padding: 28,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },

  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBEAFE",
    marginBottom: 18,
  },

  icon: {
    fontSize: 32,
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
    textAlign: "center",
    color: "#111827",
  },

  description: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
  },

  emailBox: {
    marginTop: 22,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
  },

  emailLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 5,
  },

  email: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  primaryButton: {
    marginTop: 22,
    minHeight: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  secondaryButton: {
    marginTop: 11,
    minHeight: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },

  secondaryButtonText: {
    color: "#1E40AF",
    fontSize: 14,
    fontWeight: "800",
  },

  logoutButton: {
    marginTop: 18,
    alignItems: "center",
  },

  logoutButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
});