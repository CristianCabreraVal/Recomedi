export const generarRecomendaciones = (usuario: any) => {
  const recomendaciones = [];

  const imc = usuario.peso / ((usuario.altura / 100) ** 2);

  if (imc > 25) {
    recomendaciones.push("Se recomienda control de peso");
  }

  if (usuario.edad > 40) {
    recomendaciones.push("Chequeo cardiovascular anual");
  }

  if (usuario.genero === "femenino") {
    recomendaciones.push("Chequeo ginecológico periódico");
  }

  return recomendaciones;
};