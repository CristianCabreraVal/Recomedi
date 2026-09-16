import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const newsData = [
  {
    id: "1",
    title: "Nueva campaña de vacunación",
    description:
      "El gobierno anuncia jornadas gratuitas de vacunación.",
    category: "Salud Pública",
    date: "13 Mayo 2026",
  },

  {
    id: "2",
    title: "Aumento de enfermedades respiratorias",
    description:
      "Se recomienda uso de mascarilla en lugares cerrados.",
    category: "Prevención",
    date: "12 Mayo 2026",
  },
];

export default function News() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Noticias de Salud</Text>

      <FlatList
        data={newsData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
  <View style={styles.card}>
    <Text style={styles.category}>
      {item.category}
    </Text>

    <Text style={styles.title}>
      {item.title}
    </Text>

    <Text style={styles.description}>
      {item.description}
    </Text>

    <Text style={styles.date}>
      {item.date}
    </Text>
  </View>
)}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay noticias disponibles</Text>
        }
      />
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
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 18,
    marginBottom: 15,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,

    elevation: 4,
  },

  category: {
    color: "#2563EB",
    fontWeight: "bold",
    marginBottom: 8,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },

  description: {
    marginTop: 8,
    color: "#4B5563",
    lineHeight: 22,
  },

  date: {
    marginTop: 12,
    color: "#9CA3AF",
    fontSize: 12,
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#6B7280",
  },
});