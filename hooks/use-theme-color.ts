/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// importa los componentes de React Native que se van a utilizar en la pantalla
import { ColorSchemeName, useColorScheme } from "react-native";
// Colors: contiene los colores definidos para el tema de Recomedi.
// Se importa desde constants/theme para reutilizar los mismos colores en diferentes partes de la aplicación.
import { Colors } from "@/constants/theme";
// export permite que ese componente sea utilizado por otros archivos por de medio imports.
// function declara una función. En React, una función como esta puede utilizarse como componente cuando devuelve elementos de interfaz.
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme: Exclude<ColorSchemeName, "unspecified"> =
    useColorScheme() === "dark" ? "dark" : "light";

  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  return Colors[theme][colorName];
}