import MapView, {
  Marker,
} from "react-native-maps";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  useState,
  useEffect,
} from "react";
import { buscarCentrosMedicos } from "../../services/mapService";

import * as Location from "expo-location";

export default function Mapa() {
  const [ubicacion, setUbicacion] =
    useState<any>(null);

  const [lugares, setLugares] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  // 📍 Obtener ubicación
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

        // 🔍 Buscar hospitales reales
        buscarHospitales(lat, lng);
      } catch (error) {
        console.log(error);
      }
    };

    cargar();
  }, []);

  // 🏥 API OpenStreetMap
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
      <View style={styles.loading}>
        <ActivityIndicator size="large" />

        <Text>
          Buscando centros médicos...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>
          Centros Médicos Cercanos
        </Text>

        <Text style={styles.subtitle}>
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
  latitude: Number(lugar.lat),
  longitude: Number(lugar.lon),
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
              style={styles.card}
            >
              <Text
                style={styles.cardTitle}
              >
                {lugar.display_name ||
                "Centro Médico"}
              </Text>

              <Text style={styles.cardText}>
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
    backgroundColor: "#F3F4F6",
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
    color: "#2563EB",
  },

  subtitle: {
    marginTop: 5,
    marginBottom: 20,
    color: "#6B7280",
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
    backgroundColor: "#fff",
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
    color: "#6B7280",
  },
});