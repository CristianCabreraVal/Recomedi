/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
//Componentes visuales de React Native utilizados para construir la pantalla de carga.
import {ActivityIndicator,Alert,Platform,Pressable,ScrollView,
  StyleSheet,Text,TextInput,View} from "react-native";

import {useCallback,useMemo,useState} from "react";

import {useFocusEffect,useRouter} from "expo-router";
// Componente para evitar que el contenido se solape con los bordes físicos del dispositivo (notch, barra de estado)
import {SafeAreaView,} from "react-native-safe-area-context";
// Ionicons: permite usar iconos para complementar la interfaz de usuario
import {Ionicons} from "@expo/vector-icons";
// Instancias de autenticación configurada de Firebase
import {auth} from "../../services/firebase";

import {actualizarCentroMedico,cambiarEstadoCentroMedico,crearCentroMedico,eliminarCentroMedico,obtenerCentrosMedicos,
  type CentroMedicoAdmin,type EstadoCentroMedico,type TipoCentroMedico} from "../../services/centrosMedicosAdminService";
// Importación del hook personalizado para obtener los colores del tema actual (claro u oscuro)
import {useTheme} from "../../hooks/useTheme";
// export permite utilizar este componente desde otros archivos.
// function declara el componente.
// export default indica que este es el componente principal que se exporta desde este archivo.
export default function CentrosAdmin() {
/*const: declara una variable cuyo valor no se reasigna.
Se utiliza para guardar valores, funciones, resultados de
hooks o referencias que serán utilizados posteriormente por el componente.
*/
  const { colors } = useTheme();
  // useRouter permite al usuario navegar desde botones o eventos hacia otras rutas de la aplicación.
  const router =
    useRouter();

  /* ============================================================
     EDICIÓN
  ============================================================ */

  const [modoEdicion, setModoEdicion] =
    useState(false);

  const [centroEditando, setCentroEditando] =
    useState<CentroMedicoAdmin | null>(null);

  /* ============================================================
     DATOS
  ============================================================ */

  const [centros, setCentros] =
    useState<CentroMedicoAdmin[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [actualizando, setActualizando] =
    useState(false);

  /* ============================================================
     BÚSQUEDA Y FILTROS
  ============================================================ */

  const [busqueda, setBusqueda] =
    useState("");

  const [filtroEstado, setFiltroEstado] =
    useState<
      "todos" | EstadoCentroMedico
    >("todos");

  /* ============================================================
     FORMULARIO
  ============================================================ */

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [centroAbierto, setCentroAbierto] =
    useState<string | null>(null);

  const [form, setForm] = useState({
    nombre: "",
    tipo: "hospital" as TipoCentroMedico,
    direccion: "",
    telefono: "",
    website: "",
    horario: "",
    servicios: "",
    lat: "",
    lon: "",
    fuente: "",
  });

  /* ============================================================
     CARGAR CENTROS
  ============================================================ */

  useFocusEffect(
    useCallback(() => {
      cargarCentros();
    }, [])
  );

  async function cargarCentros() {
    try {
      setCargando(true);

      const datos =
        await obtenerCentrosMedicos();

      setCentros(datos);
    } catch (error) {
      console.error(
        "Error cargando centros médicos:",
        error
      );

      mostrarMensaje(
        "Centros médicos",
        "No fue posible cargar los centros médicos."
      );
    } finally {
      setCargando(false);
    }
  }

  /* ============================================================
     ABRIR EDICIÓN
  ============================================================ */

  function abrirEdicion(
    centro: CentroMedicoAdmin
  ) {
    setCentroEditando(
      centro
    );

    setForm({
      nombre:
        centro.nombre,

      tipo:
        centro.tipo,

      direccion:
        centro.direccion,

      telefono:
        centro.telefono,

      website:
        centro.website,

      horario:
        centro.horario,

      servicios:
        centro.servicios.join(", "),

      lat:
        String(centro.lat),

      lon:
        String(centro.lon),

      fuente:
        centro.fuente,
    });

    setModoEdicion(true);
    setMostrarFormulario(true);

    /*
     * Cerramos cualquier detalle
     * abierto para centrarnos en editar.
     */
    setCentroAbierto(null);
  }

  /* ============================================================
     MENSAJES
  ============================================================ */

  function mostrarMensaje(
    titulo: string,
    mensaje: string
  ) {
    if (Platform.OS === "web") {
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

  /* ============================================================
     ACTUALIZAR CAMPO
  ============================================================ */

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

  /* ============================================================
     GUARDAR CENTRO
     
     Sirve para:
     - Crear
     - Editar
  ============================================================ */

  async function guardarCentro() {
    const usuarioUid =
      auth.currentUser?.uid;

    if (!usuarioUid) {
      mostrarMensaje(
        "Sesión",
        "No hay un usuario administrador autenticado."
      );

      return;
    }

    const lat =
      Number(
        form.lat.replace(
          ",",
          "."
        )
      );

    const lon =
      Number(
        form.lon.replace(
          ",",
          "."
        )
      );

    /* --------------------------------------------------------
       VALIDAR CAMPOS
    -------------------------------------------------------- */

    if (
      !form.nombre.trim() ||
      !form.direccion.trim() ||
      !form.fuente.trim()
    ) {
      mostrarMensaje(
        "Datos incompletos",
        "Completa nombre, dirección y fuente."
      );

      return;
    }

    /* --------------------------------------------------------
       VALIDAR COORDENADAS
    -------------------------------------------------------- */

    if (
      Number.isNaN(lat) ||
      Number.isNaN(lon)
    ) {
      mostrarMensaje(
        "Coordenadas",
        "Latitud y longitud deben ser números válidos."
      );

      return;
    }

    try {
      setActualizando(
        true
      );

      /* ======================================================
         EDITAR
      ====================================================== */

      if (
        modoEdicion &&
        centroEditando
      ) {
        await actualizarCentroMedico(
          centroEditando.id,
          {
            nombre:
              form.nombre.trim(),

            tipo:
              form.tipo,

            direccion:
              form.direccion.trim(),

            telefono:
              form.telefono.trim(),

            website:
              form.website.trim(),

            horario:
              form.horario.trim(),

            servicios:
              form.servicios
                .split(",")
                .map(
                  (item) =>
                    item.trim()
                )
                .filter(Boolean),

            lat,
            lon,

            fuente:
              form.fuente.trim(),
          },
          usuarioUid
        );

        limpiarFormulario();

        await cargarCentros();

        mostrarMensaje(
          "Centro actualizado",
          "Los cambios se guardaron correctamente."
        );

        return;
      }

      /* ======================================================
         CREAR
      ====================================================== */

      await crearCentroMedico({
        nombre:
          form.nombre.trim(),

        tipo:
          form.tipo,

        direccion:
          form.direccion.trim(),

        telefono:
          form.telefono.trim(),

        website:
          form.website.trim(),

        horario:
          form.horario.trim(),

        servicios:
          form.servicios
            .split(",")
            .map(
              (item) =>
                item.trim()
            )
            .filter(Boolean),

        lat,
        lon,

        fuente:
          form.fuente.trim(),

        estado:
          "pendiente",

        creadoPor:
          usuarioUid,
      });

      limpiarFormulario();

      await cargarCentros();

      mostrarMensaje(
        "Centro creado",
        "El centro médico fue guardado como pendiente."
      );
    } catch (error: any) {
      console.error(
    "ERROR COMPLETO GUARDANDO CENTRO:",
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
    `Código: ${error?.code || "desconocido"}\n\n${
      error?.message || "No fue posible guardar el centro médico."
    }`
  );
    } finally {
      setActualizando(
        false
      );
    }
  }

  /* ============================================================
     LIMPIAR FORMULARIO
  ============================================================ */

  function limpiarFormulario() {
    setForm({
      nombre: "",
      tipo: "hospital",
      direccion: "",
      telefono: "",
      website: "",
      horario: "",
      servicios: "",
      lat: "",
      lon: "",
      fuente: "",
    });

    setModoEdicion(
      false
    );

    setCentroEditando(
      null
    );

    setMostrarFormulario(
      false
    );
  }

  /* ============================================================
     CAMBIAR ESTADO
  ============================================================ */

  async function cambiarEstado(
    centro: CentroMedicoAdmin,
    nuevoEstado: EstadoCentroMedico
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

      await cambiarEstadoCentroMedico(
        centro.id,
        nuevoEstado,
        usuarioUid
      );

      await cargarCentros();
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

  /* ============================================================
     ELIMINAR
  ============================================================ */

  async function eliminar(
    centro: CentroMedicoAdmin
  ) {
    const confirmado =
      await confirmarAccion(
        "Eliminar centro médico",
        `¿Deseas eliminar "${centro.nombre}"?`
      );

    if (!confirmado) {
      return;
    }

    try {
      setActualizando(
        true
      );

      await eliminarCentroMedico(
        centro.id
      );

      setCentroAbierto(
        null
      );

      await cargarCentros();
    } catch (error) {
      console.error(
        "Error eliminando centro:",
        error
      );

      mostrarMensaje(
        "Error",
        "No fue posible eliminar el centro médico."
      );
    } finally {
      setActualizando(
        false
      );
    }
  }

  /* ============================================================
     CONFIRMAR
  ============================================================ */

  async function confirmarAccion(
    titulo: string,
    mensaje: string
  ): Promise<boolean> {
    if (Platform.OS === "web") {
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

  /* ============================================================
     FILTRAR CENTROS
  ============================================================ */

  const centrosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return centros.filter(
        (centro) => {
          const coincideEstado =
            filtroEstado ===
              "todos" ||
            centro.estado ===
              filtroEstado;

          const coincideTexto =
            !texto ||
            centro.nombre
              .toLowerCase()
              .includes(texto) ||
            centro.direccion
              .toLowerCase()
              .includes(texto) ||
            centro.tipo
              .toLowerCase()
              .includes(texto);

          return (
            coincideEstado &&
            coincideTexto
          );
        }
      );
    }, [
      centros,
      busqueda,
      filtroEstado,
    ]);

  /* ============================================================
     TEXTOS
  ============================================================ */

  function textoTipo(
    tipo: TipoCentroMedico
  ) {
    switch (tipo) {
      case "hospital":
        return "Hospital";

      case "clinica":
        return "Clínica";

      case "centro_salud":
        return "Centro de salud";

      case "consultorio":
        return "Consultorio";

      case "laboratorio":
        return "Laboratorio";

      default:
        return "Otro";
    }
  }

  function textoEstado(
    estado: EstadoCentroMedico
  ) {
    switch (estado) {
      case "pendiente":
        return "Pendiente";

      case "activo":
        return "Activo";

      case "oculto":
        return "Oculto";

      default:
        return estado;
    }
  }

  /* ============================================================
     CARGANDO
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
            Cargando centros médicos...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ============================================================
     INTERFAZ
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
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* ======================================================
            CABECERA
        ====================================================== */}

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
              Centros médicos
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
              Gestiona los centros
              médicos administrados
              por Recomedi.
            </Text>
          </View>
        </View>

        {/* ======================================================
            RESUMEN
        ====================================================== */}

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
              {centros.length}
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
              Centros registrados
            </Text>
          </View>

          <Pressable
            onPress={() => {
              setModoEdicion(
                false
              );

              setCentroEditando(
                null
              );

              setMostrarFormulario(
                true
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
              name="add"
              size={20}
              color="#ffffff"
            />

            <Text
              style={
                styles.primaryButtonText
              }
            >
              Nuevo centro
            </Text>
          </Pressable>
        </View>

        {/* ======================================================
            FORMULARIO CREAR / EDITAR
        ====================================================== */}

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
                  ? "Editar centro médico"
                  : "Registrar centro"}
              </Text>

              <Pressable
                onPress={
                  limpiarFormulario
                }
                disabled={
                  actualizando
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

            {/* NOMBRE */}

            <TextInput
              value={form.nombre}
              onChangeText={(valor) =>
                actualizarCampo(
                  "nombre",
                  valor
                )
              }
              placeholder="Nombre"
              placeholderTextColor={
                colors.textSecondary
              }
              editable={
                !actualizando
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

            {/* TIPO */}

            <Text
              style={[
                styles.fieldLabel,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Tipo
            </Text>

            <View
              style={
                styles.chips
              }
            >
              {(
                [
                  "hospital",
                  "clinica",
                  "centro_salud",
                  "consultorio",
                  "laboratorio",
                  "otro",
                ] as TipoCentroMedico[]
              ).map(
                (tipo) => (
                  <Pressable
                    key={tipo}
                    onPress={() =>
                      setForm(
                        (anterior) => ({
                          ...anterior,
                          tipo,
                        })
                      )
                    }
                    disabled={
                      actualizando
                    }
                    style={[
                      styles.chip,
                      {
                        borderColor:
                          colors.border,

                        backgroundColor:
                          form.tipo ===
                          tipo
                            ? colors.primary
                            : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          form.tipo ===
                          tipo
                            ? "#ffffff"
                            : colors.text,
                        fontWeight:
                          "600",
                      }}
                    >
                      {textoTipo(
                        tipo
                      )}
                    </Text>
                  </Pressable>
                )
              )}
            </View>

            {/* DIRECCIÓN */}

            <TextInput
              value={
                form.direccion
              }
              onChangeText={(valor) =>
                actualizarCampo(
                  "direccion",
                  valor
                )
              }
              placeholder="Dirección"
              placeholderTextColor={
                colors.textSecondary
              }
              editable={
                !actualizando
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

            {/* TELÉFONO */}

            <TextInput
              value={
                form.telefono
              }
              onChangeText={(valor) =>
                actualizarCampo(
                  "telefono",
                  valor
                )
              }
              placeholder="Teléfono"
              placeholderTextColor={
                colors.textSecondary
              }
              keyboardType="phone-pad"
              editable={
                !actualizando
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

            {/* WEBSITE */}

            <TextInput
              value={
                form.website
              }
              onChangeText={(valor) =>
                actualizarCampo(
                  "website",
                  valor
                )
              }
              placeholder="Sitio web"
              placeholderTextColor={
                colors.textSecondary
              }
              autoCapitalize="none"
              editable={
                !actualizando
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

            {/* HORARIO */}

            <TextInput
              value={
                form.horario
              }
              onChangeText={(valor) =>
                actualizarCampo(
                  "horario",
                  valor
                )
              }
              placeholder="Horario"
              placeholderTextColor={
                colors.textSecondary
              }
              editable={
                !actualizando
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

            {/* SERVICIOS */}

            <TextInput
              value={
                form.servicios
              }
              onChangeText={(valor) =>
                actualizarCampo(
                  "servicios",
                  valor
                )
              }
              placeholder="Servicios separados por coma"
              placeholderTextColor={
                colors.textSecondary
              }
              editable={
                !actualizando
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

            {/* COORDENADAS */}

            <View
              style={
                styles.coordinatesRow
              }
            >
              <TextInput
                value={form.lat}
                onChangeText={(valor) =>
                  actualizarCampo(
                    "lat",
                    valor
                  )
                }
                placeholder="Latitud"
                placeholderTextColor={
                  colors.textSecondary
                }
                keyboardType="decimal-pad"
                editable={
                  !actualizando
                }
                style={[
                  styles.input,
                  styles.coordinateInput,
                  {
                    color:
                      colors.text,
                    borderColor:
                      colors.border,
                  },
                ]}
              />

              <TextInput
                value={form.lon}
                onChangeText={(valor) =>
                  actualizarCampo(
                    "lon",
                    valor
                  )
                }
                placeholder="Longitud"
                placeholderTextColor={
                  colors.textSecondary
                }
                keyboardType="decimal-pad"
                editable={
                  !actualizando
                }
                style={[
                  styles.input,
                  styles.coordinateInput,
                  {
                    color:
                      colors.text,
                    borderColor:
                      colors.border,
                  },
                ]}
              />
            </View>

            {/* FUENTE */}

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
              editable={
                !actualizando
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

            {/* BOTONES FORMULARIO */}

            <View
              style={
                styles.formButtons
              }
            >
              <Pressable
                onPress={
                  limpiarFormulario
                }
                disabled={
                  actualizando
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
                  guardarCentro
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

        {/* ======================================================
            BÚSQUEDA
        ====================================================== */}

        <TextInput
          value={
            busqueda
          }
          onChangeText={
            setBusqueda
          }
          placeholder="Buscar centros..."
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

        {/* ======================================================
            FILTROS
        ====================================================== */}

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
              "activo",
              "oculto",
            ] as const
          ).map(
            (filtro) => (
              <Pressable
                key={filtro}
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
                    ? "Todos"
                    : textoEstado(
                        filtro
                      )}
                </Text>
              </Pressable>
            )
          )}
        </ScrollView>

        {/* ======================================================
            RESULTADOS
        ====================================================== */}

        <Text
          style={[
            styles.resultsText,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          {
            centrosFiltrados.length
          }{" "}
          resultado(s)
        </Text>

        {/* ======================================================
            SIN RESULTADOS
        ====================================================== */}

        {centrosFiltrados.length ===
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
              name="medical-outline"
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
              No hay centros
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
              Registra un centro
              médico para verlo
              aquí.
            </Text>
          </View>
        ) : (
          /* ====================================================
             LISTA
          ==================================================== */

          centrosFiltrados.map(
            (centro) => {
              const abierto =
                centroAbierto ===
                centro.id;

              return (
                <View
                  key={
                    centro.id
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
                  {/* ------------------------------------------------
                      CABECERA
                  ------------------------------------------------ */}

                  <Pressable
                    onPress={() =>
                      setCentroAbierto(
                        abierto
                          ? null
                          : centro.id
                      )
                    }
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
                          name="medical-outline"
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
                            centro.nombre
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
                          {textoTipo(
                            centro.tipo
                          )}
                        </Text>
                      </View>

                      <Ionicons
                        name={
                          abierto
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={20}
                        color={
                          colors.textSecondary
                        }
                      />
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
                            centro.estado
                          )}
                        </Text>
                      </View>
                    </View>
                  </Pressable>

                  {/* ------------------------------------------------
                      DETALLES
                  ------------------------------------------------ */}

                  {abierto && (
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
                          Dirección:{" "}
                        </Text>

                        {centro.direccion ||
                          "Sin dirección"}
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
                          Teléfono:{" "}
                        </Text>

                        {centro.telefono ||
                          "Sin teléfono"}
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
                          Horario:{" "}
                        </Text>

                        {centro.horario ||
                          "Sin horario"}
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
                          Coordenadas:{" "}
                        </Text>

                        {centro.lat},{" "}
                        {centro.lon}
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
                          Servicios:{" "}
                        </Text>

                        {centro
                          .servicios
                          .length >
                        0
                          ? centro.servicios.join(
                              ", "
                            )
                          : "No registrados"}
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

                        {centro.fuente ||
                          "Sin fuente"}
                      </Text>

                      {centro.website ? (
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
                            centro.website
                          }
                        </Text>
                      ) : null}

                      {/* ==================================================
                          ACCIONES
                      ================================================== */}

                      <View
                        style={
                          styles.actions
                        }
                      >
                        {/* EDITAR */}

                        <Pressable
                          onPress={() =>
                            abrirEdicion(
                              centro
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

                        {/* PENDIENTE */}

                        {centro.estado ===
                          "pendiente" && (
                          <>
                            <Pressable
                              onPress={() =>
                                cambiarEstado(
                                  centro,
                                  "activo"
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
                                Activar
                              </Text>
                            </Pressable>

                            <Pressable
                              onPress={() =>
                                cambiarEstado(
                                  centro,
                                  "oculto"
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
                                Ocultar
                              </Text>
                            </Pressable>
                          </>
                        )}

                        {/* ACTIVO */}

                        {centro.estado ===
                          "activo" && (
                          <Pressable
                            onPress={() =>
                              cambiarEstado(
                                centro,
                                "oculto"
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
                              Ocultar
                            </Text>
                          </Pressable>
                        )}

                        {/* OCULTO */}

                        {centro.estado ===
                          "oculto" && (
                          <Pressable
                            onPress={() =>
                              cambiarEstado(
                                centro,
                                "activo"
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
                              Activar
                            </Text>
                          </Pressable>
                        )}

                        {/* ELIMINAR */}

                        <Pressable
                          onPress={() =>
                            eliminar(
                              centro
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
/* StyleSheet.create permite agrupar los estilos utilizados por los componentes de este archivo.
 Cada propiedad dentro de styles representa un conjunto de 
 características visuales que puede aplicarse mediante:
 style={styles.nombre}
 */
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
      alignItems:
        "center",
      gap: 12,
    },

    loadingText: {
      fontSize: 15,
    },

    header: {
      flexDirection:
        "row",
      alignItems:
        "center",
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
      fontWeight: "800",
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

      gap: 12,

      marginBottom: 18,
    },

    summaryNumber: {
      fontSize: 28,
      fontWeight: "800",
    },

    summaryLabel: {
      fontSize: 13,
      marginTop: 2,
    },

    primaryButton: {
      minHeight: 46,
      borderRadius: 12,
      paddingHorizontal: 16,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 8,
    },

    primaryButtonText: {
      color:
        "#ffffff",

      fontWeight:
        "800",
    },

    secondaryButton: {
      minHeight: 46,
      borderRadius: 12,
      paddingHorizontal: 16,

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
      fontWeight: "800",
    },

    input: {
      minHeight: 48,

      borderWidth: 1,

      borderRadius: 12,

      paddingHorizontal: 14,

      marginBottom: 12,

      fontSize: 15,
    },

    fieldLabel: {
      fontSize: 14,
      fontWeight: "800",
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

    chip: {
      minHeight: 38,

      borderRadius: 10,

      borderWidth: 1,

      paddingHorizontal: 12,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    coordinatesRow: {
      flexDirection:
        "row",

      gap: 10,
    },

    coordinateInput: {
      flex: 1,
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

      paddingHorizontal: 14,

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

      paddingHorizontal: 13,

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
    },

    cardTitle: {
      fontSize: 17,
      fontWeight: "800",
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

      paddingHorizontal: 10,

      paddingVertical: 6,
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
      fontWeight: "800",
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

      paddingHorizontal: 12,

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

      paddingHorizontal: 12,

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
      fontWeight: "800",
    },

    emptyText: {
      fontSize: 14,

      textAlign:
        "center",

      lineHeight: 20,
    },
  });