import * as cheerio from "cheerio";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "node:crypto";
import { FUENTES_NOTICIAS } from "./fuentesNoticias.mjs";

const COLECCION = "noticias";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; RecomediNewsCollector/1.0; +https://github.com/CristianCabreraVal/Recomedi)",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

function obtenerCredencialesFirebase() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

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
      credential: cert(obtenerCredencialesFirebase()),
    });
  }

  return getFirestore();
}

const db = iniciarFirebase();

function normalizarTexto(texto = "") {
  return String(texto)
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarTitulo(texto = "") {
  return normalizarTexto(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarUrl(url = "") {
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
      resultado.searchParams.delete(parametro);
    }

    return resultado.toString().replace(/\/$/, "");
  } catch {
    return normalizarTexto(url);
  }
}

function obtenerHost(url = "") {
  try {
    return new URL(url).hostname
      .toLowerCase()
      .replace(/^www\./, "");
  } catch {
    return "";
  }
}

function dominioPermitido(url, dominio) {
  const host = obtenerHost(url);

  if (!host) {
    return false;
  }

  const esperado = dominio
    .toLowerCase()
    .replace(/^www\./, "");

  return (
    host === esperado ||
    host.endsWith(`.${esperado}`)
  );
}

function convertirFecha(fecha = "") {
  if (!fecha) {
    return null;
  }

  const texto = normalizarTexto(fecha);

  const formatoDMY = texto.match(
    /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/
  );

  if (formatoDMY) {
    const [, dia, mes, anio] = formatoDMY;

    return new Date(
      Date.UTC(
        Number(anio),
        Number(mes) - 1,
        Number(dia)
      )
    ).toISOString();
  }

  const formatoYMD = texto.match(
    /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
  );

  if (formatoYMD) {
    const [, anio, mes, dia] = formatoYMD;

    return new Date(
      Date.UTC(
        Number(anio),
        Number(mes) - 1,
        Number(dia)
      )
    ).toISOString();
  }

  const fechaConvertida = new Date(texto);

  if (Number.isNaN(fechaConvertida.getTime())) {
    return null;
  }

  return fechaConvertida.toISOString();
}

function determinarCategoria(titulo, resumen) {
  const texto =
    `${titulo} ${resumen}`.toLowerCase();

  if (
    /alerta|brote|epidem|riesgo|emergencia|vigilancia|notificacion|notificación/.test(
      texto
    )
  ) {
    return "alerta";
  }

  if (
    /vacun|prevencion|prevención|campana|campaña|dengue|fiebre amarilla/.test(
      texto
    )
  ) {
    return "prevencion";
  }

  if (
    /hospital|medicamento|tratamiento|atencion|atención|servicio de salud|salud pública/.test(
      texto
    )
  ) {
    return "salud";
  }

  return "general";
}

function construirHuella(fuenteId, url) {
  return crypto
    .createHash("sha256")
    .update(
      `${fuenteId}|${normalizarUrl(url)}`
    )
    .digest("hex");
}

async function descargar(url) {
  const respuesta = await fetch(url, {
    headers: HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });

  if (!respuesta.ok) {
    throw new Error(
      `HTTP ${respuesta.status} al consultar ${url}`
    );
  }

  return {
    texto: await respuesta.text(),
    urlFinal: respuesta.url,
  };
}

async function cargarExistentes() {
  const snapshot =
    await db.collection(COLECCION).get();

  const urls = new Set();
  const huellas = new Set();
  const clavesTitulo = new Set();

  for (const doc of snapshot.docs) {
    const datos = doc.data();

    if (datos.fuenteUrl) {
      urls.add(
        normalizarUrl(datos.fuenteUrl)
      );
    }

    if (datos.huella) {
      huellas.add(String(datos.huella));
    }

    if (datos.fuenteId && datos.titulo) {
      clavesTitulo.add(
        `${datos.fuenteId}|${normalizarTitulo(
          datos.titulo
        )}`
      );
    }
  }

  return {
    urls,
    huellas,
    clavesTitulo,
  };
}

function extraerDatosArticulo(html, url) {
  const $ = cheerio.load(html);

  const meta = (selector) =>
    normalizarTexto(
      $(selector).first().attr("content") || ""
    );

  const titulo =
    meta('meta[property="og:title"]') ||
    meta('meta[name="twitter:title"]') ||
    normalizarTexto($("h1").first().text()) ||
    normalizarTexto($("title").first().text());

  const resumen =
    meta('meta[property="og:description"]') ||
    meta('meta[name="description"]') ||
    normalizarTexto(
      $("article p").first().text()
    ) ||
    normalizarTexto(
      $(".content p").first().text()
    );

  const imagenUrl =
    meta('meta[property="og:image"]') ||
    meta('meta[name="twitter:image"]');

  let fecha =
    meta('meta[property="article:published_time"]') ||
    meta('meta[name="date"]') ||
    "";

  if (!fecha) {
    const textoPagina = normalizarTexto(
      $("body").text()
    );

    const coincidencias = [
      textoPagina.match(
        /\b\d{1,2}-\d{1,2}-\d{4}\b/
      ),
      textoPagina.match(
        /\b\d{1,2}\/\d{1,2}\/\d{4}\b/
      ),
      textoPagina.match(
        /\b\d{4}-\d{1,2}-\d{1,2}\b/
      ),
    ];

    for (const coincidencia of coincidencias) {
      if (coincidencia?.[0]) {
        fecha = coincidencia[0];
        break;
      }
    }
  }

  let imagenFinal = imagenUrl;

  if (imagenFinal) {
    try {
      imagenFinal = new URL(
        imagenFinal,
        url
      ).toString();
    } catch {
      imagenFinal = "";
    }
  }

  return {
    titulo: normalizarTexto(titulo),
    resumen: normalizarTexto(resumen),
    imagenUrl: normalizarUrl(imagenFinal),
    fechaPublicacion: convertirFecha(fecha),
  };
}

async function obtenerMinSalud() {
  const fuente = FUENTES_NOTICIAS.find(
    (item) => item.id === "minsalud"
  );

  console.log("\n[MIN SALUD]");
  console.log(
    `Consultando sitemap: ${fuente.sitemapUrl}`
  );

  const sitemapsVisitados = new Set();
  const urlsEncontradas = [];

  async function recorrerSitemap(url, nivel = 0) {
    if (nivel > 2) {
      return;
    }

    const urlNormalizada =
      normalizarUrl(url);

    if (
      sitemapsVisitados.has(
        urlNormalizada
      )
    ) {
      return;
    }

    sitemapsVisitados.add(
      urlNormalizada
    );

    try {
      const { texto } =
        await descargar(urlNormalizada);

      const $ = cheerio.load(
        texto,
        { xmlMode: true }
      );

      $("sitemap loc").each(
        (_, elemento) => {
          const child =
            normalizarTexto($(elemento).text());

          if (child) {
            urlsEncontradas.push({
              tipo: "sitemap",
              url: child,
            });
          }
        }
      );

      $("url").each((_, elemento) => {
        const loc = normalizarTexto(
          $(elemento)
            .find("loc")
            .first()
            .text()
        );

        const lastmod =
          normalizarTexto(
            $(elemento)
              .find("lastmod")
              .first()
              .text()
          );

        if (
          loc &&
          loc.includes(
            fuente.rutaPermitida
          ) &&
          dominioPermitido(
            loc,
            fuente.dominio
          )
        ) {
          urlsEncontradas.push({
            tipo: "articulo",
            url: loc,
            lastmod,
          });
        }
      });

      const childSitemaps =
        urlsEncontradas.filter(
          (item) =>
            item.tipo === "sitemap" &&
            !sitemapsVisitados.has(
              normalizarUrl(item.url)
            )
        );

      urlsEncontradas.length =
        urlsEncontradas.filter(
          (item) => item.tipo === "articulo"
        ).length;

      for (const child of childSitemaps) {
        await recorrerSitemap(
          child.url,
          nivel + 1
        );
      }
    } catch (error) {
      console.error(
        `Error sitemap MinSalud: ${
          error?.message || error
        }`
      );
    }
  }

  await recorrerSitemap(
    fuente.sitemapUrl
  );

  const articulos = [];

  for (const item of urlsEncontradas) {
    if (
      item &&
      item.url &&
      dominioPermitido(
        item.url,
        fuente.dominio
      )
    ) {
      articulos.push(item);
    }
  }

  const unicos = new Map();

  for (const articulo of articulos) {
    unicos.set(
      normalizarUrl(articulo.url),
      articulo
    );
  }

  return [...unicos.values()]
    .sort((a, b) => {
      const fechaA =
        new Date(a.lastmod || 0).getTime();

      const fechaB =
        new Date(b.lastmod || 0).getTime();

      return fechaB - fechaA;
    })
    .slice(0, fuente.limite);
}

async function obtenerListado(fuente) {
  console.log(
    `\n[${fuente.nombre}]`
  );

  console.log(
    `Consultando: ${fuente.listadoUrl}`
  );

  const { texto } =
    await descargar(
      fuente.listadoUrl
    );

  const $ = cheerio.load(texto);

  const candidatos = new Map();

  $("a[href]").each(
    (_, elemento) => {
      const titulo =
        normalizarTexto(
          $(elemento).text()
        );

      const href =
        normalizarTexto(
          $(elemento).attr("href")
        );

      if (!titulo || !href) {
        return;
      }

      let url;

      try {
        url = new URL(
          href,
          fuente.listadoUrl
        ).toString();
      } catch {
        return;
      }

      url = normalizarUrl(url);

      if (
        !dominioPermitido(
          url,
          fuente.dominio
        )
      ) {
        return;
      }

      if (fuente.id === "cundinamarca") {
        if (
          !url.includes(
            "/dependencias/secsalud/noticias/"
          )
        ) {
          return;
        }
      }

      if (fuente.id === "ins") {
        if (
          !url.includes(
            "/Comunicaciones/Paginas/"
          )
        ) {
          return;
        }

        if (
          url.toLowerCase().includes(
            "historico.aspx"
          )
        ) {
          return;
        }
      }

      if (titulo.length < 15) {
        return;
      }

      candidatos.set(url, {
        url,
        titulo,
      });
    }
  );

  return [...candidatos.values()]
    .slice(0, fuente.limite);
}

async function guardarArticulo(
  fuente,
  url,
  existentes,
  tituloListado = ""
) {
  const urlNormalizada =
    normalizarUrl(url);

  const huella =
    construirHuella(
      fuente.id,
      urlNormalizada
    );

  if (
    existentes.urls.has(
      urlNormalizada
    ) ||
    existentes.huellas.has(huella)
  ) {
    return {
      estado: "duplicada",
      titulo: tituloListado,
      url: urlNormalizada,
    };
  }

  try {
    const {
      texto,
      urlFinal,
    } = await descargar(
      urlNormalizada
    );

    const datosArticulo =
      extraerDatosArticulo(
        texto,
        urlFinal || urlNormalizada
      );

    const titulo =
      datosArticulo.titulo ||
      tituloListado;

    if (!titulo) {
      return {
        estado: "ignorada",
        razon: "sin-titulo",
      };
    }

    const claveTitulo =
      `${fuente.id}|${normalizarTitulo(
        titulo
      )}`;

    if (
      existentes.clavesTitulo.has(
        claveTitulo
      )
    ) {
      return {
        estado: "duplicada",
        titulo,
        url: urlNormalizada,
      };
    }

    const documentoId =
      huella.slice(0, 40);

    const noticia = {
      titulo,

      resumen:
        datosArticulo.resumen ||
        "Noticia publicada por la fuente oficial.",

      contenido: "",

      imagenUrl:
        datosArticulo.imagenUrl || "",

      categoria:
        determinarCategoria(
          titulo,
          datosArticulo.resumen
        ),

      fuente: fuente.nombre,

      fuenteId: fuente.id,

      fuenteUrl:
        normalizarUrl(
          urlFinal || urlNormalizada
        ),

      fechaPublicacion:
        datosArticulo.fechaPublicacion,

      fechaCaptura:
        new Date().toISOString(),

      estado: "pendiente",

      tipo: "externa",

      creadoAutomaticamente: true,

      revisado: false,

      creadoPor:
        "recolector-automatico",

      huella,
    };

    await db
      .collection(COLECCION)
      .doc(documentoId)
      .set(noticia);

    existentes.urls.add(
      noticia.fuenteUrl
    );

    existentes.huellas.add(
      huella
    );

    existentes.clavesTitulo.add(
      claveTitulo
    );

    return {
      estado: "nueva",
      titulo,
      url: noticia.fuenteUrl,
    };
  } catch (error) {
    return {
      estado: "error",
      titulo: tituloListado,
      url: urlNormalizada,
      razon:
        error?.message || String(error),
    };
  }
}

async function procesarFuente(
  fuente,
  existentes
) {
  let candidatos = [];

  if (fuente.tipo === "sitemap") {
    candidatos =
      await obtenerMinSalud();
  } else {
    candidatos =
      await obtenerListado(
        fuente
      );
  }

 console.log(
  `Candidatos encontrados: ${candidatos.length}`
);

for (const candidato of candidatos) {
  console.log(
    `CANDIDATO -> ${candidato.titulo || "SIN TITULO"}`
  );

  console.log(
    `URL -> ${candidato.url}`
  );
}

  let nuevas = 0;
  let duplicadas = 0;
  let ignoradas = 0;
  let errores = 0;

  for (const candidato of candidatos) {
    const resultado =
      await guardarArticulo(
        fuente,
        candidato.url,
        existentes,
        candidato.titulo
      );

    if (
      resultado.estado === "nueva"
    ) {
      nuevas++;

      console.log(
        `  + NUEVA: ${resultado.titulo}`
      );

      console.log(
        `    ${resultado.url}`
      );
    }

    if (
      resultado.estado === "duplicada"
    ) {
      duplicadas++;

      console.log(
        `  = DUPLICADA: ${
          resultado.titulo
        }`
      );
    }

    if (
      resultado.estado === "ignorada"
    ) {
      ignoradas++;

      console.log(
        `  - IGNORADA: ${
          resultado.razon
        }`
      );
    }

    if (
      resultado.estado === "error"
    ) {
      errores++;

      console.log(
        `  ! ERROR: ${
          resultado.razon
        }`
      );
    }
  }

  return {
    nuevas,
    duplicadas,
    ignoradas,
    errores,
  };
}

async function main() {
  console.log(
    "=============================================="
  );

  console.log(
    "     RECOMEDI - RECOLECTOR DE NOTICIAS"
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
    `Noticias existentes en Firebase: ${
      existentes.urls.size
    }`
  );

  let totalNuevas = 0;
  let totalDuplicadas = 0;
  let totalIgnoradas = 0;
  let totalErrores = 0;

  for (const fuente of FUENTES_NOTICIAS) {
    try {
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

      totalErrores +=
        resultado.errores;
    } catch (error) {
      totalErrores++;

      console.error(
        `ERROR EN FUENTE ${fuente.id}:`,
        error?.message || error
      );
    }
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
    `Errores               : ${totalErrores}`
  );

  console.log(
    "=============================================="
  );
}

main().catch((error) => {
  console.error(
    "ERROR FATAL:",
    error
  );

  process.exitCode = 1;
});