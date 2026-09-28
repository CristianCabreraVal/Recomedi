import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "node:crypto";
import Parser from "rss-parser";
import { FUENTES_NOTICIAS } from "./fuentesNoticias.mjs";

const COLECCION = "noticias";

const GOOGLE_NEWS_RSS =
  "https://news.google.com/rss/search";

const parser = new Parser({
  timeout: 30000,

  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; RecomediNewsCollector/1.0)",
    Accept:
      "application/rss+xml, application/xml, text/xml;q=0.9,*/*;q=0.8",
  },
});

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; RecomediNewsCollector/1.0)",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

function obtenerCredencialesFirebase() {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error(
      "No existe FIREBASE_SERVICE_ACCOUNT_JSON."
    );
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON no contiene un JSON válido."
    );
  }
}

function iniciarFirebase() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(
        obtenerCredencialesFirebase()
      ),
    });
  }

  return getFirestore();
}

const db = iniciarFirebase();

function normalizarTexto(texto = "") {
  return String(texto)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarTitulo(titulo = "") {
  return normalizarTexto(titulo)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarUrl(url = "") {
  if (!url) {
    return "";
  }

  try {
    const resultado = new URL(url);

    resultado.hash = "";

    const parametrosEliminar = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
    ];

    for (const parametro of parametrosEliminar) {
      resultado.searchParams.delete(
        parametro
      );
    }

    return resultado
      .toString()
      .replace(/\/$/, "");
  } catch {
    return String(url).trim();
  }
}

function obtenerHost(url = "") {
  try {
    return new URL(url)
      .hostname
      .toLowerCase()
      .replace(/^www\./, "");
  } catch {
    return "";
  }
}

function perteneceAlDominio(
  url,
  dominio
) {
  const host = obtenerHost(url);

  if (!host) {
    return false;
  }

  const base =
    dominio
      .toLowerCase()
      .replace(/^www\./, "");

  return (
    host === base ||
    host.endsWith(`.${base}`)
  );
}

function esArticuloValido(
  fuente,
  url
) {
  if (!url) {
    return false;
  }

  const normalizada =
    normalizarUrl(url);

  if (
    !perteneceAlDominio(
      normalizada,
      fuente.dominio
    )
  ) {
    return false;
  }

  const minuscula =
    normalizada.toLowerCase();

  if (
    minuscula.includes(
      "/historico.aspx"
    )
  ) {
    return false;
  }

  if (
    minuscula.includes(
      "/allnews.aspx"
    )
  ) {
    return false;
  }

  if (
    minuscula.includes(
      "/forms/"
    )
  ) {
    return false;
  }

  if (
    minuscula.includes(
      "periodicidad-divulgacion"
    )
  ) {
    return false;
  }

  if (
    minuscula.includes(
      "ins-digital.aspx"
    )
  ) {
    return false;
  }

  if (
    fuente.id === "minsalud"
  ) {
    return (
      minuscula.includes(
        "/comunicaciones/noticias/2026/paginas/"
      ) &&
      minuscula.endsWith(
        ".aspx"
      )
    );
  }

  if (
    fuente.id === "cundinamarca"
  ) {
    return minuscula.includes(
      "/dependencias/secsalud/noticias/"
    );
  }

  if (
    fuente.id === "ins"
  ) {
    return (
      minuscula.includes(
        "/noticias/paginas/"
      ) &&
      minuscula.endsWith(
        ".aspx"
      )
    );
  }

  return false;
}

function construirFeedUrl(
  consulta
) {
  const ahora =
    new Date();

  const fechaDesde =
    new Date(
      ahora.getTime() -
        30 *
          24 *
          60 *
          60 *
          1000
    );

  const yyyy =
    fechaDesde.getUTCFullYear();

  const mm =
    String(
      fechaDesde.getUTCMonth() + 1
    ).padStart(2, "0");

  const dd =
    String(
      fechaDesde.getUTCDate()
    ).padStart(2, "0");

  const consultaFinal =
    `${consulta} after:${yyyy}-${mm}-${dd}`;

  const parametros =
    new URLSearchParams({
      q: consultaFinal,
      hl: "es-419",
      gl: "CO",
      ceid: "CO:es-419",
    });

  return `${GOOGLE_NEWS_RSS}?${parametros.toString()}`;
}

async function resolverUrlGoogleNews(
  url
) {
  if (!url) {
    return "";
  }

  try {
    const respuesta =
      await fetch(url, {
        method: "HEAD",
        redirect: "manual",
        headers: HEADERS,
        signal:
          AbortSignal.timeout(
            15000
          ),
      });

    const location =
      respuesta.headers.get(
        "location"
      );

    if (location) {
      return normalizarUrl(
        location
      );
    }
  } catch {
    // Se intenta posteriormente con GET.
  }

  try {
    const respuesta =
      await fetch(url, {
        redirect: "manual",
        headers: HEADERS,
        signal:
          AbortSignal.timeout(
            15000
          ),
      });

    const location =
      respuesta.headers.get(
        "location"
      );

    if (location) {
      return normalizarUrl(
        location
      );
    }
  } catch {
    return "";
  }

  return "";
}

function obtenerImagen(item) {
  const enclosure =
    item?.enclosure?.url;

  if (enclosure) {
    return normalizarUrl(
      enclosure
    );
  }

  const contenido =
    item?.content ||
    item?.description ||
    "";

  const coincidencia =
    String(contenido).match(
      /<img[^>]+src=["']([^"']+)["']/i
    );

  return coincidencia?.[1]
    ? normalizarUrl(
        coincidencia[1]
      )
    : "";
}

function construirHuella(
  fuenteId,
  url,
  titulo
) {
  const identificador =
    url ||
    `${fuenteId}|${normalizarTitulo(
      titulo
    )}`;

  return crypto
    .createHash("sha256")
    .update(
      `${fuenteId}|${identificador}`
    )
    .digest("hex");
}

function convertirFecha(
  fecha
) {
  if (!fecha) {
    return null;
  }

  const resultado =
    new Date(fecha);

  if (
    Number.isNaN(
      resultado.getTime()
    )
  ) {
    return null;
  }

  return resultado.toISOString();
}

function determinarCategoria(
  titulo,
  resumen
) {
  const texto =
    `${titulo} ${resumen}`.toLowerCase();

  if (
    /alerta|brote|epidem|vigilancia|riesgo|emergencia/.test(
      texto
    )
  ) {
    return "alerta";
  }

  if (
    /vacun|prevencion|prevención|dengue|fiebre amarilla|sarampion|sarampión/.test(
      texto
    )
  ) {
    return "prevencion";
  }

  if (
    /hospital|medicamento|servicio de salud|atencion|atención|tratamiento/.test(
      texto
    )
  ) {
    return "salud";
  }

  return "general";
}

async function cargarExistentes() {
  const snapshot =
    await db
      .collection(COLECCION)
      .get();

  const urls =
    new Set();

  const huellas =
    new Set();

  const titulos =
    new Set();

  for (
    const documento of snapshot.docs
  ) {
    const datos =
      documento.data();

    if (
      datos.fuenteUrl
    ) {
      urls.add(
        normalizarUrl(
          datos.fuenteUrl
        )
      );
    }

    if (
      datos.huella
    ) {
      huellas.add(
        String(
          datos.huella
        )
      );
    }

    if (
      datos.fuenteId &&
      datos.titulo
    ) {
      titulos.add(
        `${
          datos.fuenteId
        }|${
          normalizarTitulo(
            datos.titulo
          )
        }`
      );
    }
  }

  return {
    urls,
    huellas,
    titulos,
  };
}

async function obtenerResultados(
  fuente,
  consulta
) {
  const feedUrl =
    construirFeedUrl(
      consulta
    );

  console.log(
    `Consulta RSS: ${consulta}`
  );

  const feed =
    await parser.parseURL(
      feedUrl
    );

  if (
    !Array.isArray(
      feed.items
    )
  ) {
    return [];
  }

  return feed.items.slice(
    0,
    fuente.limitePorConsulta
  );
}

async function procesarItem(
  fuente,
  item,
  existentes
) {
  const titulo =
    normalizarTexto(
      item.title || ""
    );

  if (!titulo) {
    return {
      estado: "ignorada",
      razon: "sin-titulo",
    };
  }

  const resumen =
    normalizarTexto(
      item.contentSnippet ||
        item.summary ||
        item.description ||
        ""
    );

  const urlGoogle =
    normalizarUrl(
      item.link || ""
    );

  const urlFuenteDeclarada =
    normalizarUrl(
      item?.source?.url ||
        ""
    );

  const urlResuelta =
    await resolverUrlGoogleNews(
      urlGoogle
    );

  let fuenteUrl = "";

  if (
    esArticuloValido(
      fuente,
      urlResuelta
    )
  ) {
    fuenteUrl =
      urlResuelta;
  }

  if (
    !fuenteUrl &&
    esArticuloValido(
      fuente,
      urlFuenteDeclarada
    )
  ) {
    fuenteUrl =
      urlFuenteDeclarada;
  }

  if (!fuenteUrl) {
    return {
      estado: "ignorada",
      razon:
        "no-se-pudo-obtener-url-oficial",
      titulo,
    };
  }

  const tituloNormalizado =
    normalizarTitulo(
      titulo
    );

  const claveTitulo =
    `${fuente.id}|${tituloNormalizado}`;

  const huella =
    construirHuella(
      fuente.id,
      fuenteUrl,
      titulo
    );

  if (
    existentes.urls.has(
      fuenteUrl
    )
  ) {
    return {
      estado: "duplicada",
      titulo,
      fuenteUrl,
    };
  }

  if (
    existentes.huellas.has(
      huella
    )
  ) {
    return {
      estado: "duplicada",
      titulo,
      fuenteUrl,
    };
  }

  if (
    existentes.titulos.has(
      claveTitulo
    )
  ) {
    return {
      estado: "duplicada",
      titulo,
      fuenteUrl,
    };
  }

  const documentoId =
    huella.slice(
      0,
      40
    );

  const noticia = {
    titulo,

    resumen:
      resumen ||
      "Noticia publicada por una fuente oficial.",

    contenido: "",

    imagenUrl:
      obtenerImagen(item),

    categoria:
      determinarCategoria(
        titulo,
        resumen
      ),

    fuente:
      fuente.nombre,

    fuenteId:
      fuente.id,

    fuenteUrl,

    urlRecoleccion:
      urlGoogle,

    fechaPublicacion:
      convertirFecha(
        item.isoDate ||
          item.pubDate
      ),

    fechaCaptura:
      new Date().toISOString(),

    estado:
      "pendiente",

    tipo:
      "externa",

    creadoAutomaticamente:
      true,

    revisado:
      false,

    creadoPor:
      "recolector-automatico",

    huella,
  };

  await db
    .collection(COLECCION)
    .doc(documentoId)
    .set(noticia);

  existentes.urls.add(
    fuenteUrl
  );

  existentes.huellas.add(
    huella
  );

  existentes.titulos.add(
    claveTitulo
  );

  return {
    estado: "nueva",
    titulo,
    fuenteUrl,
  };
}

async function procesarFuente(
  fuente,
  existentes
) {
  const resultadosUnicos =
    new Map();

  for (
    const consulta of fuente.consultas
  ) {
    try {
      const items =
        await obtenerResultados(
          fuente,
          consulta
        );

      console.log(
        `Resultados: ${items.length}`
      );

      for (
        const item of items
      ) {
        const titulo =
          normalizarTexto(
            item.title || ""
          );

        const clave =
          normalizarTitulo(
            titulo
          );

        if (!clave) {
          continue;
        }

        if (
          !resultadosUnicos.has(
            clave
          )
        ) {
          resultadosUnicos.set(
            clave,
            item
          );
        }
      }
    } catch (error) {
      console.error(
        `Error en consulta de ${fuente.id}:`,
        error?.message ||
          error
      );
    }
  }

  console.log(
    `Resultados únicos encontrados: ${resultadosUnicos.size}`
  );

  let nuevas = 0;
  let duplicadas = 0;
  let ignoradas = 0;

  for (
    const item of resultadosUnicos.values()
  ) {
    const resultado =
      await procesarItem(
        fuente,
        item,
        existentes
      );

    if (
      resultado.estado ===
      "nueva"
    ) {
      nuevas++;

      console.log(
        `+ NUEVA: ${resultado.titulo}`
      );

      console.log(
        `  URL: ${resultado.fuenteUrl}`
      );
    } else if (
      resultado.estado ===
      "duplicada"
    ) {
      duplicadas++;

      console.log(
        `= DUPLICADA: ${resultado.titulo}`
      );
    } else {
      ignoradas++;

      console.log(
        `- IGNORADA: ${
          resultado.titulo ||
          "sin título"
        }`
      );

      console.log(
        `  Motivo: ${resultado.razon}`
      );
    }
  }

  return {
    nuevas,
    duplicadas,
    ignoradas,
  };
}

async function main() {
  console.log(
    "=============================================="
  );

  console.log(
    "      RECOMEDI - RECOLECTOR DE NOTICIAS"
  );

  console.log(
    "=============================================="
  );

  console.log(
    `Fecha: ${new Date().toISOString()}`
  );

  const existentes =
    await cargarExistentes();

  console.log(
    `Noticias existentes en Firebase: ${existentes.urls.size}`
  );

  let totalNuevas = 0;
  let totalDuplicadas = 0;
  let totalIgnoradas = 0;

  for (
    const fuente of FUENTES_NOTICIAS
  ) {
    console.log(
      `\n==============================================`
    );

    console.log(
      fuente.nombre
    );

    console.log(
      `==============================================`
    );

    const resultado =
      await procesarFuente(
        fuente,
        existentes
      );

    totalNuevas +=
      resultado.nuevas;

    totalDuplicadas +=
      resultado.duplicadas;

    totalIgnoradas +=
      resultado.ignoradas;
  }

  console.log(
    "\n=============================================="
  );

  console.log(
    "              RESUMEN DE EJECUCION"
  );

  console.log(
    "=============================================="
  );

  console.log(
    `Noticias nuevas       : ${totalNuevas}`
  );

  console.log(
    `Noticias duplicadas   : ${totalDuplicadas}`
  );

  console.log(
    `Noticias ignoradas    : ${totalIgnoradas}`
  );

  console.log(
    "=============================================="
  );
}

main().catch(
  (error) => {
    console.error(
      "ERROR FATAL DEL RECOLECTOR:",
      error
    );

    process.exitCode = 1;
  }
);