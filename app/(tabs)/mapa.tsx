import MapView, { Marker } from "react-native-maps";
import { View } from "react-native";

export default function MapScreen() {
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
        <Marker
          coordinate={{ latitude: 4.711, longitude: -74.0721 }}
          title="Centro de salud"
        />
      </MapView>
    </View>
  );
}