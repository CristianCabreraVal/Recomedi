import { View, Text, Switch, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Configuracion() {
  const [notificaciones, setNotificaciones] = useState(false);
  const [modoOscuro, setModoOscuro] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const data = await AsyncStorage.getItem("config");
      if (data) {
        const config = JSON.parse(data);
        setNotificaciones(config.notificaciones ?? false);
        setModoOscuro(config.modoOscuro ?? false);
      }
    };
    cargar();
  }, []);

  // 💾 Guardar automáticamente
  useEffect(() => {
    const guardar = async () => {
      const config = { notificaciones, modoOscuro };
      await AsyncStorage.setItem("config", JSON.stringify(config));
    };
    guardar();
  }, [notificaciones, modoOscuro]);

  return (
  <SafeAreaView style={styles.container}>
    <Text style={styles.header}>Configuración</Text>

    <Text style={styles.subheader}>
      Personaliza tu experiencia
    </Text>

    {/* 🔔 Notificaciones */}
    <View style={styles.card}>
      <View>
        <Text style={styles.optionTitle}>
          Notificaciones
        </Text>

        <Text style={styles.optionSubtitle}>
          Recibir recordatorios médicos
        </Text>
      </View>

      <Switch
        value={notificaciones}
        onValueChange={setNotificaciones}
      />
    </View>

    {/* 🌙 Modo oscuro */}
    <View style={styles.card}>
      <View>
        <Text style={styles.optionTitle}>
          Modo oscuro
        </Text>

        <Text style={styles.optionSubtitle}>
          Cambiar apariencia visual
        </Text>
      </View>

      <Switch
        value={modoOscuro}
        onValueChange={setModoOscuro}
      />
    </View>

    {/* 🍎 Alimentación */}
    <View style={styles.card}>
      <Text style={styles.optionTitle}>
        Alimentación saludable
      </Text>

      <Text style={styles.optionSubtitle}>
        Próximamente recomendaciones personalizadas
      </Text>
    </View>

    {/* ℹ️ Información */}
    <View style={styles.card}>
      <Text style={styles.optionTitle}>
        Información
      </Text>

      <Text style={styles.optionSubtitle}>
        Recomedi versión 1.0
      </Text>
    </View>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F3F4F6",
  },

  header: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2563EB",
  },

  subheader: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 4,
    marginBottom: 25,
  },

  card: {
    backgroundColor: "#fff",
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
    color: "#111827",
  },

  optionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
});