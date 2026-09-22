import MapView, { Marker } from "react-native-maps";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useState, useEffect } from "react";
import { buscarCentrosMedicos } from "../../services/mapService";

import * as Location from "expo-location";
import { useTheme } from "../../hooks/useTheme";

export default function Mapa() {
  const { colors } = useTheme();

  const [ubicacion, setUbicacion] =
    useState<any>(null);

  const [lugares, setLugares] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  // Obtener ubicación
  useEffect(() => {
    const cargar = async () => {
      try {
        const permiso =
          await Location.requestForegroundPermissionsAsync();

        if (
          permiso.status !== "granted"
        ) {
          alert(
            "Permiso de ubicación denegado"
          );

          setLoading(false);
          return;
        }

        const location =
          await Location.getCurrentPositionAsync(
            {}
          );

        const lat =
          location.coords.latitude;

        const lng =
          location.coords.longitude;

        setUbicacion({
          latitude: lat,
          longitude: lng,
        });

        buscarHospitales(lat, lng);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    cargar();
  }, []);

  // API OpenStreetMap
  const buscarHospitales = async (
    lat: number,
    lng: number
  ) => {
    setLoading(true);

    const data =
      await buscarCentrosMedicos(
        lat,
        lng
      );

    setLugares(data);

    setLoading(false);
  };

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
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text
          style={{
            color: colors.text,
            marginTop: 10,
          }}
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
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
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
              color:
                colors.textSecondary,
            },
          ]}
        >
          Hospitales y farmacias cerca de ti
        </Text>

        {/* MAPA */}

        {ubicacion && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude:
                  ubicacion.latitude,

                longitude:
                  ubicacion.longitude,

                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              {/* Usuario */}

              <Marker
                coordinate={ubicacion}
                title="Tu ubicación"
                pinColor="blue"
              />

              {/* Lugares */}

              {lugares.map(
                (lugar, index) => (
                  <Marker
                    key={index}
                    coordinate={{
                      latitude: Number(
                        lugar.lat
                      ),
                      longitude: Number(
                        lugar.lon
                      ),
                    }}
                    title={
                      lugar.tags?.name ||
                      "Centro médico"
                    }
                    description={
                      lugar.tags?.amenity
                    }
                  />
                )
              )}
            </MapView>
          </View>
        )}

        {/* LISTA */}

        {lugares.map(
          (lugar, index) => (
            <View
              key={index}
              style={[
                styles.card,
                {
                  backgroundColor:
                    colors.card,
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
                  "Centro Médico"}
              </Text>

              <Text
                style={[
                  styles.cardText,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                Hospital o centro de salud
              </Text>
            </View>
          )
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

  header: {
    fontSize: 30,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 5,
    marginBottom: 20,
  },

  mapContainer: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
  },

  map: {
    height: 320,
    width: "100%",
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
});