export const calcularIMC = (peso: number, altura: number) => {
  const alturaM = altura / 100;
  return peso / (alturaM * alturaM);
};

export const interpretarIMC = (imc: number) => {
  if (imc < 18.5) return "Bajo peso";
  if (imc < 25) return "Normal";
  return "Sobrepeso";
};