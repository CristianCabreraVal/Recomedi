import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "node:crypto";
import Parser from "rss-parser";
import { FUENTES_NOTICIAS } from "./fuentesNoticias.mjs";

const COLECCION = "noticias";
const MAX_ITEMS_POR_CONSULTA = 15;
const GOOGLE_NEWS_RSS = "https://news.google.com/rss/search";

const CONTENIDO_NO_RELEVANTE = [
  /suicid/i,
  /autoles/i,
];

function obtenerCredencialesFirebase() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error(
      "Falta la variable FIREBASE_SERVICE_ACCOUNT_JSON en el entorno del recolector."
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
      credential: cert(obtenerCredencialesFirebase()),
    });
  }

  return getFirestore();
}

const db = iniciarFirebase();

const parser = new Parser({
  headers: {
    "User-Agent": "Recomedi-NewsCollector/2.0",
    Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
  },
  timeout: 20000,
});

function normalizarTexto(valor = "") {
  return String(valor)
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

function normalizarUrl(valor = "") {
  if (!valor) return "";

  try {
    const url = new URL(valor);

    const clavesIgnoradas = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "gclid",
      "fbclid",
    ];

    for (const clave of clavesIgnoradas) {
      url.searchParams.delete(clave);
    }

    url.hash = "";

    return url.toString().replace(/\/$/, "");
  } catch {
    return String(valor).trim();
  }
}

function obtenerHost(valor = "") {
  try {
    return new URL(valor).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function dominioPermitido(url, fuente) {
  const host = obtenerHost(url);

  if (!host) {
    return false;
  }

  return fuente.dominiosPermitidos.some((dominio) => {
    const base = dominio.toLowerCase().replace(/^www\./, "");

    return host === base || host.endsWith(`.${base}`);
  });
}

function determinarCategoria(titulo, resumen) {
  const texto = `${titulo} ${resumen}`.toLowerCase();

  if (
    /alerta|brote|epidem|riesgo|emergencia|notificacion|notificación|vigila/.test(
      texto
    )
  ) {
    return "alerta";
  }

  if (
    /vacun|prevencion|prevención|campana|campaña|promocion|promoción/.test(
      texto
    )
  ) {
    return "prevencion";
  }

  if (
    /hospital|servicio|atencion|atención|medicamento|salud/.test(texto)
  ) {
    return "salud";
  }

  return "general";
}

function extraerImagen(item) {
  if (item?.enclosure?.url) {
    return item.enclosure.url;
  }

  const html =
    item?.contentEncoded ||
    item?.content ||
    item?.description ||
    "";

  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);

  return match?.[1] || "";
}

function construirUrlFeed(consulta) {
  const params = new URLSearchParams({
    q: consulta,
    hl: "es-419",
    gl: "CO",
    ceid: "CO:es-419",
  });

  return `${GOOGLE_NEWS_RSS}?${params.toString()}`;
}

async function resolverUrl(url) {
  if (!url) {
    return "";
  }

  try {
    const respuesta = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "Recomedi-NewsCollector/2.0",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
    });

    return respuesta.url || url;
  } catch {
    return url;
  }
}

function construirHuella({ fuenteId, titulo, url }) {
  const base = `${fuenteId}|${normalizarUrl(url)}|${normalizarTitulo(
    titulo
  )}`;

  return crypto
    .createHash("sha256")
    .update(base)
    .digest("hex");
}

function fechaValida(fecha) {
  if (!fecha) {
    return null;
  }

  const timestamp = new Date(fecha).getTime();

  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Date(timestamp).toISOString();
}

function contenidoExcluido(titulo, resumen) {
  const texto = `${titulo} ${resumen}`;

  return CONTENIDO_NO_RELEVANTE.some((patron) =>
    patron.test(texto)
  );
}

async function cargarNoticiasExistentes() {
  const snapshot = await db.collection(COLECCION).get();

  const porHuella = new Set();
  const porUrl = new Set();
  const porFuenteTitulo = new Set();

  for (const documento of snapshot.docs) {
    const datos = documento.data();

    if (datos.huella) {
      porHuella.add(String(datos.huella));
    }

    if (datos.fuenteUrl) {
      porUrl.add(normalizarUrl(datos.fuenteUrl));
    }

    if (datos.fuenteId && datos.titulo) {
      porFuenteTitulo.add(
        `${datos.fuenteId}|${normalizarTitulo(datos.titulo)}`
      );
    }
  }

  return {
    porHuella,
    porUrl,
    porFuenteTitulo,
  };
}

async function recolectarConsulta(consulta) {
  const urlFeed = construirUrlFeed(consulta);

  const feed = await parser.parseURL(urlFeed);

  return Array.isArray(feed.items)
    ? feed.items.slice(0, MAX_ITEMS_POR_CONSULTA)
    : [];
}

async function guardarNoticia(fuente, item, existentes) {
  const titulo = normalizarTexto(item.title);

  if (!titulo) {
    return {
      estado: "ignorada",
      razon: "sin-titulo",
    };
  }

  const resumen = normalizarTexto(
    item.contentSnippet ||
      item.summary ||
      item.description ||
      item.content ||
      ""
  );

  if (contenidoExcluido(titulo, resumen)) {
    return {
      estado: "ignorada",
      razon: "contenido-no-relevante",
      titulo,
    };
  }

  const enlaceFeed = normalizarUrl(
    item.link || item.guid || ""
  );

  const urlDeclarada = normalizarUrl(
    item?.source?.url || ""
  );

  const urlResuelta = await resolverUrl(enlaceFeed);

  let fuenteUrl = "";

  if (dominioPermitido(urlResuelta, fuente)) {
    fuenteUrl = normalizarUrl(urlResuelta);
  } else if (dominioPermitido(urlDeclarada, fuente)) {
    fuenteUrl = urlDeclarada;
  }

  if (!fuenteUrl) {
    return {
      estado: "ignorada",
      razon: `fuente-no-oficial:${
        obtenerHost(urlResuelta) ||
        obtenerHost(urlDeclarada) ||
        "desconocida"
      }`,
      titulo,
    };
  }

  const huella = construirHuella({
    fuenteId: fuente.id,
    titulo,
    url: fuenteUrl,
  });

  const claveFuenteTitulo =
    `${fuente.id}|${normalizarTitulo(titulo)}`;

  if (
    existentes.porHuella.has(huella) ||
    existentes.porUrl.has(fuenteUrl) ||
    existentes.porFuenteTitulo.has(claveFuenteTitulo)
  ) {
    return {
      estado: "duplicada",
      titulo,
      fuenteUrl,
    };
  }

  const documentoId = huella.slice(0, 40);

  const datos = {
    titulo,
    resumen,
    contenido: "",
    imagenUrl: extraerImagen(item),

    categoria: determinarCategoria(
      titulo,
      resumen
    ),

    fuente: fuente.nombre,
    fuenteId: fuente.id,
    fuenteUrl,
    urlRecoleccion: enlaceFeed,

    fechaPublicacion: fechaValida(
      item.isoDate || item.pubDate
    ),

    fechaCaptura: new Date().toISOString(),

    estado: "pendiente",

    tipo: "externa",

    creadoAutomaticamente: true,

    revisado: false,

    creadoPor: "recolector-automatico",

    huella,
  };

  await db
    .collection(COLECCION)
    .doc(documentoId)
    .set(datos, {
      merge: false,
    });

  existentes.porHuella.add(huella);
  existentes.porUrl.add(fuenteUrl);
  existentes.porFuenteTitulo.add(
    claveFuenteTitulo
  );

  return {
    estado: "nueva",
    titulo,
    fuenteUrl,
  };
}

async function main() {
  console.log("========================================");
  console.log("   RECOLECTOR AUTOMATICO DE NOTICIAS");
  console.log("========================================");

  console.log(
    `Fecha de ejecución: ${new Date().toISOString()}`
  );

  console.log(
    `Colección destino: ${COLECCION}`
  );

  console.log(
    `Fuentes configuradas: ${FUENTES_NOTICIAS.length}`
  );

  const existentes =
    await cargarNoticiasExistentes();

  let encontradas = 0;
  let nuevas = 0;
  let duplicadas = 0;
  let ignoradas = 0;

  for (const fuente of FUENTES_NOTICIAS) {
    console.log(`\n[${fuente.nombre}]`);

    for (const consulta of fuente.consultas) {
      console.log(`Consulta: ${consulta}`);

      try {
        const items =
          await recolectarConsulta(consulta);

        encontradas += items.length;

        console.log(
          `Resultados encontrados: ${items.length}`
        );

        for (const item of items) {
          const resultado =
            await guardarNoticia(
              fuente,
              item,
              existentes
            );

          if (resultado.estado === "nueva") {
            nuevas += 1;

            console.log(
              `  + NUEVA: ${resultado.titulo}`
            );

            console.log(
              `    URL: ${resultado.fuenteUrl}`
            );
          } else if (
            resultado.estado === "duplicada"
          ) {
            duplicadas += 1;

            console.log(
              `  = DUPLICADA: ${resultado.titulo}`
            );
          } else {
            ignoradas += 1;

            console.log(
              `  - IGNORADA: ${
                resultado.titulo ||
                "sin título"
              }`
            );

            console.log(
              `    Motivo: ${resultado.razon}`
            );
          }
        }
      } catch (error) {
        console.error(
          `  ! ERROR EN CONSULTA: ${
            error?.message || error
          }`
        );
      }
    }
  }

  console.log("\n========================================");
  console.log("RESUMEN DE EJECUCION");
  console.log("========================================");

  console.log(
    `Resultados encontrados : ${encontradas}`
  );

  console.log(
    `Noticias nuevas       : ${nuevas}`
  );

  console.log(
    `Noticias duplicadas   : ${duplicadas}`
  );

  console.log(
    `Noticias ignoradas    : ${ignoradas}`
  );

  console.log(
    `Total procesado       : ${
      nuevas + duplicadas + ignoradas
    }`
  );

  console.log("========================================");
}

main().catch((error) => {
  console.error(
    "ERROR FATAL DEL RECOLECTOR:",
    error
  );

  process.exitCode = 1;
});