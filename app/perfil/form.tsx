import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useEffect, useState } from "react";

import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";

import { auth, db } from "../../services/firebase";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

export default function PerfilForm() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [genero, setGenero] = useState("");

  const [condiciones, setCondiciones] =
    useState<string[]>([]);
    const [editando, setEditando] =
  useState(false);

  const enfermedadesDisponibles = [
    "Diabetes",
    "Hipertensión",
    "Asma",
    "Obesidad",
    "Ansiedad",
  ];

  // 🔄 Cargar perfil existente
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const uid = auth.currentUser?.uid;

        if (!uid) return;

        const ref = doc(db, "usuarios", uid);

        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setEditando(true);

          setNombre(data.nombre || "");
          setEdad(String(data.edad || ""));
          setPeso(String(data.peso || ""));
          setAltura(String(data.altura || ""));
          setGenero(data.genero || "");

          setCondiciones(
            data.condiciones || []
          );
        }
      } catch (error) {
        console.log(error);
      }
    };

    cargarPerfil();
  }, []);

  // 💾 Guardar perfil
const guardar = async () => {
  if (
    !nombre ||
    !edad ||
    !peso ||
    !altura ||
    !genero
  ) {
    alert("Completa todos los campos");
    return;
  }

  try {
    const usuarioActual = auth.currentUser;

    if (!usuarioActual) {
      alert("Debes iniciar sesión");
      return;
    }

    const uid = usuarioActual.uid;

    const referencia = doc(
      db,
      "usuarios",
      uid
    );

    const perfil = {
      nombre: nombre.trim(),
      edad: Number(edad),
      peso: Number(peso),
      altura: Number(altura),
      genero,
      condiciones,
      email: usuarioActual.email || "",
      emailVerificado:
        usuarioActual.emailVerified || false,
    };

    if (editando) {
      // Editar perfil existente.
      // Solo modifica los campos del perfil.
      // rol y activo quedan intactos.
      await updateDoc(
        referencia,
        perfil
      );
    } else {
      // Crear perfil por primera vez.
      // Se conservan datos existentes y se
      // establece el rol inicial como usuario.
      await setDoc(
        referencia,
        {
          uid,
          ...perfil,
          rol: "usuario",
          activo: true,
        },
        {
          merge: true,
        }
      );
    }

    alert(
      editando
        ? "Perfil actualizado correctamente"
        : "Perfil creado correctamente"
    );

    router.back();
  } catch (error) {
    console.log(
      "Error guardando perfil:",
      error
    );

    alert(
      "No fue posible guardar el perfil"
    );
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>
        {editando
          ? "Editar Perfil"
          : "Crear Perfil"}
        </Text>

        <Text style={styles.subtitle}>
        {editando
          ? "Actualiza tus datos de salud"
          : "Completa tu información médica"}
        </Text>

        {/* DATOS PERSONALES */}

        <View style={styles.card}>
          <Text style={styles.section}>
            Información Personal
          </Text>

          <TextInput
            placeholder="Nombre completo"
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
          />

          <TextInput
            placeholder="Edad"
            keyboardType="numeric"
            style={styles.input}
            value={edad}
            onChangeText={setEdad}
          />

          <TextInput
            placeholder="Peso (kg)"
            keyboardType="numeric"
            style={styles.input}
            value={peso}
            onChangeText={setPeso}
          />

          <TextInput
            placeholder="Altura (cm)"
            keyboardType="numeric"
            style={styles.input}
            value={altura}
            onChangeText={setAltura}
          />
        </View>

        {/* GÉNERO */}

        <View style={styles.card}>
          <Text style={styles.section}>
            Género
          </Text>

          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                genero === "Masculino" &&
                  styles.selectedGender,
              ]}
              onPress={() =>
                setGenero("Masculino")
              }
            >
              <Text>Masculino</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderButton,
                genero === "Femenino" &&
                  styles.selectedGender,
              ]}
              onPress={() =>
                setGenero("Femenino")
              }
            >
              <Text>Femenino</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CONDICIONES */}

        <View style={styles.card}>
          <Text style={styles.section}>
            Condiciones Médicas
          </Text>

          <View
            style={styles.conditionsContainer}
          >
            {enfermedadesDisponibles.map(
              (item) => {
                const seleccionado =
                  condiciones.includes(item);

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.conditionButton,
                      seleccionado &&
                        styles.conditionSelected,
                    ]}
                    onPress={() => {
                      if (seleccionado) {
                        setCondiciones(
                          condiciones.filter(
                            (c) => c !== item
                          )
                        );
                      } else {
                        setCondiciones([
                          ...condiciones,
                          item,
                        ]);
                      }
                    }}
                  >
                    <Text>{item}</Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>
        </View>

        {/* BOTÓN */}

        <TouchableOpacity
          style={styles.button}
          onPress={guardar}
        >
          <Text style={styles.buttonText}>
            Guardar Perfil
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 20,
  },

  header: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2563EB",
  },

  subtitle: {
    color: "#6B7280",
    marginTop: 5,
    marginBottom: 25,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,

    elevation: 4,
  },

  section: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  input: {
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 14,
    marginBottom: 15,
  },

  genderContainer: {
    flexDirection: "row",
    gap: 10,
  },

  genderButton: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
  },

  selectedGender: {
    backgroundColor: "#93C5FD",
  },

  conditionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  conditionButton: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },

  conditionSelected: {
    backgroundColor: "#93C5FD",
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 40,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});