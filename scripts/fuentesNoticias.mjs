export const FUENTES_NOTICIAS = [
  {
    id: "minsalud",
    nombre: "Ministerio de Salud y Protección Social",
    dominiosPermitidos: ["minsalud.gov.co", "www2.minsalud.gov.co"],
    consulta:
      "site:minsalud.gov.co/Comunicaciones/Paginas/noticias.aspx salud OR vacunacion OR alerta OR prevencion when:7d",
  },
  {
    id: "cundinamarca",
    nombre: "Secretaría de Salud de Cundinamarca",
    dominiosPermitidos: ["cundinamarca.gov.co", "www.cundinamarca.gov.co"],
    consulta:
      "site:cundinamarca.gov.co/dependencias/secsalud/noticias salud OR vacunacion OR alerta OR prevencion when:7d",
  },
  {
    id: "ins",
    nombre: "Instituto Nacional de Salud",
    dominiosPermitidos: ["ins.gov.co", "www.ins.gov.co"],
    consulta:
      "site:ins.gov.co/Comunicaciones salud OR vigilancia OR epidemiologia OR alerta when:7d",
  },
];
