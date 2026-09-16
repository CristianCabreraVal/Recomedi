export const generarMensaje = (usuario: any) => {
  // Usuario no registrado
  if (!usuario) {
    return "Recuerda hacerte un chequeo médico general al menos una vez al año.";
  }

  const { edad } = usuario;

  if (edad >= 45) {
    return "A tu edad se recomienda control cardiovascular anual.";
  }

  if (edad >= 30) {
    return "Es recomendable realizar chequeos de presión arterial regularmente.";
  }

  if (edad >= 18) {
    return "No olvides tu revisión dental cada 6 meses.";
  }

  return "Mantén hábitos saludables y revisiones periódicas.";
};