/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
//Animated: proporciona los componentes preparados para trabajar con animaciones.
import Animated from 'react-native-reanimated';
// export permite utilizar este componente desde otros archivos.
// function declara el componente.
export function HelloWave() {
  // return indica qué elemento de interfaz devuelve el componente.
  // En este caso se devuelve un texto animado que contiene el emoji de una mano saludando.
  return (
    <Animated.Text
      style={{
        //Tamaño del animated text
        fontSize: 28,
        // Altura de línea utilizada por texto
        lineHeight: 32,
        // Ajuste vertical de la posición.
        // El valor negativo mueve ligeramente el elemento hacia arriba.
        marginTop: -6,
        /* animationName define el comportamiento de la animación.
         50% indica el punto intermedio de la animación, donde el texto alcanza una rotación de 25 grados.
         */
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },
        //Número de veces que se repite la animación
        animationIterationCount: 4,
        // Duración de la animación
        animationDuration: '300ms',
      }}>
      👋
    </Animated.Text>
  );
}