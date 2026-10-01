/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// Notifications: módulo de Expo que permite trabajar con notificaciones del dispositivo.
// Se utiliza para solicitar permisos, configurar notificaciones y responder a eventos relacionados con ellas.
// * as Notifications: importa todo el módulo y le asigna el nombre Notifications.
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