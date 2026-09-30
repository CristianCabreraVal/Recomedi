/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */

import Constants from "expo-constants";
 // importa los componentes de React Native que se van a utilizar en la pantalla
import { Platform } from "react-native";

import * as Notifications from 'expo-notifications';

export type TipoNotificacion =
  | "noticia"
  | "alerta"
  | "actividad"
  | "hidratacion"
  | "cuidado"
  | "chequeo";

export type PreferenciasNotificaciones = {
  noticias: boolean;
  alertas: boolean;

  actividad: boolean;
  actividadHora: string;

  hidratacion: boolean;
  hidratacionInicio: string;
  hidratacionFin: string;
  hidratacionCadaHoras: number;

  cuidadoPersonal: boolean;
  chequeosMedicos: boolean;
};

export const preferenciasNotificacionesPredeterminadas:
  PreferenciasNotificaciones = {
  noticias: true,
  alertas: true,

  actividad: true,
  actividadHora: "19:00",

  hidratacion: true,
  hidratacionInicio: "08:00",
  hidratacionFin: "20:00",
  hidratacionCadaHoras: 2,

  cuidadoPersonal: true,
  chequeosMedicos: true,
};


/* ============================================================
   OBTENER EXPO NOTIFICATIONS SOLAMENTE EN ANDROID
============================================================ */

let moduloNotificaciones:
  | typeof import("expo-notifications")
  | null = null;

let handlerConfigurado = false;

async function obtenerNotifications() {
  /*
   * IMPORTANTE:
   *
   * En Web no cargamos expo-notifications.
   *
   * Esto evita que el navegador intente inicializar
   * funcionalidades nativas de Android.
   */
  if (Platform.OS !== "android") {
    return null;
  }

  try {
    if (!moduloNotificaciones) {
      moduloNotificaciones =
        await import("expo-notifications");
    }

    /*
     * Configuramos el comportamiento una sola vez.
     */
    if (
      moduloNotificaciones &&
      !handlerConfigurado
    ) {
      moduloNotificaciones.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      handlerConfigurado = true;
    }

    return moduloNotificaciones;
  } catch (error) {
    console.error(
      "No se pudo cargar expo-notifications:",
      error
    );

    return null;
  }
}


/* ============================================================
   EXPO GO
============================================================ */

function estaEnExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}


/* ============================================================
   PREPARAR NOTIFICACIONES
============================================================ */

export async function prepararNotificaciones(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return false;
  }

  try {
    const Notifications =
      await obtenerNotifications();

    if (!Notifications) {
      return false;
    }

    /*
     * El canal debe existir antes de solicitar
     * el token nativo de Android.
     */
    await Notifications.setNotificationChannelAsync(
      "recomedi",
      {
        name: "Recomedi",

        importance:
          Notifications.AndroidImportance.HIGH,

        vibrationPattern: [
          0,
          250,
          250,
          250,
        ],


        enableVibrate: true,

        showBadge: true,
      }
    );

    const permisos =
      await Notifications.getPermissionsAsync();

    if (
      permisos.status === "granted"
    ) {
      return true;
    }

    const resultado =
      await Notifications.requestPermissionsAsync();

    return (
      resultado.status === "granted"
    );
  } catch (error) {
    console.error(
      "Error preparando notificaciones:",
      error
    );

    return false;
  }
}


/* ============================================================
   SOLICITAR PERMISOS
============================================================ */

export async function solicitarPermisosNotificaciones(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return false;
  }

  try {
    const Notifications =
      await obtenerNotifications();

    if (!Notifications) {
      return false;
    }

    const permisos =
      await Notifications.getPermissionsAsync();

    if (
      permisos.status === "granted"
    ) {
      return true;
    }

    const resultado =
      await Notifications.requestPermissionsAsync();

    return (
      resultado.status === "granted"
    );
  } catch (error) {
    console.error(
      "Error solicitando permisos:",
      error
    );

    return false;
  }
}


/* ============================================================
   OBTENER TOKEN FCM
============================================================ */

export async function obtenerTokenFCM(): Promise<string | null> {
  if (Platform.OS !== "android") {
    return null;
  }

  /*
   * En Expo Go no solicitamos push remoto.
   *
   * Las notificaciones push remotas de Android
   * requieren development build.
   */
  if (estaEnExpoGo()) {
    console.log(
      "Expo Go detectado. No se solicitará token FCM."
    );

    return null;
  }

  try {
    const Notifications =
      await obtenerNotifications();

    if (!Notifications) {
      return null;
    }

    /*
     * Asegurar canal antes de obtener el token.
     */
    await Notifications.setNotificationChannelAsync(
      "recomedi",
      {
        name: "Recomedi",

        importance:
          Notifications.AndroidImportance.HIGH,

        vibrationPattern: [
          0,
          250,
          250,
          250,
        ],


        enableVibrate: true,

        showBadge: true,
      }
    );

    const permitido =
      await solicitarPermisosNotificaciones();

    if (!permitido) {
      console.log(
        "No se concedieron permisos de notificaciones."
      );

      return null;
    }

    const dispositivo =
      await Notifications.getDevicePushTokenAsync();

    const token =
      String(dispositivo.data);

    console.log(
      "Token FCM obtenido:",
      token
    );

    return token;

  } catch (error) {
    console.error(
      "Error obteniendo token FCM:",
      error
    );

    return null;
  }
}


/* ============================================================
   NOTIFICACIÓN LOCAL
============================================================ */

export async function enviarNotificacionLocal(
  titulo: string,
  cuerpo: string,
  tipo: TipoNotificacion = "alerta",
): Promise<string | null> {

  if (Platform.OS !== "android") {
    return null;
  }

  try {
    const Notifications =
      await obtenerNotifications();

    if (!Notifications) {
      return null;
    }

    const permitido =
      await solicitarPermisosNotificaciones();

    if (!permitido) {
      console.log(
        "No hay permisos para notificaciones."
      );

      return null;
    }

    const id =
      await Notifications.scheduleNotificationAsync({
        content: {
          title: titulo,
          body: cuerpo,

          data: {
            tipo,
          },
        },

        trigger: null,
      });

    console.log(
      "Notificación local creada:",
      id
    );

    return id;

  } catch (error) {
    console.error(
      "Error enviando notificación local:",
      error
    );

    return null;
  }
}


/* ============================================================
   PRUEBA
============================================================ */

export async function probarNotificacion(): Promise<string | null> {
  return enviarNotificacionLocal(
    "🔔 Recomedi",
    "Las notificaciones están funcionando correctamente.",
    "alerta"
  );
}


/* ============================================================
   RECORDATORIO DIARIO
============================================================ */

export async function programarRecordatorioDiario(
  titulo: string,
  cuerpo: string,
  hora: string,
  tipo: TipoNotificacion,
): Promise<string | null> {

  if (Platform.OS !== "android") {
    return null;
  }

  try {
    const Notifications =
      await obtenerNotifications();

    if (!Notifications) {
      return null;
    }

    const partes =
      hora.split(":");

    const hour =
      Number(partes[0]);

    const minute =
      Number(partes[1]);

    if (
      Number.isNaN(hour) ||
      Number.isNaN(minute) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      console.error(
        "Hora inválida:",
        hora
      );

      return null;
    }

    const id =
      await Notifications.scheduleNotificationAsync({
        content: {
          title: titulo,
          body: cuerpo,
          data: {
            tipo,
          },
        },

        trigger: {
          type:
            Notifications.SchedulableTriggerInputTypes.DAILY,

          hour,
          minute,

          channelId: "recomedi",
        },
      });

    console.log(
      "Recordatorio diario programado:",
      id
    );

    return id;

  } catch (error) {
    console.error(
      "Error programando recordatorio diario:",
      error
    );

    return null;
  }
}


/* ============================================================
   RECORDATORIO POR INTERVALO
============================================================ */

export async function programarRecordatorioIntervalo(
  titulo: string,
  cuerpo: string,
  cadaHoras: number,
  tipo: TipoNotificacion,
): Promise<string | null> {

  if (Platform.OS !== "android") {
    return null;
  }

  try {
    const Notifications =
      await obtenerNotifications();

    if (!Notifications) {
      return null;
    }

    if (
      !Number.isFinite(cadaHoras) ||
      cadaHoras <= 0
    ) {
      return null;
    }

    const segundos =
      Math.max(
        60,
        Math.round(
          cadaHoras * 60 * 60
        )
      );

    const id =
      await Notifications.scheduleNotificationAsync({
        content: {
          title: titulo,
          body: cuerpo,

          data: {
            tipo,
          },
        },

        trigger: {
          type:
            Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,

          seconds: segundos,

          repeats: true,

          channelId: "recomedi",
        },
      });

    console.log(
      "Recordatorio por intervalo programado:",
      id
    );

    return id;

  } catch (error) {
    console.error(
      "Error programando intervalo:",
      error
    );

    return null;
  }
}


/* ============================================================
   ACTIVIDAD
============================================================ */

export async function programarRecordatorioActividad(
  hora = "19:00",
): Promise<string | null> {
  return programarRecordatorioDiario(
    "📝 Actividad diaria",
    "Recuerda registrar tu actividad de hoy en Recomedi.",
    hora,
    "actividad"
  );
}


/* ============================================================
   HIDRATACIÓN
============================================================ */

export async function programarRecordatorioHidratacion(
  cadaHoras = 2,
): Promise<string | null> {
  return programarRecordatorioIntervalo(
    "💧 Hidratación",
    "Recuerda tomar agua y mantenerte hidratado.",
    cadaHoras,
    "hidratacion"
  );
}


/* ============================================================
   CUIDADO PERSONAL
============================================================ */

export async function programarRecordatorioCuidadoPersonal(
  hora = "20:00",
): Promise<string | null> {
  return programarRecordatorioDiario(
    "🧴 Cuidado personal",
    "Recuerda dedicar unos minutos a tu cuidado personal.",
    hora,
    "cuidado"
  );
}


/* ============================================================
   CHEQUEO MÉDICO
============================================================ */

export async function programarRecordatorioChequeo(
  hora = "09:00",
): Promise<string | null> {
  return programarRecordatorioDiario(
    "🩺 Chequeo médico",
    "Recuerda revisar tus próximos controles médicos.",
    hora,
    "chequeo"
  );
}


/* ============================================================
   CANCELAR PROGRAMADAS
============================================================ */

export async function cancelarTodasLasNotificaciones(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return false;
  }

  try {
    const Notifications =
      await obtenerNotifications();

    if (!Notifications) {
      return false;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    return true;

  } catch (error) {
    console.error(
      "Error cancelando notificaciones:",
      error
    );

    return false;
  }
}


/* ============================================================
   OBTENER PROGRAMADAS
============================================================ */

export async function obtenerNotificacionesProgramadas() {
  if (Platform.OS !== "android") {
    return [];
  }

  try {
    const Notifications =
      await obtenerNotifications();

    if (!Notifications) {
      return [];
    }

    return await Notifications.getAllScheduledNotificationsAsync();

  } catch (error) {
    console.error(
      "Error obteniendo notificaciones programadas:",
      error
    );

    return [];
  }
}


/* ============================================================
   LISTENER RECEPCIÓN
============================================================ */

export async function registrarListenerNotificacionRecibida(
  callback: (
    notificacion: unknown
  ) => void,
) {
  if (Platform.OS !== "android") {
    return null;
  }

  try {
    const Notifications =
      await obtenerNotifications();

    if (!Notifications) {
      return null;
    }

    return Notifications.addNotificationReceivedListener(
      (notification) => {
        callback(notification);
      }
    );

  } catch (error) {
    console.error(
      "Error registrando listener:",
      error
    );

    return null;
  }
}


/* ============================================================
   LISTENER RESPUESTA
============================================================ */

export async function registrarListenerNotificacionRespondida(
  callback: (
    respuesta: unknown
  ) => void,
) {
  if (Platform.OS !== "android") {
    return null;
  }

  try {
    const Notifications =
      await obtenerNotifications();

    if (!Notifications) {
      return null;
    }

    return Notifications.addNotificationResponseReceivedListener(
      (response) => {
        callback(response);
      }
    );

  } catch (error) {
    console.error(
      "Error registrando listener de respuesta:",
      error
    );

    return null;
  }
}


/* ============================================================
   ESTADO
============================================================ */

export function obtenerEstadoNotificaciones() {
  return {
    plataforma: Platform.OS,
    esAndroid:
      Platform.OS === "android",

    esExpoGo:
      estaEnExpoGo(),

    puedeUsarPushRemoto:
      Platform.OS === "android" &&
      !estaEnExpoGo(),
  };
}

/* ============================================================
   MANEJAR TOQUE SOBRE NOTIFICACIÓN
============================================================ */

/**
 * Escucha cuando el usuario toca una notificación.
 *
 * Android:
 * - Funciona en la aplicación de desarrollo.
 *
 * Expo Go:
 * - No intenta cargar el módulo nativo de notificaciones remotas.
 *
 * Web:
 * - No hace nada para evitar errores.
 */
type NotificacionPendiente = {
  tipo: string | null;
  data: Record<string, unknown>;
};

const CLAVE_NOTIFICACION_PENDIENTE =
  "@recomedi/notificacion_pendiente";

async function guardarNotificacionPendiente(
  tipo: string | null,
  data: Record<string, unknown>
): Promise<void> {
  try {
    if (Platform.OS !== "android") {
      return;
    }

    const AsyncStorage =
      await import(
        "@react-native-async-storage/async-storage"
      );

    const pendiente: NotificacionPendiente = {
      tipo,
      data,
    };

    await AsyncStorage.default.setItem(
      CLAVE_NOTIFICACION_PENDIENTE,
      JSON.stringify(pendiente)
    );

    console.log(
      "Notificación pendiente guardada."
    );
  } catch (error) {
    console.error(
      "Error guardando notificación pendiente:",
      error
    );
  }
}

export async function consumirNotificacionPendiente(): Promise<NotificacionPendiente | null> {
  try {
    if (Platform.OS !== "android") {
      return null;
    }

    const AsyncStorage =
      await import(
        "@react-native-async-storage/async-storage"
      );

    const valor =
      await AsyncStorage.default.getItem(
        CLAVE_NOTIFICACION_PENDIENTE
      );

    if (!valor) {
      return null;
    }

    await AsyncStorage.default.removeItem(
      CLAVE_NOTIFICACION_PENDIENTE
    );

    const pendiente =
      JSON.parse(valor) as NotificacionPendiente;

    console.log(
      "Notificación pendiente recuperada:",
      pendiente
    );

    return pendiente;
  } catch (error) {
    console.error(
      "Error recuperando notificación pendiente:",
      error
    );

    return null;
  }
}

export async function iniciarEscuchaNotificaciones(
  onNotificacionTocada?: (
    tipo: string | null,
    data: Record<string, unknown>
  ) => void
): Promise<(() => void) | undefined> {
  if (Platform.OS !== "android") {
    return undefined;
  }

  try {
    const Constants =
      await import("expo-constants");

    if (
      Constants.default.appOwnership ===
      "expo"
    ) {
      console.log(
        "Expo Go detectado: escucha de notificaciones remotas omitida."
      );

      return undefined;
    }

    const Notifications =
      await import("expo-notifications");

    const procesarRespuesta = async (
      response: Notifications.NotificationResponse
    ) => {
      try {
        const data =
          response.notification.request.content
            .data as Record<string, unknown>;

        const tipo =
          typeof data?.tipo === "string"
            ? data.tipo
            : null;

        console.log(
          "================================="
        );

        console.log(
          "NOTIFICACIÓN TOCADA"
        );

        console.log(
          "Tipo:",
          tipo
        );

        console.log(
          "Data:",
          data
        );

        console.log(
          "================================="
        );

        /*
         * Siempre guardamos la notificación.
         *
         * Así, si la aplicación necesita mostrar
         * el Login antes de continuar, el destino
         * no se pierde.
         */
        await guardarNotificacionPendiente(
          tipo,
          data
        );

        /*
         * Si hay una función externa y el usuario
         * ya está autenticado, también avisamos.
         *
         * El _layout decidirá si puede navegar
         * inmediatamente.
         */
        if (onNotificacionTocada) {
          onNotificacionTocada(
            tipo,
            data
          );
        }

        await Notifications.clearLastNotificationResponseAsync();
      } catch (error) {
        console.error(
          "Error procesando pulsación de notificación:",
          error
        );
      }
    };

    /*
     * Aplicación abierta mediante una notificación
     * cuando estaba completamente cerrada.
     */
    const respuestaInicial =
      await Notifications.getLastNotificationResponseAsync();

    if (respuestaInicial) {
      await procesarRespuesta(
        respuestaInicial
      );
    }

    /*
     * Notificación tocada mientras la aplicación
     * está abierta o en segundo plano.
     */
    const subscription =
      Notifications.addNotificationResponseReceivedListener(
        (response) => {
          void procesarRespuesta(
            response
          );
        }
      );

    return () => {
      subscription.remove();

      console.log(
        "Listener de notificaciones eliminado."
      );
    };
  } catch (error) {
    console.error(
      "No se pudo iniciar el listener de notificaciones:",
      error
    );

    return undefined;
  }
}