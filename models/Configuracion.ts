export interface Configuracion {

  // APARIENCIA
  modoOscuro: boolean;
  tema: "Azul" | "Verde" | "Morado";
  tamanoFuente: "Pequeña" | "Mediana" | "Grande";
  animaciones: boolean;
  altoContraste: boolean;

  // IDIOMA
  idioma: "Español" | "English";

  // NOTIFICACIONES
  notificaciones: boolean;
  notificacionesChequeos: boolean;
  notificacionesMedicamentos: boolean;
  notificacionesNoticias: boolean;
  notificacionesEpidemias: boolean;
  consejosDiarios: boolean;

  // SALUD
  compartirUbicacion: boolean;
  mostrarMapa: boolean;
  objetivoAgua: number;
  objetivoPasos: number;
  objetivoSueno: number;

  // PRIVACIDAD
  guardarHistorial: boolean;
  sincronizacionAutomatica: boolean;
  compartirDatosAnonimos: boolean;

}