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

      <View style={styles.option}>
        <Text>Notificaciones</Text>
        <Switch value={notificaciones} onValueChange={setNotificaciones} />
      </View>

      <View style={styles.option}>
        <Text>Modo oscuro</Text>
        <Switch value={modoOscuro} onValueChange={setModoOscuro} />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 10,
  },
});