/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
 // importa los componentes de React Native que se van a utilizar en la pantalla
import {ActivityIndicator,Alert,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View,} from "react-native";
// Importación de hooks fundamentales de React
import { useCallback, useState } from "react";
// Hook de Expo Router para ejecutar acciones cuando la pantalla se vuelve visible
import { useFocusEffect } from "expo-router";
// Ionicons: permite usar iconos para complementar la interfaz de usuario
import { Ionicons } from "@expo/vector-icons";
// Componente para evitar que el contenido se solape con los bordes físicos del dispositivo (notch, barra de estado)
import { SafeAreaView } from "react-native-safe-area-context";
// Importación del hook personalizado para obtener los colores del tema actual (claro u oscuro)
import { useTheme } from "../../hooks/useTheme";
// Instancias de autenticación y base de datos configuradas de Firebase
import { auth, db } from "../../services/firebase";
// Importación de funciones específicas de Firebase Firestore para manipular y consultar datos
import {collection,doc,getDocs,limit,orderBy,query,serverTimestamp,setDoc,} from "firebase/firestore";
// Importa la funcion de un boton para reportar
import BotonReportar from "../../components/BotonReportar";

import {MOTIVOS_GENERALES} from "../../services/reportesService";
/* ============================================================
   TIPOS DE DATOS (TypeScript)
============================================================ */

// Define la estructura exacta de un documento de actividad en la base de datos.
// Se usa "number | null" porque el usuario podría no registrar todas las métricas un día.
type RegistroActividad = {
  id: string;
  fecha: string;
  pasos: number | null;
  frecuenciaCardiaca: number | null;
  calorias: number | null;
  distancia: number | null;
};

// Limita los valores posibles para la variable métrica, evitando errores de escritura.
type Metrica = "pasos" | "calorias" | "frecuenciaCardiaca" | "distancia";

/* ============================================================
   COMPONENTE PRINCIPAL DE LA PANTALLA
============================================================ */
// export default indica que este es el componente principal que se exporta desde este archivo.
export default function Actividad() {
/*const: declara una variable cuyo valor no se reasigna.
Se utiliza para guardar valores, funciones, resultados de
hooks o referencias que serán utilizados posteriormente por el componente.
*/
  // Obtenemos la paleta de colores actual dependiendo del tema del dispositivo
  const { colors } = useTheme();

  // --- ESTADOS DEL FORMULARIO DE REGISTRO ---
  // Inicializa la fecha con el día actual por defecto
  const [fecha, setFecha] = useState(obtenerFechaActual());
  
  // Estados para almacenar lo que el usuario escribe en los campos de texto
  const [pasos, setPasos] = useState("");
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState("");
  const [calorias, setCalorias] = useState("");
  const [distancia, setDistancia] = useState("");

  // --- ESTADOS DE CARGA E INTERFAZ ---
  // Controlan la aparición de los círculos de carga (spinners)
  const [guardando, setGuardando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  // --- ESTADOS DE DATOS Y VISUALIZACIÓN ---
  // Almacena el array de actividades descargadas desde Firestore
  const [registros, setRegistros] = useState<RegistroActividad[]>([]);
  // Días que se van a consultar y mostrar en la gráfica (7 por defecto)
  const [periodo, setPeriodo] = useState(7);
  // Métrica que se está mostrando actualmente en la gráfica principal
  const [metrica, setMetrica] = useState<Metrica>("pasos");

  // Controla si se despliega o se oculta la sección para ingresar datos manualmente
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // --- EFECTO DE CICLO DE VIDA ---
  // Se ejecuta cada vez que la pantalla gana el foco o cuando cambia el "periodo".
  // Su función principal es mantener los datos actualizados.
  useFocusEffect(
    useCallback(() => {
      cargarDatos(periodo);
    }, [periodo])
  );

  /* ============================================================
     FUNCIÓN PARA OBTENER DATOS DE FIREBASE
  ============================================================ */
  async function cargarDatos(dias: number) {
    const usuario = auth.currentUser;

    // Si no hay sesión iniciada, vaciamos los registros y detenemos la carga
    if (!usuario) {
      setRegistros([]);
      setCargandoDatos(false);
      return;
    }

    try {
      setCargandoDatos(true); // Mostramos el indicador de carga

      // 1. Apuntamos a la subcolección "actividad" dentro del documento del usuario actual
      const referencia = collection(
        db,
        "usuarios",
        usuario.uid,
        "actividad"
      );

      // 2. Construimos la consulta: Ordenamos por fecha (más reciente primero) y limitamos a la cantidad de "días"
      const consulta = query(
        referencia,
        orderBy("fecha", "desc"),
        limit(dias)
      );

      // 3. Ejecutamos la petición a Firebase
      const resultado = await getDocs(consulta);

      // 4. Transformamos los documentos crudos de Firebase a nuestro tipo "RegistroActividad"
      const datos: RegistroActividad[] = resultado.docs.map((documento) => {
        const data = documento.data();

        // Validamos que cada campo sea un número; de lo contrario, forzamos un valor null
        return {
          id: documento.id,
          fecha: data.fecha ?? documento.id,
          pasos: typeof data.pasos === "number" ? data.pasos : null,
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

      // 5. Ordenamos localmente de forma descendente para asegurar que las fechas estén correctas
      datos.sort((a, b) => b.fecha.localeCompare(a.fecha));

      // 6. Guardamos los datos formateados en el estado de React
      setRegistros(datos);
    } catch (error) {
      console.error("Error cargando actividad:", error);
      Alert.alert(
        "Error",
        "No fue posible cargar los datos de actividad."
      );
      setRegistros([]); // En caso de error, dejamos la lista vacía
    } finally {
      setCargandoDatos(false); // Ocultamos el indicador de carga en cualquier caso (éxito o error)
    }
  }

  /* ============================================================
     FUNCIÓN PARA GUARDAR DATOS EN FIREBASE
  ============================================================ */
  async function guardarRegistro() {
    const usuario = auth.currentUser;

    // Validación 1: Verificar que el usuario tenga sesión
    if (!usuario) {
      Alert.alert(
        "Sesión requerida",
        "Debes iniciar sesión para guardar tus datos."
      );
      return;
    }

    // Validación 2: Verificar que el campo fecha no esté vacío
    if (!fecha.trim()) {
      Alert.alert("Fecha requerida", "Ingresa una fecha.");
      return;
    }

    // Validación 3: Al menos un campo numérico debe tener datos para que valga la pena guardar
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
      setGuardando(true); // Activamos el spinner del botón guardar

      // Construimos el objeto a guardar. 
      // Si el campo de texto está vacío, enviamos null; si tiene texto, lo convertimos a Número.
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
        actualizadoEn: serverTimestamp(), // Registra la fecha/hora exacta del servidor
      };

      // Establecemos la ruta exacta del documento. Usamos la FECHA como ID del documento.
      const referencia = doc(
        db,
        "usuarios",
        usuario.uid,
        "actividad",
        fecha.trim()
      );

      // Guardamos el documento. 
      // IMPORTANTE: { merge: true } hace que si el documento ya existe, solo actualice los campos enviados sin borrar los demás.
      await setDoc(referencia, registro, { merge: true });

      Alert.alert(
        "Registro guardado",
        "Los datos de actividad se guardaron correctamente."
      );

      // Refrescamos la información de la pantalla para reflejar los nuevos cambios
      await cargarDatos(periodo);
    } catch (error) {
      console.error("Error guardando actividad:", error);
      Alert.alert(
        "Error",
        "No fue posible guardar los datos. Intenta nuevamente."
      );
    } finally {
      setGuardando(false); // Desactivamos el spinner del botón
    }
  }

  // --- CÁLCULOS DERIVADOS ---
  // Busca si dentro de los registros descargados existe uno con la fecha de hoy
  const registroHoy = registros.find(
    (registro) => registro.fecha === obtenerFechaActual()
  );

  // Calcula promedio y el valor más alto según la métrica actualmente seleccionada
  const promedio = calcularPromedio(registros, metrica);
  const mayor = obtenerMayor(registros, metrica);

  /* ============================================================
     RENDERIZADO DE LA INTERFAZ DE USUARIO (JSX)
  ============================================================ */
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* Contenedor principal desplazable (Scroll) */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        
        {/* ====================================================
   ENCABEZADO DE ACTIVIDAD

   Agrupa el icono de la sección, el título "Mi actividad"
   y la descripción introductoria de la pantalla.
        =================================================== */}
        
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

        {/* SECCIÓN: RESUMEN DE HOY */}
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

        {/* ============================================================
   RESUMEN DE HOY

   Presenta las cuatro métricas disponibles para el día actual:
   pasos, calorías, frecuencia cardíaca y distancia.
============================================================ */}
        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="footsteps"
            title="Pasos"
            value={
              registroHoy?.pasos !== null &&
              registroHoy?.pasos !== undefined
                ? formatearNumero(registroHoy.pasos)
                : "--" // Muestra guiones si no hay dato
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

        {/* ============================================================
   GRÁFICA

   Muestra la evolución de la métrica seleccionada.
   Puede presentar estados de carga, ausencia de datos o
   información disponible.
============================================================ */}
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

        {/* SELECTOR DE PERIODO: Botones para cambiar entre 7, 14 y 30 días */}
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
              onPress={() => setPeriodo(cantidad)} // Actualiza el periodo, provocando que se vuelva a consultar Firebase
              style={[
                styles.periodButton,
                periodo === cantidad && {
                  backgroundColor: colors.primary, // Color sólido si es el botón activo
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

        {/* SELECTOR DE MÉTRICA: Botones deslizables horizontalmente para cambiar qué métrica se grafica */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricScroll}
        >
          <MetricButton
            icon="footsteps"
            title="Pasos"
            active={metrica === "pasos"}
            onPress={() => setMetrica("pasos")} // Actualiza la métrica visible
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

        {/* TARJETA DE GRÁFICA: Contenedor visual del gráfico de barras */}
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Cabecera de la gráfica (Título dinámico e ícono) */}
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

          {/* Renderizado condicional de la gráfica */}
          {cargandoDatos ? (
            // 1. Estado de carga: Muestra el spinner si está consultando base de datos
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
            // 2. Estado vacío: Si se consultó pero no hay registros guardados en absoluto
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
            // 3. Estado con datos: Renderiza el componente de gráfica
            <BarChart
              registros={registros}
              metrica={metrica}
              colors={colors}
            />
          )}
        </View>

        {/* SECCIÓN: ESTADÍSTICAS DEL PERIODO */}
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
          {/* Fila: Total de días registrados de los consultados */}
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

          {/* Fila: Valor promedio matemático */}
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

          {/* Fila: El valor más alto registrado y en qué fecha fue */}
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

        {/* SECCIÓN: HISTORIAL (Listado detallado) */}
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

          {/* Botón para refrescar (forzar recarga) los datos manualmente */}
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

        {/* Renderizado de las tarjetas del historial */}
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
          // Itera el arreglo para renderizar una tarjeta por cada día registrado
          registros.map((registro) => (
            <HistoryCard
              key={registro.id}
              registro={registro}
              colors={colors}
            />
          ))
        )}

        {/* SECCIÓN: FORMULARIO DE REGISTRO MANUAL (Acordeón) */}
        <View style={styles.formHeader}>
          {/* Botón grande que muestra u oculta el formulario */}
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
              <Text
                  style={styles.registerActivitySubtitle}
                  numberOfLines={2}
                  ellipsizeMode="tail"
              >
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

        {/* Si mostrarFormulario es verdadero, se despliega el contenido a continuación */}
        {mostrarFormulario && (
          <View style={styles.formContainer}>
            {/* Mensaje de información sobre la captura manual */}
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

            {/* Inputs del formulario */}
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
              keyboardType="numeric" // Despliega el teclado numérico del teléfono
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
              keyboardType="decimal-pad" // Teclado que permite el punto decimal
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            {/* Botón para accionar el guardado en Firebase */}
            <TouchableOpacity
              onPress={guardarRegistro}
              disabled={guardando} // Deshabilita el botón si la app ya está guardando
              activeOpacity={0.85}
              style={[
                styles.button,
                {
                  backgroundColor: colors.primary,
                  opacity: guardando ? 0.7 : 1, // Atenúa el botón si está cargando
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
        {/* ============================================================
   REPORTE DE LA PANTALLA
============================================================ */}

<BotonReportar
  recursoId="actividad"
  recursoNombre="Actividad y estadísticas"
  motivos={MOTIVOS_GENERALES}
  textoBoton="Reportar un problema"
  descripcionBoton="Reporta un problema con tus datos o estadísticas"
/>
      </ScrollView>
    </View>
  );
}

/* ============================================================
   SUBCOMPONENTE: TARJETA DE RESUMEN
   (Se usa en la cuadrícula superior de "Resumen de hoy")
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
   SUBCOMPONENTE: BOTÓN DE MÉTRICA
   (Botones tipo pastilla debajo del selector de periodo)
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
          // Cambia el color del fondo y borde dependiendo de si está presionado
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
   SUBCOMPONENTE: GRÁFICA DE BARRAS
   (Dibuja las barras dinámicamente)
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
  // Invierte los datos para que el día más viejo quede a la izquierda y el actual a la derecha
  const datos = [...registros].reverse();

  // Extrae un arreglo plano solo con los números (filtra los valores nulos)
  const valores = datos
    .map((registro) => obtenerValor(registro, metrica))
    .filter((valor): valor is number => valor !== null);

  // Calcula el valor máximo matemáticamente; servirá para definir el 100% de la altura
  const maximo = Math.max(...valores, 1);

  // Si no hay datos válidos, muestra un estado visual vacío
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

        // Si ese día no tiene datos registrados para esa métrica, renderiza una barra gris mínima
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

        // Calcula dinámicamente qué porcentaje de altura debe tener la barra respecto al valor máximo.
        // Math.max asegura que aunque el valor sea muy bajo, la barra mida al menos 5% y sea visible.
        const porcentaje = Math.max(
          (valor / maximo) * 100,
          5
        );

        // Verifica si la fecha que se está dibujando es la más reciente (índice 0 en registros originales)
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
                    // Asigna el tamaño porcentual calculado arriba
                    height: `${porcentaje}%`,
                    // Resalta el día más reciente con un color opaco, el resto semitransparente ("66")
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
   SUBCOMPONENTE: FILA DE ESTADÍSTICA
   (Filas para Promedio, Días registrados y Mayor registro)
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
  subtitle?: string; // Opcional, usado para poner la fecha bajo el récord
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
   SUBCOMPONENTE: TARJETA DE HISTORIAL
   (Contenedor grande por cada día en la lista de abajo)
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

      {/* Renderiza las 4 submétricas internas del historial */}
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

// Componente diminuto usado internamente dentro de HistoryCard
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
   UTILIDADES LÓGICAS (Cálculo de Datos)
============================================================ */

// Retorna el valor dinámicamente dependiendo del string de la métrica (ej. registro['pasos'])
function obtenerValor(
  registro: RegistroActividad,
  metrica: Metrica
): number | null {
  return registro[metrica];
}

// Calcula el promedio filtrando nulos
function calcularPromedio(
  registros: RegistroActividad[],
  metrica: Metrica
): number | null {
  // Filtra del arreglo completo solamente los valores numéricos válidos
  const valores = registros
    .map((registro) => obtenerValor(registro, metrica))
    .filter((valor): valor is number => valor !== null);

  if (valores.length === 0) {
    return null; // Evita error matemático si no hay datos
  }

  // Suma todos los valores usando reduce
  const total = valores.reduce(
    (acumulado, valor) => acumulado + valor,
    0
  );

  return total / valores.length; // Retorna el promedio
}

// Encuentra el objeto (fecha y valor) más alto del historial para una métrica en particular
function obtenerMayor(
  registros: RegistroActividad[],
  metrica: Metrica
): { valor: number; fecha: string } | null {
  // Transforma el arreglo y elimina los nulos
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

  // Reduce el array comparando elementos de dos en dos, reteniendo siempre el mayor
  return disponibles.reduce((mayor, actual) =>
    actual.valor > mayor.valor ? actual : mayor
  );
}

/* ============================================================
   UTILIDADES DE PRESENTACIÓN (Formatos de Textos e Iconos)
============================================================ */

// Devuelve el string en español correcto dependiendo del valor seleccionado
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

// Devuelve el nombre del icono de Ionicons dependiente de la métrica
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

// Devuelve los prefijos para textos (bpm, kcal, km)
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

// Transforma "1500" a "1.500" según formato regional (Colombia en este caso)
function formatearNumero(valor: number) {
  return Math.round(valor).toLocaleString("es-CO");
}

// Formateador condicional según el tipo de medida
function formatearValor(
  valor: number,
  metrica: Metrica
) {
  if (metrica === "distancia") {
    // La distancia siempre muestra 1 decimal (Ej. 5.2)
    return valor.toFixed(1);
  }

  if (metrica === "frecuenciaCardiaca") {
    // El ritmo cardíaco nunca usa separación por miles (Ej. 120 bpm)
    return Math.round(valor).toString();
  }

  // Por defecto (pasos, calorías) usa separación de miles (Ej. 1.500)
  return Math.round(valor).toLocaleString("es-CO");
}

// Pasa de "YYYY-MM-DD" a formato verbal: "15 de mayo de 2023"
function formatearFecha(fecha: string) {
  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return fecha; // Previene error si el string falla
  }

  const [año, mes, dia] = partes;

  const meses = [
    "enero", "febrero", "marzo", "abril",
    "mayo", "junio", "julio", "agosto",
    "septiembre", "octubre", "noviembre", "diciembre",
  ];

  const numeroMes = Number(mes) - 1; // Ajuste del índice de Array (enero es 0)

  if (!meses[numeroMes]) {
    return fecha;
  }

  return `${Number(dia)} de ${meses[numeroMes]} de ${año}`;
}

// Pasa de "YYYY-MM-DD" a formato corto "DD/MM" para la gráfica
function formatearFechaCorta(fecha: string) {
  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  const [, mes, dia] = partes;

  return `${dia}/${mes}`;
}

// Extrae la fecha actual del sistema operativo del dispositivo móvil
function obtenerFechaActual() {
  const ahora = new Date();

  const año = ahora.getFullYear();
  // padStart asegura que meses menores a 10 se completen con cero (ej. '05')
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");

  return `${año}-${mes}-${dia}`;
}

/* ============================================================
   HOJAS DE ESTILO (StyleSheet)
   Solo definen posición (flexbox), geometría (radios, márgenes) y fuentes.
   Los colores (background, color, border) se aplican 'en línea' 
   dentro de los componentes para reaccionar al Tema Claro/Oscuro.
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

  /* Permite que el texto del encabezado se reduzca sin empujar
   otros elementos en pantallas pequeñas. */
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
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
    flexWrap: "wrap", // Permite que los elementos pasen a la línea inferior si no caben
    justifyContent: "space-between",
  },

  summaryCard: {
    width: "48%", // Fuerza 2 columnas
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
    overflow: "hidden", // Esconde elementos internos que se salgan de los bordes redondeados
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
    justifyContent: "flex-end", // Empuja la barra hacia la base de la gráfica
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
    height: 1, // Línea gris de separación entre filas
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

  /* Distribuye las cuatro métricas del historial de forma
   proporcional al ancho disponible. */
historyMetrics: {
  flexDirection: "row",
  justifyContent: "space-between",
  gap: 4,
},

/* Cada métrica utiliza una fracción del ancho disponible
   evitando que una cifra larga empuje a las demás. */
historyMetric: {
  flex: 1,
  minWidth: 0,
  alignItems: "center",
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

  /* ESTILOS DEL FORMULARIO Y SU BOTÓN ACORDEÓN */

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
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.18)", // Sombra base para iOS y nueva web React Native
  },

  registerActivityIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Permite que los textos del botón se adapten a teléfonos
   estrechos sin desplazar la flecha lateral. */
  registerActivityContent: {
    flex: 1,
    minWidth: 0,
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