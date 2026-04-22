import { View, Text, StyleSheet, Button } from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function Perfil() {
  const [usuario, setUsuario] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const cargar = async () => {
      const data = await AsyncStorage.getItem("usuario");
      if (data) setUsuario(JSON.parse(data));
    };
    cargar();
  }, []);

  if (!usuario) {
    return (
        <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Perfil</Text>
        <Text>No tienes perfil creado</Text>

        <Button
          title="Crear perfil"
          onPress={() => router.push("/perfil/form")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Perfil</Text>

      <Text>Nombre: {usuario.nombre}</Text>
      <Text>Edad: {usuario.edad}</Text>
      <Text>Peso: {usuario.peso}</Text>
      <Text>Altura: {usuario.altura}</Text>
      <Text>Género: {usuario.genero}</Text>

      <Button
        title="Editar perfil"
        onPress={() => router.push("/perfil/form")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  header: { fontSize: 22, fontWeight: "bold" },
});