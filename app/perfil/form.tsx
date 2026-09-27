/* ============================================================
   IMPORTACIONES
============================================================ */

import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../../services/firebase";
import { useTheme } from "../../hooks/useTheme";

/* ============================================================
   FORMULARIO DE PERFIL
============================================================ */

export default function PerfilForm() {
  const router = useRouter();
  const { colors } = useTheme();

  /* ==========================================================
     ESTADOS
  ========================================================== */
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [genero, setGenero] = useState("");
  const [condiciones, setCondiciones] = useState<string[]>([]);

  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const enfermedadesDisponibles = [
    "Diabetes",
    "Hipertensión",
    "Asma",
    "Obesidad",
    "Ansiedad",
  ];

  /* ============================================================
     CARGAR PERFIL EXISTENTE (Lógica Archivo 1 + Validación Archivo 2)
  ============================================================ */
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
          setEdad(String(data.edad ?? ""));
          setPeso(String(data.peso ?? ""));
          setAltura(String(data.altura ?? ""));
          setGenero(data.genero || "");
          setCondiciones(
            Array.isArray(data.condiciones) ? data.condiciones : []
          );
        }
      } catch (error) {
        console.error("Error cargando perfil:", error);
      }
    };

    cargarPerfil();
  }, []);

  /* ============================================================
     GUARDAR PERFIL (Lógica de Firestore Archivo 1 + UX Archivo 2)
  ============================================================ */
  const guardar = async () => {
    // Validación de campos vacíos
    if (
      !nombre.trim() ||
      !edad.trim() ||
      !peso.trim() ||
      !altura.trim() ||
      !genero
    ) {
      Alert.alert(
        "Datos incompletos",
        "Completa nombre, edad, peso, altura y género."
      );
      return;
    }

    const edadNumero = Number(edad);
    const pesoNumero = Number(peso);
    const alturaNumero = Number(altura);

    // Validación numérica del Archivo 2
    if (
      !Number.isFinite(edadNumero) ||
      !Number.isFinite(pesoNumero) ||
      !Number.isFinite(alturaNumero)
    ) {
      Alert.alert(
        "Datos inválidos",
        "Edad, peso y altura deben contener valores numéricos."
      );
      return;
    }

    try {
      setGuardando(true);

      const usuarioActual = auth.currentUser;
      if (!usuarioActual) {
        Alert.alert(
          "Sesión requerida",
          "Debes iniciar sesión para guardar tu perfil."
        );
        return;
      }

      const uid = usuarioActual.uid;
      const referencia = doc(db, "usuarios", uid);

      // Objeto base del perfil según la lógica del Archivo 1
      const perfil = {
        nombre: nombre.trim(),
        edad: edadNumero,
        peso: pesoNumero,
        altura: alturaNumero,
        genero,
        condiciones,
        email: usuarioActual.email || "",
        emailVerificado: usuarioActual.emailVerified || false,
      };

      /* --------------------------------------------------------
         LÓGICA CORE DE FIRESTORE (Del Archivo 1)
      -------------------------------------------------------- */
      if (editando) {
        // Editar perfil existente: Solo modifica los campos del perfil.
        // rol y activo quedan intactos en Firestore.
        await updateDoc(referencia, perfil);
      } else {
        // Crear perfil por primera vez: Se establecen valores iniciales.
        await setDoc(
          referencia,
          {
            uid,
            ...perfil,
            rol: "usuario",
            activo: true,
          },
          { merge: true }
        );
      }

      /* --------------------------------------------------------
         ACTUALIZACIÓN LOCAL Y UX (Del Archivo 2)
      -------------------------------------------------------- */
      // Mantener sincronizado localmente
      await AsyncStorage.setItem("usuario", JSON.stringify(perfil));

      Alert.alert(
        editando ? "Perfil actualizado" : "Perfil creado",
        "Los datos se guardaron correctamente."
      );

      router.back();
    } catch (error: any) {
      console.error("Error guardando perfil:", error);
      Alert.alert(
        "Error",
        "No fue posible guardar el perfil. " + (error?.message || "")
      );
    } finally {
      setGuardando(false);
    }
  };

  /* ==========================================================
     INTERFAZ (Diseño y estructura del Archivo 2)
  ========================================================== */
  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ======================================================
            ENCABEZADO
        ====================================================== */}
        <View style={styles.header}>
          <View
            style={[
              styles.headerMark,
              { backgroundColor: colors.card },
            ]}
          >
            <Text style={styles.headerEmoji}>✎</Text>
          </View>

          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>
              {editando ? "Editar Perfil" : "Crear Perfil"}
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: colors.textSecondary },
              ]}
            >
              {editando
                ? "Actualiza tus datos de salud"
                : "Completa tu información médica"}
            </Text>
          </View>
        </View>

        {/* ======================================================
            INFORMACIÓN PERSONAL
        ====================================================== */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>📋</Text>

            <View>
              <Text style={[styles.section, { color: colors.text }]}>
                Información personal
              </Text>
              <Text
                style={[
                  styles.sectionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Estos datos se utilizan para tu perfil y recomendaciones.
              </Text>
            </View>
          </View>

          {/* NOMBRE */}
          <Text style={[styles.label, { color: colors.text }]}>
            Nombre completo
          </Text>
          <TextInput
            placeholder="Ej. Juan Carlos"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={nombre}
            onChangeText={setNombre}
          />

          {/* EDAD */}
          <Text style={[styles.label, { color: colors.text }]}>Edad</Text>
          <TextInput
            placeholder="Ej. 20"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={edad}
            onChangeText={setEdad}
          />

          {/* PESO */}
          <Text style={[styles.label, { color: colors.text }]}>Peso</Text>
          <View style={styles.inputWithUnit}>
            <TextInput
              placeholder="Ej. 70"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              style={[
                styles.inputUnitField,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={peso}
              onChangeText={setPeso}
            />
            <Text style={[styles.unit, { color: colors.textSecondary }]}>
              kg
            </Text>
          </View>

          {/* ALTURA */}
          <Text style={[styles.label, { color: colors.text }]}>Altura</Text>
          <View style={styles.inputWithUnit}>
            <TextInput
              placeholder="Ej. 175"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              style={[
                styles.inputUnitField,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={altura}
              onChangeText={setAltura}
            />
            <Text style={[styles.unit, { color: colors.textSecondary }]}>
              cm
            </Text>
          </View>
        </View>

        {/* ======================================================
            GÉNERO
        ====================================================== */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>👥</Text>

            <View>
              <Text style={[styles.section, { color: colors.text }]}>
                Género
              </Text>
              <Text
                style={[
                  styles.sectionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Selecciona una opción para tu perfil.
              </Text>
            </View>
          </View>

          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
                genero === "Masculino" && styles.selectedGender,
              ]}
              onPress={() => setGenero("Masculino")}
            >
              <Text style={styles.genderEmoji}>♂</Text>
              <Text style={[styles.genderText, { color: colors.text }]}>
                Masculino
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
                genero === "Femenino" && styles.selectedGender,
              ]}
              onPress={() => setGenero("Femenino")}
            >
              <Text style={styles.genderEmoji}>♀</Text>
              <Text style={[styles.genderText, { color: colors.text }]}>
                Femenino
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ======================================================
            CONDICIONES MÉDICAS (Opcional)
        ====================================================== */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>🩺</Text>

            <View style={styles.sectionHeaderText}>
              <View style={styles.optionalTitleRow}>
                <Text style={[styles.section, { color: colors.text }]}>
                  Condiciones médicas
                </Text>
                <Text
                  style={[
                    styles.optionalBadge,
                    { color: colors.textSecondary },
                  ]}
                >
                  OPCIONAL
                </Text>
              </View>

              <Text
                style={[
                  styles.sectionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Puedes seleccionar las que correspondan. También puedes dejar
                este apartado vacío.
              </Text>
            </View>
          </View>

          <View style={styles.conditionsContainer}>
            {enfermedadesDisponibles.map((item) => {
              const seleccionado = condiciones.includes(item);

              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.conditionButton,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                    seleccionado && styles.conditionSelected,
                  ]}
                  onPress={() => {
                    if (seleccionado) {
                      setCondiciones(
                        condiciones.filter((c) => c !== item)
                      );
                    } else {
                      setCondiciones([...condiciones, item]);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.conditionMark,
                      seleccionado && styles.conditionMarkSelected,
                    ]}
                  >
                    {seleccionado ? "✓" : "+"}
                  </Text>
                  <Text
                    style={[
                      styles.conditionText,
                      { color: colors.text },
                      seleccionado && styles.conditionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ======================================================
            BOTÓN DE GUARDADO
        ====================================================== */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: guardando ? 0.65 : 1,
            },
          ]}
          onPress={guardar}
          disabled={guardando}
        >
          <Text style={styles.buttonText}>
            {guardando
              ? "Guardando..."
              : editando
              ? "Guardar cambios"
              : "Guardar Perfil"}
          </Text>
        </TouchableOpacity>

        <Text
          style={[styles.footerText, { color: colors.textSecondary }]}
        >
          Las condiciones médicas no son obligatorias.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================================================================
   ESTILOS (Diseño del Archivo 2)
================================================================ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  scrollContent: {
    width: "100%",
    maxWidth: 850,
    alignSelf: "center",
    paddingBottom: 35,
  },

  /* ENCABEZADO */
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },
  headerMark: {
    width: 54,
    height: 54,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  headerEmoji: {
    fontSize: 27,
    color: "#2563EB",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },

  /* TARJETAS */
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionEmoji: {
    fontSize: 23,
    width: 40,
    marginRight: 9,
    textAlign: "center",
  },
  section: {
    fontSize: 18,
    fontWeight: "800",
  },
  sectionDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  /* CAMPOS */
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 7,
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 14,
    fontSize: 15,
  },
  inputWithUnit: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  inputUnitField: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 15,
    borderWidth: 1,
    fontSize: 15,
  },
  unit: {
    width: 42,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
  },

  /* GÉNERO */
  genderContainer: {
    flexDirection: "row",
    gap: 12,
  },
  genderButton: {
    flex: 1,
    minHeight: 80,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedGender: {
    backgroundColor: "#DBEAFE",
    borderColor: "#2563EB",
  },
  genderEmoji: {
    fontSize: 23,
    color: "#2563EB",
    marginBottom: 5,
  },
  genderText: {
    fontSize: 14,
    fontWeight: "700",
  },

  /* CONDICIONES */
  optionalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionalBadge: {
    fontSize: 10,
    fontWeight: "800",
    marginLeft: 9,
    letterSpacing: 0.5,
  },
  conditionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  conditionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: 1,
  },
  conditionSelected: {
    backgroundColor: "#DBEAFE",
    borderColor: "#2563EB",
  },
  conditionMark: {
    fontSize: 16,
    fontWeight: "800",
    color: "#64748B",
    marginRight: 7,
  },
  conditionMarkSelected: {
    color: "#2563EB",
  },
  conditionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  conditionTextSelected: {
    color: "#1D4ED8",
    fontWeight: "800",
  },

  /* BOTÓN */
  button: {
    alignSelf: "center",
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 18,
    marginTop: 2,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  footerText: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 12,
  },
});