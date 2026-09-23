import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

/**
 * Configuración de cómo se muestran las notificaciones
 * cuando la aplicación está abierta.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Solicita permiso para mostrar notificaciones
 * y prepara el canal de Android.
 */
export const prepararNotificaciones = async (): Promise<boolean> => {
  try {
    // Android necesita un canal de notificaciones.
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(
        "recomedi",
        {
          name: "Recomedi",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: "default",
        }
      );
    }

    const permisos =
      await Notifications.getPermissionsAsync();

    let estado = permisos.status;

    if (estado !== "granted") {
      const nuevosPermisos =
        await Notifications.requestPermissionsAsync();

      estado = nuevosPermisos.status;
    }

    return estado === "granted";
  } catch (error) {
    console.error(
      "Error preparando notificaciones:",
      error
    );

    return false;
  }
};

/**
 * Muestra inmediatamente una notificación
 * con una recomendación de Recomedi.
 */
export const enviarNotificacionRecomendacion =
  async (recomendacion: string): Promise<boolean> => {
    try {
      const permitido =
        await prepararNotificaciones();

      if (!permitido) {
        console.log(
          "No hay permiso para mostrar notificaciones."
        );

        return false;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Recomedi",
          body: recomendacion,
          sound: "default",
          data: {
            tipo: "recomendacion",
          },
        },

        trigger: null,
      });

      return true;
    } catch (error) {
      console.error(
        "Error enviando notificación:",
        error
      );

      return false;
    }
  };