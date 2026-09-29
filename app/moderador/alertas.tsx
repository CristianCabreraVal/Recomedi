import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  useFocusEffect,
  useRouter,
} from "expo-router";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  auth,
} from "../../services/firebase";

import {
  actualizarAlerta,
  cambiarEstadoAlerta,
  crearAlerta,
  eliminarAlerta,
  obtenerAlertas,
  type AlertaSanitaria,
  type EstadoAlerta,
  type NivelAlerta,
} from "../../services/alertasAdminService";

import {
  useTheme,
} from "../../hooks/useTheme";

/* ============================================================
   CATEGORÍAS SUGERIDAS
============================================================ */

const CATEGORIAS_SUGERIDAS = [
  "Respiratoria",
  "Vectorial",
  "Gastrointestinal",
  "Zoonótica",
  "Alimentos y agua",
  "Inmunoprevenible",
  "Ambiental / sanitaria",
  "Otra",
];

/* ============================================================
   NORMALIZAR CATEGORÍA
============================================================ */

function normalizarCategoria(
  valor: string
): string {
  const texto = valor
    .trim()
    .replace(/\s+/g, " ");

  const clave =
    texto.toLowerCase();

  const equivalencias: Record<
    string,
    string
  > = {
    respiratorio:
      "Respiratoria",

    respiratoria:
      "Respiratoria",

    vectorial:
      "Vectorial",

    gastrointestinal:
      "Gastrointestinal",

    zoonotica:
      "Zoonótica",

    zoonótica:
      "Zoonótica",

    "alimentos y agua":
      "Alimentos y agua",

    inmunoprevenible:
      "Inmunoprevenible",

    "ambiental / sanitaria":
      "Ambiental / sanitaria",

    ambiental:
      "Ambiental / sanitaria",

    otra:
      "Otra",
  };

  return (
    equivalencias[clave] ??
    texto
  );
}

/* ============================================================
   COMPONENTE
============================================================ */

export default function AlertasModerador() {
  const { colors } =
    useTheme();

  const router =
    useRouter();

  const { width } =
    useWindowDimensions();

  const esMovil =
    width < 768;

  /* ==========================================================
     ESTADOS
  ========================================================== */

  const [
    modoEdicion,
    setModoEdicion,
  ] = useState(false);

  const [
    alertaEditando,
    setAlertaEditando,
  ] =
    useState<AlertaSanitaria | null>(
      null
    );

  const [
    alertas,
    setAlertas,
  ] = useState<AlertaSanitaria[]>(
    []
  );

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    actualizando,
    setActualizando,
  ] = useState(false);

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState<
    "todos" | EstadoAlerta
  >("todos");

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false);

  const [
    alertaAbierta,
    setAlertaAbierta,
  ] = useState<string | null>(
    null
  );

  const [
    form,
    setForm,
  ] = useState({
    titulo: "",
    descripcion: "",
    contenido: "",
    nivel:
      "informativa" as NivelAlerta,
    categoria: "",
    zona: "",
    fuente: "",
    fuenteUrl: "",
  });

  /* ==========================================================
     CARGAR ALERTAS AL ENTRAR
  ========================================================== */

  useFocusEffect(
    useCallback(() => {
      cargarAlertas();
    }, [])
  );

  /* ==========================================================
     ABRIR EDICIÓN
  ========================================================== */

  function abrirEdicion(
    alerta: AlertaSanitaria
  ) {
    setAlertaEditando(
      alerta
    );

    setForm({
      titulo:
        alerta.titulo,

      descripcion:
        alerta.descripcion,

      contenido:
        alerta.contenido,

      nivel:
        alerta.nivel,

      categoria:
        normalizarCategoria(
          alerta.categoria
        ),

      zona:
        alerta.zona,

      fuente:
        alerta.fuente,

      fuenteUrl:
        alerta.fuenteUrl,
    });

    setModoEdicion(
      true
    );

    setMostrarFormulario(
      true
    );

    setAlertaAbierta(
      null
    );
  }

  /* ==========================================================
     CARGAR ALERTAS
  ========================================================== */

  async function cargarAlertas() {
    try {
      setCargando(true);

      const datos =
        await obtenerAlertas();

      setAlertas(datos);
    } catch (error) {
      console.error(
        "Error cargando alertas:",
        error
      );

      mostrarMensaje(
        "Alertas sanitarias",
        "No fue posible cargar las alertas."
      );
    } finally {
      setCargando(false);
    }
  }

  /* ==========================================================
     MENSAJES
  ========================================================== */

  function mostrarMensaje(
    titulo: string,
    mensaje: string
  ) {
    if (
      Platform.OS === "web"
    ) {
      window.alert(
        `${titulo}\n\n${mensaje}`
      );

      return;
    }

    Alert.alert(
      titulo,
      mensaje
    );
  }

  /* ==========================================================
     ACTUALIZAR CAMPO
  ========================================================== */

  function actualizarCampo(
    campo: keyof typeof form,
    valor: string
  ) {
    setForm(
      (anterior) => ({
        ...anterior,
        [campo]: valor,
      })
    );
  }

  /* ==========================================================
     GUARDAR ALERTA
  ========================================================== */

  async function guardarAlerta() {
    const usuarioUid =
      auth.currentUser?.uid;

    if (!usuarioUid) {
      mostrarMensaje(
        "Sesión",
        "No hay un usuario moderador autenticado."
      );

      return;
    }

    if (
      !form.titulo.trim() ||
      !form.descripcion.trim() ||
      !form.contenido.trim() ||
      !form.categoria.trim() ||
      !form.zona.trim() ||
      !form.fuente.trim()
    ) {
      mostrarMensaje(
        "Datos incompletos",
        "Completa los campos obligatorios."
      );

      return;
    }

    try {
      setActualizando(
        true
      );

      const categoriaNormalizada =
        normalizarCategoria(
          form.categoria
        );

      /* ======================================================
         EDITAR
      ====================================================== */

      if (
        modoEdicion &&
        alertaEditando
      ) {
        await actualizarAlerta(
          alertaEditando.id,
          {
            titulo:
              form.titulo.trim(),

            descripcion:
              form.descripcion.trim(),

            contenido:
              form.contenido.trim(),

            nivel:
              form.nivel,

            categoria:
              categoriaNormalizada,

            zona:
              form.zona.trim(),

            fuente:
              form.fuente.trim(),

            fuenteUrl:
              form.fuenteUrl.trim(),
          },
          usuarioUid
        );

        limpiarFormulario();

        await cargarAlertas();

        mostrarMensaje(
          "Alerta actualizada",
          "Los cambios se guardaron correctamente."
        );

        return;
      }

      /* ======================================================
         CREAR
      ====================================================== */

      await crearAlerta({
        titulo:
          form.titulo.trim(),

        descripcion:
          form.descripcion.trim(),

        contenido:
          form.contenido.trim(),

        nivel:
          form.nivel,

        categoria:
          categoriaNormalizada,

        zona:
          form.zona.trim(),

        fuente:
          form.fuente.trim(),

        fuenteUrl:
          form.fuenteUrl.trim(),

        estado:
          "pendiente",

        creadoPor:
          usuarioUid,
      });

      limpiarFormulario();

      await cargarAlertas();

      mostrarMensaje(
        "Alerta creada",
        "La alerta fue guardada como pendiente."
      );
    } catch (error: any) {
      console.error(
        "ERROR COMPLETO GUARDANDO ALERTA:",
        error
      );

      console.error(
        "Código:",
        error?.code
      );

      console.error(
        "Mensaje:",
        error?.message
      );

      mostrarMensaje(
        "Error",
        `Código: ${
          error?.code ||
          "desconocido"
        }\n\n${
          error?.message ||
          "No fue posible guardar la alerta."
        }`
      );
    } finally {
      setActualizando(
        false
      );
    }
  }

  /* ==========================================================
     LIMPIAR FORMULARIO
  ========================================================== */

  function limpiarFormulario() {
    setForm({
      titulo: "",
      descripcion: "",
      contenido: "",
      nivel:
        "informativa",
      categoria: "",
      zona: "",
      fuente: "",
      fuenteUrl: "",
    });

    setModoEdicion(
      false
    );

    setAlertaEditando(
      null
    );

    setMostrarFormulario(
      false
    );

    setAlertaAbierta(
      null
    );
  }

  /* ==========================================================
     CAMBIAR ESTADO
  ========================================================== */

  async function cambiarEstado(
    alerta: AlertaSanitaria,
    nuevoEstado: EstadoAlerta
  ) {
    const usuarioUid =
      auth.currentUser?.uid;

    if (!usuarioUid) {
      return;
    }

    try {
      setActualizando(
        true
      );

      await cambiarEstadoAlerta(
        alerta.id,
        nuevoEstado,
        usuarioUid
      );

      await cargarAlertas();

      setAlertaAbierta(
        null
      );
    } catch (error) {
      console.error(
        "Error cambiando estado:",
        error
      );

      mostrarMensaje(
        "Error",
        "No fue posible cambiar el estado."
      );
    } finally {
      setActualizando(
        false
      );
    }
  }

  /* ==========================================================
     ELIMINAR
  ========================================================== */

  async function eliminar(
    alerta: AlertaSanitaria
  ) {
    const confirmado =
      await confirmarAccion(
        "Eliminar alerta",
        `¿Deseas eliminar "${alerta.titulo}"?`
      );

    if (!confirmado) {
      return;
    }

    try {
      setActualizando(
        true
      );

      await eliminarAlerta(
        alerta.id
      );

      await cargarAlertas();

      setAlertaAbierta(
        null
      );
    } catch (error) {
      console.error(
        "Error eliminando alerta:",
        error
      );

      mostrarMensaje(
        "Error",
        "No fue posible eliminar la alerta."
      );
    } finally {
      setActualizando(
        false
      );
    }
  }

  /* ==========================================================
     CONFIRMAR ACCIÓN
  ========================================================== */

  async function confirmarAccion(
    titulo: string,
    mensaje: string
  ): Promise<boolean> {
    if (
      Platform.OS === "web"
    ) {
      return window.confirm(
        `${titulo}\n\n${mensaje}`
      );
    }

    return new Promise(
      (resolve) => {
        Alert.alert(
          titulo,
          mensaje,
          [
            {
              text: "Cancelar",
              style: "cancel",
              onPress: () =>
                resolve(false),
            },
            {
              text: "Aceptar",
              style: "destructive",
              onPress: () =>
                resolve(true),
            },
          ]
        );
      }
    );
  }

  /* ==========================================================
     ALERTAS FILTRADAS
  ========================================================== */

  const alertasFiltradas =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return alertas.filter(
        (alerta) => {
          const coincideEstado =
            filtroEstado ===
              "todos" ||
            alerta.estado ===
              filtroEstado;

          const coincideTexto =
            !texto ||
            alerta.titulo
              .toLowerCase()
              .includes(texto) ||
            alerta.descripcion
              .toLowerCase()
              .includes(texto) ||
            alerta.categoria
              .toLowerCase()
              .includes(texto) ||
            alerta.zona
              .toLowerCase()
              .includes(texto);

          // Mientras se edita, la alerta original
          // no aparece también debajo.
          const esLaAlertaEditando =
            modoEdicion &&
            alertaEditando?.id ===
              alerta.id;

          return (
            coincideEstado &&
            coincideTexto &&
            !esLaAlertaEditando
          );
        }
      );
    }, [
      alertas,
      busqueda,
      filtroEstado,
      modoEdicion,
      alertaEditando,
    ]);

  /* ==========================================================
     TEXTO DEL ESTADO
  ========================================================== */

  function textoEstado(
    estado: EstadoAlerta
  ) {
    switch (estado) {
      case "pendiente":
        return "Pendiente";

      case "activa":
        return "Activa";

      case "finalizada":
        return "Finalizada";

      case "rechazada":
        return "Rechazada";

      case "archivada":
        return "Archivada";

      default:
        return estado;
    }
  }

  /* ==========================================================
     TEXTO DEL NIVEL
  ========================================================== */

  function textoNivel(
    nivel: NivelAlerta
  ) {
    switch (nivel) {
      case "informativa":
        return "Informativa";

      case "moderada":
        return "Moderada";

      case "alta":
        return "Alta";

      case "critica":
        return "Crítica";

      default:
        return nivel;
    }
  }

  /* ==========================================================
     FORMATEAR FECHA
  ========================================================== */

  function formatearFecha(
    fecha: any
  ) {
    if (!fecha) {
      return "Sin fecha";
    }

    try {
      if (
        typeof fecha.toDate ===
        "function"
      ) {
        return fecha
          .toDate()
          .toLocaleString();
      }

      const fechaJs =
        new Date(fecha);

      if (
        Number.isNaN(
          fechaJs.getTime()
        )
      ) {
        return "Sin fecha";
      }

      return fechaJs.toLocaleString();
    } catch {
      return "Sin fecha";
    }
  }

  /* ==========================================================
     BOTONES DE ESTADO
  ========================================================== */

  function botonesEstado(
    alerta: AlertaSanitaria
  ) {
    const botones: {
      estado: EstadoAlerta;
      texto: string;
    }[] = [];

    if (
      alerta.estado ===
      "pendiente"
    ) {
      botones.push(
        {
          estado: "activa",
          texto: "Activar",
        },
        {
          estado: "rechazada",
          texto: "Rechazar",
        },
        {
          estado: "archivada",
          texto: "Archivar",
        }
      );
    }

    if (
      alerta.estado ===
      "activa"
    ) {
      botones.push(
        {
          estado: "finalizada",
          texto: "Finalizar",
        },
        {
          estado: "archivada",
          texto: "Archivar",
        }
      );
    }

    if (
      alerta.estado ===
        "finalizada" ||
      alerta.estado ===
        "rechazada"
    ) {
      botones.push({
        estado: "archivada",
        texto: "Archivar",
      });
    }

    return botones;
  }

  /* ==========================================================
     CARGANDO
  ========================================================== */

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
            color={
              colors.primary
            }
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
            Cargando alertas...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ==========================================================
     INTERFAZ
  ========================================================== */

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
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* =====================================================
            ENCABEZADO
        ===================================================== */}

        <View
          style={styles.header}
        >
          <Pressable
            onPress={() =>
              router.back()
            }
            style={
              styles.backButton
            }
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={
                colors.text
              }
            />
          </Pressable>

          <View
            style={
              styles.headerTextContainer
            }
          >
            <Text
              style={[
                styles.title,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Alertas sanitarias
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Gestiona las alertas de
              salud de Recomedi.
            </Text>
          </View>
        </View>

        {/* =====================================================
            RESUMEN
        ===================================================== */}

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
        >
          <View>
            <Text
              style={[
                styles.summaryNumber,
                {
                  color:
                    colors.primary,
                },
              ]}
            >
              {alertas.length}
            </Text>

            <Text
              style={[
                styles.summaryLabel,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Alertas registradas
            </Text>
          </View>

          <Pressable
            onPress={() => {
              setModoEdicion(
                false
              );
              setAlertaEditando(
                null
              );

              setMostrarFormulario(
                (anterior) =>
                  !anterior
              );
            }}
            style={[
              styles.primaryButton,
              {
                backgroundColor:
                  colors.primary,
              },
            ]}
          >
            <Ionicons
              name={
                mostrarFormulario
                  ? "chevron-up"
                  : "add"
              }
              size={20}
              color="#ffffff"
            />

            <Text
              style={
                styles.primaryButtonText
              }
            >
              {mostrarFormulario
                ? "Cerrar"
                : "Nueva alerta"}
            </Text>
          </Pressable>
        </View>

        {/* =====================================================
            FORMULARIO
        ===================================================== */}

        {mostrarFormulario && (
          <View
            style={[
              styles.formCard,
              {
                backgroundColor:
                  colors.card,
                borderColor:
                  colors.border,
              },
            ]}
          >
            <View
              style={
                styles.formHeader
              }
            >
              <View
                style={{
                  flex: 1,
                  marginRight: 12,
                }}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  {modoEdicion
                    ? "Editar alerta"
                    : "Crear alerta"}
                </Text>

                <Text
                  style={{
                    color:
                      colors.textSecondary,
                    marginTop: 3,
                    fontSize: 13,
                  }}
                >
                  {modoEdicion
                    ? "Modifica los datos de esta alerta."
                    : "Completa la información de la nueva alerta."}
                </Text>
              </View>

              <Pressable
                onPress={
                  limpiarFormulario
                }
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={
                    colors.textSecondary
                  }
                />
              </Pressable>
            </View>

            <TextInput
              value={
                form.titulo
              }
              onChangeText={(valor) =>
                actualizarCampo(
                  "titulo",
                  valor
                )
              }
              placeholder="Título"
              placeholderTextColor={
                colors.textSecondary
              }
              style={[
                styles.input,
                {
                  color:
                    colors.text,
                  borderColor:
                    colors.border,
                },
              ]}
            />

            <TextInput
              value={
                form.descripcion
              }
              onChangeText={(valor) =>
                actualizarCampo(
                  "descripcion",
                  valor
                )
              }
              placeholder="Descripción breve"
              placeholderTextColor={
                colors.textSecondary
              }
              multiline
              style={[
                styles.input,
                styles.textAreaSmall,
                {
                  color:
                    colors.text,
                  borderColor:
                    colors.border,
                },
              ]}
            />

            <TextInput
              value={
                form.contenido
              }
              onChangeText={(valor) =>
                actualizarCampo(
                  "contenido",
                  valor
                )
              }
              placeholder="Contenido completo"
              placeholderTextColor={
                colors.textSecondary
              }
              multiline
              style={[
                styles.input,
                styles.textArea,
                {
                  color:
                    colors.text,
                  borderColor:
                    colors.border,
                },
              ]}
            />

            {/* =================================================
                NIVEL
            ================================================= */}

            <Text
              style={[
                styles.fieldLabel,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Nivel
            </Text>

            <View
              style={styles.chips}
            >
              {(
                [
                  "informativa",
                  "moderada",
                  "alta",
                  "critica",
                ] as NivelAlerta[]
              ).map(
                (nivel) => (
                  <Pressable
                    key={
                      nivel
                    }
                    onPress={() =>
                      setForm(
                        (
                          anterior
                        ) => ({
                          ...anterior,
                          nivel,
                        })
                      )
                    }
                    style={[
                      styles.chip,
                      {
                        borderColor:
                          colors.border,
                        backgroundColor:
                          form.nivel ===
                          nivel
                            ? colors.primary
                            : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          form.nivel ===
                          nivel
                            ? "#ffffff"
                            : colors.text,
                        fontWeight:
                          "600",
                      }}
                    >
                      {textoNivel(
                        nivel
                      )}
                    </Text>
                  </Pressable>
                )
              )}
            </View>

            {/* =================================================
                CATEGORÍA
            ================================================= */}

            <Text
              style={[
                styles.fieldLabel,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Categoría
            </Text>

            <View
              style={
                styles.categorySuggestions
              }
            >
              {CATEGORIAS_SUGERIDAS.map(
                (categoria) => {
                  const seleccionada =
                    normalizarCategoria(
                      form.categoria
                    ) ===
                    categoria;

                  return (
                    <Pressable
                      key={
                        categoria
                      }
                      onPress={() =>
                        actualizarCampo(
                          "categoria",
                          categoria
                        )
                      }
                      style={[
                        styles.categoryChip,
                        {
                          borderColor:
                            seleccionada
                              ? colors.primary
                              : colors.border,

                          backgroundColor:
                            seleccionada
                              ? colors.primary
                              : "transparent",
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color:
                            seleccionada
                              ? "#FFFFFF"
                              : colors.text,
                          fontWeight:
                            "600",
                        }}
                      >
                        {
                          categoria
                        }
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>

            <TextInput
              value={
                form.categoria
              }
              onChangeText={(valor) =>
                actualizarCampo(
                  "categoria",
                  valor
                )
              }
              placeholder="Escribe una categoría personalizada"
              placeholderTextColor={
                colors.textSecondary
              }
              style={[
                styles.input,
                {
                  color:
                    colors.text,
                  borderColor:
                    colors.border,
                },
              ]}
            />

            {/* =================================================
                ZONA
            ================================================= */}

            <TextInput
              value={
                form.zona
              }
              onChangeText={(valor) =>
                actualizarCampo(
                  "zona",
                  valor
                )
              }
              placeholder="Zona o municipio"
              placeholderTextColor={
                colors.textSecondary
              }
              style={[
                styles.input,
                {
                  color:
                    colors.text,
                  borderColor:
                    colors.border,
                },
              ]}
            />

            {/* =================================================
                FUENTE
            ================================================= */}

            <TextInput
              value={
                form.fuente
              }
              onChangeText={(valor) =>
                actualizarCampo(
                  "fuente",
                  valor
                )
              }
              placeholder="Fuente"
              placeholderTextColor={
                colors.textSecondary
              }
              style={[
                styles.input,
                {
                  color:
                    colors.text,
                  borderColor:
                    colors.border,
                },
              ]}
            />

            <TextInput
              value={
                form.fuenteUrl
              }
              onChangeText={(valor) =>
                actualizarCampo(
                  "fuenteUrl",
                  valor
                )
              }
              placeholder="URL de la fuente (opcional)"
              placeholderTextColor={
                colors.textSecondary
              }
              autoCapitalize="none"
              style={[
                styles.input,
                {
                  color:
                    colors.text,
                  borderColor:
                    colors.border,
                },
              ]}
            />

            {/* =================================================
                BOTONES
            ================================================= */}

            <View
              style={
                styles.formButtons
              }
            >
              <Pressable
                onPress={
                  limpiarFormulario
                }
                style={[
                  styles.secondaryButton,
                  {
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      colors.text,
                    fontWeight:
                      "700",
                  }}
                >
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                onPress={
                  guardarAlerta
                }
                disabled={
                  actualizando
                }
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor:
                      colors.primary,
                  },
                  actualizando &&
                    styles.disabledButton,
                ]}
              >
                {actualizando ? (
                  <ActivityIndicator
                    color="#ffffff"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="save-outline"
                      size={19}
                      color="#ffffff"
                    />

                    <Text
                      style={
                        styles.primaryButtonText
                      }
                    >
                      {modoEdicion
                        ? "Guardar cambios"
                        : "Guardar"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* =====================================================
            BUSCADOR
        ===================================================== */}

        <TextInput
          value={
            busqueda
          }
          onChangeText={
            setBusqueda
          }
          placeholder="Buscar alertas..."
          placeholderTextColor={
            colors.textSecondary
          }
          style={[
            styles.searchInput,
            {
              color:
                colors.text,
              borderColor:
                colors.border,
              backgroundColor:
                colors.card,
            },
          ]}
        />

        {/* =====================================================
            FILTROS
        ===================================================== */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.filters
          }
        >
          {(
            [
              "todos",
              "pendiente",
              "activa",
              "finalizada",
              "rechazada",
              "archivada",
            ] as const
          ).map(
            (filtro) => (
              <Pressable
                key={
                  filtro
                }
                onPress={() =>
                  setFiltroEstado(
                    filtro
                  )
                }
                style={[
                  styles.filterChip,
                  {
                    borderColor:
                      colors.border,
                    backgroundColor:
                      filtroEstado ===
                      filtro
                        ? colors.primary
                        : colors.card,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      filtroEstado ===
                      filtro
                        ? "#ffffff"
                        : colors.text,
                    fontWeight:
                      "600",
                  }}
                >
                  {filtro ===
                  "todos"
                    ? "Todas"
                    : textoEstado(
                        filtro
                      )}
                </Text>
              </Pressable>
            )
          )}
        </ScrollView>

        {/* =====================================================
            RESULTADOS
        ===================================================== */}

        <Text
          style={[
            styles.resultsText,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          {alertasFiltradas.length}{" "}
          resultado(s)
        </Text>

        {/* =====================================================
            ALERTAS
        ===================================================== */}

        {alertasFiltradas.length ===
        0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor:
                  colors.card,
                borderColor:
                  colors.border,
              },
            ]}
          >
            <Ionicons
              name="notifications-off-outline"
              size={38}
              color={
                colors.textSecondary
              }
            />

            <Text
              style={[
                styles.emptyTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              No hay alertas
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
              Crea la primera alerta
              sanitaria para verla aquí.
            </Text>
          </View>
        ) : (
          alertasFiltradas.map(
            (alerta) => {
              const abierta =
                esMovil
                  ? alertaAbierta ===
                    alerta.id
                  : true;

              return (
                <View
                  key={
                    alerta.id
                  }
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
                  {/* =================================================
                      CABECERA
                  ================================================= */}

                  <Pressable
                    onPress={() => {
                      if (
                        !esMovil
                      ) {
                        return;
                      }

                      setAlertaAbierta(
                        abierta
                          ? null
                          : alerta.id
                      );
                    }}
                  >
                    <View
                      style={
                        styles.cardTop
                      }
                    >
                      <View
                        style={
                          styles.cardIcon
                        }
                      >
                        <Ionicons
                          name="warning-outline"
                          size={24}
                          color={
                            colors.primary
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.cardTitleContainer
                        }
                      >
                        <Text
                          style={[
                            styles.cardTitle,
                            {
                              color:
                                colors.text,
                            },
                          ]}
                        >
                          {
                            alerta.titulo
                          }
                        </Text>

                        <Text
                          style={[
                            styles.cardSubtitle,
                            {
                              color:
                                colors.textSecondary,
                            },
                          ]}
                        >
                          {normalizarCategoria(
                            alerta.categoria ||
                              ""
                          )}
                          {" · "}
                          {alerta.zona ||
                            "Zona no especificada"}
                        </Text>
                      </View>

                      {esMovil && (
                        <Ionicons
                          name={
                            abierta
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={20}
                          color={
                            colors.textSecondary
                          }
                        />
                      )}
                    </View>

                    <View
                      style={
                        styles.badgesRow
                      }
                    >
                      <View
                        style={[
                          styles.badge,
                          {
                            borderColor:
                              colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color:
                              colors.text,
                            fontWeight:
                              "700",
                          }}
                        >
                          {textoEstado(
                            alerta.estado
                          )}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.badge,
                          {
                            borderColor:
                              colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color:
                              colors.textSecondary,
                            fontWeight:
                              "600",
                          }}
                        >
                          {textoNivel(
                            alerta.nivel
                          )}
                        </Text>
                      </View>
                    </View>
                  </Pressable>

                  {/* =================================================
                      DETALLES
                  ================================================= */}

                  {abierta && (
                    <View
                      style={
                        styles.details
                      }
                    >
                      <Text
                        style={[
                          styles.detailText,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        <Text
                          style={
                            styles.bold
                          }
                        >
                          Descripción:{" "}
                        </Text>

                        {alerta.descripcion ||
                          "Sin descripción"}
                      </Text>

                      <Text
                        style={[
                          styles.detailText,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        <Text
                          style={
                            styles.bold
                          }
                        >
                          Contenido:{" "}
                        </Text>

                        {alerta.contenido ||
                          "Sin contenido"}
                      </Text>

                      <Text
                        style={[
                          styles.detailText,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        <Text
                          style={
                            styles.bold
                          }
                        >
                          Categoría:{" "}
                        </Text>

                        {normalizarCategoria(
                          alerta.categoria ||
                            ""
                        ) ||
                          "Sin categoría"}
                      </Text>

                      <Text
                        style={[
                          styles.detailText,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        <Text
                          style={
                            styles.bold
                          }
                        >
                          Zona:{" "}
                        </Text>

                        {alerta.zona ||
                          "Sin zona"}
                      </Text>

                      <Text
                        style={[
                          styles.detailText,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        <Text
                          style={
                            styles.bold
                          }
                        >
                          Fuente:{" "}
                        </Text>

                        {alerta.fuente ||
                          "Sin fuente"}
                      </Text>

                      <Text
                        style={[
                          styles.detailText,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        <Text
                          style={
                            styles.bold
                          }
                        >
                          Creada:{" "}
                        </Text>

                        {formatearFecha(
                          alerta.fechaCreacion
                        )}
                      </Text>

                      {alerta.fuenteUrl ? (
                        <Text
                          style={[
                            styles.detailText,
                            {
                              color:
                                colors.primary,
                            },
                          ]}
                          selectable
                        >
                          {
                            alerta.fuenteUrl
                          }
                        </Text>
                      ) : null}

                      {/* =================================================
                          ACCIONES
                      ================================================= */}

                      <View
                        style={
                          styles.actions
                        }
                      >
                        <Pressable
                          onPress={() =>
                            abrirEdicion(
                              alerta
                            )
                          }
                          style={[
                            styles.actionButton,
                            {
                              borderColor:
                                colors.border,
                            },
                          ]}
                        >
                          <Ionicons
                            name="create-outline"
                            size={18}
                            color={
                              colors.text
                            }
                          />

                          <Text
                            style={{
                              color:
                                colors.text,
                              fontWeight:
                                "700",
                            }}
                          >
                            Editar
                          </Text>
                        </Pressable>

                        {botonesEstado(
                          alerta
                        ).map(
                          (
                            boton
                          ) => (
                            <Pressable
                              key={
                                boton.estado
                              }
                              onPress={() =>
                                cambiarEstado(
                                  alerta,
                                  boton.estado
                                )
                              }
                              disabled={
                                actualizando
                              }
                              style={[
                                styles.actionButton,
                                {
                                  borderColor:
                                    colors.border,
                                },
                              ]}
                            >
                              <Text
                                style={{
                                  color:
                                    colors.text,
                                  fontWeight:
                                    "700",
                                }}
                              >
                                {
                                  boton.texto
                                }
                              </Text>
                            </Pressable>
                          )
                        )}

                        <Pressable
                          onPress={() =>
                            eliminar(
                              alerta
                            )
                          }
                          disabled={
                            actualizando
                          }
                          style={[
                            styles.deleteButton,
                            {
                              borderColor:
                                colors.border,
                            },
                          ]}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={
                              colors.text
                            }
                          />

                          <Text
                            style={{
                              color:
                                colors.text,
                              fontWeight:
                                "700",
                            }}
                          >
                            Eliminar
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              );
            }
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================================================
   ESTILOS
============================================================ */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },

    content: {
      padding: 20,
      paddingBottom: 40,
    },

    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
      gap: 12,
    },

    loadingText: {
      fontSize: 15,
    },

    header: {
      flexDirection:
        "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 20,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    headerTextContainer: {
      flex: 1,
    },

    title: {
      fontSize: 28,
      fontWeight:
        "800",
    },

    subtitle: {
      marginTop: 4,
      fontSize: 14,
      lineHeight: 20,
    },

    summaryCard: {
      borderWidth: 1,
      borderRadius: 18,
      padding: 18,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 18,
    },

    summaryNumber: {
      fontSize: 28,
      fontWeight:
        "800",
    },

    summaryLabel: {
      fontSize: 13,
      marginTop: 2,
    },

    primaryButton: {
      minHeight: 46,
      borderRadius: 12,
      paddingHorizontal:
        16,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 8,
    },

    primaryButtonText: {
      color: "#ffffff",
      fontWeight:
        "800",
    },

    secondaryButton: {
      minHeight: 46,
      borderRadius: 12,
      paddingHorizontal:
        16,
      borderWidth: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    disabledButton: {
      opacity: 0.6,
    },

    formCard: {
      borderWidth: 1,
      borderRadius: 18,
      padding: 18,
      marginBottom: 18,
    },

    formHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginBottom: 14,
    },

    sectionTitle: {
      fontSize: 19,
      fontWeight:
        "800",
    },

    input: {
      minHeight: 48,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal:
        14,
      marginBottom: 12,
      fontSize: 15,
    },

    textAreaSmall: {
      minHeight: 82,
      textAlignVertical:
        "top",
      paddingTop: 12,
    },

    textArea: {
      minHeight: 130,
      textAlignVertical:
        "top",
      paddingTop: 12,
    },

    fieldLabel: {
      fontSize: 14,
      fontWeight:
        "800",
      marginBottom: 8,
    },

    chips: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 8,
      marginBottom: 14,
    },

    categorySuggestions: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 8,
      marginBottom: 10,
    },

    categoryChip: {
      paddingHorizontal:
        12,
      paddingVertical:
        8,
      borderRadius: 14,
      borderWidth: 1,
    },

    chip: {
      minHeight: 38,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal:
        12,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    formButtons: {
      flexDirection:
        "row",
      justifyContent:
        "flex-end",
      gap: 10,
      marginTop: 4,
    },

    searchInput: {
      minHeight: 48,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal:
        14,
      fontSize: 15,
      marginBottom: 12,
    },

    filters: {
      gap: 8,
      paddingBottom: 10,
    },

    filterChip: {
      minHeight: 38,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal:
        13,
      justifyContent:
        "center",
    },

    resultsText: {
      fontSize: 13,
      marginBottom: 10,
    },

    card: {
      borderWidth: 1,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
    },

    cardTop: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 12,
    },

    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    cardTitleContainer: {
      flex: 1,
      minWidth: 0,
    },

    cardTitle: {
      fontSize: 17,
      fontWeight:
        "800",
    },

    cardSubtitle: {
      marginTop: 3,
      fontSize: 13,
    },

    badgesRow: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 8,
      marginTop: 12,
    },

    badge: {
      borderWidth: 1,
      borderRadius: 9,
      paddingHorizontal:
        10,
      paddingVertical:
        6,
    },

    details: {
      borderTopWidth: 1,
      marginTop: 14,
      paddingTop: 14,
      gap: 8,
    },

    detailText: {
      fontSize: 14,
      lineHeight: 21,
    },

    bold: {
      fontWeight:
        "800",
    },

    actions: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 8,
      marginTop: 10,
    },

    actionButton: {
      minHeight: 40,
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal:
        12,
      justifyContent:
        "center",
      alignItems:
        "center",
      flexDirection:
        "row",
      gap: 6,
    },

    deleteButton: {
      minHeight: 40,
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal:
        12,
      justifyContent:
        "center",
      alignItems:
        "center",
      flexDirection:
        "row",
      gap: 6,
    },

    emptyCard: {
      borderWidth: 1,
      borderRadius: 18,
      padding: 30,
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 8,
      marginTop: 10,
    },

    emptyTitle: {
      fontSize: 18,
      fontWeight:
        "800",
    },

    emptyText: {
      fontSize: 14,
      textAlign:
        "center",
      lineHeight: 20,
    },
  });