import {View,Text,StyleSheet,TouchableOpacity,ScrollView,
} from "react-native";

import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { Ionicons } from "@expo/vector-icons";

import { generarRecomendaciones } from "../../ml/recomendaciones";
import { generarMensaje } from "../../ml/notificaciones";
import { useTheme } from "../../hooks/useTheme";

import { auth } from "../../services/firebase";

export default function Home() {
  const dark = useTheme();
  const router = useRouter();

  const [usuario, setUsuario] = useState<any>(null);
  const [recomendaciones, setRecomendaciones] = useState<string[]>([]);

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

useEffect(() => {
  const verificarSesion = async () => {
    setTimeout(() => {
      if (!auth.currentUser) {
        router.replace("/auth/login");
      }
    }, 100);
  };

  verificarSesion();
}, []);

  const probarNotificacion = async () => {
    const data = await AsyncStorage.getItem("usuario");

    const usuario = data ? JSON.parse(data) : null;

    const mensaje = generarMensaje(usuario);

    alert(mensaje);
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: dark ? "#121212" : "#F3F4F6",
        },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>Recomedi</Text>

            <Text style={styles.subtitle}>
              {usuario
                ? `Hola, ${usuario.nombre}`
                : "Bienvenido a tu salud preventiva"}
            </Text>
          </View>

          <Ionicons name="medkit" size={34} color="#2563EB" />
        </View>

        {/* RECOMENDACIÓN DESTACADA */}
        <View style={styles.mainCard}>
          <Text style={styles.mainTitle}>
            Recomendación personalizada
          </Text>

          <Text style={styles.mainText}>
            Mantener controles médicos periódicos ayuda a
            prevenir enfermedades.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={probarNotificacion}
          >
            <Text style={styles.buttonText}>
              Ver recomendación
            </Text>
          </TouchableOpacity>
        </View>

        {/* RECORDATORIOS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Recordatorios importantes
          </Text>

          <Text style={styles.item}>
            • Chequeo médico: 6-12 meses
          </Text>

          <Text style={styles.item}>
            • Revisión dental: cada 6 meses
          </Text>
        </View>

        {/* RECOMENDACIONES */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Recomendaciones
          </Text>

          {recomendaciones.length > 0 ? (
            recomendaciones.map((r, index) => (
              <Text key={index} style={styles.item}>
                • {r}
              </Text>
            ))
          ) : (
            <Text style={styles.item}>
              Completa tu perfil para obtener recomendaciones.
            </Text>
          )}
        </View>

        {/* MAPA */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/mapa")}
        >
          <View style={styles.row}>
            <Ionicons
              name="location"
              size={24}
              color="#2563EB"
            />

            <Text style={styles.cardTitle}>
              Centros de salud
            </Text>
          </View>

          <Text style={styles.item}>
            Hospitales y droguerías cercanas
          </Text>
        </TouchableOpacity>

        {/* NOTICIAS */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/noticias")}
        >
          <View style={styles.row}>
            <Ionicons
              name="newspaper"
              size={24}
              color="#2563EB"
            />

            <Text style={styles.cardTitle}>
              Noticias de salud
            </Text>
          </View>

          <Text style={styles.item}>
            Información y novedades médicas
          </Text>
        </TouchableOpacity>

        {/* ALERTAS */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/epidemia")}
        >
          <View style={styles.row}>
            <Ionicons
              name="warning"
              size={24}
              color="#DC2626"
            />

            <Text style={styles.cardTitle}>
              Alertas sanitarias
            </Text>
          </View>

          <Text style={styles.item}>
            Brotes y epidemias cercanas
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
    paddingTop: 10,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },

  logo: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2563EB",
  },

  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 4,
  },

  mainCard: {
    backgroundColor: "#2563EB",
    padding: 22,
    borderRadius: 20,
    marginBottom: 18,
  },

  mainTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  mainText: {
    color: "#E5E7EB",
    fontSize: 15,
    marginBottom: 18,
  },

  button: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#2563EB",
    fontWeight: "bold",
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
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },

  item: {
    marginTop: 8,
    fontSize: 15,
    color: "#374151",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});