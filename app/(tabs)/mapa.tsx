import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";

import { useState, useEffect } from "react";

import { SafeAreaView } from "react-native-safe-area-context";

import { WebView } from "react-native-webview";

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
        <Text
          style={[
            styles.header,
            {
              color: colors.primary,
            },
          ]}
        >
          Centros Médicos Cercanos
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          Hospitales y farmacias cerca de ti
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

        {/* BÚSQUEDA DE CENTROS */}

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

        {/* LISTA DE CENTROS */}

        {!buscandoLugares &&
          lugares.length === 0 && (
            <Text
              style={[
                styles.empty,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              No se encontraron centros médicos
              cercanos.
            </Text>
          )}

        {lugares.map((lugar, index) => (
          <View
            key={index}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.cardTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {lugar.display_name ||
                lugar.tags?.name ||
                "Centro Médico"}
            </Text>

            <Text
              style={[
                styles.cardText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {lugar.tags?.amenity ||
                "Hospital o centro de salud"}
            </Text>
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
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    .medical-marker {
      width: 18px;
      height: 18px;
      background: #DC2626;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
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
      .bindPopup("Tu ubicación");

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
        lugar.tags?.amenity ||
        "Centro de salud";

      const medicalIcon = L.divIcon({
        className: "",
        html:
          '<div class="medical-marker"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      L.marker(
        [latitude, longitude],
        {
          icon: medicalIcon
        }
      )
        .addTo(map)
        .bindPopup(
          "<strong>" +
          nombre +
          "</strong><br>" +
          tipo
        );
    });

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
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 5,
    marginBottom: 20,
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

  card: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,

    boxShadow:
      "0px 3px 8px rgba(0, 0, 0, 0.08)",
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  cardText: {
    marginTop: 5,
  },

  empty: {
    textAlign: "center",
    marginTop: 30,
    lineHeight: 20,
  },
});