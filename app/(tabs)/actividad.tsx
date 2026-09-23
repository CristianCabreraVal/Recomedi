import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";

import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../hooks/useTheme";
import { auth, db } from "../../services/firebase";

import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

type RegistroActividad = {
  id: string;
  fecha: string;
  pasos: number | null;
  frecuenciaCardiaca: number | null;
  calorias: number | null;
  distancia: number | null;
};

type Metrica = "pasos" | "calorias" | "frecuenciaCardiaca" | "distancia";

export default function Actividad() {
  const { colors } = useTheme();

  const [fecha, setFecha] = useState(obtenerFechaActual());

  const [pasos, setPasos] = useState("");
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState("");
  const [calorias, setCalorias] = useState("");
  const [distancia, setDistancia] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  const [registros, setRegistros] = useState<RegistroActividad[]>([]);
  const [periodo, setPeriodo] = useState(7);
  const [metrica, setMetrica] = useState<Metrica>("pasos");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarDatos(periodo);
    }, [periodo])
  );

  async function cargarDatos(dias: number) {
    const usuario = auth.currentUser;

    if (!usuario) {
      setRegistros([]);
      setCargandoDatos(false);
      return;
    }

    try {
      setCargandoDatos(true);

      const referencia = collection(
        db,
        "usuarios",
        usuario.uid,
        "actividad"
      );

      const consulta = query(
        referencia,
        orderBy("fecha", "desc"),
        limit(dias)
      );

      const resultado = await getDocs(consulta);

      const datos: RegistroActividad[] = resultado.docs.map((documento) => {
        const data = documento.data();

        return {
          id: documento.id,
          fecha: data.fecha ?? documento.id,
          pasos:
            typeof data.pasos === "number" ? data.pasos : null,
          frecuenciaCardiaca:
            typeof data.frecuenciaCardiaca === "number"
              ? data.frecuenciaCardiaca
              : null,
          calorias:
            typeof data.calorias === "number"
              ? data.calorias
              : null,
          distancia:
            typeof data.distancia === "number"
              ? data.distancia
              : null,
        };
      });

      datos.sort((a, b) => b.fecha.localeCompare(a.fecha));

      setRegistros(datos);
    } catch (error) {
      console.error("Error cargando actividad:", error);

      Alert.alert(
        "Error",
        "No fue posible cargar los datos de actividad."
      );

      setRegistros([]);
    } finally {
      setCargandoDatos(false);
    }
  }

  async function guardarRegistro() {
    const usuario = auth.currentUser;

    if (!usuario) {
      Alert.alert(
        "Sesión requerida",
        "Debes iniciar sesión para guardar tus datos."
      );
      return;
    }

    if (!fecha.trim()) {
      Alert.alert("Fecha requerida", "Ingresa una fecha.");
      return;
    }

    if (
      pasos.trim() === "" &&
      frecuenciaCardiaca.trim() === "" &&
      calorias.trim() === "" &&
      distancia.trim() === ""
    ) {
      Alert.alert(
        "Datos requeridos",
        "Ingresa al menos uno de los datos de actividad."
      );
      return;
    }

    try {
      setGuardando(true);

      const registro = {
        fecha: fecha.trim(),
        pasos: pasos.trim() === "" ? null : Number(pasos),
        frecuenciaCardiaca:
          frecuenciaCardiaca.trim() === ""
            ? null
            : Number(frecuenciaCardiaca),
        calorias:
          calorias.trim() === "" ? null : Number(calorias),
        distancia:
          distancia.trim() === "" ? null : Number(distancia),
        origen: "manual",
        actualizadoEn: serverTimestamp(),
      };

      const referencia = doc(
        db,
        "usuarios",
        usuario.uid,
        "actividad",
        fecha.trim()
      );

      await setDoc(referencia, registro, { merge: true });

      Alert.alert(
        "Registro guardado",
        "Los datos de actividad se guardaron correctamente."
      );

      await cargarDatos(periodo);
    } catch (error) {
      console.error("Error guardando actividad:", error);

      Alert.alert(
        "Error",
        "No fue posible guardar los datos. Intenta nuevamente."
      );
    } finally {
      setGuardando(false);
    }
  }

  const registroHoy = registros.find(
    (registro) => registro.fecha === obtenerFechaActual()
  );

  const promedio = calcularPromedio(registros, metrica);
  const mayor = obtenerMayor(registros, metrica);

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ENCABEZADO */}

        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="fitness"
              size={28}
              color={colors.primary}
            />
          </View>

          <View style={styles.headerTextContainer}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              Mi actividad
            </Text>

            <Text
              style={[
                styles.description,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Consulta y registra tu actividad diaria.
            </Text>
          </View>
        </View>

        {/* RESUMEN DE HOY */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Resumen de hoy
        </Text>

        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="footsteps"
            title="Pasos"
            value={
              registroHoy?.pasos !== null &&
              registroHoy?.pasos !== undefined
                ? formatearNumero(registroHoy.pasos)
                : "--"
            }
            colors={colors}
          />

          <SummaryCard
            icon="flame"
            title="Calorías"
            value={
              registroHoy?.calorias !== null &&
              registroHoy?.calorias !== undefined
                ? `${formatearNumero(registroHoy.calorias)} kcal`
                : "--"
            }
            colors={colors}
          />

          <SummaryCard
            icon="heart"
            title="Frecuencia"
            value={
              registroHoy?.frecuenciaCardiaca !== null &&
              registroHoy?.frecuenciaCardiaca !== undefined
                ? `${registroHoy.frecuenciaCardiaca} bpm`
                : "--"
            }
            colors={colors}
          />

          <SummaryCard
            icon="walk"
            title="Distancia"
            value={
              registroHoy?.distancia !== null &&
              registroHoy?.distancia !== undefined
                ? `${registroHoy.distancia} km`
                : "--"
            }
            colors={colors}
          />
        </View>

        {/* GRAFICA */}

        <View style={styles.sectionHeader}>
          <View>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                  marginBottom: 4,
                },
              ]}
            >
              Comparación
            </Text>

            <Text
              style={[
                styles.sectionSubtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Compara tus registros entre diferentes días.
            </Text>
          </View>
        </View>

        {/* SELECTOR DE PERIODO */}

        <View
          style={[
            styles.periodContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {[7, 14, 30].map((cantidad) => (
            <TouchableOpacity
              key={cantidad}
              onPress={() => setPeriodo(cantidad)}
              style={[
                styles.periodButton,
                periodo === cantidad && {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.periodText,
                  {
                    color:
                      periodo === cantidad
                        ? "#FFFFFF"
                        : colors.textSecondary,
                  },
                ]}
              >
                {cantidad} días
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SELECTOR DE METRICA */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricScroll}
        >
          <MetricButton
            icon="footsteps"
            title="Pasos"
            active={metrica === "pasos"}
            onPress={() => setMetrica("pasos")}
            colors={colors}
          />

          <MetricButton
            icon="flame"
            title="Calorías"
            active={metrica === "calorias"}
            onPress={() => setMetrica("calorias")}
            colors={colors}
          />

          <MetricButton
            icon="heart"
            title="Frecuencia"
            active={metrica === "frecuenciaCardiaca"}
            onPress={() =>
              setMetrica("frecuenciaCardiaca")
            }
            colors={colors}
          />

          <MetricButton
            icon="walk"
            title="Distancia"
            active={metrica === "distancia"}
            onPress={() => setMetrica("distancia")}
            colors={colors}
          />
        </ScrollView>

        {/* TARJETA DE GRAFICA */}

        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.chartHeader}>
            <View>
              <Text
                style={[
                  styles.chartTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {obtenerNombreMetrica(metrica)}
              </Text>

              <Text
                style={[
                  styles.chartSubtitle,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Últimos {periodo} días
              </Text>
            </View>

            <View
              style={[
                styles.chartIcon,
                {
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Ionicons
                name={obtenerIconoMetrica(metrica)}
                size={22}
                color={colors.primary}
              />
            </View>
          </View>

          {cargandoDatos ? (
            <View style={styles.chartLoading}>
              <ActivityIndicator
                size="large"
                color={colors.primary}
              />

              <Text
                style={[
                  styles.loadingText,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Cargando datos...
              </Text>
            </View>
          ) : registros.length === 0 ? (
            <View style={styles.emptyChart}>
              <Ionicons
                name="bar-chart-outline"
                size={46}
                color={colors.textSecondary}
              />

              <Text
                style={[
                  styles.emptyTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Aún no hay registros
              </Text>

              <Text
                style={[
                  styles.emptyText,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Guarda algunos datos para comenzar a
                visualizar tu evolución.
              </Text>
            </View>
          ) : (
            <BarChart
              registros={registros}
              metrica={metrica}
              colors={colors}
            />
          )}
        </View>

        {/* ESTADISTICAS DEL PERIODO */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Estadísticas del periodo
        </Text>

        <View
          style={[
            styles.statsCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <StatRow
            icon="calendar"
            title="Días registrados"
            value={`${registros.length} de ${periodo}`}
            colors={colors}
          />

          <View
            style={[
              styles.statDivider,
              {
                backgroundColor: colors.border,
              },
            ]}
          />

          <StatRow
            icon="analytics"
            title="Promedio"
            value={
              promedio !== null
                ? `${formatearValor(promedio, metrica)} ${obtenerUnidad(
                    metrica
                  )}`
                : "--"
            }
            colors={colors}
          />

          <View
            style={[
              styles.statDivider,
              {
                backgroundColor: colors.border,
              },
            ]}
          />

          <StatRow
            icon="trophy"
            title="Mayor registro"
            value={
              mayor !== null
                ? `${formatearValor(mayor.valor, metrica)} ${obtenerUnidad(
                    metrica
                  )}`
                : "--"
            }
            subtitle={mayor ? formatearFecha(mayor.fecha) : undefined}
            colors={colors}
          />
        </View>

        {/* HISTORIAL */}

        <View style={styles.historyHeader}>
          <View>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                  marginBottom: 4,
                },
              ]}
            >
              Historial
            </Text>

            <Text
              style={[
                styles.sectionSubtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Tus registros más recientes.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => cargarDatos(periodo)}
          >
            <Ionicons
              name="refresh"
              size={23}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {registros.length === 0 ? (
          <View
            style={[
              styles.historyEmpty,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={34}
              color={colors.textSecondary}
            />

            <Text
              style={[
                styles.emptyTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Sin historial todavía
            </Text>

            <Text
              style={[
                styles.emptyText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Aquí aparecerán los días que registres.
            </Text>
          </View>
        ) : (
          registros.map((registro) => (
            <HistoryCard
              key={registro.id}
              registro={registro}
              colors={colors}
            />
          ))
        )}

{/* FORMULARIO */}

<View style={styles.formHeader}>
  <TouchableOpacity
    onPress={() => setMostrarFormulario(!mostrarFormulario)}
    activeOpacity={0.85}
    style={[
      styles.registerActivityButton,
      {
        backgroundColor: colors.primary,
      },
    ]}
  >
    <View style={styles.registerActivityIcon}>
      <Ionicons
        name={mostrarFormulario ? "close" : "add"}
        size={28}
        color="#FFFFFF"
      />
    </View>

    <View style={styles.registerActivityContent}>
      <Text style={styles.registerActivityTitle}>
        {mostrarFormulario
          ? "Ocultar formulario"
          : "Registrar mi actividad"}
      </Text>

      <Text style={styles.registerActivitySubtitle}>
        {mostrarFormulario
          ? "Cierra la sección de registro"
          : "Añade los datos de actividad de tu día"}
      </Text>
    </View>

    <View style={styles.registerActivityArrow}>
      <Ionicons
        name={mostrarFormulario ? "chevron-up" : "chevron-forward"}
        size={22}
        color="#FFFFFF"
      />
    </View>
  </TouchableOpacity>
</View>

{mostrarFormulario && (
  <View style={styles.formContainer}>
    <View
      style={[
        styles.infoCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.infoHeader}>
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={colors.primary}
        />

        <Text
          style={[
            styles.infoTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Registro manual
        </Text>
      </View>

      <Text
        style={[
          styles.infoText,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        Estos datos son registrados manualmente a partir de
        la información que proporciona tu dispositivo.
      </Text>
    </View>

    <Text
      style={[
        styles.formSectionTitle,
        {
          color: colors.text,
        },
      ]}
    >
      Fecha
    </Text>

    <TextInput
      value={fecha}
      onChangeText={setFecha}
      placeholder="AAAA-MM-DD"
      placeholderTextColor={colors.textSecondary}
      style={[
        styles.input,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          color: colors.text,
        },
      ]}
    />

    <Text
      style={[
        styles.formSectionTitle,
        {
          color: colors.text,
          marginTop: 22,
        },
      ]}
    >
      Actividad
    </Text>

    <Text
      style={[
        styles.label,
        {
          color: colors.textSecondary,
        },
      ]}
    >
      Pasos
    </Text>

    <TextInput
      value={pasos}
      onChangeText={setPasos}
      placeholder="Ej. 7342"
      placeholderTextColor={colors.textSecondary}
      keyboardType="numeric"
      style={[
        styles.input,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          color: colors.text,
        },
      ]}
    />

    <Text
      style={[
        styles.label,
        {
          color: colors.textSecondary,
        },
      ]}
    >
      Frecuencia cardíaca
    </Text>

    <TextInput
      value={frecuenciaCardiaca}
      onChangeText={setFrecuenciaCardiaca}
      placeholder="Ej. 78"
      placeholderTextColor={colors.textSecondary}
      keyboardType="numeric"
      style={[
        styles.input,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          color: colors.text,
        },
      ]}
    />

    <Text
      style={[
        styles.label,
        {
          color: colors.textSecondary,
        },
      ]}
    >
      Calorías
    </Text>

    <TextInput
      value={calorias}
      onChangeText={setCalorias}
      placeholder="Ej. 412"
      placeholderTextColor={colors.textSecondary}
      keyboardType="numeric"
      style={[
        styles.input,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          color: colors.text,
        },
      ]}
    />

    <Text
      style={[
        styles.label,
        {
          color: colors.textSecondary,
        },
      ]}
    >
      Distancia (km)
    </Text>

    <TextInput
      value={distancia}
      onChangeText={setDistancia}
      placeholder="Ej. 5.2"
      placeholderTextColor={colors.textSecondary}
      keyboardType="decimal-pad"
      style={[
        styles.input,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          color: colors.text,
        },
      ]}
    />

    <TouchableOpacity
      onPress={guardarRegistro}
      disabled={guardando}
      activeOpacity={0.85}
      style={[
        styles.button,
        {
          backgroundColor: colors.primary,
          opacity: guardando ? 0.7 : 1,
        },
      ]}
    >
      {guardando ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Ionicons
            name="save-outline"
            size={20}
            color="#FFFFFF"
          />

          <Text style={styles.buttonText}>
            Guardar registro
          </Text>
        </>
      )}
    </TouchableOpacity>
  </View>
)}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================================================
   COMPONENTE: TARJETA DE RESUMEN
============================================================ */

function SummaryCard({
  icon,
  title,
  value,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.summaryIcon,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>

      <Text
        style={[
          styles.summaryTitle,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.summaryValue,
          {
            color: colors.text,
          },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

/* ============================================================
   COMPONENTE: BOTON DE METRICA
============================================================ */

function MetricButton({
  icon,
  title,
  active,
  onPress,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  active: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.metricButton,
        {
          backgroundColor: active
            ? colors.primary
            : colors.card,
          borderColor: active
            ? colors.primary
            : colors.border,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={17}
        color={active ? "#FFFFFF" : colors.textSecondary}
      />

      <Text
        style={[
          styles.metricButtonText,
          {
            color: active
              ? "#FFFFFF"
              : colors.textSecondary,
          },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

/* ============================================================
   COMPONENTE: GRAFICA DE BARRAS
============================================================ */

function BarChart({
  registros,
  metrica,
  colors,
}: {
  registros: RegistroActividad[];
  metrica: Metrica;
  colors: any;
}) {
  const datos = [...registros].reverse();

  const valores = datos
    .map((registro) => obtenerValor(registro, metrica))
    .filter((valor): valor is number => valor !== null);

  const maximo = Math.max(...valores, 1);

  if (valores.length === 0) {
    return (
      <View style={styles.noMetricData}>
        <Ionicons
          name="analytics-outline"
          size={38}
          color={colors.textSecondary}
        />

        <Text
          style={[
            styles.emptyText,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          No hay datos disponibles para esta métrica.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chartScroll}
    >
      {datos.map((registro) => {
        const valor = obtenerValor(registro, metrica);

        if (valor === null) {
          return (
            <View
              key={registro.id}
              style={styles.barColumn}
            >
              <View style={styles.barArea}>
                <View
                  style={[
                    styles.noDataBar,
                    {
                      backgroundColor: colors.border,
                    },
                  ]}
                />
              </View>

              <Text
                style={[
                  styles.barLabel,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {formatearFechaCorta(registro.fecha)}
              </Text>
            </View>
          );
        }

        const porcentaje = Math.max(
          (valor / maximo) * 100,
          5
        );

        const esUltimo =
          registro.fecha === registros[0]?.fecha;

        return (
          <View
            key={registro.id}
            style={styles.barColumn}
          >
            <Text
              style={[
                styles.barValue,
                {
                  color: colors.text,
                },
              ]}
            >
              {formatearValor(valor, metrica)}
            </Text>

            <View style={styles.barArea}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${porcentaje}%`,
                    backgroundColor: esUltimo
                      ? colors.primary
                      : `${colors.primary}66`,
                  },
                ]}
              />
            </View>

            <Text
              style={[
                styles.barLabel,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {formatearFechaCorta(registro.fecha)}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

/* ============================================================
   COMPONENTE: ESTADISTICA
============================================================ */

function StatRow({
  icon,
  title,
  value,
  subtitle,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  subtitle?: string;
  colors: any;
}) {
  return (
    <View style={styles.statRow}>
      <View
        style={[
          styles.statIcon,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>

      <View style={styles.statContent}>
        <Text
          style={[
            styles.statTitle,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {title}
        </Text>

        {subtitle && (
          <Text
            style={[
              styles.statSubtitle,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>

      <Text
        style={[
          styles.statValue,
          {
            color: colors.text,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/* ============================================================
   COMPONENTE: HISTORIAL
============================================================ */

function HistoryCard({
  registro,
  colors,
}: {
  registro: RegistroActividad;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.historyCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.historyDate}>
        <View
          style={[
            styles.historyCalendar,
            {
              backgroundColor: colors.background,
            },
          ]}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={colors.primary}
          />
        </View>

        <View>
          <Text
            style={[
              styles.historyDateText,
              {
                color: colors.text,
              },
            ]}
          >
            {formatearFecha(registro.fecha)}
          </Text>

          <Text
            style={[
              styles.historyOrigin,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Registro manual
          </Text>
        </View>
      </View>

      <View style={styles.historyMetrics}>
        <HistoryMetric
          icon="footsteps"
          value={
            registro.pasos !== null
              ? formatearNumero(registro.pasos)
              : "--"
          }
          label="pasos"
          colors={colors}
        />

        <HistoryMetric
          icon="flame"
          value={
            registro.calorias !== null
              ? formatearNumero(registro.calorias)
              : "--"
          }
          label="kcal"
          colors={colors}
        />

        <HistoryMetric
          icon="heart"
          value={
            registro.frecuenciaCardiaca !== null
              ? `${registro.frecuenciaCardiaca}`
              : "--"
          }
          label="bpm"
          colors={colors}
        />

        <HistoryMetric
          icon="walk"
          value={
            registro.distancia !== null
              ? `${registro.distancia}`
              : "--"
          }
          label="km"
          colors={colors}
        />
      </View>
    </View>
  );
}

function HistoryMetric({
  icon,
  value,
  label,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  colors: any;
}) {
  return (
    <View style={styles.historyMetric}>
      <Ionicons
        name={icon}
        size={16}
        color={colors.primary}
      />

      <Text
        style={[
          styles.historyMetricValue,
          {
            color: colors.text,
          },
        ]}
      >
        {value}
      </Text>

      <Text
        style={[
          styles.historyMetricLabel,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

/* ============================================================
   FUNCIONES DE DATOS
============================================================ */

function obtenerValor(
  registro: RegistroActividad,
  metrica: Metrica
): number | null {
  return registro[metrica];
}

function calcularPromedio(
  registros: RegistroActividad[],
  metrica: Metrica
): number | null {
  const valores = registros
    .map((registro) => obtenerValor(registro, metrica))
    .filter((valor): valor is number => valor !== null);

  if (valores.length === 0) {
    return null;
  }

  const total = valores.reduce(
    (acumulado, valor) => acumulado + valor,
    0
  );

  return total / valores.length;
}

function obtenerMayor(
  registros: RegistroActividad[],
  metrica: Metrica
): { valor: number; fecha: string } | null {
  const disponibles = registros
    .map((registro) => {
      const valor = obtenerValor(registro, metrica);

      if (valor === null) {
        return null;
      }

      return {
        valor,
        fecha: registro.fecha,
      };
    })
    .filter(
      (
        dato
      ): dato is { valor: number; fecha: string } =>
        dato !== null
    );

  if (disponibles.length === 0) {
    return null;
  }

  return disponibles.reduce((mayor, actual) =>
    actual.valor > mayor.valor ? actual : mayor
  );
}

/* ============================================================
   FUNCIONES DE PRESENTACION
============================================================ */

function obtenerNombreMetrica(metrica: Metrica) {
  switch (metrica) {
    case "pasos":
      return "Pasos";
    case "calorias":
      return "Calorías";
    case "frecuenciaCardiaca":
      return "Frecuencia cardíaca";
    case "distancia":
      return "Distancia";
  }
}

function obtenerIconoMetrica(
  metrica: Metrica
): keyof typeof Ionicons.glyphMap {
  switch (metrica) {
    case "pasos":
      return "footsteps";
    case "calorias":
      return "flame";
    case "frecuenciaCardiaca":
      return "heart";
    case "distancia":
      return "walk";
  }
}

function obtenerUnidad(metrica: Metrica) {
  switch (metrica) {
    case "pasos":
      return "pasos";
    case "calorias":
      return "kcal";
    case "frecuenciaCardiaca":
      return "bpm";
    case "distancia":
      return "km";
  }
}

function formatearNumero(valor: number) {
  return Math.round(valor).toLocaleString("es-CO");
}

function formatearValor(
  valor: number,
  metrica: Metrica
) {
  if (metrica === "distancia") {
    return valor.toFixed(1);
  }

  if (metrica === "frecuenciaCardiaca") {
    return Math.round(valor).toString();
  }

  return Math.round(valor).toLocaleString("es-CO");
}

function formatearFecha(fecha: string) {
  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  const [año, mes, dia] = partes;

  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  const numeroMes = Number(mes) - 1;

  if (!meses[numeroMes]) {
    return fecha;
  }

  return `${Number(dia)} de ${meses[numeroMes]} de ${año}`;
}

function formatearFechaCorta(fecha: string) {
  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  const [, mes, dia] = partes;

  return `${dia}/${mes}`;
}

function obtenerFechaActual() {
  const ahora = new Date();

  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");

  return `${año}-${mes}-${dia}`;
}

/* ============================================================
   ESTILOS
============================================================ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scroll: {
    padding: 20,
    paddingBottom: 50,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  headerIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(37, 99, 235, 0.12)",
    marginRight: 13,
  },

  headerTextContainer: {
    flex: 1,
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
    marginBottom: 4,
  },

  description: {
    fontSize: 14,
    lineHeight: 20,
  },

  sectionHeader: {
    marginTop: 27,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 5,
  },

  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  summaryCard: {
    width: "48%",
    minHeight: 125,
    borderWidth: 1,
    borderRadius: 17,
    padding: 14,
    marginBottom: 12,
  },

  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  summaryTitle: {
    fontSize: 12,
    marginBottom: 5,
  },

  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
  },

  periodContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    marginBottom: 13,
  },

  periodButton: {
    flex: 1,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 9,
  },

  periodText: {
    fontSize: 13,
    fontWeight: "700",
  },

  metricScroll: {
    paddingBottom: 5,
    gap: 8,
  },

  metricButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  metricButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },

  chartCard: {
    borderWidth: 1,
    borderRadius: 19,
    marginTop: 14,
    padding: 16,
    overflow: "hidden",
  },

  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  chartTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  chartSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },

  chartIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },

  chartScroll: {
    paddingTop: 5,
    paddingBottom: 8,
    paddingHorizontal: 4,
    minWidth: "100%",
  },

  barColumn: {
    width: 46,
    marginRight: 8,
    alignItems: "center",
  },

  barValue: {
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 5,
  },

  barArea: {
    width: 28,
    height: 135,
    justifyContent: "flex-end",
    alignItems: "center",
  },

  bar: {
    width: 24,
    minHeight: 7,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },

  noDataBar: {
    width: 24,
    height: 7,
    borderRadius: 4,
  },

  barLabel: {
    fontSize: 10,
    marginTop: 7,
  },

  chartLoading: {
    height: 190,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },

  emptyChart: {
    minHeight: 190,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  noMetricData: {
    minHeight: 190,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center",
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 5,
  },

  statsCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },

  statRow: {
    minHeight: 67,
    flexDirection: "row",
    alignItems: "center",
  },

  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  statContent: {
    flex: 1,
  },

  statTitle: {
    fontSize: 13,
  },

  statSubtitle: {
    fontSize: 11,
    marginTop: 3,
  },

  statValue: {
    fontSize: 15,
    fontWeight: "800",
  },

  statDivider: {
    height: 1,
  },

  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 27,
    marginBottom: 2,
  },

  historyCard: {
    borderWidth: 1,
    borderRadius: 17,
    padding: 15,
    marginTop: 10,
  },

  historyDate: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  historyCalendar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  historyDateText: {
    fontSize: 14,
    fontWeight: "800",
  },

  historyOrigin: {
    fontSize: 11,
    marginTop: 3,
  },

  historyMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  historyMetric: {
    alignItems: "center",
    minWidth: 58,
  },

  historyMetricValue: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },

  historyMetricLabel: {
    fontSize: 10,
    marginTop: 2,
  },

  /* ============================================================
     BOTON PARA MOSTRAR / OCULTAR FORMULARIO
  ============================================================ */

  formHeader: {
    marginTop: 32,
    marginBottom: 14,
  },

  registerActivityButton: {
    minHeight: 86,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",

    elevation: 4,

    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  registerActivityIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },

  registerActivityContent: {
    flex: 1,
    marginLeft: 13,
  },

  registerActivityTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },

  registerActivitySubtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    lineHeight: 17,
  },

  registerActivityArrow: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  formContainer: {
    marginTop: 14,
  },

  formSectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },

  infoCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    marginBottom: 21,
  },

  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 8,
  },

  infoText: {
    fontSize: 13,
    lineHeight: 19,
  },

  label: {
    fontSize: 13,
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 14,
    fontSize: 16,
  },

  button: {
    height: 53,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    flexDirection: "row",
    gap: 9,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  historyEmpty: {
    borderWidth: 1,
    borderRadius: 17,
    padding: 25,
    alignItems: "center",
    marginTop: 10,
  },
});