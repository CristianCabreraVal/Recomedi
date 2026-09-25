import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useEffect, useState } from "react";

import { Ionicons } from "@expo/vector-icons";

import * as Location from "expo-location";

import { buscarCentrosMedicos } from "../../services/mapService";

import { useTheme } from "../../hooks/useTheme";

export default function MapaWeb() {
  const { colors } = useTheme();

  const [ubicacion, setUbicacion] =
    useState<{
      latitude: number;
      longitude: number;
    } | null>(null);

  const [lugares, setLugares] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const cargar = async () => {
      try {
        const permiso =
          await Location.requestForegroundPermissionsAsync();

        if (permiso.status !== "granted") {
          setError(
            "No se concedió permiso para acceder a tu ubicación."
          );

          setLoading(false);
          return;
        }

        const location =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

        const lat = location.coords.latitude;
        const lng = location.coords.longitude;

        setUbicacion({
          latitude: lat,
          longitude: lng,
        });

        const data = await buscarCentrosMedicos(
          lat,
          lng
        );

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
        setLoading(false);
      }
    };

    cargar();
  }, []);

  /* ============================================================
     ABRIR UBICACIÓN DEL USUARIO
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
  ============================================================ */

  const abrirLugar = (lugar: any) => {
    const lat = Number(lugar.lat);
    const lon = Number(lugar.lon);

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
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <View
        style={[
          styles.loading,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <View
          style={[
            styles.loadingIcon,
            {
              backgroundColor: colors.card,
            },
          ]}
        >
          <Ionicons
            name="map-outline"
            size={32}
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
          Buscando centros médicos...
        </Text>

        <Text
          style={[
            styles.loadingSubtitle,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          Estamos buscando establecimientos cercanos a tu ubicación.
        </Text>
      </View>
    );
  }

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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ======================================================
            ENCABEZADO
        ====================================================== */}

        <View style={styles.headerContainer}>
          <View
            style={[
              styles.headerIcon,
              {
                backgroundColor: colors.card,
              },
            ]}
          >
            <Ionicons
              name="medical"
              size={30}
              color={colors.primary}
            />
          </View>

          <View style={styles.headerTextContainer}>
            <Text
              style={[
                styles.header,
                {
                  color: colors.text,
                },
              ]}
            >
              Centros médicos cercanos
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Hospitales, clínicas y centros de salud cerca de ti
            </Text>
          </View>
        </View>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error !== "" && (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.errorIcon,
                {
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Ionicons
                name="warning-outline"
                size={24}
                color={colors.primary}
              />
            </View>

            <Text
              style={[
                styles.errorText,
                {
                  color: colors.text,
                },
              ]}
            >
              {error}
            </Text>
          </View>
        )}

        {/* ======================================================
            UBICACIÓN
        ====================================================== */}

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
                    backgroundColor:
                      colors.background,
                  },
                ]}
              >
                <Ionicons
                  name="location"
                  size={23}
                  color={colors.primary}
                />
              </View>

              <View style={styles.locationHeaderText}>
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
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  Ubicación utilizada para encontrar centros cercanos
                </Text>
              </View>
            </View>

            <View style={styles.coordinatesContainer}>
              <View
                style={[
                  styles.coordinateBox,
                  {
                    backgroundColor:
                      colors.background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.coordinateLabel,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  Latitud
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
                    backgroundColor:
                      colors.background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.coordinateLabel,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  Longitud
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
                styles.mapButton,
                {
                  backgroundColor:
                    colors.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Ionicons
                name="map-outline"
                size={19}
                color="#FFFFFF"
              />

              <Text style={styles.mapButtonText}>
                Ver mi ubicación en OpenStreetMap
              </Text>
            </Pressable>
          </View>
        )}

        {/* ======================================================
            RESULTADOS
        ====================================================== */}

        <View style={styles.resultsHeader}>
          <View>
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
                  color:
                    colors.textSecondary,
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
              styles.resultsBadge,
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
                styles.resultsBadgeText,
                {
                  color: colors.primary,
                },
              ]}
            >
              5 km
            </Text>
          </View>
        </View>

        {/* ======================================================
            SIN RESULTADOS
        ====================================================== */}

        {lugares.length === 0 ? (
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
            <View
              style={[
                styles.emptyIcon,
                {
                  backgroundColor:
                    colors.background,
                },
              ]}
            >
              <Ionicons
                name="medical-outline"
                size={34}
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
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              No hay establecimientos médicos registrados
              cerca de tu ubicación.
            </Text>
          </View>
        ) : (
          lugares.map((lugar, index) => (
            <View
              key={lugar.id || index}
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
              {/* CABECERA */}

              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.cardIcon,
                    {
                      backgroundColor:
                        colors.background,
                    },
                  ]}
                >
                  <Ionicons
                    name={obtenerIconoCentro(
                      lugar
                    )}
                    size={26}
                    color={colors.primary}
                  />
                </View>

                <View
                  style={
                    styles.cardHeaderText
                  }
                >
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

                  <Text
                    style={[
                      styles.cardType,
                      {
                        color:
                          colors.primary,
                      },
                    ]}
                  >
                    {obtenerTipoCentro(
                      lugar
                    )}
                  </Text>
                </View>
              </View>

              {/* DISTANCIA */}

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>

                <Text
                  style={[
                    styles.infoText,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  {formatearDistancia(
                    lugar.distanciaKm
                  )}
                </Text>
              </View>

              {/* DIRECCIÓN */}

              {obtenerDireccion(lugar) !==
                "" && (
                <View
                  style={styles.infoRow}
                >
                  <View
                    style={styles.infoIcon}
                  >
                    <Ionicons
                      name="home-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>

                  <Text
                    style={[
                      styles.infoText,
                      {
                        color:
                          colors.textSecondary,
                      },
                    ]}
                  >
                    {obtenerDireccion(
                      lugar
                    )}
                  </Text>
                </View>
              )}

              {/* HORARIO */}

              {lugar.tags
                ?.opening_hours && (
                <View
                  style={styles.infoRow}
                >
                  <View
                    style={styles.infoIcon}
                  >
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>

                  <View
                    style={styles.infoContent}
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
                      Horario registrado
                    </Text>

                    <Text
                      style={[
                        styles.infoValue,
                        {
                          color:
                            colors.text,
                        },
                      ]}
                    >
                      {formatearHorario(
                        lugar.tags
                          .opening_hours
                      )}
                    </Text>
                  </View>
                </View>
              )}

              {/* ESPECIALIDAD */}

              {lugar.tags
                ?.speciality && (
                <View
                  style={styles.infoRow}
                >
                  <View
                    style={styles.infoIcon}
                  >
                    <Ionicons
                      name="medkit-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>

                  <View
                    style={styles.infoContent}
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
                      Especialidad
                    </Text>

                    <Text
                      style={[
                        styles.infoValue,
                        {
                          color:
                            colors.text,
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

              {/* TELÉFONO */}

              {lugar.tags?.phone && (
                <View
                  style={styles.infoRow}
                >
                  <View
                    style={styles.infoIcon}
                  >
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>

                  <Text
                    style={[
                      styles.infoText,
                      {
                        color:
                          colors.textSecondary,
                      },
                    ]}
                  >
                    {lugar.tags.phone}
                  </Text>
                </View>
              )}

              {/* WEB */}

              {lugar.tags?.website && (
                <View
                  style={styles.infoRow}
                >
                  <View
                    style={styles.infoIcon}
                  >
                    <Ionicons
                      name="globe-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>

                  <Text
                    style={[
                      styles.infoText,
                      {
                        color:
                          colors.textSecondary,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {lugar.tags.website}
                  </Text>
                </View>
              )}

              {/* BOTÓN */}

              <Pressable
                onPress={() =>
                  abrirLugar(lugar)
                }
                style={({ pressed }) => [
                  styles.placeButton,
                  {
                    borderColor:
                      colors.primary,
                    backgroundColor:
                      pressed
                        ? colors.background
                        : "transparent",
                  },
                ]}
              >
                <Ionicons
                  name="map-outline"
                  size={18}
                  color={colors.primary}
                />

                <Text
                  style={[
                    styles.placeButtonText,
                    {
                      color:
                        colors.primary,
                    },
                  ]}
                >
                  Ver ubicación en mapa
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
                    borderTopColor:
                      colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={15}
                  color={colors.textSecondary}
                />

                <Text
                  style={[
                    styles.footerText,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  Información registrada en OpenStreetMap
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================================================
   FUNCIONES
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
    )} metros de distancia`;
  }

  return `${distancia.toFixed(
    1
  )} km de distancia`;
}

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
  container: {
    flex: 1,
  },

  scroll: {
    padding: 20,
    paddingBottom: 50,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  loadingIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  loadingSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  headerIcon: {
    width: 55,
    height: 55,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  headerTextContainer: {
    flex: 1,
  },

  header: {
    fontSize: 26,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
  },

  locationCard: {
    padding: 17,
    borderRadius: 19,
    borderWidth: 1,
    marginBottom: 24,

    boxShadow:
      "0px 3px 8px rgba(0, 0, 0, 0.08)",
  },

  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  locationIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  locationHeaderText: {
    flex: 1,
  },

  locationTitle: {
    fontSize: 16,
    fontWeight: "800",
  },

  locationSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  coordinatesContainer: {
    flexDirection: "row",
    gap: 9,
    marginTop: 15,
  },

  coordinateBox: {
    flex: 1,
    padding: 11,
    borderRadius: 12,
  },

  coordinateLabel: {
    fontSize: 10,
    marginBottom: 3,
  },

  coordinateValue: {
    fontSize: 13,
    fontWeight: "700",
  },

  mapButton: {
    marginTop: 15,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  mapButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },

  errorCard: {
    padding: 16,
    borderRadius: 17,
    borderWidth: 1,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  errorIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },

  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  resultsTitle: {
    fontSize: 21,
    fontWeight: "800",
  },

  resultsSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
  },

  resultsBadge: {
    minWidth: 65,
    height: 34,
    paddingHorizontal: 9,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },

  resultsBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },

  card: {
    padding: 17,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,

    boxShadow:
      "0px 3px 8px rgba(0, 0, 0, 0.08)",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  cardHeaderText: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 22,
  },

  cardType: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
  },

  infoIcon: {
    width: 26,
    alignItems: "center",
    marginRight: 8,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    marginBottom: 2,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },

  infoValue: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },

  placeButton: {
    marginTop: 16,
    minHeight: 45,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },

  placeButtonText: {
    fontWeight: "800",
    fontSize: 13,
  },

  cardFooter: {
    marginTop: 15,
    paddingTop: 11,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  footerText: {
    fontSize: 10,
    marginLeft: 5,
    flex: 1,
  },

  emptyCard: {
    padding: 26,
    borderRadius: 20,
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
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 6,
  },
});