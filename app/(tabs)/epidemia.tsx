import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const alertsData = [
  {
    id: "1",
    disease: "Gripe común",
    level: "Moderado",
    location: "Bogotá",
  },
  {
    id: "2",
    disease: "Dengue",
    level: "Alto",
    location: "Zona cercana",
  },
];

export default function Alerts() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Alertas Epidemiológicas</Text>

      <FlatList
        data={alertsData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.disease}</Text>
            <Text>Nivel: {item.level}</Text>
            <Text>Ubicación: {item.location}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay alertas cercanas</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  card: {
    backgroundColor: "#FADBD8",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  title: { fontWeight: "bold" },
  empty: { textAlign: "center", marginTop: 20 },
});