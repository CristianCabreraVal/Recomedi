import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useEffect, useState } from "react";

import { SafeAreaView } from "react-native-safe-area-context";

import { WebView } from "react-native-webview";

import { Ionicons } from "@expo/vector-icons";

import * as Location from "expo-location";

import { buscarCentrosMedicos } from "../../services/mapService";

import { useTheme } from "../../hooks/useTheme";

type Ubicacion = {
  latitude: number;
  longitude: number;
};

export default function Mapa() {
  const { colors } = useTheme();

  const [ubicacion, setUbicacion] =
    useState<Ubicacion | null>(null);

  const [lugares, setLugares] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [buscandoLugares, setBuscandoLugares] =
    useState(false);

  useEffect(() => {
    cargarUbicacion();
  }, []);

  async function cargarUbicacion() {
    try {
      setLoading(true);

      const permiso =
        await Location.requestForegroundPermissionsAsync();

      if (permiso.status !== "granted") {
        Alert.alert(
          "Ubicación",
          "Se necesita permiso de ubicación para encontrar centros médicos cercanos."
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

      const nuevaUbicacion = {
        latitude: lat,
        longitude: lng,
      };

      setUbicacion(nuevaUbicacion);

      setLoading(false);

      buscarHospitales(lat, lng);
    } catch (error) {
      console.log(
        "Error obteniendo ubicación:",
        error
      );

      setLoading(false);

      Alert.alert(
        "Ubicación",
        "No fue posible obtener tu ubicación actual."
      );
    }
  }

  async function buscarHospitales(
    lat: number,
    lng: number
  ) {
    try {
      setBuscandoLugares(true);

      const data = await buscarCentrosMedicos(
        lat,
        lng
      );

      setLugares(data);
    } catch (error) {
      console.log(
        "Error buscando centros médicos:",
        error
      );

      setLugares([]);

      Alert.alert(
        "Centros médicos",
        "No fue posible cargar los centros médicos cercanos."
      );
    } finally {
      setBuscandoLugares(false);
    }
  }

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
      </View>
    );
  }

  const mapaHtml = generarMapaHtml(
    ubicacion,
    lugares
  );

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
        {/* ENCABEZADO */}

        <Text
          style={[
            styles.header,
            {
              color: colors.primary,
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

        {/* MAPA */}

        {ubicacion && (
          <View style={styles.mapContainer}>
            <WebView
              originWhitelist={["*"]}
              source={{
                html: mapaHtml,
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View
                  style={[
                    styles.mapLoading,
                    {
                      backgroundColor:
                        colors.background,
                    },
                  ]}
                >
                  <ActivityIndicator
                    size="large"
                    color={colors.primary}
                  />

                  <Text
                    style={[
                      styles.mapLoadingText,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    Cargando mapa...
                  </Text>
                </View>
              )}
            />
          </View>
        )}

        {/* BÚSQUEDA */}

        {buscandoLugares && (
          <View
            style={[
              styles.searchingCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <ActivityIndicator
              size="small"
              color={colors.primary}
            />

            <Text
              style={[
                styles.searchingText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Buscando centros médicos cercanos...
            </Text>
          </View>
        )}

        {/* LISTA */}

        {!buscandoLugares &&
          lugares.length === 0 && (
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
                    backgroundColor:
                      colors.background,
                  },
                ]}
              >
                <Ionicons
                  name="medical-outline"
                  size={30}
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
                No encontramos centros cercanos
              </Text>

              <Text
                style={[
                  styles.emptyText,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                No hay establecimientos registrados
                cerca de tu ubicación.
              </Text>
            </View>
          )}

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
            {/* CABECERA DE TARJETA */}

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
                  name={obtenerIconoCentro(lugar)}
                  size={25}
                  color={colors.primary}
                />
              </View>

              <View style={styles.cardHeaderText}>
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
                      color: colors.primary,
                    },
                  ]}
                >
                  {obtenerTipoCentro(lugar)}
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
                    color: colors.textSecondary,
                  },
                ]}
              >
                {formatearDistancia(
                  lugar.distanciaKm
                )}
              </Text>
            </View>

            {/* DIRECCIÓN */}

            {obtenerDireccion(lugar) && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
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
                  {obtenerDireccion(lugar)}
                </Text>
              </View>
            )}

            {/* HORARIO */}

            {lugar.tags?.opening_hours && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.infoContent}>
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

            {/* ESPECIALIDAD */}

            {lugar.tags?.speciality && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="medkit-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.infoContent}>
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

            {/* TELÉFONO */}

            {lugar.tags?.phone && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
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

            {/* SITIO WEB */}

            {lugar.tags?.website && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
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

            {/* AVISO */}

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
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================================================
   GENERAR MAPA HTML
============================================================ */

function generarMapaHtml(
  ubicacion: Ubicacion | null,
  lugares: any[]
) {
  if (!ubicacion) {
    return `
      <!DOCTYPE html>
      <html>
        <body>
          <h3>No se pudo obtener la ubicación.</h3>
        </body>
      </html>
    `;
  }

  const lugaresJson = JSON.stringify(lugares).replace(
    /</g,
    "\\u003c"
  );

  return `
<!DOCTYPE html>
<html>
<head>

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  />

  <style>
    html,
    body,
    #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }

    body {
      overflow: hidden;
    }

    .user-marker {
      width: 18px;
      height: 18px;
      background: #2563EB;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow:
        0 2px 8px rgba(0,0,0,0.3);
    }

    .medical-marker {
      width: 18px;
      height: 18px;
      background: #DC2626;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow:
        0 2px 8px rgba(0,0,0,0.3);
    }

    .popup-title {
      font-size: 15px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .popup-type {
      font-size: 12px;
      color: #2563EB;
      margin-bottom: 4px;
    }

    .popup-info {
      font-size: 12px;
      line-height: 18px;
    }
  </style>

</head>

<body>

  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <script>
    const userLatitude = ${ubicacion.latitude};
    const userLongitude = ${ubicacion.longitude};

    const lugares = ${lugaresJson};

    const map = L.map("map", {
      zoomControl: true
    }).setView(
      [userLatitude, userLongitude],
      14
    );

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; OpenStreetMap contributors'
      }
    ).addTo(map);

    /* UBICACIÓN DEL USUARIO */

    const userIcon = L.divIcon({
      className: "",
      html:
        '<div class="user-marker"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    L.marker(
      [userLatitude, userLongitude],
      {
        icon: userIcon
      }
    )
      .addTo(map)
      .bindPopup(
        "<div class='popup-title'>Tu ubicación</div>"
      );

    /* CENTROS MÉDICOS */

    lugares.forEach((lugar) => {
      const latitude = Number(lugar.lat);
      const longitude = Number(lugar.lon);

      if (
        Number.isNaN(latitude) ||
        Number.isNaN(longitude)
      ) {
        return;
      }

      const nombre =
        lugar.tags?.name ||
        lugar.display_name ||
        "Centro médico";

      const tipo =
        obtenerTipoCentroMapa(lugar);

      const distancia =
        formatearDistanciaMapa(
          Number(lugar.distanciaKm || 0)
        );

      const horario =
        lugar.tags?.opening_hours
          ? formatearHorarioMapa(
              lugar.tags.opening_hours
            )
          : "";

      const medicalIcon = L.divIcon({
        className: "",
        html:
          '<div class="medical-marker"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      let popup =
        "<div class='popup-title'>" +
        nombre +
        "</div>";

      popup +=
        "<div class='popup-type'>" +
        tipo +
        "</div>";

      popup +=
        "<div class='popup-info'>" +
        distancia +
        "</div>";

      if (horario) {
        popup +=
          "<div class='popup-info'>🕒 " +
          horario +
          "</div>";
      }

      L.marker(
        [latitude, longitude],
        {
          icon: medicalIcon
        }
      )
        .addTo(map)
        .bindPopup(popup);
    });

    function obtenerTipoCentroMapa(lugar) {
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

    function formatearDistanciaMapa(distancia) {
      if (distancia < 1) {
        return Math.round(
          distancia * 1000
        ) + " m de distancia";
      }

      return distancia.toFixed(1) +
        " km de distancia";
    }

    function formatearHorarioMapa(horario) {
      if (!horario) {
        return "";
      }

      if (
        horario.trim() === "24/7"
      ) {
        return "Abierto las 24 horas";
      }

      return horario
        .replace(/\\bMo-Fr\\b/g, "Lunes a viernes")
        .replace(/\\bMo-Sa\\b/g, "Lunes a sábado")
        .replace(/\\bMo-Su\\b/g, "Lunes a domingo")
        .replace(/\\bSa-Su\\b/g, "Sábado y domingo")
        .replace(/\\bMo\\b/g, "Lun")
        .replace(/\\bTu\\b/g, "Mar")
        .replace(/\\bWe\\b/g, "Mié")
        .replace(/\\bTh\\b/g, "Jue")
        .replace(/\\bFr\\b/g, "Vie")
        .replace(/\\bSa\\b/g, "Sáb")
        .replace(/\\bSu\\b/g, "Dom");
    }

    /* AJUSTAR MAPA */

    setTimeout(() => {
      map.invalidateSize();
    }, 300);

  </script>

</body>
</html>
`;
}

/* ============================================================
   FUNCIONES DE PRESENTACIÓN
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
  const tipo = obtenerTipoCentro(lugar);

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
    .replace(/\bMo-Fr\b/g, "Lunes a viernes")
    .replace(/\bMo-Sa\b/g, "Lunes a sábado")
    .replace(/\bMo-Su\b/g, "Lunes a domingo")
    .replace(/\bSa-Su\b/g, "Sábado y domingo")
    .replace(/\bMo\b/g, "Lun")
    .replace(/\bTu\b/g, "Mar")
    .replace(/\bWe\b/g, "Mié")
    .replace(/\bTh\b/g, "Jue")
    .replace(/\bFr\b/g, "Vie")
    .replace(/\bSa\b/g, "Sáb")
    .replace(/\bSu\b/g, "Dom")
    .replace(/;/g, " · ")
    .replace(/\s*-\s*/g, " – ");
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
    paddingBottom: 40,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 15,
  },

  header: {
    fontSize: 30,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
  },

  mapContainer: {
    height: 320,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
  },

  mapLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  mapLoadingText: {
    marginTop: 10,
    fontSize: 14,
  },

  searchingCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  searchingText: {
    marginLeft: 10,
    fontSize: 13,
  },

  /* ========================================================
     TARJETA DEL CENTRO MÉDICO
  ======================================================== */

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

  /* ========================================================
     VACÍO
  ======================================================== */

  emptyCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },

  emptyIcon: {
    width: 58,
    height: 58,
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