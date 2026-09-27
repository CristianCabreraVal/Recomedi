import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Comprueba si la aplicación está ejecutándose
 * dentro de Expo Go.
 */
const esExpoGo =
  Constants.appOwnership === "expo";

/**
 * En Android + Expo Go no utilizaremos
 * expo-notifications.
 *
 * Esto permite seguir desarrollando y probando
 * el resto de Recomedi normalmente.
 */
const puedeUsarNotificaciones =
  !(Platform.OS === "android" && esExpoGo);

/**
 * Tipo para el módulo de notificaciones.
 */
type NotificationsModule = typeof import("expo-notifications");

let Notifications: NotificationsModule | null = null;

/**
 * Carga expo-notifications solamente cuando
 * realmente está disponible.
 */
const obtenerNotifications =
  async (): Promise<NotificationsModule | null> => {
    if (!puedeUsarNotificaciones) {
      return null;
    }

    if (!Notifications) {
      Notifications = await import(
        "expo-notifications"
      );
    }

    return Notifications;
  };

/**
 * Configura el comportamiento de las notificaciones
 * cuando la aplicación está abierta.
 */
const configurarNotificaciones = async () => {
  const modulo =
    await obtenerNotifications();

  if (!modulo) {
    return;
  }

  modulo.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

/**
 * Solicita permisos y prepara el canal
 * de notificaciones en Android.
 */
export const prepararNotificaciones =
  async (): Promise<boolean> => {
    try {
      const modulo =
        await obtenerNotifications();

      /**
       * Expo Go Android:
       * las notificaciones se omiten.
       */
      if (!modulo) {
        console.log(
          "Notificaciones desactivadas en Expo Go Android."
        );

        return false;
      }

      /**
       * Android necesita un canal.
       */
      if (Platform.OS === "android") {
        await modulo.setNotificationChannelAsync(
          "recomedi",
          {
            name: "Recomedi",
            importance:
              modulo.AndroidImportance.HIGH,
            vibrationPattern: [
              0,
              250,
              250,
              250,
            ],
            sound: "default",
          }
        );
      }

      const permisos =
        await modulo.getPermissionsAsync();

      let estado = permisos.status;

      if (estado !== "granted") {
        const nuevosPermisos =
          await modulo.requestPermissionsAsync();

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
 * Envía inmediatamente una notificación
 * con una recomendación de Recomedi.
 */
export const enviarNotificacionRecomendacion =
  async (
    recomendacion: string
  ): Promise<boolean> => {
    try {
      const modulo =
        await obtenerNotifications();

      /**
       * Expo Go Android:
       * no intentamos enviar la notificación.
       */
      if (!modulo) {
        console.log(
          "Notificación omitida porque Recomedi está ejecutándose en Expo Go Android."
        );

        return false;
      }

      const permitido =
        await prepararNotificaciones();

      if (!permitido) {
        console.log(
          "No hay permiso para mostrar notificaciones."
        );

        return false;
      }

      await modulo.scheduleNotificationAsync({
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

/**
 * Configuramos las notificaciones solamente
 * si el entorno las permite.
 */
if (puedeUsarNotificaciones) {
  configurarNotificaciones();
}

