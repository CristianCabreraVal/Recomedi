import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const newsData = [
  {
    id: "1",
    title: "Nueva campaña de vacunación",
    description: "El gobierno anuncia jornadas gratuitas de vacunación.",
  },
  {
    id: "2",
    title: "Aumento de enfermedades respiratorias",
    description: "Se recomienda uso de mascarilla en lugares cerrados.",
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
            <Text style={styles.title}>{item.title}</Text>
            <Text>{item.description}</Text>
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
  container: { flex: 1, padding: 15 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  card: {
    backgroundColor: "#E8F6F3",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  title: { fontWeight: "bold" },
  empty: { textAlign: "center", marginTop: 20 },
});