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
  if (!nombre || !edad || !peso || !altura || !genero) {
    Alert.alert("Error", "Todos los campos son obligatorios");
    return;
  }

  if (isNaN(Number(edad)) || isNaN(Number(peso)) || isNaN(Number(altura))) {
    Alert.alert("Error", "Edad, peso y altura deben ser números");
    return;
  }

  const usuario = {
    nombre,
    edad: Number(edad),
    peso: Number(peso),
    altura: Number(altura),
    genero,
  };

  await AsyncStorage.setItem("usuario", JSON.stringify(usuario));

  router.replace("/perfil");
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