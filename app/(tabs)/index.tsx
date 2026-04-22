import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>Recomedi</Text>

      {/* 🔹 Recordatorios */}
      <View style={styles.card}>
        <Text style={styles.title}>Recordatorios</Text>
        <Text>Chequeo médico: 6-12 meses</Text>
        <Text>Revisión dental: 6 meses</Text>
      </View>

      {/* 🔹 Vista rápida del mapa */}
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