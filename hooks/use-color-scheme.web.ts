/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
//Hooks de React utilizados para manejar
//useEffect: ejecutar procesos al cargar la pantalla.
//useState: guardar información que cambia durante el uso.
import { useEffect, useState } from 'react';
// useColorScheme permite conocer si el dispositivo está utilizando un tema claro u oscuro.
// as useRNColorScheme: cambia el nombre de la función importada a useRNColorScheme para diferenciarla de una función propia del proyecto que puede tener el mismo nombre.
import { useColorScheme as useRNColorScheme } from 'react-native';
// Para la versión web, el tema debe comprobarse nuevamente después de que el componente se haya cargado en el cliente.
// export permite que ese componente sea utilizado por otros archivos por de medio imports.
// function declara una función. En React, una función como esta puede utilizarse como componente cuando devuelve elementos de interfaz.
export function useColorScheme() {
// useState: permite almacenar el estado hasHydrated.
// useEffect: permite ejecutar una acción después de que el componente se haya renderizado.
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
