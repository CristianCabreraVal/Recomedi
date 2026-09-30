/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
import {useEffect,useState} from "react";
//Componentes visuales de React Native utilizados paraconstruir la pantalla de carga.
import {ActivityIndicator,StyleSheet,View,} from "react-native";
import {Redirect,Stack,} from "expo-router";

import {onAuthStateChanged,} from "firebase/auth";
// Instancias de autenticación configurada de Firebase
import {auth} from "../../services/firebase";
import {obtenerRolUsuario,} from "../../services/rolService";
// export permite utilizar este componente desde otros archivos.
// function declara el componente.
// export default indica que este es el componente principal que se exporta desde este archivo.
export default function ModeradorLayout() {
/*const: declara una variable cuyo valor no se reasigna.
Se utiliza para guardar valores, funciones, resultados de
hooks o referencias que serán utilizados posteriormente por el componente.
*/
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
/* StyleSheet.create permite agrupar los estilos utilizados por los componentes de este archivo.
 Cada propiedad dentro de styles representa un conjunto de 
 características visuales que puede aplicarse mediante:
 style={styles.nombre}
 */
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