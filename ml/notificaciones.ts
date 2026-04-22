export const generarMensaje = (usuario: any) => {
  // 🔹 Usuario NO registrado
  if (!usuario) {
    return "Recuerda hacerte un chequeo médico general al menos una vez al año.";
  }

  const { edad, genero } = usuario;

  // 🔹 Reglas más realistas por edad
  if (edad >= 45) {
    return "A tu edad se recomienda control cardiovascular anual.";
  }

  if (edad >= 30) {
    return "Es recomendable realizar chequeos de presión arterial regularmente.";
  }

  if (edad >= 18) {
    return "No olvides tu revisión dental cada 6 meses.";
  }

  // fallback
  return "Mantén hábitos saludables y revisiones periódicas.";
};

import * as Notifications from "expo-notifications";

export const enviarNotificacion = async (mensaje: string) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Recomedi",
      body: mensaje,
    },
    trigger: null, // inmediata (modo prueba)
  });
};