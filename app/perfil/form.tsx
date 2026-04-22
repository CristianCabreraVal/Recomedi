import { View, Text, TextInput, StyleSheet, Button, Alert } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function PerfilForm() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [genero, setGenero] = useState("");

  const guardar = async () => {
    const usuario = { nombre, edad, peso, altura, genero };

    await AsyncStorage.setItem("usuario", JSON.stringify(usuario));

    Alert.alert("Listo", "Perfil guardado");
    router.replace("/perfil"); // 🔥 vuelve al perfil
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Crear Perfil</Text>

      <TextInput placeholder="Nombre" style={styles.input} onChangeText={setNombre} />
      <TextInput placeholder="Edad" style={styles.input} onChangeText={setEdad} keyboardType="numeric" />
      <TextInput placeholder="Peso (kg)" style={styles.input} onChangeText={setPeso} keyboardType="numeric" />
      <TextInput placeholder="Altura (cm)" style={styles.input} onChangeText={setAltura} keyboardType="numeric" />
      <TextInput placeholder="Género" style={styles.input} onChangeText={setGenero} />

      <Button title="Guardar perfil" onPress={guardar} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
});