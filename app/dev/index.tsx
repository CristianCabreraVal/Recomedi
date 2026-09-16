import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

export default function DevPanel() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>
          Recomedi Developer Panel
        </Text>

        <Text style={styles.subtitle}>
          Herramientas internas de desarrollo
        </Text>

        {/* Firebase */}

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/dev/firebase")}
        >
          <Text style={styles.cardTitle}>🔥 Firebase</Text>

          <Text style={styles.cardText}>
            Authentication y Firestore
          </Text>
        </TouchableOpacity>

        {/* Configuración */}

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/dev/configuracion")}
        >
          <Text style={styles.cardTitle}>⚙ Configuración</Text>

          <Text style={styles.cardText}>
            Pruebas de configuración
          </Text>
        </TouchableOpacity>

        {/* Perfil */}

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/dev/perfil")}
        >
          <Text style={styles.cardTitle}>👤 Perfil</Text>

          <Text style={styles.cardText}>
            Pruebas del perfil
          </Text>
        </TouchableOpacity>

        {/* Mapa */}

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/dev/mapa")}
        >
          <Text style={styles.cardTitle}>🗺 Mapa</Text>

          <Text style={styles.cardText}>
            APIs y geolocalización
          </Text>
        </TouchableOpacity>

        {/* IA */}

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/dev/ml")}
        >
          <Text style={styles.cardTitle}>🧠 Machine Learning</Text>

          <Text style={styles.cardText}>
            Motor de recomendaciones
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
    padding: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2563EB",
  },

  subtitle: {
    marginTop: 5,
    marginBottom: 30,
    color: "#6B7280",
    fontSize: 15,
  },

  card: {

    backgroundColor: "#FFFFFF",

    padding: 20,

    borderRadius: 18,

    marginBottom: 18,

    elevation: 4,

    shadowColor: "#000",

    shadowOpacity: 0.08,

    shadowRadius: 10,
  },

  cardTitle: {

    fontSize: 18,

    fontWeight: "bold",

    marginBottom: 6,

  },

  cardText: {

    color: "#6B7280",

  },

});