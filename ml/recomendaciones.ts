export const generarRecomendaciones = (usuario: any) => {
  const recomendaciones: string[] = [];

  const imc = usuario.peso / ((usuario.altura / 100) ** 2);

  if (imc > 25) {
    recomendaciones.push("Se recomienda control de peso");
  }

  if (usuario.edad > 40) {
    recomendaciones.push("Chequeo cardiovascular anual");
  }

  if (usuario.genero.toLowerCase() === "femenino") {
    recomendaciones.push("Chequeo ginecológico periódico");
  }

  if (recomendaciones.length === 0) {
    recomendaciones.push("Mantén hábitos saludables");
  }

  return recomendaciones;
};