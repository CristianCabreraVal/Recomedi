/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
//Hooks de React utilizados para manejar:
//useEffect: ejecutar procesos al cargar la pantalla.
//useState: guardar información que cambia durante el uso.
import { useEffect, useState } from "react";
 // importa los componentes de React Native que se van a utilizar en la pantalla
import {FlatList,StyleSheet,Text,useWindowDimensions,View,} from "react-native";
// Ionicons: permite usar iconos para complementar la interfaz de usuario
import { Ionicons } from "@expo/vector-icons";
// Importación del hook personalizado para obtener los colores del tema actual (claro u oscuro)
import { useTheme } from "../../hooks/useTheme";
// Importa la funcion de un boton para reportar
import BotonReportar from "../../components/BotonReportar";

import {MOTIVOS_ALERTAS,} from "../../services/reportesService";

import {escucharAlertasActivas,type AlertaPublica,} from "../../services/alertasPublicasService";
// export default indica que este es el componente principal que se exporta desde este archivo.
export default function Alerts() {
/*const: declara una variable cuyo valor no se reasigna.
Se utiliza para guardar valores, funciones, resultados de
hooks o referencias que serán utilizados posteriormente por el componente.
*/  // useTheme obtiene los colores utilizados actualmente por la aplicación 
  const { colors } = useTheme();

  const { width } =
    useWindowDimensions();

  // A partir de 900 px se utiliza una distribución de dos columnas.
  const pantallaAncha =
    width >= 900;

  const [alertas, setAlertas] =
    useState<AlertaPublica[]>([]);

  const [cargandoAlertas, setCargandoAlertas] =
    useState(true);

  const [errorAlertas, setErrorAlertas] =
    useState(false);

  /* ==========================================================
     ESCUCHAR ALERTAS ACTIVAS
  ========================================================== */

  useEffect(() => {
    setCargandoAlertas(true);
    setErrorAlertas(false);

    const unsubscribe =
      escucharAlertasActivas(
        (nuevasAlertas) => {
          setAlertas(nuevasAlertas);
          setCargandoAlertas(false);
          setErrorAlertas(false);
        },
        () => {
          setAlertas([]);
          setCargandoAlertas(false);
          setErrorAlertas(true);
        }
      );

    return unsubscribe;
  }, []);

  /* ==========================================================
     NIVEL DE ALERTA
  ========================================================== */

  const obtenerNivel = (
    level: string
  ) => {
    const nivelNormalizado =
      level.toLowerCase();

    if (
      nivelNormalizado === "critica" ||
      nivelNormalizado === "crítica"
    ) {
      return {
        icon: "warning" as const,
        iconColor: "#DC2626",
        iconBackground: "#FEE2E2",
        textColor: "#DC2626",
        indicatorWidth:
          "100%" as const,
      };
    }

    if (
      nivelNormalizado === "alta" ||
      nivelNormalizado === "alto"
    ) {
      return {
        icon: "warning" as const,
        iconColor: "#EA580C",
        iconBackground: "#FFEDD5",
        textColor: "#EA580C",
        indicatorWidth:
          "85%" as const,
      };
    }

    if (
      nivelNormalizado === "moderada" ||
      nivelNormalizado === "moderado"
    ) {
      return {
        icon: "alert-circle" as const,
        iconColor: "#D97706",
        iconBackground: "#FEF3C7",
        textColor: "#D97706",
        indicatorWidth:
          "66%" as const,
      };
    }

    return {
      icon: "information-circle" as const,
      iconColor: "#2563EB",
      iconBackground: "#DBEAFE",
      textColor: "#2563EB",
      indicatorWidth:
        "40%" as const,
    };
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      {/* =====================================================
          ENCABEZADO
      ===================================================== */}

      <View
        style={
          styles.headerContainer
        }
      >
        <View
          style={
            styles.headerTitleRow
          }
        >
          <View
            style={[
              styles.headerIcon,
              {
                backgroundColor:
                  colors.card,
              },
            ]}
          >
            <Ionicons
              name="warning"
              size={25}
              color="#DC2626"
            />
          </View>

          <View
            style={
              styles.headerTextContainer
            }
          >
            <Text
              style={[
                styles.header,
                {
                  color:
                    colors.text,
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Alertas Epidemiológicas
            </Text>

            <Text
              style={[
                styles.subheader,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              Información sanitaria relevante
              y recomendaciones.
            </Text>
          </View>
        </View>
      </View>

      {/* =====================================================
          LISTA DE ALERTAS
      ===================================================== */}

      <FlatList
        data={alertas}
        keyExtractor={(item) =>
          item.id
        }
        showsVerticalScrollIndicator={
          true
        }
        contentContainerStyle={[
          styles.listContent,
          pantallaAncha &&
            styles.listContentWide,
        ]}
        columnWrapperStyle={
          pantallaAncha
            ? styles.columnWrapperWide
            : undefined
        }
        numColumns={
          pantallaAncha ? 2 : 1
        }
        renderItem={({ item }) => {
          const nivel =
            obtenerNivel(item.nivel);

          return (
            <View
              style={[
                styles.card,
                {
                  backgroundColor:
                    colors.card,
                },
                pantallaAncha &&
                  styles.cardWide,
              ]}
            >
              {/* =================================================
                  CABECERA DE ESTADO
              ================================================= */}

              <View
                style={styles.cardTop}
              >
                <View
                  style={[
                    styles.alertIcon,
                    {
                      backgroundColor:
                        nivel.iconBackground,
                    },
                  ]}
                >
                  <Ionicons
                    name={nivel.icon}
                    size={25}
                    color={
                      nivel.iconColor
                    }
                  />
                </View>

                <View
                  style={[
                    styles.levelBadge,
                    {
                      backgroundColor:
                        nivel.iconBackground,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.levelDot,
                      {
                        backgroundColor:
                          nivel.iconColor,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.level,
                      {
                        color:
                          nivel.textColor,
                      },
                    ]}
                  >
                    {item.nivel}
                  </Text>
                </View>
              </View>

              {/* =================================================
                  INDICADOR DE NIVEL
              ================================================= */}

              <View
                style={styles.riskSection}
              >
                <View
                  style={
                    styles.riskLabelRow
                  }
                >
                  <Text
                    style={[
                      styles.riskLabel,
                      {
                        color:
                          colors.textSecondary,
                      },
                    ]}
                  >
                    NIVEL DE ALERTA
                  </Text>

                  <Text
                    style={[
                      styles.riskValue,
                      {
                        color:
                          nivel.textColor,
                      },
                    ]}
                  >
                    {item.nivel.toUpperCase()}
                  </Text>
                </View>

                <View
                  style={[
                    styles.riskTrack,
                    {
                      backgroundColor:
                        colors.background,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.riskProgress,
                      {
                        width:
                          nivel.indicatorWidth,
                        backgroundColor:
                          nivel.iconColor,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* =================================================
                  INFORMACIÓN PRINCIPAL
              ================================================= */}

              <Text
                style={[
                  styles.title,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                {item.titulo}
              </Text>

              {/* CATEGORÍA */}

              {item.categoria ? (
                <View
                  style={styles.infoRow}
                >
                  <View
                    style={[
                      styles.infoIcon,
                      {
                        backgroundColor:
                          colors.background,
                      },
                    ]}
                  >
                    <Ionicons
                      name="pricetag-outline"
                      size={17}
                      color={
                        colors.primary
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.infoTextContainer
                    }
                  >
                    <Text
                      style={[
                        styles.infoLabel,
                        {
                          color:
                            colors.textSecondary,
                        },
                      ]}
                    >
                      CATEGORÍA
                    </Text>

                    <Text
                      style={[
                        styles.location,
                        {
                          color:
                            colors.text,
                        },
                      ]}
                    >
                      {item.categoria}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* =================================================
                  UBICACIÓN
              ================================================= */}

              <View
                style={styles.infoRow}
              >
                <View
                  style={[
                    styles.infoIcon,
                    {
                      backgroundColor:
                        colors.background,
                    },
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={17}
                    color={
                      colors.primary
                    }
                  />
                </View>

                <View
                  style={
                    styles.infoTextContainer
                  }
                >
                  <Text
                    style={[
                      styles.infoLabel,
                      {
                        color:
                          colors.textSecondary,
                      },
                    ]}
                  >
                    UBICACIÓN
                  </Text>

                  <Text
                    style={[
                      styles.location,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    {item.zona}
                  </Text>
                </View>
              </View>

              {/* =================================================
                  RECOMENDACIÓN SANITARIA
              ================================================= */}

              <View
                style={[
                  styles.recommendationBox,
                  {
                    backgroundColor:
                      colors.background,
                  },
                ]}
              >
                <View
                  style={[
                    styles.recommendationIcon,
                    {
                      backgroundColor:
                        colors.card,
                    },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={
                      colors.primary
                    }
                  />
                </View>

                <View
                  style={
                    styles.recommendationContent
                  }
                >
                  <Text
                    style={[
                      styles.recommendationLabel,
                      {
                        color:
                          colors.textSecondary,
                      },
                    ]}
                  >
                    RECOMENDACIÓN
                  </Text>

                  <Text
                    style={[
                      styles.recommendation,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    {item.contenido ||
  item.descripcion ||
  "No hay una recomendación disponible."}
                  </Text>
                </View>
              </View>

              {/* =================================================
                  INDICADOR FINAL
              ================================================= */}

              <View
                style={
                  styles.cardFooter
                }
              >
                <View
                  style={
                    styles.liveIndicator
                  }
                >
                  <View
                    style={[
                      styles.liveDot,
                      {
                        backgroundColor:
                          nivel.iconColor,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.liveText,
                      {
                        color:
                          colors.textSecondary,
                      },
                    ]}
                  >
                    ALERTA ACTIVA
                  </Text>
                </View>

                <Ionicons
                  name="pulse-outline"
                  size={20}
                  color={
                    nivel.iconColor
                  }
                />
              </View>
            </View>
          );
        }}

        ListFooterComponent={
          <BotonReportar
            recursoId="alertas-epidemiologicas"
            recursoNombre="Alertas Epidemiológicas"
            motivos={MOTIVOS_ALERTAS}
            textoBoton="Reportar un problema"
            descripcionBoton="Ayúdanos a mejorar las alertas de esta pantalla"
          />
        }

        ListEmptyComponent={
          <Text
            style={[
              styles.empty,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            {cargandoAlertas
              ? "Cargando alertas..."
              : errorAlertas
              ? "No se pudieron cargar las alertas."
              : "No hay alertas activas."}
          </Text>
        }
      />
    </View>
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
      paddingHorizontal: 20,
      paddingTop: 15,
    },

    headerContainer: {
      marginBottom: 20,
    },

    headerTitleRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    headerTextContainer: {
      flex: 1,
      minWidth: 0,
    },

    headerIcon: {
      width: 50,
      height: 50,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },

    header: {
      fontSize: 30,
      fontWeight: "800",
    },

    subheader: {
      fontSize: 14,
      marginTop: 5,
    },

    listContent: {
      paddingBottom: 35,
    },

    listContentWide: {
      maxWidth: 1180,
      width: "100%",
      alignSelf: "center",
    },

    columnWrapperWide: {
      gap: 16,
    },

    card: {
      padding: 20,
      borderRadius: 28,
      marginBottom: 16,

      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 14,

      shadowOffset: {
        width: 0,
        height: 6,
      },

      elevation: 4,
    },

    cardWide: {
      flex: 1,
    },

    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 18,
    },

    alertIcon: {
      width: 52,
      height: 52,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },

    levelBadge: {
      flexDirection: "row",
      alignItems: "center",

      paddingHorizontal: 12,
      paddingVertical: 8,

      borderRadius: 999,
    },

    levelDot: {
      width: 7,
      height: 7,
      borderRadius: 999,
      marginRight: 7,
    },

    level: {
      fontWeight: "800",
      fontSize: 12,
    },

    riskSection: {
      marginBottom: 18,
    },

    riskLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 7,
    },

    riskLabel: {
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 1,
    },

    riskValue: {
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 0.8,
    },

    riskTrack: {
      width: "100%",
      height: 6,
      borderRadius: 999,
      overflow: "hidden",
    },

    riskProgress: {
      height: "100%",
      borderRadius: 999,
    },

    title: {
      fontSize: 24,
      fontWeight: "900",
      marginBottom: 14,
    },

    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },

    infoIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },

    infoTextContainer: {
      flex: 1,
      minWidth: 0,
    },

    infoLabel: {
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 0.8,
      marginBottom: 2,
    },

    location: {
      fontSize: 14,
      fontWeight: "700",
    },

    recommendationBox: {
      flexDirection: "row",
      alignItems: "center",

      padding: 14,

      borderRadius: 18,
    },

    recommendationIcon: {
      width: 38,
      height: 38,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },

    recommendationContent: {
      flex: 1,
      minWidth: 0,
      marginLeft: 10,
    },

    recommendationLabel: {
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 0.8,
      marginBottom: 3,
    },

    recommendation: {
      fontSize: 13,
      lineHeight: 20,
      fontWeight: "600",
    },

    cardFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",

      marginTop: 16,
      paddingTop: 12,

      borderTopWidth: 1,
      borderTopColor: "#E2E8F0",
    },

    liveIndicator: {
      flexDirection: "row",
      alignItems: "center",
    },

    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 999,
      marginRight: 7,
    },

    liveText: {
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1,
    },

    empty: {
      textAlign: "center",
      marginTop: 40,
    },
  });