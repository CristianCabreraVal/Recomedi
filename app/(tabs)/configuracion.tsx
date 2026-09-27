import {View,Text,Switch,StyleSheet,TouchableOpacity,ScrollView} from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

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
    </ScrollView>
  </SafeAreaView>
);
}

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
