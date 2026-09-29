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

export async function prepararNotificaciones(): Promise<boolean> {
  return false;
}

export async function solicitarPermisosNotificaciones(): Promise<boolean> {
  return false;
}

export async function obtenerTokenFCM(): Promise<string | null> {
  return null;
}

export async function enviarNotificacionLocal(
  _titulo: string,
  _cuerpo: string,
  _tipo: TipoNotificacion = "alerta",
): Promise<string | null> {
  return null;
}

export async function probarNotificacion(): Promise<string | null> {
  return null;
}

export async function programarRecordatorioDiario(
  _titulo: string,
  _cuerpo: string,
  _hora: string,
  _tipo: TipoNotificacion,
): Promise<string | null> {
  return null;
}

export async function programarRecordatorioIntervalo(
  _titulo: string,
  _cuerpo: string,
  _cadaHoras: number,
  _tipo: TipoNotificacion,
): Promise<string | null> {
  return null;
}

export async function programarRecordatorioActividad(
  _hora: string = "19:00",
): Promise<string | null> {
  return null;
}

export async function programarRecordatorioHidratacion(
  _cadaHoras: number = 2,
): Promise<string | null> {
  return null;
}

export async function programarRecordatorioCuidadoPersonal(
  _hora: string = "20:00",
): Promise<string | null> {
  return null;
}

export async function programarRecordatorioChequeo(
  _hora: string = "09:00",
): Promise<string | null> {
  return null;
}

export async function cancelarTodasLasNotificaciones(): Promise<boolean> {
  return false;
}

export async function obtenerNotificacionesProgramadas(): Promise<
  unknown[]
> {
  return [];
}

export async function registrarListenerNotificacionRecibida(
  _callback: (notificacion: unknown) => void,
) {
  return null;
}

export async function registrarListenerNotificacionRespondida(
  _callback: (respuesta: unknown) => void,
) {
  return null;
}

export function obtenerEstadoNotificaciones() {
  return {
    plataforma: "web",
    esAndroid: false,
    esExpoGo: false,
    puedeUsarPushRemoto: false,
  };
}