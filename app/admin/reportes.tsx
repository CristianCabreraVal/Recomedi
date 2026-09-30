/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
 // importa los componentes de React Native que se van a utilizar en la pantalla
import {ActivityIndicator,Alert,Pressable,ScrollView,StyleSheet,Text,View} from "react-native";

import {useFocusEffect,useRouter} from "expo-router";

import {useCallback,useState} from "react";
// Componente para evitar que el contenido se solape con los bordes físicos del dispositivo (notch, barra de estado)
import { SafeAreaView } from "react-native-safe-area-context";
// Ionicons: permite usar iconos para complementar la interfaz de usuario
import { Ionicons } from "@expo/vector-icons";
// Instancias de autenticación configurada de Firebase
import { auth } from "../../services/firebase";

import {
  cambiarEstadoReporte,
  obtenerReportesAdmin,
} from "../../services/reportesAdminService";

import type {
  EstadoReporte,
  Reporte,
} from "../../services/reportesService";
// Importación del hook personalizado para obtener los colores del tema actual (claro u oscuro)
import { useTheme } from "../../hooks/useTheme";

/* ============================================================
   NOMBRES DE MOTIVOS
============================================================ */

const nombresMotivos: Record<
  string,
  string
> = {
  informacion_incorrecta:
    "Información incorrecta",

  contenido_desactualizado:
    "Contenido desactualizado",

  enlace_no_funciona:
    "Enlace no funciona",

  error_visual:
    "Problema visual",

  alerta_desactualizada:
    "Alerta desactualizada",

  alerta_incorrecta:
    "Información de alerta incorrecta",

  ubicacion_incorrecta:
    "Ubicación incorrecta",

  alerta_no_aplica:
    "La alerta ya no aplica",

  centro_no_existe:
    "El centro ya no existe",

  direccion_incorrecta:
    "Dirección incorrecta",

  telefono_incorrecto:
    "Teléfono incorrecto",

  horario_incorrecto:
    "Horario incorrecto",

  otro: "Otro problema",
};
// export permite utilizar este componente desde otros archivos.
// function declara el componente.
// export default indica que este es el componente principal que se exporta desde este archivo.
export default function ReportesAdmin() {
/*const: declara una variable cuyo valor no se reasigna.
Se utiliza para guardar valores, funciones, resultados de
hooks o referencias que serán utilizados posteriormente por el componente.
*/
  const { colors } = useTheme();
  // useRouter permite al usuario navegar desde botones o eventos hacia otras rutas de la aplicación.
  const router = useRouter();

  const [reportes, setReportes] =
    useState<Reporte[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [filtro, setFiltro] =
    useState<
      EstadoReporte | "todos"
    >("todos");

  const [procesando, setProcesando] =
    useState<string | null>(null);

  /* ==========================================================
     CARGAR
  ========================================================== */

  const cargarReportes = useCallback(
    async () => {
      try {
        setLoading(true);

        const data =
          await obtenerReportesAdmin();

        setReportes(data);
      } catch (error) {
        console.error(
          "Error cargando reportes:",
          error
        );

        Alert.alert(
          "Reportes",
          "No fue posible cargar los reportes."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      cargarReportes();
    }, [cargarReportes])
  );

  /* ==========================================================
     ESTADO
  ========================================================== */

  const cambiarEstado = async (
    reporte: Reporte,
    estado: EstadoReporte
  ) => {
    const usuarioUid =
      auth.currentUser?.uid;

    if (!usuarioUid) {
      return;
    }

    try {
      setProcesando(reporte.id);

      await cambiarEstadoReporte(
        reporte.id,
        estado,
        usuarioUid
      );

      await cargarReportes();
    } catch (error) {
      console.error(
        "Error cambiando estado:",
        error
      );

      Alert.alert(
        "Reportes",
        "No fue posible actualizar el reporte."
      );
    } finally {
      setProcesando(null);
    }
  };

  /* ==========================================================
     FILTRO
  ========================================================== */

  const reportesFiltrados =
    filtro === "todos"
      ? reportes
      : reportes.filter(
          (reporte) =>
            reporte.estado ===
            filtro
        );

  /* ==========================================================
     AGRUPAR
  ========================================================== */

  const grupos = Array.from(
    reportesFiltrados
      .reduce(
        (
          mapa,
          reporte
        ) => {
          const clave =
            reporte.grupoClave ||
            `${reporte.pagina}|${reporte.recursoId}|${reporte.tipo}`;

          const existente =
            mapa.get(clave);

          if (existente) {
            existente.reportes.push(
              reporte
            );

            existente.totalReportes +=
              reporte.vecesReportado;
          } else {
            mapa.set(clave, {
              clave,
              recursoNombre:
                reporte.recursoNombre,
              tipo:
                reporte.tipo,
              pagina:
                reporte.pagina,
              reportes: [reporte],
              totalReportes:
                reporte.vecesReportado,
            });
          }

          return mapa;
        },
        new Map<
          string,
          {
            clave: string;
            recursoNombre: string;
            tipo: string;
            pagina: string;
            reportes: Reporte[];
            totalReportes: number;
          }
        >()
      )
      .values()
  );

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
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
            Cargando reportes...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ==========================================================
     RENDER
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
      >
        {/* ====================================================
            CABECERA
        ==================================================== */}

        <View
          style={styles.header}
        >
          <Pressable
            onPress={() =>
              router.back()
            }
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={colors.text}
            />
          </Pressable>

          <View
            style={
              styles.headerText
            }
          >
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              Reportes
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
              Revisa los problemas
              informados por los
              usuarios.
            </Text>
          </View>
        </View>

        {/* ====================================================
            RESUMEN
        ==================================================== */}

        <View
          style={styles.summaryRow}
        >
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
            <Text
              style={[
                styles.summaryNumber,
                {
                  color:
                    colors.primary,
                },
              ]}
            >
              {reportes.length}
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
              Reportes
            </Text>
          </View>

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
            <Text
              style={[
                styles.summaryNumber,
                {
                  color: "#DC2626",
                },
              ]}
            >
              {
                reportes.filter(
                  (r) =>
                    r.estado ===
                    "pendiente"
                ).length
              }
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
              Pendientes
            </Text>
          </View>
        </View>

        {/* ====================================================
            FILTROS
        ==================================================== */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.filtros
          }
        >
          {(
            [
              ["todos", "Todos"],
              [
                "pendiente",
                "Pendientes",
              ],
              [
                "en_revision",
                "En revisión",
              ],
              [
                "resuelto",
                "Resueltos",
              ],
              [
                "rechazado",
                "Rechazados",
              ],
            ] as const
          ).map(
            ([id, nombre]) => {
              const activo =
                filtro === id;

              return (
                <Pressable
                  key={id}
                  onPress={() =>
                    setFiltro(id)
                  }
                  style={[
                    styles.filtro,
                    {
                      backgroundColor:
                        activo
                          ? colors.primary
                          : colors.card,
                      borderColor:
                        activo
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filtroTexto,
                      {
                        color: activo
                          ? "#FFFFFF"
                          : colors.text,
                      },
                    ]}
                  >
                    {nombre}
                  </Text>
                </Pressable>
              );
            }
          )}
        </ScrollView>

        {/* ====================================================
            GRUPOS
        ==================================================== */}

        {grupos.length === 0 ? (
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
              name="checkmark-circle-outline"
              size={42}
              color={colors.primary}
            />

            <Text
              style={[
                styles.emptyTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              No hay reportes aquí
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
              No encontramos reportes
              con el filtro seleccionado.
            </Text>
          </View>
        ) : (
          grupos.map((grupo) => (
            <View
              key={grupo.clave}
              style={[
                styles.groupCard,
                {
                  backgroundColor:
                    colors.card,
                  borderColor:
                    colors.border,
                },
              ]}
            >
              {/* ENCABEZADO DEL GRUPO */}

              <View
                style={styles.groupHeader}
              >
                <View
                  style={[
                    styles.groupIcon,
                    {
                      backgroundColor:
                        colors.background,
                    },
                  ]}
                >
                  <Ionicons
                    name="flag"
                    size={20}
                    color="#DC2626"
                  />
                </View>

                <View
                  style={
                    styles.groupHeaderText
                  }
                >
                  <Text
                    style={[
                      styles.groupTitle,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                    numberOfLines={3}
                  >
                    {
                      grupo.recursoNombre
                    }
                  </Text>

                  <Text
                    style={[
                      styles.groupReason,
                      {
                        color:
                          colors.primary,
                      },
                    ]}
                  >
                    {nombresMotivos[
                      grupo.tipo
                    ] ||
                      grupo.tipo}
                  </Text>
                </View>
              </View>

              {/* RESUMEN */}

              <View
                style={
                  styles.groupStats
                }
              >
                <Text
                  style={[
                    styles.groupStat,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  {grupo.reportes.length}{" "}
                  usuario
                  {grupo.reportes.length !==
                  1
                    ? "s"
                    : ""}
                </Text>

                <Text
                  style={[
                    styles.groupStat,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  {grupo.totalReportes}{" "}
                  reporte
                  {grupo.totalReportes !==
                  1
                    ? "s"
                    : ""}
                </Text>

                <Text
                  style={[
                    styles.groupStat,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  {grupo.pagina}
                </Text>
              </View>

              {/* REPORTES INDIVIDUALES */}

              {grupo.reportes.map(
                (reporte) => {
                  const ocupado =
                    procesando ===
                    reporte.id;

                  return (
                    <View
                      key={
                        reporte.id
                      }
                      style={[
                        styles.reportItem,
                        {
                          borderTopColor:
                            colors.border,
                        },
                      ]}
                    >
                      <View
                        style={
                          styles.reportHeader
                        }
                      >
                        <Text
                          style={[
                            styles.reportUser,
                            {
                              color:
                                colors.text,
                            },
                          ]}
                        >
                          Usuario
                        </Text>

                        <View
                          style={[
                            styles.estadoBadge,
                            {
                              backgroundColor:
                                obtenerColorEstado(
                                  reporte.estado
                                ),
                            },
                          ]}
                        >
                          <Text
                            style={
                              styles.estadoTexto
                            }
                          >
                            {obtenerNombreEstado(
                              reporte.estado
                            )}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={[
                          styles.reportDescription,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        {
                          reporte.ultimaDescripcion
                        }
                      </Text>

                      <Text
                        style={[
                          styles.reportCount,
                          {
                            color:
                              colors.textSecondary,
                          },
                        ]}
                      >
                        Este usuario ha
                        reportado este
                        problema{" "}
                        {
                          reporte.vecesReportado
                        }{" "}
                        vez
                        {reporte.vecesReportado !==
                        1
                          ? "es"
                          : ""}.
                      </Text>

                      <View
                        style={
                          styles.actions
                        }
                      >
                        <Pressable
                          disabled={
                            ocupado
                          }
                          onPress={() =>
                            cambiarEstado(
                              reporte,
                              "en_revision"
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
                          <Text
                            style={[
                              styles.actionText,
                              {
                                color:
                                  colors.text,
                              },
                            ]}
                          >
                            Revisar
                          </Text>
                        </Pressable>

                        <Pressable
                          disabled={
                            ocupado
                          }
                          onPress={() =>
                            cambiarEstado(
                              reporte,
                              "resuelto"
                            )
                          }
                          style={[
                            styles.actionButton,
                            {
                              backgroundColor:
                                colors.primary,
                              },
                            ]}
                          >
                            {ocupado ? (
                              <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                              />
                            ) : (
                              <Text
                                style={
                                  styles.actionTextWhite
                                }
                              >
                                Resolver
                              </Text>
                            )}
                        </Pressable>

                        <Pressable
                          disabled={
                            ocupado
                          }
                          onPress={() =>
                            cambiarEstado(
                              reporte,
                              "rechazado"
                            )
                          }
                          style={[
                            styles.actionButton,
                            {
                              borderColor:
                                "#DC2626",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.actionText,
                              {
                                color:
                                  "#DC2626",
                              },
                            ]}
                          >
                            Rechazar
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                }
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function obtenerNombreEstado(
  estado: EstadoReporte
) {
  switch (estado) {
    case "pendiente":
      return "Pendiente";

    case "en_revision":
      return "En revisión";

    case "resuelto":
      return "Resuelto";

    case "rechazado":
      return "Rechazado";

    default:
      return estado;
  }
}

function obtenerColorEstado(
  estado: EstadoReporte
) {
  switch (estado) {
    case "pendiente":
      return "#DC2626";

    case "en_revision":
      return "#D97706";

    case "resuelto":
      return "#16A34A";

    case "rechazado":
      return "#6B7280";

    default:
      return "#6B7280";
  }
}
/* StyleSheet.create permite agrupar los estilos utilizados por los componentes de este archivo.
 Cada propiedad dentro de styles representa un conjunto de 
 características visuales que puede aplicarse mediante:
 style={styles.nombre}
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 14,
    paddingBottom: 22,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },

  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },

  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },

  summaryNumber: {
    fontSize: 28,
    fontWeight: "800",
  },

  summaryLabel: {
    fontSize: 13,
    marginTop: 3,
  },

  filtros: {
    gap: 8,
    paddingBottom: 16,
  },

  filtro: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  filtroTexto: {
    fontSize: 13,
    fontWeight: "700",
  },

  emptyCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 30,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 10,
  },

  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },

  groupCard: {
    borderWidth: 1,
    borderRadius: 22,
    marginBottom: 16,
    overflow: "hidden",
  },

  groupHeader: {
    flexDirection: "row",
    padding: 16,
  },

  groupIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  groupHeaderText: {
    flex: 1,
  },

  groupTitle: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21,
  },

  groupReason: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },

  groupStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },

  groupStat: {
    fontSize: 12,
  },

  reportItem: {
    borderTopWidth: 1,
    padding: 16,
  },

  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  reportUser: {
    fontSize: 13,
    fontWeight: "700",
  },

  estadoBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },

  estadoTexto: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  reportDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },

  reportCount: {
    fontSize: 12,
    marginTop: 7,
  },

  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 13,
  },

  actionButton: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  actionText: {
    fontSize: 12,
    fontWeight: "700",
  },

  actionTextWhite: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
});