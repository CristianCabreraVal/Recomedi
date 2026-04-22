import { View, Text, TextInput, StyleSheet } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
  const [edad, setEdad] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Perfil de Salud</Text>

      <Text>Edad</Text>
      <TextInput
        style={styles.input}
        value={edad}
        onChangeText={setEdad}
        keyboardType="numeric"
      />

      <Text>Peso (kg)</Text>
      <TextInput
        style={styles.input}
        value={peso}
        onChangeText={setPeso}
        keyboardType="numeric"
      />

      <Text>Altura (cm)</Text>
      <TextInput
        style={styles.input}
        value={altura}
        onChangeText={setAltura}
        keyboardType="numeric"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
});