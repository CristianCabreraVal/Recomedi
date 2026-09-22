import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../hooks/useTheme";

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
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <Text
        style={[
          styles.header,
          { color: colors.primary },
        ]}
      >
        Noticias de Salud
      </Text>

      <FlatList
        data={newsData}
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
                styles.category,
                { color: colors.primary },
              ]}
            >
              {item.category}
            </Text>

            <Text
              style={[
                styles.title,
                { color: colors.text },
              ]}
            >
              {item.title}
            </Text>

            <Text
              style={[
                styles.description,
                { color: colors.textSecondary },
              ]}
            >
              {item.description}
            </Text>

            <Text
              style={[
                styles.date,
                { color: colors.textSecondary },
              ]}
            >
              {item.date}
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
            No hay noticias disponibles
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

  category: {
    fontWeight: "bold",
    marginBottom: 8,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
  },

  description: {
    marginTop: 8,
    lineHeight: 22,
  },

  date: {
    marginTop: 12,
    fontSize: 12,
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
  },
});