import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  useFocusEffect,
  useRouter,
} from "expo-router";

import {
  useCallback,
  useState,
} from "react";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { useTheme } from "../../hooks/useTheme";
import { useUserRole } from "../../hooks/useUserRole";

import {
  auth,
  db,
} from "../../services/firebase";

export default function Perfil() {
  const { colors } = useTheme();

  const {
    rol,
    cargandoRol,
    esAdmin,
    esModerador,
  } = useUserRole();

  const [usuario, setUsuario] =
    useState<any>(null);

  const [cargando, setCargando] =
    useState(true);

  const router = useRouter();

  /* ============================================================
     CARGAR PERFIL
  ============================================================ */

  useFocusEffect(
    useCallback(() => {
      const cargar = async () => {
        try {
          setCargando(true);

          const uid =
            auth.currentUser?.uid;

          if (!uid) {
            setUsuario(null);
            return;
          }

          const referencia = doc(
            db,
            "usuarios",
            uid
          );

          const snap =
            await getDoc(referencia);

          if (snap.exists()) {
            setUsuario(
              snap.data()
            );
          } else {
            setUsuario(null);
          }
        } catch (error) {
          console.log(
            "Error cargando perfil:",
            error
          );

          setUsuario(null);
        } finally {
          setCargando(false);
        }
      };

      cargar();
    }, [])
  );

  /* ============================================================
     CARGANDO PERFIL
  ============================================================ */

  if (cargando) {
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
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text
            style={[
              styles.loadingText,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            Cargando perfil...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ============================================================
     SI NO EXISTE PERFIL
  ============================================================ */

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
              {
                color:
                  colors.primary,
              },
            ]}
          >
            Perfil
          </Text>

          <Text
            style={[
              styles.emptyText,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            Aún no has creado tu perfil
          </Text>

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor:
                  colors.primary,
              },
            ]}
            onPress={() =>
              router.push("/perfil/form")
            }
          >
            <Text
              style={styles.buttonText}
            >
              Crear Perfil
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ============================================================
     CALCULAR IMC
  ============================================================ */

  const alturaMetros =
    Number(usuario.altura) / 100;

  const peso =
    Number(usuario.peso);

  const imc =
    alturaMetros > 0
      ? peso /
        (alturaMetros *
          alturaMetros)
      : 0;

  /* ============================================================
     PANTALLA PRINCIPAL
  ============================================================ */

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
        showsVerticalScrollIndicator={
          false
        }
      >
      {/* ======================================================
    INFORMACIÓN DEL ROL
====================================================== */}

{!cargandoRol &&
  (esAdmin || esModerador) && (
    <View
      style={[
        styles.roleCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.roleIcon,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={styles.roleIconText}>
          {esAdmin ? "👑" : "🛡️"}
        </Text>
      </View>

      <View style={styles.roleContent}>
        <Text
          style={[
            styles.roleTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {esAdmin
            ? "Cuenta de administrador"
            : "Cuenta de moderador"}
        </Text>

        <Text
          style={[
            styles.roleText,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          Rol actual:{" "}
          <Text
            style={[
              styles.roleValue,
              {
                color: colors.primary,
              },
            ]}
          >
            {rol}
          </Text>
        </Text>

        <Text
          style={[
            styles.roleText,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {esAdmin
            ? "Tienes permisos administrativos."
            : "Tienes permisos de moderación."}
        </Text>
      </View>
    </View>
  )}
        {/* ======================================================
            HEADER
        ====================================================== */}

        <View
          style={styles.profileCard}
        >
          <View style={styles.avatar}>
            <Text
              style={
                styles.avatarText
              }
            >
              {usuario.nombre
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </Text>
          </View>

          <Text
            style={styles.name}
          >
            {usuario.nombre}
          </Text>

          <Text
            style={styles.subtitle}
          >
            Perfil Médico Personal
          </Text>
        </View>

        {/* ======================================================
            DATOS PERSONALES
        ====================================================== */}

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.section,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Información Personal
          </Text>

          <Text
            style={[
              styles.item,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Edad: {usuario.edad} años
          </Text>

          <Text
            style={[
              styles.item,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Peso: {usuario.peso} kg
          </Text>

          <Text
            style={[
              styles.item,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Altura: {usuario.altura} cm
          </Text>

          <Text
            style={[
              styles.item,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Género: {usuario.genero}
          </Text>
        </View>

        {/* ======================================================
            IMC
        ====================================================== */}

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.section,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Índice de Masa Corporal
          </Text>

          <Text
            style={styles.imc}
          >
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

        {/* ======================================================
            CONDICIONES MÉDICAS
        ====================================================== */}

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.section,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Condiciones Médicas
          </Text>

          <View
            style={styles.conditions}
          >
            {usuario.condiciones
              ?.length > 0 ? (
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
                        color:
                          colors.text,
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

        {/* ======================================================
            BOTÓN EDITAR PERFIL
        ====================================================== */}

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor:
                colors.primary,
            },
          ]}
          onPress={() =>
            router.push(
              "/perfil/form"
            )
          }
        >
          <Text
            style={styles.buttonText}
          >
            Editar Perfil
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================================================
   ESTILOS
============================================================ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  /* ==========================================================
     ROL
  ========================================================== */

  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 18,
  },

  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  roleIconText: {
    fontSize: 23,
  },

  roleContent: {
    flex: 1,
  },

  roleTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },

  roleText: {
    fontSize: 13,
    marginTop: 2,
  },

  roleValue: {
    fontWeight: "800",
  },

  /* ==========================================================
     PERFIL
  ========================================================== */

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

  /* ==========================================================
     TARJETAS
  ========================================================== */

  card: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
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

  /* ==========================================================
     CONDICIONES
  ========================================================== */

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

  /* ==========================================================
     IMC
  ========================================================== */

  imc: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#2563EB",
  },

  imcText: {
    marginTop: 10,
  },

  /* ==========================================================
     BOTONES
  ========================================================== */

  button: {
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

  /* ==========================================================
     ESTADO VACÍO
  ========================================================== */

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

  /* ==========================================================
     CARGANDO
  ========================================================== */

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});