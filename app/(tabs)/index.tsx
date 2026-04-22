import { View, Text, Button, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

import { generarRecomendaciones } from "../../ml/recomendaciones";
import { generarMensaje, enviarNotificacion } from "../../ml/notificaciones";

export default function Home() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<any>(null);
  const [recomendaciones, setRecomendaciones] = useState<string[]>([]);

  // 🔔 Permisos de notificación
  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  // 📊 Cargar usuario + recomendaciones
  useEffect(() => {
    const cargar = async () => {
      const data = await AsyncStorage.getItem("usuario");
      if (data) {
        const user = JSON.parse(data);
        setUsuario(user);

        const rec = generarRecomendaciones(user);
        setRecomendaciones(rec);
      }
    };
    cargar();
  }, []);

  // 🔔 Botón de prueba
  const probarNotificacion = async () => {
    const data = await AsyncStorage.getItem("usuario");
    const usuario = data ? JSON.parse(data) : null;

    const mensaje = generarMensaje(usuario);

    alert(mensaje);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>Recomedi</Text>

      <Button title="Probar notificación" onPress={probarNotificacion} />

      {/* 🔹 Recordatorios */}
      <View style={styles.card}>
        <Text style={styles.title}>Recordatorios</Text>
        <Text>Chequeo médico: 6-12 meses</Text>
        <Text>Revisión dental: 6 meses</Text>
      </View>

      {/* 🔹 Recomendaciones */}
      <View style={styles.card}>
        <Text style={{ fontWeight: "bold" }}>Recomendaciones:</Text>

        {recomendaciones.map((r, index) => (
          <Text key={index}>• {r}</Text>
        ))}
      </View>

      {/* 🔹 Mapa */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/mapa")}
      >
        <Text style={styles.title}>Centros de salud cercanos</Text>
        <Text>Ver mapa</Text>
      </TouchableOpacity>

      {/* 🔹 Noticias */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/noticias")}
      >
        <Text style={styles.title}>Noticias de salud</Text>
        <Text>Última: Nueva campaña de vacunación</Text>
      </TouchableOpacity>

      {/* 🔹 Alertas */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/epidemia")}
      >
        <Text style={styles.title}>Alertas</Text>
        <Text>Brote de gripe en tu zona</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2E86C1",
  },
  card: {
    backgroundColor: "#D6EAF8",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  title: {
    fontWeight: "bold",
  },
});