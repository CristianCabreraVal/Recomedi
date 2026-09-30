/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// Ionicons: permite usar iconos para complementar la interfaz de usuario
import { Ionicons } from "@expo/vector-icons";
// AsyncStorage: permite guardar y recuperar datos de manera persistente desde el dispositivo del usuario
import AsyncStorage from "@react-native-async-storage/async-storage";
//Hooks de React utilizados para manejar:
//useEffect: ejecutar procesos al cargar la pantalla.
//useState: guardar información que cambia durante el uso.
import { useEffect, useState } from "react";
 // importa los componentes de React Native que se van a utilizar en la pantalla
import { ScrollView,StyleSheet,Switch,Text,TouchableOpacity,View } from "react-native";
//signOut: función de Firebase Auth utilizada para cerrar la sesión del usuario actualmente autenticado.
import { signOut } from "firebase/auth";
// Instancias de autenticación configurada de Firebase
import { auth } from "../../services/firebase";
// Importación del hook personalizado para obtener los colores del tema actual (claro u oscuro)
import { useTheme } from "../../hooks/useTheme";
// Importa la funcion de un boton para reportar
import BotonReportar from "../../components/BotonReportar";

import {MOTIVOS_GENERALES} from "../../services/reportesService";
// export default indica que este es el componente principal que se exporta desde este archivo.
export default function Configuracion() {
/*const: declara una variable cuyo valor no se reasigna.
Se utiliza para guardar valores, funciones, resultados de
hooks o referencias que serán utilizados posteriormente por el componente.
*/
  const [notificaciones, setNotificaciones] = useState(false);
  const { dark, colors, setDark } = useTheme();

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await AsyncStorage.getItem("config");

        if (data) {
          const config = JSON.parse(data);

          setNotificaciones(config.notificaciones ?? false);
        }
      } catch (error) {
        console.error("Error al cargar configuración:", error);
      }
    };

    cargar();
  }, []);

  // Guardar configuración de notificaciones
  useEffect(() => {
    const guardarNotificaciones = async () => {
      try {
        const data = await AsyncStorage.getItem("config");
        const config = data ? JSON.parse(data) : {};

        config.notificaciones = notificaciones;

        await AsyncStorage.setItem(
          "config",
          JSON.stringify(config)
        );
      } catch (error) {
        console.error(
          "Error al guardar configuración:",
          error
        );
      }
    };

    guardarNotificaciones();
  }, [notificaciones]);

  // Cerrar sesión
  const cerrarSesion = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

return (
  <View
    style={[
      styles.container,
      {
        backgroundColor: colors.background,
      },
    ]}
  >
    <ScrollView
      showsVerticalScrollIndicator={true}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Encabezado */}
      <View style={styles.headerContainer}>
        <View
          style={[
            styles.headerIcon,
            {
              backgroundColor: colors.card,
            },
          ]}
        >
          <Ionicons
            name="settings"
            size={26}
            color={colors.primary}
          />
        </View>

        <View>
          <Text
            style={[
              styles.header,
              { color: colors.text },
            ]}
          >
            Configuración
          </Text>

          <Text
            style={[
              styles.subheader,
              { color: colors.textSecondary },
            ]}
          >
            Personaliza tu experiencia
          </Text>
        </View>
      </View>

      {/* Notificaciones */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card },
        ]}
      >
        <View style={styles.optionIcon}>
          <Ionicons
            name="notifications"
            size={23}
            color="#2563EB"
          />
        </View>

        <View style={styles.optionContent}>
          <Text
            style={[
              styles.optionTitle,
              { color: colors.text },
            ]}
          >
            Notificaciones
          </Text>

          <Text
            style={[
              styles.optionSubtitle,
              { color: colors.textSecondary },
            ]}
          >
            Recibir recordatorios médicos
          </Text>
        </View>

        <Switch
          value={notificaciones}
          onValueChange={setNotificaciones}
        />
      </View>

      {/* Modo oscuro */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card },
        ]}
      >
        <View
          style={[
            styles.optionIcon,
            {
              backgroundColor: dark
                ? "#312E81"
                : "#EEF2FF",
            },
          ]}
        >
          <Ionicons
            name="moon"
            size={23}
            color="#6366F1"
          />
        </View>

        <View style={styles.optionContent}>
          <Text
            style={[
              styles.optionTitle,
              { color: colors.text },
            ]}
          >
            Modo oscuro
          </Text>

          <Text
            style={[
              styles.optionSubtitle,
              { color: colors.textSecondary },
            ]}
          >
            Cambiar apariencia visual
          </Text>
        </View>

        <Switch
          value={dark}
          onValueChange={setDark}
        />
      </View>

      {/* Alimentación */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card },
        ]}
      >
        <View
          style={[
            styles.optionIcon,
            {
              backgroundColor: dark
                ? "#14532D"
                : "#F0FDF4",
            },
          ]}
        >
          <Ionicons
            name="nutrition"
            size={23}
            color="#16A34A"
          />
        </View>

        <View style={styles.optionContent}>
          <Text
            style={[
              styles.optionTitle,
              { color: colors.text },
            ]}
          >
            Alimentación saludable
          </Text>

          <Text
            style={[
              styles.optionSubtitle,
              { color: colors.textSecondary },
            ]}
          >
            Próximamente recomendaciones personalizadas
          </Text>
        </View>
      </View>

      {/* Información */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card },
        ]}
      >
        <View
          style={[
            styles.optionIcon,
            {
              backgroundColor: dark
                ? "#164E63"
                : "#ECFEFF",
            },
          ]}
        >
          <Ionicons
            name="information-circle"
            size={23}
            color="#0891B2"
          />
        </View>

        <View style={styles.optionContent}>
          <Text
            style={[
              styles.optionTitle,
              { color: colors.text },
            ]}
          >
            Información
          </Text>

          <Text
            style={[
              styles.optionSubtitle,
              { color: colors.textSecondary },
            ]}
          >
            Recomedi versión 1.0
          </Text>
        </View>
      </View>

      {/* Cerrar sesión */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={cerrarSesion}
      >
        <Ionicons
          name="log-out-outline"
          size={21}
          color="#FFFFFF"
        />

        <Text style={styles.logoutText}>
          Cerrar sesión
        </Text>
      </TouchableOpacity>
      <BotonReportar
  recursoId="configuracion"
  recursoNombre="Configuración de Recomedi"
  motivos={MOTIVOS_GENERALES}
  textoBoton="Reportar un problema"
  descripcionBoton="Ayúdanos a detectar problemas de la aplicación"
/>
    </ScrollView>
  </View>
);
}
/* StyleSheet.create permite agrupar los estilos utilizados por los componentes de este archivo.
 Cada propiedad dentro de styles representa un conjunto de 
 características visuales que puede aplicarse mediante:
 style={styles.nombre}
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },

  scrollContent: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    paddingBottom: 35,
  },

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 13,
  },

  header: {
    fontSize: 30,
    fontWeight: "800",
  },

  subheader: {
    fontSize: 14,
    marginTop: 4,
  },

  card: {
    minHeight: 82,

    padding: 16,

    borderRadius: 22,
    marginBottom: 14,

    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },

  optionIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,

    backgroundColor: "#EFF6FF",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 13,
  },

  optionContent: {
    flex: 1,
    marginRight: 12,
  },

  optionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },

  optionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#DC2626",

    paddingVertical: 15,
    borderRadius: 18,

    marginTop: 6,
  },

  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 8,
  },
});
