/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// importa los componentes de React Native que se van a utilizar en la pantalla
import { View, type ViewProps } from 'react-native';
// Importación del hook personalizado para obtener los colores del tema actual (claro u oscuro)
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};
// export permite que ese componente sea utilizado por otros archivos por de medio imports.
// function declara una función. En React, una función como esta puede utilizarse como componente cuando devuelve elementos de interfaz.
export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
