import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import { auth, db } from "../../services/firebase";

import { doc, getDoc } from "firebase/firestore";
import { useTheme } from "../../hooks/useTheme";

export default function Perfil() {
  const { colors } = useTheme();

  const [usuario, setUsuario] =
    useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    const cargar = async () => {
      try {
        const uid = auth.currentUser?.uid;

        if (!uid) return;

        const ref = doc(
          db,
          "usuarios",
          uid
        );

        const snap = await getDoc(ref);

        if (snap.exists()) {
          setUsuario(snap.data());
        }
      } catch (error) {
        console.log(error);
      }
    };

    cargar();
  }, []);

  // SI NO EXISTE PERFIL
  if (!usuario) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor:
              colors.background,
          },
        ]}
      >
        <View style={styles.emptyCard}>
          <Text
            style={[
              styles.header,
              { color: colors.primary },
            ]}
          >
            Perfil
          </Text>

          <Text
            style={[
              styles.emptyText,
              { color: colors.textSecondary },
            ]}
          >
            Aún no has creado tu perfil
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              router.push("/perfil/form")
            }
          >
            <Text style={styles.buttonText}>
              Crear Perfil
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // CALCULAR IMC
  const alturaMetros =
    usuario.altura / 100;

  const imc =
    usuario.peso /
    (alturaMetros * alturaMetros);

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {usuario.nombre?.charAt(0)}
            </Text>
          </View>

          <Text style={styles.name}>
            {usuario.nombre}
          </Text>

          <Text style={styles.subtitle}>
            Perfil Médico Personal
          </Text>
        </View>

        {/* DATOS */}

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,
            },
          ]}
        >
          <Text
            style={[
              styles.section,
              { color: colors.text },
            ]}
          >
            Información Personal
          </Text>

          <Text
            style={[
              styles.item,
              { color: colors.text },
            ]}
          >
            Edad: {usuario.edad} años
          </Text>

          <Text
            style={[
              styles.item,
              { color: colors.text },
            ]}
          >
            Peso: {usuario.peso} kg
          </Text>

          <Text
            style={[
              styles.item,
              { color: colors.text },
            ]}
          >
            Altura: {usuario.altura} cm
          </Text>

          <Text
            style={[
              styles.item,
              { color: colors.text },
            ]}
          >
            Género: {usuario.genero}
          </Text>
        </View>

        {/* IMC */}

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,
            },
          ]}
        >
          <Text
            style={[
              styles.section,
              { color: colors.text },
            ]}
          >
            Índice de Masa Corporal
          </Text>

          <Text style={styles.imc}>
            {imc.toFixed(1)}
          </Text>

          <Text
            style={[
              styles.imcText,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            {imc < 18.5
              ? "Bajo peso"
              : imc < 25
              ? "Peso saludable"
              : imc < 30
              ? "Sobrepeso"
              : "Obesidad"}
          </Text>
        </View>

        {/* CONDICIONES */}

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,
            },
          ]}
        >
          <Text
            style={[
              styles.section,
              { color: colors.text },
            ]}
          >
            Condiciones Médicas
          </Text>

          <View style={styles.conditions}>
            {usuario.condiciones?.length >
            0 ? (
              usuario.condiciones.map(
                (
                  item: string,
                  index: number
                ) => (
                  <View
                    key={index}
                    style={[
                      styles.condition,
                      {
                        backgroundColor:
                          colors.background,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: colors.text,
                      }}
                    >
                      {item}
                    </Text>
                  </View>
                )
              )
            ) : (
              <Text
                style={{
                  color:
                    colors.textSecondary,
                }}
              >
                Sin condiciones registradas
              </Text>
            )}
          </View>
        </View>

        {/* BOTÓN */}

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push("/perfil/form")
          }
        >
          <Text style={styles.buttonText}>
            Editar Perfil
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  profileCard: {
    backgroundColor: "#2563EB",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  avatarText: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#2563EB",
  },

  name: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  subtitle: {
    color: "#DBEAFE",
    marginTop: 5,
  },

  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 18,

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

  item: {
    marginBottom: 10,
    fontSize: 16,
  },

  conditions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  condition: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },

  imc: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#2563EB",
  },

  imcText: {
    marginTop: 10,
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 40,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  emptyCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    marginVertical: 15,
  },

  header: {
    fontSize: 30,
    fontWeight: "bold",
  },
});