/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
//BottomTabBarButtonProps: tipo que contiene las propiedades que React Navigation proporciona a un botón de la barra inferior.
import {BottomTabBarButtonProps} from "@react-navigation/bottom-tabs";
//PlatformPressable: componente similar a Pressable, preparado para utilizar el comportamiento de presión adecuado para cada plataforma.
import {PlatformPressable} from "@react-navigation/elements";
// Haptics:contiene las funciones necesarias para producir retroalimentación.
// * as Haptics: importa todo el módulo y le asigna el nombre Haptics.
import * as Haptics from "expo-haptics";
// export permite utilizar este componente desde otros archivos.
// function declara el componente.
// props contiene las propiedades que recibe el botón de la pestaña.
export function HapticTab(props: BottomTabBarButtonProps) {
  /* return indica qué devuelve el componente. En React, lo que se encuentra dentro de return representa la estructura visual que será renderizada.
    PlatformPressable que funciona como botón de una pestaña.
   */
  return (
    <PlatformPressable
      /*{...props}: pasa todas las propiedades recibidas por HapticTab al PlatformPressable.
      De esta forma se conserva el comportamiento normal del botón de navegación.
       */
      {...props}
      //onPressIn se ejecuta cuando el usuario comienza a presionar el botón.
      onPressIn={(ev) => {
        //Comprueba si la aplicación está funcionando en iOS.
        if (
          process.env.EXPO_OS === "ios"
        ) {

          // Produce una respuesta háptica ligera.
          Haptics.impactAsync(
            Haptics.ImpactFeedbackStyle.Light
          );
        }
        // Ejecuta también la función onPressIn original que pudiera haber recibido el botón.
        //?. significa que solo se ejecuta si la función existe.
        props.onPressIn?.(ev);
      }}
    />
  );
}