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