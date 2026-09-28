export const FUENTES_NOTICIAS = [
  {
    id: "minsalud",
    nombre: "Ministerio de Salud y Protección Social",
    dominiosPermitidos: ["minsalud.gov.co", "www2.minsalud.gov.co"],
    consultas: [
      'site:minsalud.gov.co/Comunicaciones/noticias/2026 (salud OR vacunacion OR vacunación OR alerta OR prevencion OR prevención OR emergencia OR hospital) when:14d',
    ],
  },
  {
    id: "cundinamarca",
    nombre: "Secretaría de Salud de Cundinamarca",
    dominiosPermitidos: ["cundinamarca.gov.co", "www.cundinamarca.gov.co"],
    consultas: [
      'site:cundinamarca.gov.co/dependencias/secsalud/noticias (salud OR vacunacion OR vacunación OR alerta OR prevencion OR prevención OR hospital OR medicamentos) when:14d',
    ],
  },
  {
    id: "ins",
    nombre: "Instituto Nacional de Salud",
    dominiosPermitidos: ["ins.gov.co", "www.ins.gov.co"],
    consultas: [
      'site:ins.gov.co/Comunicaciones/Paginas (salud OR vigilancia OR epidemiologia OR epidemiología OR alerta OR enfermedad OR brote) when:14d',
    ],
  },
];