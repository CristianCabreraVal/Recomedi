import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useEffect, useState } from "react";

import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import * as Location from "expo-location";

import { buscarCentrosMedicos } from "../../services/mapService";

import { useTheme } from "../../hooks/useTheme";

import BotonReportar from "../../components/BotonReportar";

import {
  MOTIVOS_GENERALES,
} from "../../services/reportesService";
/* ============================================================
   TIPO DE UBICACIÓN

   Guarda las coordenadas obtenidas mediante expo-location.
============================================================ */

type Ubicacion = {
  latitude: number;
  longitude: number;
};

/* ============================================================
   PANTALLA WEB DEL MAPA

   Esta versión está destinada a la navegación web.

   La lógica de ubicación y búsqueda se mantiene separada de
   la interfaz para evitar modificar el funcionamiento del
   servicio mapService.
============================================================ */

export default function MapaWeb() {
  const { colors } = useTheme();

  /* ==========================================================
     ESTADOS
  ========================================================== */

  // Coordenadas actuales del usuario.
  const [ubicacion, setUbicacion] =
    useState<Ubicacion | null>(null);

  // Centros médicos encontrados.
  const [lugares, setLugares] =
    useState<any[]>([]);

  // Estado general de carga.
  const [loading, setLoading] =
    useState(true);

  // Estado de búsqueda de establecimientos.
  const [error, setError] =
    useState("");

  /* ==========================================================
     CARGA INICIAL

     Cuando la pantalla se abre:
     1. Solicita permiso de ubicación.
     2. Obtiene las coordenadas actuales.
     3. Guarda la ubicación.
     4. Busca centros médicos cercanos.
  ========================================================== */

  useEffect(() => {
    const cargar = async () => {
      try {
        // Solicita permiso para utilizar la ubicación.
        const permiso =
          await Location.requestForegroundPermissionsAsync();

        // Si el permiso no fue concedido, informamos al usuario.
        if (permiso.status !== "granted") {
          setError(
            "No se concedió permiso para acceder a tu ubicación."
          );

          setLoading(false);
          return;
        }

        // Obtiene la ubicación actual.
        const location =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

        const lat =
          location.coords.latitude;

        const lng =
          location.coords.longitude;

        // Guarda las coordenadas.
        setUbicacion({
          latitude: lat,
          longitude: lng,
        });

        // Busca los centros médicos cercanos.
        const data =
          await buscarCentrosMedicos(
            lat,
            lng
          );

        // Guarda los resultados.
        setLugares(data);
      } catch (error) {
        console.log(
          "Error obteniendo ubicación:",
          error
        );

        setError(
          "No fue posible obtener tu ubicación. Puedes intentar nuevamente."
        );
      } finally {
        // Finaliza el estado de carga.
        setLoading(false);
      }
    };

    cargar();
  }, []);

  /* ============================================================
     ABRIR UBICACIÓN DEL USUARIO

     Abre OpenStreetMap utilizando las coordenadas actuales.
  ============================================================ */

  const abrirMapa = () => {
    if (!ubicacion) {
      return;
    }

    const url =
      `https://www.openstreetmap.org/?mlat=${ubicacion.latitude}` +
      `&mlon=${ubicacion.longitude}` +
      `#map=15/${ubicacion.latitude}/${ubicacion.longitude}`;

    Linking.openURL(url);
  };

  /* ============================================================
     ABRIR CENTRO MÉDICO

     Utiliza las coordenadas de un establecimiento para abrir
     su ubicación específica en OpenStreetMap.
  ============================================================ */

  const abrirLugar = (lugar: any) => {
    const lat =
      Number(lugar.lat);

    const lon =
      Number(lugar.lon);

    // Evita abrir una ubicación inválida.
    if (
      Number.isNaN(lat) ||
      Number.isNaN(lon)
    ) {
      return;
    }

    const url =
      `https://www.openstreetmap.org/?mlat=${lat}` +
      `&mlon=${lon}` +
      `#map=18/${lat}/${lon}`;

    Linking.openURL(url);
  };

  /* ============================================================
     ESTADO DE CARGA

     Se muestra mientras se obtiene la posición del usuario.
  ============================================================ */

  if (loading) {
    return (
      <View
        style={[
          styles.loading,
          {
            backgroundColor:
              colors.background,
          },
        ]}
      >
        <View
          style={[
            styles.loadingIcon,
            {
              backgroundColor:
                colors.card,
            },
          ]}
        >
          <Ionicons
            name="location-outline"
            size={31}
            color={colors.primary}
          />
        </View>

        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text
          style={[
            styles.loadingText,
            {
              color: colors.text,
            },
          ]}
        >
          Obteniendo tu ubicación...
        </Text>

        <Text
          style={[
            styles.loadingSubtitle,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          Estamos preparando el mapa y buscando
          centros médicos cercanos.
        </Text>
      </View>
    );
  }

  /* ============================================================
     INTERFAZ PRINCIPAL
  ============================================================ */

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
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={
          styles.scroll
        }
      >
        <View style={styles.content}>

          {/* ==================================================
              ENCABEZADO
          ================================================== */}

          <View
            style={
              styles.headerContainer
            }
          >
            <View
              style={
                styles.headerTextContainer
              }
            >
              <Text
                style={[
                  styles.eyebrow,
                  {
                    color:
                      colors.primary,
                  },
                ]}
              >
                MAPA DE SALUD
              </Text>

              <Text
                style={[
                  styles.header,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Centros médicos cercanos
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
                Encuentra hospitales, clínicas
                y centros de salud cerca de ti.
              </Text>
            </View>

            <View
              style={[
                styles.headerBadge,
                {
                  backgroundColor:
                    colors.card,
                  borderColor:
                    colors.border,
                },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={16}
                color={colors.primary}
              />

              <Text
                style={[
                  styles.headerBadgeText,
                  {
                    color:
                      colors.primary,
                  },
                ]}
              >
                Cerca de ti
              </Text>
            </View>
          </View>

          {/* ==================================================
              ERROR
          ================================================== */}

          {error !== "" && (
            <View
              style={[
                styles.errorCard,
                {
                  backgroundColor:
                    colors.card,
                  borderColor:
                    colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.errorIcon,
                  {
                    backgroundColor:
                      colors.background,
                  },
                ]}
              >
                <Ionicons
                  name="warning-outline"
                  size={23}
                  color={colors.primary}
                />
              </View>

              <View
                style={
                  styles.errorContent
                }
              >
                <Text
                  style={[
                    styles.errorTitle,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  No fue posible obtener la ubicación
                </Text>

                <Text
                  style={[
                    styles.errorText,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  {error}
                </Text>
              </View>
            </View>
          )}

          {/* ==================================================
              UBICACIÓN
          ================================================== */}
<View style={styles.dashboardGrid}>

  {/* ==================================================
      COLUMNA IZQUIERDA
  ================================================== */}

  <View style={styles.leftColumn}>

    {/* UBICACIÓN */}

    {ubicacion && (
      <View
        style={[
          styles.locationCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.locationHeader}>
          <View
            style={[
              styles.locationIcon,
              {
                backgroundColor: colors.background,
              },
            ]}
          >
            <Ionicons
              name="location"
              size={22}
              color={colors.primary}
            />
          </View>

          <View style={styles.locationTextContainer}>
            <Text
              style={[
                styles.locationTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Tu ubicación
            </Text>

            <Text
              style={[
                styles.locationSubtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Esta posición se utiliza para encontrar centros
              médicos cercanos.
            </Text>
          </View>
        </View>

        <View style={styles.coordinatesContainer}>
          <View
            style={[
              styles.coordinateBox,
              {
                backgroundColor: colors.background,
              },
            ]}
          >
            <Text
              style={[
                styles.coordinateLabel,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              LATITUD
            </Text>

            <Text
              style={[
                styles.coordinateValue,
                {
                  color: colors.text,
                },
              ]}
            >
              {ubicacion.latitude.toFixed(5)}
            </Text>
          </View>

          <View
            style={[
              styles.coordinateBox,
              {
                backgroundColor: colors.background,
              },
            ]}
          >
            <Text
              style={[
                styles.coordinateLabel,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              LONGITUD
            </Text>

            <Text
              style={[
                styles.coordinateValue,
                {
                  color: colors.text,
                },
              ]}
            >
              {ubicacion.longitude.toFixed(5)}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={abrirMapa}
          style={({ pressed }) => [
            styles.locationButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          <Ionicons
            name="map-outline"
            size={18}
            color="#FFFFFF"
          />

          <Text style={styles.locationButtonText}>
            Ver mi ubicación
          </Text>

          <Ionicons
            name="open-outline"
            size={16}
            color="#FFFFFF"
          />
        </Pressable>
      </View>
    )}

  </View>

  {/* ==================================================
      COLUMNA DERECHA
  ================================================== */}

  <View style={styles.rightColumn}>

    {/* CABECERA DE RESULTADOS */}

    <View style={styles.resultsHeader}>
      <View style={styles.resultsHeaderText}>
        <Text
          style={[
            styles.resultsTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Centros encontrados
        </Text>

        <Text
          style={[
            styles.resultsSubtitle,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {lugares.length > 0
            ? `${lugares.length} establecimientos encontrados cerca de ti`
            : "No encontramos establecimientos registrados cerca de ti"}
        </Text>
      </View>

      <View
        style={[
          styles.resultsCount,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.resultsCountNumber,
            {
              color: colors.primary,
            },
          ]}
        >
          {lugares.length}
        </Text>

        <Text
          style={[
            styles.resultsCountLabel,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          lugares
        </Text>
      </View>
    </View>

    {/* SIN RESULTADOS */}

    {lugares.length === 0 && (
      <View
        style={[
          styles.emptyCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.emptyIcon,
            {
              backgroundColor: colors.background,
            },
          ]}
        >
          <Ionicons
            name="medical-outline"
            size={32}
            color={colors.textSecondary}
          />
        </View>

        <Text
          style={[
            styles.emptyTitle,
            {
              color: colors.text,
            },
          ]}
        >
          No se encontraron centros médicos
        </Text>

        <Text
          style={[
            styles.emptyText,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          No hay establecimientos médicos registrados cerca
          de tu ubicación.
        </Text>
      </View>
    )}

    {/* LISTA DE CENTROS */}

    <View style={styles.resultsGrid}>
      {lugares.map((lugar, index) => (
        <View
          key={lugar.id || index}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* CABECERA */}

          <View style={styles.cardHeader}>
            <View
              style={[
                styles.cardIcon,
                {
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Ionicons
                name={obtenerIconoCentro(lugar)}
                size={25}
                color={colors.primary}
              />
            </View>

            <View style={styles.cardHeaderText}>
              <Text
                style={[
                  styles.cardType,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                {obtenerTipoCentro(lugar).toUpperCase()}
              </Text>

              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: colors.text,
                  },
                ]}
                numberOfLines={2}
              >
                {lugar.display_name ||
                  lugar.tags?.name ||
                  "Centro médico"}
              </Text>
            </View>

            <View
              style={[
                styles.distanceBadge,
                {
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Ionicons
                name="navigate-outline"
                size={14}
                color={colors.primary}
              />

              <Text
                style={[
                  styles.distanceText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                {formatearDistancia(lugar.distanciaKm)}
              </Text>
            </View>
          </View>

          {/* INFORMACIÓN */}

          <View style={styles.infoContainer}>

            {obtenerDireccion(lugar) !== "" && (
              <View style={styles.infoRow}>
                <View
                  style={[
                    styles.infoIcon,
                    {
                      backgroundColor: colors.background,
                    },
                  ]}
                >
                  <Ionicons
                    name="home-outline"
                    size={16}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.infoContent}>
                  <Text
                    style={[
                      styles.infoLabel,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    Dirección
                  </Text>

                  <Text
                    style={[
                      styles.infoValue,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    {obtenerDireccion(lugar)}
                  </Text>
                </View>
              </View>
            )}

            {lugar.tags?.opening_hours && (
              <View style={styles.infoRow}>
                <View
                  style={[
                    styles.infoIcon,
                    {
                      backgroundColor: colors.background,
                    },
                  ]}
                >
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.infoContent}>
                  <Text
                    style={[
                      styles.infoLabel,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    Horario
                  </Text>

                  <Text
                    style={[
                      styles.infoValue,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    {formatearHorario(
                      lugar.tags.opening_hours
                    )}
                  </Text>
                </View>
              </View>
            )}

            {lugar.tags?.speciality && (
              <View style={styles.infoRow}>
                <View
                  style={[
                    styles.infoIcon,
                    {
                      backgroundColor: colors.background,
                    },
                  ]}
                >
                  <Ionicons
                    name="medkit-outline"
                    size={16}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.infoContent}>
                  <Text
                    style={[
                      styles.infoLabel,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    Especialidad
                  </Text>

                  <Text
                    style={[
                      styles.infoValue,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    {formatearEspecialidad(
                      lugar.tags.speciality
                    )}
                  </Text>
                </View>
              </View>
            )}

            {lugar.tags?.phone && (
              <View style={styles.infoRow}>
                <View
                  style={[
                    styles.infoIcon,
                    {
                      backgroundColor: colors.background,
                    },
                  ]}
                >
                  <Ionicons
                    name="call-outline"
                    size={16}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.infoContent}>
                  <Text
                    style={[
                      styles.infoLabel,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    Teléfono
                  </Text>

                  <Text
                    style={[
                      styles.infoValue,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    {lugar.tags.phone}
                  </Text>
                </View>
              </View>
            )}

            {lugar.tags?.website && (
              <View style={styles.infoRow}>
                <View
                  style={[
                    styles.infoIcon,
                    {
                      backgroundColor: colors.background,
                    },
                  ]}
                >
                  <Ionicons
                    name="globe-outline"
                    size={16}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.infoContent}>
                  <Text
                    style={[
                      styles.infoLabel,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    Sitio web
                  </Text>

                  <Text
                    style={[
                      styles.infoValue,
                      {
                        color: colors.text,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {lugar.tags.website}
                  </Text>
                </View>
              </View>
            )}

          </View>

          {/* BOTÓN */}

          <Pressable
            onPress={() => abrirLugar(lugar)}
            style={({ pressed }) => [
              styles.placeButton,
              {
                borderColor: colors.primary,
                backgroundColor: pressed
                  ? colors.background
                  : "transparent",
              },
            ]}
          >
            <Ionicons
              name="map-outline"
              size={17}
              color={colors.primary}
            />

            <Text
              style={[
                styles.placeButtonText,
                {
                  color: colors.primary,
                },
              ]}
            >
              Ver ubicación
            </Text>

            <Ionicons
              name="open-outline"
              size={16}
              color={colors.primary}
            />
          </Pressable>

          {/* FUENTE */}

          <View
            style={[
              styles.cardFooter,
              {
                borderTopColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={colors.textSecondary}
            />

            <Text
              style={[
                styles.footerText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Información registrada en OpenStreetMap
            </Text>
          </View>
        </View>
      ))}
    </View>

  </View>

</View>
        </View>
        <BotonReportar
  recursoId="mapa"
  recursoNombre="Mapa de centros médicos"
  motivos={MOTIVOS_GENERALES}
  textoBoton="Reportar un problema"
  descripcionBoton="Cuéntanos si encuentras un problema con el mapa"
/>
      </ScrollView>
    </View>
  );
}

/* ============================================================
   FUNCIONES DE INFORMACIÓN

   Estas funciones únicamente transforman los datos recibidos
   desde mapService para mostrarlos correctamente.
============================================================ */

/* ============================================================
   OBTENER TIPO DE CENTRO
============================================================ */

function obtenerTipoCentro(
  lugar: any
): string {
  if (
    lugar.tags?.amenity === "hospital" ||
    lugar.tags?.healthcare === "hospital"
  ) {
    return "Hospital";
  }

  if (
    lugar.tags?.amenity === "clinic" ||
    lugar.tags?.healthcare === "clinic"
  ) {
    return "Clínica";
  }

  if (
    lugar.tags?.amenity === "doctors" ||
    lugar.tags?.healthcare === "doctor"
  ) {
    return "Consultorio médico";
  }

  if (
    lugar.tags?.amenity === "health_post" ||
    lugar.tags?.healthcare === "health_post"
  ) {
    return "Puesto de salud";
  }

  if (
    lugar.tags?.healthcare === "centre"
  ) {
    return "Centro de salud";
  }

  return "Centro médico";
}

/* ============================================================
   OBTENER ICONO DEL CENTRO
============================================================ */

function obtenerIconoCentro(
  lugar: any
): keyof typeof Ionicons.glyphMap {
  const tipo =
    obtenerTipoCentro(lugar);

  switch (tipo) {
    case "Hospital":
      return "medkit";

    case "Clínica":
      return "medical";

    case "Consultorio médico":
      return "person";

    case "Puesto de salud":
      return "medkit-outline";

    case "Centro de salud":
      return "medical-outline";

    default:
      return "medical-outline";
  }
}

/* ============================================================
   FORMATEAR DISTANCIA

   Menos de 1 km:
   → metros

   1 km o más:
   → kilómetros
============================================================ */

function formatearDistancia(
  distancia: number
): string {
  if (
    typeof distancia !== "number" ||
    Number.isNaN(distancia)
  ) {
    return "Distancia no disponible";
  }

  if (distancia < 1) {
    return `${Math.round(
      distancia * 1000
    )} metros`;
  }

  return `${distancia.toFixed(
    1
  )} km`;
}

/* ============================================================
   OBTENER DIRECCIÓN
============================================================ */

function obtenerDireccion(
  lugar: any
): string {
  const calle =
    lugar.tags?.street || "";

  const numero =
    lugar.tags?.houseNumber || "";

  const ciudad =
    lugar.tags?.city || "";

  return [
    calle,
    numero,
    ciudad,
  ]
    .filter(Boolean)
    .join(" ");
}

/* ============================================================
   FORMATEAR ESPECIALIDAD
============================================================ */

function formatearEspecialidad(
  especialidad: string
): string {
  return especialidad
    .split(";")
    .map((item) =>
      item
        .replace(/_/g, " ")
        .trim()
    )
    .filter(Boolean)
    .join(", ");
}

/* ============================================================
   FORMATEAR HORARIO
============================================================ */

function formatearHorario(
  horario: string
): string {
  if (!horario) {
    return "";
  }

  if (
    horario.trim() === "24/7"
  ) {
    return "Abierto las 24 horas";
  }

  return horario
    .replace(
      /\bMo-Fr\b/g,
      "Lunes a viernes"
    )
    .replace(
      /\bMo-Sa\b/g,
      "Lunes a sábado"
    )
    .replace(
      /\bMo-Su\b/g,
      "Lunes a domingo"
    )
    .replace(
      /\bSa-Su\b/g,
      "Sábado y domingo"
    )
    .replace(
      /\bMo\b/g,
      "Lun"
    )
    .replace(
      /\bTu\b/g,
      "Mar"
    )
    .replace(
      /\bWe\b/g,
      "Mié"
    )
    .replace(
      /\bTh\b/g,
      "Jue"
    )
    .replace(
      /\bFr\b/g,
      "Vie"
    )
    .replace(
      /\bSa\b/g,
      "Sáb"
    )
    .replace(
      /\bSu\b/g,
      "Dom"
    )
    .replace(
      /;/g,
      " · "
    )
    .replace(
      /\s*-\s*/g,
      " – "
    );
}

/* ============================================================
   ESTILOS
============================================================ */

const styles = StyleSheet.create({

  /* ==========================================================
     CONTENEDOR
  ========================================================== */

  container: {
    flex: 1,
  },

  scroll: {
    paddingBottom: 60,
  },

  content: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 22,
  },

  /* ==========================================================
     CARGA
  ========================================================== */

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  loadingIcon: {
    width: 63,
    height: 63,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  loadingSubtitle: {
    marginTop: 6,
    maxWidth: 380,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  /* ==========================================================
     ENCABEZADO
  ========================================================== */

  headerContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  headerTextContainer: {
    flex: 1,
    paddingRight: 15,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: 5,
  },

  header: {
    fontSize: 30,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
  },

  headerBadge: {
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  headerBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },

  /* ==========================================================
     ERROR
  ========================================================== */

  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 17,
    borderWidth: 1,
    marginBottom: 20,
  },

  errorIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  errorContent: {
    flex: 1,
  },

  errorTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 3,
  },

  errorText: {
    fontSize: 12,
    lineHeight: 18,
  },

  /* ==========================================================
     UBICACIÓN
  ========================================================== */

  locationCard: {
    padding: 16,
    borderRadius: 19,
    borderWidth: 1,
    marginBottom: 28,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 2,
  },

  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  locationIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  locationTextContainer: {
    flex: 1,
  },

  locationTitle: {
    fontSize: 16,
    fontWeight: "800",
  },

  locationSubtitle: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 17,
  },

  coordinatesContainer: {
    flexDirection: "row",
    gap: 9,
    marginTop: 14,
  },

  coordinateBox: {
    flex: 1,
    minHeight: 57,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    justifyContent: "center",
  },

  coordinateLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 3,
  },

  coordinateValue: {
    fontSize: 14,
    fontWeight: "800",
  },

  locationButton: {
    minHeight: 44,
    marginTop: 13,
    borderRadius: 12,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  locationButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  /* ==========================================================
     RESULTADOS
  ========================================================== */

  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  resultsHeaderText: {
    flex: 1,
    paddingRight: 12,
  },

  resultsTitle: {
    fontSize: 21,
    fontWeight: "800",
  },

  resultsSubtitle: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
  },

  resultsCount: {
    minWidth: 72,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  resultsCountNumber: {
    fontSize: 17,
    fontWeight: "800",
  },

  resultsCountLabel: {
    marginTop: 1,
    fontSize: 8,
    fontWeight: "700",
  },

  resultsList: {
    width: "100%",
  },

  dashboardGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "flex-start",
  gap: 16,
},

leftColumn: {
  flexGrow: 1,
  flexBasis: 330,
  minWidth: 300,
},

rightColumn: {
  flexGrow: 2,
  flexBasis: 600,
  minWidth: 500,
},

resultsGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 12,
},

  /* ==========================================================
     TARJETA
  ========================================================== */

  card: {
  flexGrow: 1,
  flexBasis: 300,
  minWidth: 280,

  padding: 15,
  borderRadius: 18,
  marginBottom: 12,
  borderWidth: 1,

  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 7,
  shadowOffset: {
    width: 0,
    height: 3,
  },

  elevation: 2,
},

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  cardType: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 3,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },

  distanceBadge: {
    maxWidth: 105,
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 7,
  },

  distanceText: {
    fontSize: 8,
    fontWeight: "800",
  },

  /* ==========================================================
     INFORMACIÓN
  ========================================================== */

  infoContainer: {
    width: "100%",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
  },

  infoIcon: {
    width: 27,
    height: 27,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  infoContent: {
    flex: 1,
    minWidth: 0,
  },

  infoLabel: {
    fontSize: 9,
    fontWeight: "700",
    marginBottom: 1,
  },

  infoValue: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },

  /* ==========================================================
     BOTÓN
  ========================================================== */

  placeButton: {
    minHeight: 43,
    marginTop: 15,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  placeButtonText: {
    fontSize: 12,
    fontWeight: "800",
  },

  /* ==========================================================
     PIE
  ========================================================== */

  cardFooter: {
    marginTop: 13,
    paddingTop: 10,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  footerText: {
    flex: 1,
    marginLeft: 5,
    fontSize: 9,
    lineHeight: 14,
  },

  /* ==========================================================
     SIN RESULTADOS
  ========================================================== */

  emptyCard: {
    paddingHorizontal: 25,
    paddingVertical: 32,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
  },

  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 6,
    maxWidth: 400,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});