import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../hooks/useTheme";
import { generarMensaje } from "../../ml/notificaciones";
import { generarRecomendaciones } from "../../ml/recomendaciones";

export default function Home() {
  const dark = useTheme();
  const router = useRouter();

  const [usuario, setUsuario] = useState<any>(null);
  const [recomendaciones, setRecomendaciones] = useState<string[]>([]);

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const data = await AsyncStorage.getItem("usuario");

        if (!data) {
          setUsuario(null);
          setRecomendaciones([]);
          return;
        }

        const user = JSON.parse(data);

        setUsuario(user);

        const rec = generarRecomendaciones(user);
        setRecomendaciones(rec);
      } catch (error) {
        console.error("Error cargando usuario:", error);
      }
    };

    cargarUsuario();
  }, []);

  const probarRecomendacion = async () => {
    try {
      const data = await AsyncStorage.getItem("usuario");

      const usuarioActual = data ? JSON.parse(data) : null;

      const mensaje = generarMensaje(usuarioActual);

      Alert.alert("Recomedi", mensaje);
    } catch (error) {
      console.error("Error generando recomendación:", error);

      Alert.alert(
        "Recomedi",
        "No fue posible generar la recomendación."
      );
    }
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

            <Text
              style={[
                styles.subtitle,
                {
                  color: dark ? "#D1D5DB" : "#6B7280",
                },
              ]}
            >
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
            onPress={probarRecomendacion}
          >
            <Text style={styles.buttonText}>
              Ver recomendación
            </Text>
          </TouchableOpacity>
        </View>

        {/* RECORDATORIOS */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: dark ? "#1E1E1E" : "#FFFFFF",
            },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              {
                color: dark ? "#FFFFFF" : "#111827",
              },
            ]}
          >
            Recordatorios importantes
          </Text>

          <Text
            style={[
              styles.item,
              {
                color: dark ? "#D1D5DB" : "#374151",
              },
            ]}
          >
            • Chequeo médico: 6-12 meses
          </Text>

          <Text
            style={[
              styles.item,
              {
                color: dark ? "#D1D5DB" : "#374151",
              },
            ]}
          >
            • Revisión dental: cada 6 meses
          </Text>
        </View>

        {/* RECOMENDACIONES */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: dark ? "#1E1E1E" : "#FFFFFF",
            },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              {
                color: dark ? "#FFFFFF" : "#111827",
              },
            ]}
          >
            Recomendaciones
          </Text>

          {recomendaciones.length > 0 ? (
            recomendaciones.map((r, index) => (
              <Text
                key={`${r}-${index}`}
                style={[
                  styles.item,
                  {
                    color: dark ? "#D1D5DB" : "#374151",
                  },
                ]}
              >
                • {r}
              </Text>
            ))
          ) : (
            <Text
              style={[
                styles.item,
                {
                  color: dark ? "#D1D5DB" : "#374151",
                },
              ]}
            >
              Completa tu perfil para obtener recomendaciones.
            </Text>
          )}
        </View>

        {/* MAPA */}
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: dark ? "#1E1E1E" : "#FFFFFF",
            },
          ]}
          onPress={() => router.push("/mapa")}
        >
          <View style={styles.row}>
            <Ionicons
              name="location"
              size={24}
              color="#2563EB"
            />

            <Text
              style={[
                styles.cardTitle,
                {
                  color: dark ? "#FFFFFF" : "#111827",
                },
              ]}
            >
              Centros de salud
            </Text>
          </View>

          <Text
            style={[
              styles.item,
              {
                color: dark ? "#D1D5DB" : "#374151",
              },
            ]}
          >
            Hospitales y droguerías cercanas
          </Text>
        </TouchableOpacity>

        {/* NOTICIAS */}
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: dark ? "#1E1E1E" : "#FFFFFF",
            },
          ]}
          onPress={() => router.push("/noticias")}
        >
          <View style={styles.row}>
            <Ionicons
              name="newspaper"
              size={24}
              color="#2563EB"
            />

            <Text
              style={[
                styles.cardTitle,
                {
                  color: dark ? "#FFFFFF" : "#111827",
                },
              ]}
            >
              Noticias de salud
            </Text>
          </View>

          <Text
            style={[
              styles.item,
              {
                color: dark ? "#D1D5DB" : "#374151",
              },
            ]}
          >
            Información y novedades médicas
          </Text>
        </TouchableOpacity>

        {/* ALERTAS */}
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: dark ? "#1E1E1E" : "#FFFFFF",
            },
          ]}
          onPress={() => router.push("/epidemia")}
        >
          <View style={styles.row}>
            <Ionicons
              name="warning"
              size={24}
              color="#DC2626"
            />

            <Text
              style={[
                styles.cardTitle,
                {
                  color: dark ? "#FFFFFF" : "#111827",
                },
              ]}
            >
              Alertas sanitarias
            </Text>
          </View>

          <Text
            style={[
              styles.item,
              {
                color: dark ? "#D1D5DB" : "#374151",
              },
            ]}
          >
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
    marginTop: 4,
  },

  mainCard: {
    backgroundColor: "#2563EB",
    padding: 22,
    borderRadius: 20,
    marginBottom: 18,
  },

  mainTitle: {
    color: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#2563EB",
    fontWeight: "bold",
  },

  card: {
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
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});