export const FUENTES_NOTICIAS = [
  {
    id: "minsalud",
    nombre: "Ministerio de Salud y Protección Social",
    dominio: "minsalud.gov.co",
    consultas: [
      'site:minsalud.gov.co/Comunicaciones/noticias/2026/Paginas/',
      'site:minsalud.gov.co/Comunicaciones/noticias/2026/Paginas/ salud',
      'site:minsalud.gov.co/Comunicaciones/noticias/2026/Paginas vacunación',
      'site:minsalud.gov.co/Comunicaciones/noticias/2026/Paginas hospital',
      'site:minsalud.gov.co/Comunicaciones/noticias/2026/Paginas vigilancia',
    ],
    limitePorConsulta: 15,
  },

  {
    id: "cundinamarca",
    nombre: "Secretaría de Salud de Cundinamarca",
    dominio: "cundinamarca.gov.co",
    consultas: [
      'site:cundinamarca.gov.co/dependencias/secsalud/noticias/',
      'site:cundinamarca.gov.co/dependencias/secsalud/noticias/ salud',
      'site:cundinamarca.gov.co/dependencias/secsalud/noticias/ vacunación',
      'site:cundinamarca.gov.co/dependencias/secsalud/noticias/ vigilancia',
      'site:cundinamarca.gov.co/dependencias/secsalud/noticias/ hospital',
    ],
    limitePorConsulta: 15,
  },

  {
    id: "ins",
    nombre: "Instituto Nacional de Salud",
    dominio: "ins.gov.co",
    consultas: [
      'site:ins.gov.co/Noticias/Paginas/',
      'site:ins.gov.co/Noticias/Paginas/ salud',
      'site:ins.gov.co/Noticias/Paginas/ vigilancia epidemiológica',
      'site:ins.gov.co/Noticias/Paginas/ enfermedad',
      'site:ins.gov.co/Comunicaciones/Paginas/ salud',
    ],
    limitePorConsulta: 15,
  },
];