import {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import {
  Redirect,
  Stack,
} from "expo-router";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
} from "../../services/firebase";

import {
  obtenerRolUsuario,
} from "../../services/rolService";

export default function ModeradorLayout() {
  const [
    usuarioCargado,
    setUsuarioCargado,
  ] = useState(false);

  const [
    esModerador,
    setEsModerador,
  ] = useState(false);

  const [
    verificando,
    setVerificando,
  ] = useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          try {
            setUsuarioCargado(
              !!user
            );

            /*
             * ==============================================
             * NO HAY USUARIO
             * ==============================================
             */

            if (!user) {
              setEsModerador(
                false
              );

              return;
            }

            /*
             * ==============================================
             * OBTENER ROL DESDE FIRESTORE
             * ==============================================
             *
             * usuarios/{uid}
             * rol: "moderador"
             */

            const rol =
              await obtenerRolUsuario(
                user.uid
              );

            console.log(
              "ROL MODERADOR:",
              rol
            );

            /*
             * ==============================================
             * COMPROBAR MODERADOR
             * ==============================================
             */

            if (
              rol ===
              "moderador"
            ) {
              setEsModerador(
                true
              );
            } else {
              setEsModerador(
                false
              );
            }

          } catch (error) {
            console.error(
              "Error verificando rol de moderador:",
              error
            );

            setEsModerador(
              false
            );

          } finally {
            setVerificando(
              false
            );
          }
        }
      );

    return unsubscribe;
  }, []);

  /*
   * ==========================================================
   * CARGANDO
   * ==========================================================
   */

  if (verificando) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
        />

        <View
          style={
            styles.loadingSpacing
          }
        />
      </View>
    );
  }

  /*
   * ==========================================================
   * NO AUTENTICADO
   * ==========================================================
   */

  if (
    !usuarioCargado
  ) {
    return (
      <Redirect
        href="/auth/login"
      />
    );
  }

  /*
   * ==========================================================
   * NO ES MODERADOR
   * ==========================================================
   */

  if (
    !esModerador
  ) {
    return (
      <Redirect
        href="/"
      />
    );
  }

  /*
   * ==========================================================
   * MODERADOR AUTORIZADO
   * ==========================================================
   */

  return (
    <Stack
      screenOptions={{
        headerShown:
          false,
      }}
    />
  );
}

const styles =
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    loadingSpacing: {
      height: 1,
    },
  });