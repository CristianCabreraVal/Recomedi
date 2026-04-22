import MapView, { Marker } from "react-native-maps";
import { View } from "react-native";

const lugares = [
  {
    id: 1,
    nombre: "Hospital Central",
    lat: 4.711,
    lng: -74.0721,
  },
  {
    id: 2,
    nombre: "Clínica Salud Plus",
    lat: 4.715,
    lng: -74.068,
  },
];

export default function Mapa() {
  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 4.711,
          longitude: -74.0721,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {lugares.map((lugar) => (
          <Marker
            key={lugar.id}
            coordinate={{
              latitude: lugar.lat,
              longitude: lugar.lng,
            }}
            title={lugar.nombre}
          />
        ))}
      </MapView>
    </View>
  );
}