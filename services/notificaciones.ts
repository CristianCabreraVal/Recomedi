/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */

import * as Notifications from "expo-notifications";

export async function enviarNotificacion(
  mensaje: string
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Recomedi",
      body: mensaje,
    },
    trigger: null,
  });
}