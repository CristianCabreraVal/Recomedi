export type Recomendacion = {
  id: string;
  categoria: string;
  texto: string;
  prioridad: number;
};

const recomendacionesGenerales: Recomendacion[] = [
  {
    id: "hidratacion",
    categoria: "Hidratación",
    texto:
      "Recuerda tomar agua regularmente durante el día.",
    prioridad: 1,
  },
  {
    id: "pausa-activa",
    categoria: "Actividad",
    texto:
      "Si llevas bastante tiempo sentado, haz una pausa y muévete unos minutos.",
    prioridad: 1,
  },
  {
    id: "sueno",
    categoria: "Descanso",
    texto:
      "Procura mantener una rutina regular de sueño.",
    prioridad: 1,
  },
  {
    id: "alimentacion",
    categoria: "Alimentación",
    texto:
      "Procura incluir variedad de alimentos en tus comidas.",
    prioridad: 1,
  },
  {
    id: "descanso",
    categoria: "Bienestar",
    texto:
      "Reserva algunos momentos del día para descansar.",
    prioridad: 1,
  },
  {
    id: "pantallas",
    categoria: "Bienestar",
    texto:
      "Si llevas mucho tiempo frente a una pantalla, haz una pausa y descansa la vista.",
    prioridad: 1,
  },
];

export const generarRecomendaciones = (
  usuario?: any
): string[] => {
  const recomendaciones: Recomendacion[] = [
    ...recomendacionesGenerales,
  ];

  /*
   * REGLAS PERSONALIZADAS
   *
   * Por ahora son reglas sencillas.
   * En el futuro podrían sustituirse o complementarse
   * con un sistema de recomendaciones más avanzado.
   */

  if (usuario) {
    if (Number(usuario.edad) > 40) {
      recomendaciones.push({
        id: "control-periodico",
        categoria: "Prevención",
        texto:
          "Considera mantener controles de salud periódicos según las recomendaciones de un profesional de salud.",
        prioridad: 2,
      });
    }

    if (
      typeof usuario.genero === "string" &&
      usuario.genero.toLowerCase() === "femenino"
    ) {
      recomendaciones.push({
        id: "control-ginecologico",
        categoria: "Prevención",
        texto:
          "Recuerda consultar con profesionales de salud sobre los controles preventivos que correspondan a tu situación.",
        prioridad: 2,
      });
    }
  }

  return recomendaciones.map(
    (recomendacion) => recomendacion.texto
  );
};