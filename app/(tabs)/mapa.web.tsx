import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useState, useEffect } from "react";
import * as Location from "expo-location";

import { buscarCentrosMedicos } from "../../services/mapService";
import { useTheme } from "../../hooks/useTheme";

export default function MapaWeb() {
  const { colors } = useTheme();

  const [ubicacion, setUbicacion] = useState<any>(null);
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
          await Location.getCurrentPositionAsync({});

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

  const abrirMapa = () => {
    if (!ubicacion) return;

    const url =
      `https://www.openstreetmap.org/?mlat=${ubicacion.latitude}` +
      `&mlon=${ubicacion.longitude}` +
      `#map=15/${ubicacion.latitude}/${ubicacion.longitude}`;

    Linking.openURL(url);
  };

  const abrirLugar = (lugar: any) => {
    const lat = Number(lugar.lat);
    const lon = Number(lugar.lon);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return;
    }

    const url =
      `https://www.openstreetmap.org/?mlat=${lat}` +
      `&mlon=${lon}` +
      `#map=18/${lat}/${lon}`;

    Linking.openURL(url);
  };

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
          Buscando centros médicos...
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
      <ScrollView showsVerticalScrollIndicator={false}>
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
            <Text
              style={[
                styles.locationTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              📍 Tu ubicación
            </Text>

            <Text
              style={[
                styles.coordinates,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Latitud: {ubicacion.latitude.toFixed(5)}
            </Text>

            <Text
              style={[
                styles.coordinates,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Longitud: {ubicacion.longitude.toFixed(5)}
            </Text>

            <Pressable
              onPress={abrirMapa}
              style={[
                styles.mapButton,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Text style={styles.mapButtonText}>
                Ver mi ubicación en OpenStreetMap
              </Text>
            </Pressable>
          </View>
        )}

        {/* ERROR */}

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

        {/* RESULTADOS */}

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

        {lugares.length === 0 ? (
          <Text
            style={[
              styles.empty,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            No se encontraron centros médicos cercanos.
          </Text>
        ) : (
          lugares.map((lugar, index) => (
            <View
              key={index}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
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

              {lugar.lat && lugar.lon && (
                <Pressable
                  onPress={() =>
                    abrirLugar(lugar)
                  }
                  style={[
                    styles.placeButton,
                    {
                      borderColor:
                        colors.primary,
                    },
                  ]}
                >
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
                </Pressable>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
  },

  header: {
    fontSize: 30,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 5,
    marginBottom: 20,
  },

  locationCard: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
  },

  locationTitle: {
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 10,
  },

  coordinates: {
    marginTop: 3,
  },

  mapButton: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  mapButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  resultsTitle: {
    fontSize: 21,
    fontWeight: "bold",
    marginBottom: 14,
  },

  card: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,

    elevation: 4,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  cardText: {
    marginTop: 5,
  },

  placeButton: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },

  placeButtonText: {
    fontWeight: "bold",
  },

  errorCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
  },

  errorText: {
    textAlign: "center",
  },

  empty: {
    textAlign: "center",
    marginTop: 20,
  },
});