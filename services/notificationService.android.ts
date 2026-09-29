import Constants from "expo-constants";
import * as Notifications from "expo-notifications";

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

export const preferenciasNotificacionesPredeterminadas: PreferenciasNotificaciones =
  {
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

function estaEnExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function prepararNotificaciones(): Promise<boolean> {
  try {
    await Notifications.setNotificationChannelAsync("recomedi", {
      name: "Recomedi",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });

    const permisos =
      await Notifications.getPermissionsAsync();

    if (permisos.status === "granted") {
      return true;
    }

    const nuevosPermisos =
      await Notifications.requestPermissionsAsync();

    return nuevosPermisos.status === "granted";
  } catch (error) {
    console.error(
      "Error preparando notificaciones:",
      error
    );

    return false;
  }
}

export async function solicitarPermisosNotificaciones(): Promise<boolean> {
  try {
    const permisos =
      await Notifications.getPermissionsAsync();

    if (permisos.status === "granted") {
      return true;
    }

    const resultado =
      await Notifications.requestPermissionsAsync();

    return resultado.status === "granted";
  } catch (error) {
    console.error(
      "Error solicitando permisos:",
      error
    );

    return false;
  }
}

export async function obtenerTokenFCM(): Promise<string | null> {
  try {
    /**
     * Expo Go no tiene push remoto de Android.
     */
    if (estaEnExpoGo()) {
      console.log(
        "Expo Go detectado. No se solicitará token FCM."
      );

      return null;
    }

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

    const token = String(dispositivo.data);

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

export async function enviarNotificacionLocal(
  titulo: string,
  cuerpo: string,
  tipo: TipoNotificacion = "alerta",
): Promise<string | null> {
  try {
    const permitido =
      await solicitarPermisosNotificaciones();

    if (!permitido) {
      console.log(
        "No hay permiso para mostrar notificaciones."
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
      "Notificación local enviada:",
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

export async function probarNotificacion(): Promise<string | null> {
  return enviarNotificacionLocal(
    "🔔 Recomedi",
    "Las notificaciones están funcionando correctamente.",
    "alerta",
  );
}

export async function programarRecordatorioDiario(
  titulo: string,
  cuerpo: string,
  hora: string,
  tipo: TipoNotificacion,
): Promise<string | null> {
  try {
    const [horaTexto, minutoTexto] =
      hora.split(":");

    const hour = Number(horaTexto);
    const minute = Number(minutoTexto);

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

    return id;
  } catch (error) {
    console.error(
      "Error programando recordatorio:",
      error
    );

    return null;
  }
}

export async function programarRecordatorioIntervalo(
  titulo: string,
  cuerpo: string,
  cadaHoras: number,
  tipo: TipoNotificacion,
): Promise<string | null> {
  try {
    if (
      !Number.isFinite(cadaHoras) ||
      cadaHoras <= 0
    ) {
      return null;
    }

    const segundos =
      Math.max(60, Math.round(cadaHoras * 3600));

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

    return id;
  } catch (error) {
    console.error(
      "Error programando intervalo:",
      error
    );

    return null;
  }
}

export async function programarRecordatorioActividad(
  hora: string = "19:00",
): Promise<string | null> {
  return programarRecordatorioDiario(
    "📝 Actividad diaria",
    "Recuerda registrar tu actividad de hoy en Recomedi.",
    hora,
    "actividad",
  );
}

export async function programarRecordatorioHidratacion(
  cadaHoras: number = 2,
): Promise<string | null> {
  return programarRecordatorioIntervalo(
    "💧 Hidratación",
    "Recuerda tomar agua y mantenerte hidratado.",
    cadaHoras,
    "hidratacion",
  );
}

export async function programarRecordatorioCuidadoPersonal(
  hora: string = "20:00",
): Promise<string | null> {
  return programarRecordatorioDiario(
    "🧴 Cuidado personal",
    "Recuerda dedicar unos minutos a tu cuidado personal.",
    hora,
    "cuidado",
  );
}

export async function programarRecordatorioChequeo(
  hora: string = "09:00",
): Promise<string | null> {
  return programarRecordatorioDiario(
    "🩺 Chequeo médico",
    "Recuerda revisar tus próximos controles médicos.",
    hora,
    "chequeo",
  );
}

export async function cancelarTodasLasNotificaciones(): Promise<boolean> {
  try {
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

export async function obtenerNotificacionesProgramadas() {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error(
      "Error obteniendo notificaciones programadas:",
      error
    );

    return [];
  }
}

export async function registrarListenerNotificacionRecibida(
  callback: (notificacion: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(
    callback,
  );
}

export async function registrarListenerNotificacionRespondida(
  callback: (
    respuesta: Notifications.NotificationResponse,
  ) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(
    callback,
  );
}

export function obtenerEstadoNotificaciones() {
  return {
    plataforma: "android",
    esAndroid: true,
    esExpoGo: estaEnExpoGo(),
    puedeUsarPushRemoto: !estaEnExpoGo(),
  };
}