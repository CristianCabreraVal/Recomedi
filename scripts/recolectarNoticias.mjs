import crypto from "node:crypto";
import Parser from "rss-parser";

import {
    applicationDefault,
    cert,
    getApps,
    initializeApp,
} from "firebase-admin/app";

import {
    getFirestore,
    Timestamp,
} from "firebase-admin/firestore";

import { FUENTES_NOTICIAS } from "./fuentesNoticias.mjs";

/* ============================================================
   CONFIGURACIÓN
============================================================ */

const parser = new Parser({
  timeout: 20000,

  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
    ],
  },
});

const LIMITE_POR_FUENTE = 15;

/* ============================================================
   FIREBASE
============================================================ */

function inicializarFirebase() {
  if (getApps().length > 0) {
    return;
  }

  /*
   * GitHub Actions:
   * FIREBASE_SERVICE_ACCOUNT_JSON
   *
   * Ejecución local:
   * GOOGLE_APPLICATION_CREDENTIALS
   */

  const credencialJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (credencialJson) {
    try {
      const serviceAccount =
        JSON.parse(credencialJson);

      initializeApp({
        credential: cert(serviceAccount),
      });

      return;
    } catch (error) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON no contiene un JSON válido."
      );
    }
  }

  initializeApp({
    credential: applicationDefault(),
  });
}

inicializarFirebase();

const db = getFirestore();

/* ============================================================
   UTILIDADES
============================================================ */

function generarIdNoticia(fuenteId, item) {
  const identificador =
    item.guid ||
    item.id ||
    item.link ||
    `${item.title || ""}|${item.pubDate || ""}`;

  return crypto
    .createHash("sha256")
    .update(
      `${fuenteId}|${identificador}`,
      "utf8"
    )
    .digest("hex");
}

function limpiarTexto(texto = "") {
  return texto
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function obtenerResumen(item) {
  const texto =
    item.contentSnippet ||
    item.summary ||
    item.content ||
    "";

  return limpiarTexto(texto).slice(0, 600);
}

function obtenerImagen(item) {
  if (
    item.enclosure &&
    typeof item.enclosure.url === "string"
  ) {
    return item.enclosure.url;
  }

  if (
    Array.isArray(item.mediaContent)
  ) {
    for (const elemento of item.mediaContent) {
      const url =
        elemento?.$?.url ||
        elemento?.url;

      if (url) {
        return url;
      }
    }
  }

  if (
    Array.isArray(item.mediaThumbnail)
  ) {
    for (const elemento of item.mediaThumbnail) {
      const url =
        elemento?.$?.url ||
        elemento?.url;

      if (url) {
        return url;
      }
    }
  }

  return "";
}

function obtenerFecha(item) {
  const fecha =
    item.isoDate ||
    item.pubDate;

  if (!fecha) {
    return new Date();
  }

  const fechaConvertida =
    new Date(fecha);

  if (
    Number.isNaN(
      fechaConvertida.getTime()
    )
  ) {
    return new Date();
  }

  return fechaConvertida;
}

function obtenerUrl(item) {
  return (
    item.link ||
    item.guid ||
    ""
  );
}

function clasificarCategoria(titulo, resumen) {
  const texto =
    `${titulo} ${resumen}`.toLowerCase();

  if (
    texto.includes("vacun") ||
    texto.includes("inmuniz")
  ) {
    return "prevencion";
  }

  if (
    texto.includes("dengue") ||
    texto.includes("sarampión") ||
    texto.includes("sarampion") ||
    texto.includes("fiebre amarilla") ||
    texto.includes("virus") ||
    texto.includes("enfermedad")
  ) {
    return "enfermedades";
  }

  if (
    texto.includes("alerta") ||
    texto.includes("brote") ||
    texto.includes("emergencia") ||
    texto.includes("riesgo")
  ) {
    return "alerta";
  }

  if (
    texto.includes("hospital") ||
    texto.includes("médico") ||
    texto.includes("medico") ||
    texto.includes("salud")
  ) {
    return "servicios";
  }

  return "salud-publica";
}

function esValida(item) {
  const titulo =
    typeof item.title === "string"
      ? item.title.trim()
      : "";

  const url =
    obtenerUrl(item);

  return (
    titulo.length >= 5 &&
    url.length > 0
  );
}

/* ============================================================
   RECOLECTAR UNA FUENTE
============================================================ */

async function recolectarFuente(fuente) {
  console.log("");
  console.log(
    "======================================"
  );
  console.log(
    `FUENTE: ${fuente.nombre}`
  );
  console.log(
    "======================================"
  );

  const rssUrl =
    "https://news.google.com/rss/search?q=" +
    encodeURIComponent(fuente.consulta) +
    "&hl=es-419&gl=CO&ceid=CO%3Aes-419";

  console.log(
    "Consultando noticias..."
  );

  const feed =
    await parser.parseURL(rssUrl);

  console.log(
    `Encontradas: ${feed.items.length}`
  );

  const items =
    feed.items.slice(
      0,
      LIMITE_POR_FUENTE
    );

  let nuevas = 0;
  let repetidas = 0;

  for (const item of items) {
    if (!esValida(item)) {
      continue;
    }

    const id =
      generarIdNoticia(
        fuente.id,
        item
      );

    const referencia =
      db
        .collection("noticias")
        .doc(id);

    const existente =
      await referencia.get();

    if (existente.exists) {
      repetidas++;
      continue;
    }

    const titulo =
      item.title.trim();

    const resumen =
      obtenerResumen(item);

    const documento = {
      titulo,

      resumen,

      /*
       * El contenido completo NO se publica
       * automáticamente.
       */
      contenido: "",

      imagenUrl:
        obtenerImagen(item),

      categoria:
        clasificarCategoria(
          titulo,
          resumen
        ),

      fuente:
        fuente.nombre,

      fuenteId:
        fuente.id,

      fuenteUrl:
        obtenerUrl(item),

      fechaPublicacion:
        Timestamp.fromDate(
          obtenerFecha(item)
        ),

      fechaCaptura:
        Timestamp.now(),

      /*
       * TODA noticia automática comienza
       * como pendiente.
       */
      estado: "pendiente",

      tipo: "externa",

      creadoAutomaticamente: true,

      revisado: false,

      creadoPor:
        "recolector-automatico",
    };

    await referencia.set(
      documento
    );

    nuevas++;

    console.log(
      `✓ Nueva: ${titulo}`
    );
  }

  console.log(
    `Nuevas: ${nuevas}`
  );

  console.log(
    `Repetidas: ${repetidas}`
  );

  return {
    nuevas,
    repetidas,
  };
}

/* ============================================================
   PROCESO PRINCIPAL
============================================================ */

async function recolectarNoticias() {
  console.log("");
  console.log(
    "======================================"
  );
  console.log(
    "RECOMEDI - RECOLECTOR DE NOTICIAS"
  );
  console.log(
    "======================================"
  );

  let totalNuevas = 0;
  let totalRepetidas = 0;

  for (const fuente of FUENTES_NOTICIAS) {
    try {
      const resultado =
        await recolectarFuente(
          fuente
        );

      totalNuevas +=
        resultado.nuevas;

      totalRepetidas +=
        resultado.repetidas;
    } catch (error) {
      console.error("");

      console.error(
        `✗ Error en ${fuente.nombre}`
      );

      console.error(
        error?.message ||
        error
      );
    }
  }

  console.log("");
  console.log(
    "======================================"
  );
  console.log(
    "RESULTADO FINAL"
  );
  console.log(
    "======================================"
  );

  console.log(
    `Noticias nuevas: ${totalNuevas}`
  );

  console.log(
    `Noticias repetidas: ${totalRepetidas}`
  );

  console.log(
    "======================================"
  );
  console.log("");
}

recolectarNoticias()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(
      "ERROR GENERAL:"
    );

    console.error(error);

    process.exit(1);
  });