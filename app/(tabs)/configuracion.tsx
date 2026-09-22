import {View,Text,Switch,StyleSheet,TouchableOpacity,} from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";

import { useTheme } from "../../hooks/useTheme";

export default function Configuracion() {
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
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <Text
        style={[
          styles.header,
          { color: colors.primary },
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

      {/* Notificaciones */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card },
        ]}
      >
        <View>
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
        <View>
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

      {/* Información */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card },
        ]}
      >
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

      {/* Cerrar sesión */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={cerrarSesion}
      >
        <Text style={styles.logoutText}>
          Cerrar sesión
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  header: {
    fontSize: 30,
    fontWeight: "bold",
  },

  subheader: {
    fontSize: 15,
    marginTop: 4,
    marginBottom: 25,
  },

  card: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 15,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,

    elevation: 4,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  optionTitle: {
    fontSize: 17,
    fontWeight: "bold",
  },

  optionSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },

  logoutButton: {
    backgroundColor: "#DC2626",
    padding: 16,
    borderRadius: 18,
    marginTop: 5,
    alignItems: "center",
  },

  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});