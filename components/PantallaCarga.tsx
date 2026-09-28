import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  mensaje?: string;
  subtitulo?: string;
};

export default function PantallaCarga({
  mensaje = "Cargando...",
  subtitulo = "Preparando tu espacio",
}: Props) {
  return (
    <View style={styles.container}>
      <Image
        source={require(
          "../assets/images/Recomedi.jpeg"
        )}
        style={styles.logo}
        resizeMode="contain"
      />

      <ActivityIndicator
        size="large"
        color="#2563EB"
        style={styles.spinner}
      />

      <Text style={styles.title}>
        {mensaje}
      </Text>

      <Text style={styles.subtitle}>
        {subtitulo}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,

    backgroundColor: "#FFFFFF",

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 30,

    zIndex: 9999,
    elevation: 9999,
  },

  logo: {
    width: 280,
    height: 110,

    marginBottom: 20,
  },

  spinner: {
    marginBottom: 14,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",

    color: "#2563EB",

    marginBottom: 5,

    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,

    color: "#64748B",

    textAlign: "center",
  },
});