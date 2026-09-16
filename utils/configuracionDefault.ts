import { Configuracion } from "../models/Configuracion";

export const configuracionDefault: Configuracion = {

  // Apariencia

  modoOscuro: false,

  tema: "Azul",

  tamanoFuente: "Mediana",

  animaciones: true,

  altoContraste: false,

  // Idioma

  idioma: "Español",

  // Notificaciones

  notificaciones: true,

  notificacionesChequeos: true,

  notificacionesMedicamentos: true,

  notificacionesNoticias: true,

  notificacionesEpidemias: true,

  consejosDiarios: true,

  // Salud

  compartirUbicacion: true,

  mostrarMapa: true,

  objetivoAgua: 2000,

  objetivoPasos: 8000,

  objetivoSueno: 8,

  // Privacidad

  guardarHistorial: true,

  sincronizacionAutomatica: true,

  compartirDatosAnonimos: false,

};