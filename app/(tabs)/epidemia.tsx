import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../hooks/useTheme";

const alertsData = [
  {
    id: "1",
    disease: "Gripe común",
    level: "Moderado",
    location: "Bogotá",
    recommendation:
      "Usar mascarilla en lugares cerrados.",
  },

  {
    id: "2",
    disease: "Dengue",
    level: "Alto",
    location: "Zona cercana",
    recommendation:
      "Evitar acumulación de agua.",
  },
];

export default function Alerts() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <Text style={styles.header}>
        Alertas Epidemiológicas
      </Text>

      <FlatList
        data={alertsData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card },
            ]}
          >
            <Text
              style={[
                styles.title,
                { color: colors.text },
              ]}
            >
              {item.disease}
            </Text>

            <Text style={styles.level}>
              Nivel: {item.level}
            </Text>

            <Text
              style={[
                styles.location,
                { color: colors.text },
              ]}
            >
              Ubicación: {item.location}
            </Text>

            <Text
              style={[
                styles.recommendation,
                { color: colors.textSecondary },
              ]}
            >
              {item.recommendation}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text
            style={[
              styles.empty,
              { color: colors.textSecondary },
            ]}
          >
            No hay alertas cercanas
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  header: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#DC2626",
    marginBottom: 20,
  },

  card: {
    padding: 20,
    borderRadius: 18,
    marginBottom: 15,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,

    elevation: 4,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
  },

  level: {
    marginTop: 8,
    color: "#DC2626",
    fontWeight: "bold",
  },

  location: {
    marginTop: 6,
  },

  recommendation: {
    marginTop: 12,
    lineHeight: 20,
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
  },
});