/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
//Componentes visuales de React Native utilizados paraconstruir la pantalla de carga.
import {ActivityIndicator,Image,StyleSheet,Text,View} from "react-native";
// type permite crear un nuevo tipo de datos en TypeScript.
// Props describe las propiedades que puede recibir el componente ExternalLink.
type Props = {
  /*mensaje representa el texto principal de la pantalla.
    ? indica que esta propiedad es opcional.
    string indica que, cuando se utilice, debe contener texto.
   */
  mensaje?: string;
  /*subtitulo funciona de la misma manera, pero corresponde 
  al texto secundario mostrado debajo.*/
  subtitulo?: string;
};
// export default indica que este es el componente principal que se exporta desde este archivo.
export default function PantallaCarga({
// Si no se proporciona mensaje, se utiliza "Cargando..." como valor predeterminado.
  mensaje = "Cargando...",
// Si no se proporciona subtitulo, se utiliza "Preparando tu espacio".
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
/* StyleSheet.create permite agrupar los estilos utilizados por los componentes de este archivo.
 Cada propiedad dentro de styles representa un conjunto de 
 características visuales que puede aplicarse mediante:
 style={styles.nombre}
 */
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