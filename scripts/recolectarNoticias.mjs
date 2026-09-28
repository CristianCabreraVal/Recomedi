import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleDecoder } from "google-news-url-decoder";
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

const decoder =
  new GoogleDecoder();

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

  const urlNormalizada =
    normalizarUrl(url);

  if (
    !urlNormalizada.includes(
      "news.google.com"
    )
  ) {
    return urlNormalizada;
  }

  for (
    let intento = 1;
    intento <= 2;
    intento++
  ) {
    try {
      console.log(
        `Resolviendo URL de Google News... intento ${intento}`
      );

      const resultado =
        await decoder.decode(
          urlNormalizada
        );

      if (
        resultado?.status &&
        resultado?.decoded_url
      ) {
        const urlDecodificada =
          normalizarUrl(
            resultado.decoded_url
          );

        console.log(
          `URL oficial encontrada: ${urlDecodificada}`
        );

        return urlDecodificada;
      }

      console.log(
        `Decoder sin resultado: ${
          resultado?.message ||
          "respuesta vacía"
        }`
      );
    } catch (error) {
      console.log(
        `Error en intento ${intento}: ${
          error?.message ||
          error
        }`
      );
    }

    await new Promise(
      (resolve) =>
        setTimeout(resolve, 1500)
    );
  }

  try {
    const parsed =
      new URL(
        urlNormalizada
      );

    const partes =
      parsed.pathname.split("/");

    const indice =
      partes.findIndex(
        (parte) =>
          parte === "articles"
      );

    if (indice !== -1) {
      const codigo =
        partes[indice + 1];

      if (codigo) {
        const base64 =
          codigo
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const relleno =
          "=".repeat(
            (4 -
              (base64.length % 4)) %
              4
          );

        const buffer =
          Buffer.from(
            base64 + relleno,
            "base64"
          );

        const contenido =
          buffer.toString(
            "latin1"
          );

        const coincidencias =
          contenido.match(
            /https?:\/\/[^\x00-\x20"'<>]+/g
          );

        if (
          Array.isArray(
            coincidencias
          )
        ) {
          for (
            const posibleUrl of coincidencias
          ) {
            let limpia =
              posibleUrl;

            limpia =
              limpia.replace(
                /[),.;]+$/,
                ""
              );

            limpia =
              normalizarUrl(
                limpia
              );

            if (
              limpia &&
              !limpia.includes(
                "news.google.com"
              )
            ) {
              console.log(
                `URL encontrada directamente: ${limpia}`
              );

              return limpia;
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(
      `Error en extracción directa: ${
        error?.message ||
        error
      }`
    );
  }

  return "";
}

async function buscarUrlOficialPorTitulo(
  fuente,
  titulo
) {
  if (!titulo) {
    return "";
  }

  try {
    console.log(
      `Buscando URL oficial por título...`
    );

    const consulta =
      encodeURIComponent(
        `"${titulo}" site:${fuente.dominio}`
      );

    const urlBusqueda =
      `https://www.google.com/search?q=${consulta}&num=5`;

    const respuesta =
      await fetch(
        urlBusqueda,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml",
          },
          signal:
            AbortSignal.timeout(
              20000
            ),
        }
      );

    if (!respuesta.ok) {
      console.log(
        `Google devolvió HTTP ${respuesta.status}`
      );

      return "";
    }

    const html =
      await respuesta.text();

    const coincidencias =
      html.match(
        /https?:\/\/[^"'<> ]+/g
      ) || [];

    for (
      const posibleUrl of coincidencias
    ) {
      let url =
        posibleUrl
          .replace(
            /\\u003d/g,
            "="
          )
          .replace(
            /\\u0026/g,
            "&"
          )
          .replace(
            /\\u003F/g,
            "?"
          )
          .replace(
            /\\u002F/g,
            "/"
          );

      try {
        url =
          decodeURIComponent(
            url
          );
      } catch {
        // Mantener URL original.
      }

      url =
        normalizarUrl(
          url
        );

      if (
        esArticuloValido(
          fuente,
          url
        )
      ) {
        console.log(
          `URL oficial encontrada por título: ${url}`
        );

        return url;
      }
    }
  } catch (error) {
    console.log(
      `Error buscando URL por título: ${
        error?.message ||
        error
      }`
    );
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

// ==========================================================
// NUEVO: EXTRACCIÓN DE IMAGEN Y CONTENIDO DESDE LA PÁGINA
// OFICIAL. Esta capa NO modifica la lógica de URLs.
// ==========================================================

function extraerMeta(
  html,
  atributo,
  valor
) {
  const patron1 = new RegExp(
    `<meta[^>]+${atributo}=["']${valor}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );

  const patron2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+${atributo}=["']${valor}["'][^>]*>`,
    "i"
  );

  const resultado =
    html.match(patron1) ||
    html.match(patron2);

  return resultado?.[1] || "";
}

function convertirUrlAbsoluta(
  valor,
  urlBase
) {
  if (!valor) {
    return "";
  }

  try {
    return normalizarUrl(
      new URL(
        valor,
        urlBase
      ).toString()
    );
  } catch {
    return "";
  }
}

function limpiarContenidoHtml(
  html = ""
) {
  return String(html)
    .replace(
      /<script\b[^>]*>[\s\S]*?<\/script>/gi,
      " "
    )
    .replace(
      /<style\b[^>]*>[\s\S]*?<\/style>/gi,
      " "
    )
    .replace(
      /<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,
      " "
    )
    .replace(
      /<nav\b[^>]*>[\s\S]*?<\/nav>/gi,
      " "
    )
    .replace(
      /<header\b[^>]*>[\s\S]*?<\/header>/gi,
      " "
    )
    .replace(
      /<footer\b[^>]*>[\s\S]*?<\/footer>/gi,
      " "
    )
    .replace(
      /<aside\b[^>]*>[\s\S]*?<\/aside>/gi,
      " "
    )
    .replace(
      /<\/((p|div|section|article|h1|h2|h3|h4|h5|li|blockquote))>/gi,
      "\n"
    )
    .replace(
      /<(br|hr)\s*\/?>/gi,
      "\n"
    )
    .replace(
      /<li\b[^>]*>/gi,
      "\n• "
    )
    .replace(
      /<[^>]+>/g,
      " "
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, codigo) =>
      String.fromCharCode(
        Number(codigo)
      )
    )
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extraerArticleBodyDesdeJsonLd(
  html
) {
  const bloques =
    html.match(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi
    ) || [];

  for (const bloque of bloques) {
    const jsonTexto =
      bloque
        .replace(
          /<script[^>]*>/i,
          ""
        )
        .replace(
          /<\/script>\s*$/i,
          ""
        )
        .trim();

    try {
      const datos =
        JSON.parse(jsonTexto);

      const revisar = (objeto) => {
        if (!objeto) {
          return "";
        }

        if (Array.isArray(objeto)) {
          for (
            const elemento of objeto
          ) {
            const resultado =
              revisar(elemento);

            if (resultado) {
              return resultado;
            }
          }

          return "";
        }

        if (
          typeof objeto !== "object"
        ) {
          return "";
        }

        if (
          typeof objeto.articleBody ===
            "string" &&
          objeto.articleBody.trim()
        ) {
          return objeto.articleBody.trim();
        }

        if (
          typeof objeto.image === "string" &&
          !objeto.articleBody
        ) {
          // La imagen se maneja por separado.
        }

        if (
          Array.isArray(
            objeto["@graph"]
          )
        ) {
          const resultado =
            revisar(
              objeto["@graph"]
            );

          if (resultado) {
            return resultado;
          }
        }

        return "";
      };

      const resultado =
        revisar(datos);

      if (
        resultado &&
        resultado.length >= 200
      ) {
        return resultado;
      }
    } catch {
      // Ignorar JSON-LD inválido.
    }
  }

  return "";
}

function extraerImagenDesdeJsonLd(
  html,
  urlBase
) {
  const bloques =
    html.match(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi
    ) || [];

  for (const bloque of bloques) {
    const jsonTexto =
      bloque
        .replace(
          /<script[^>]*>/i,
          ""
        )
        .replace(
          /<\/script>\s*$/i,
          ""
        )
        .trim();

    try {
      const datos =
        JSON.parse(jsonTexto);

      const revisar = (objeto) => {
        if (!objeto) {
          return "";
        }

        if (Array.isArray(objeto)) {
          for (
            const elemento of objeto
          ) {
            const resultado =
              revisar(elemento);

            if (resultado) {
              return resultado;
            }
          }

          return "";
        }

        if (
          typeof objeto !== "object"
        ) {
          return "";
        }

        const imagen = objeto.image;

        if (
          typeof imagen === "string" &&
          imagen
        ) {
          return convertirUrlAbsoluta(
            imagen,
            urlBase
          );
        }

        if (
          imagen &&
          typeof imagen === "object"
        ) {
          if (
            typeof imagen.url === "string"
          ) {
            return convertirUrlAbsoluta(
              imagen.url,
              urlBase
            );
          }
        }

        if (
          Array.isArray(
            objeto["@graph"]
          )
        ) {
          return revisar(
            objeto["@graph"]
          );
        }

        return "";
      };

      const resultado =
        revisar(datos);

      if (resultado) {
        return resultado;
      }
    } catch {
      // Ignorar JSON-LD inválido.
    }
  }

  return "";
}

function extraerImagenDesdePagina(
  html,
  urlBase
) {
  const imagenJsonLd =
    extraerImagenDesdeJsonLd(
      html,
      urlBase
    );

  if (imagenJsonLd) {
    return imagenJsonLd;
  }

  const imagenMeta =
    extraerMeta(
      html,
      "property",
      "og:image"
    );

  if (imagenMeta) {
    return convertirUrlAbsoluta(
      imagenMeta,
      urlBase
    );
  }

  const imagenTwitter =
    extraerMeta(
      html,
      "name",
      "twitter:image"
    );

  if (imagenTwitter) {
    return convertirUrlAbsoluta(
      imagenTwitter,
      urlBase
    );
  }

  const imagenTwitterSrc =
    extraerMeta(
      html,
      "name",
      "twitter:image:src"
    );

  if (imagenTwitterSrc) {
    return convertirUrlAbsoluta(
      imagenTwitterSrc,
      urlBase
    );
  }

  const imagenLink =
    html.match(
      /<link[^>]+rel=["'][^"']*image_src[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i
    );

  if (imagenLink?.[1]) {
    return convertirUrlAbsoluta(
      imagenLink[1],
      urlBase
    );
  }

  const imagenes =
    html.match(
      /<img\b[^>]*>/gi
    ) || [];

  for (const etiqueta of imagenes) {
    const coincidencia =
      etiqueta.match(
        /\b(?:src|data-src|data-lazy-src|data-original)=['"]([^'"]+)['"]/i
      );

    if (
      !coincidencia?.[1]
    ) {
      continue;
    }

    const url =
      convertirUrlAbsoluta(
        coincidencia[1],
        urlBase
      );

    if (
      url &&
      !url.startsWith("data:")
    ) {
      return url;
    }
  }

  return "";
}

function extraerContenidoDesdePagina(
  html
) {
  const desdeJsonLd =
    extraerArticleBodyDesdeJsonLd(
      html
    );

  if (desdeJsonLd) {
    return limpiarContenidoHtml(
      desdeJsonLd
    );
  }

  const patrones = [
    /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    /<main\b[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]+class=["'][^"']*(?:article|article-content|news-content|news-detail|noticia|noticia-content|contenido|content|detalle)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]+id=["'][^"']*(?:article|noticia|contenido|content|detalle)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const patron of patrones) {
    const coincidencia =
      html.match(patron);

    if (
      coincidencia?.[1]
    ) {
      const contenido =
        limpiarContenidoHtml(
          coincidencia[1]
        );

      if (
        contenido.length >= 200
      ) {
        return contenido;
      }
    }
  }

  // Fallback adicional para portales institucionales:
  // tomar los párrafos largos cuando no existe un contenedor
  // claro para el artículo.
  const parrafos =
    html.match(
      /<p\b[^>]*>[\s\S]*?<\/p>/gi
    ) || [];

  const textosParrafos =
    parrafos
      .map((parrafo) =>
        limpiarContenidoHtml(
          parrafo
        )
      )
      .filter(
        (texto) =>
          texto.length >= 40
      );

  const contenidoParrafos =
    textosParrafos.join(
      "\n\n"
    );

  if (
    contenidoParrafos.length >= 400
  ) {
    return contenidoParrafos;
  }

  return "";
}

async function obtenerDatosDesdePaginaOficial(
  url
) {
  if (!url) {
    return {
      imagenUrl: "",
      contenido: "",
    };
  }

  try {
    console.log(
      `Obteniendo imagen y contenido desde: ${url}`
    );

    const respuesta =
      await fetch(
        url,
        {
          headers: HEADERS,
          redirect: "follow",
          signal:
            AbortSignal.timeout(
              30000
            ),
        }
      );

    console.log(
      `HTTP página oficial: ${respuesta.status}`
    );

    if (!respuesta.ok) {
      return {
        imagenUrl: "",
        contenido: "",
      };
    }

    const html =
      await respuesta.text();

    const urlFinal =
      respuesta.url || url;

    const imagenUrl =
      extraerImagenDesdePagina(
        html,
        urlFinal
      );

    const contenido =
      extraerContenidoDesdePagina(
        html
      );

    console.log(
      `Imagen encontrada: ${
        imagenUrl ? "SI" : "NO"
      }`
    );

    console.log(
      `Contenido encontrado: ${
        contenido ? "SI" : "NO"
      }`
    );

    return {
      imagenUrl,
      contenido,
    };
  } catch (error) {
    console.log(
      `Error obteniendo datos de la página oficial: ${
        error?.message ||
        error
      }`
    );

    return {
      imagenUrl: "",
      contenido: "",
    };
  }
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

// ==========================================================
// NUEVO: ENRIQUECER NOTICIAS YA EXISTENTES EN FIREBASE.
// Usa urlOficial y, solo si es una URL oficial válida,
// fuenteUrl como respaldo. NO modifica ninguna URL.
// ==========================================================

async function enriquecerNoticiasExistentes() {
  console.log(
    "\n=============================================="
  );

  console.log(
    "      ENRIQUECIENDO NOTICIAS EXISTENTES"
  );

  console.log(
    "=============================================="
  );

  const snapshot =
    await db
      .collection(COLECCION)
      .get();

  let procesadas = 0;
  let actualizadas = 0;
  let sinCambios = 0;

  for (
    const documento of snapshot.docs
  ) {
    const datos =
      documento.data();

    if (
      datos.imagenUrl &&
      datos.contenido
    ) {
      continue;
    }

    const fuente =
      FUENTES_NOTICIAS.find(
        (item) =>
          item.id ===
          datos.fuenteId
      );

    if (!fuente) {
      console.log(
        `\nNo se encontró configuración para fuenteId: ${datos.fuenteId || "desconocida"}`
      );
      continue;
    }

    let url = "";

    if (
      datos.urlOficial &&
      esArticuloValido(
        fuente,
        datos.urlOficial
      )
    ) {
      url =
        datos.urlOficial;
    } else if (
      datos.fuenteUrl &&
      esArticuloValido(
        fuente,
        datos.fuenteUrl
      )
    ) {
      url =
        datos.fuenteUrl;
    }

    // Nunca intentar extraer contenido de una URL de Google News.
    if (!url) {
      console.log(
        `\nSin URL oficial válida para: ${
          datos.titulo ||
          documento.id
        }`
      );
      continue;
    }

    procesadas++;

    console.log(
      `\nProcesando noticia: ${
        datos.titulo ||
        documento.id
      }`
    );

    console.log(
      `URL oficial utilizada: ${url}`
    );

    const datosPagina =
      await obtenerDatosDesdePaginaOficial(
        url
      );

    const cambios = {};

    if (
      !datos.imagenUrl &&
      datosPagina.imagenUrl
    ) {
      cambios.imagenUrl =
        datosPagina.imagenUrl;
    }

    if (
      !datos.contenido &&
      datosPagina.contenido
    ) {
      cambios.contenido =
        datosPagina.contenido;
    }

    if (
      Object.keys(cambios).length >
      0
    ) {
      await documento.ref.update(
        cambios
      );

      actualizadas++;

      console.log(
        "Noticia actualizada correctamente en Firebase."
      );

      console.log(
        `  imagenUrl: ${
          cambios.imagenUrl
            ? "SI"
            : "NO"
        }`
      );

      console.log(
        `  contenido: ${
          cambios.contenido
            ? "SI"
            : "NO"
        }`
      );
    } else {
      sinCambios++;

      console.log(
        "No se encontraron datos nuevos para actualizar."
      );
    }
  }

  console.log(
    "\n=============================================="
  );

  console.log(
    "RESUMEN DE ENRIQUECIMIENTO"
  );

  console.log(
    "=============================================="
  );

  console.log(
    `Noticias procesadas : ${procesadas}`
  );

  console.log(
    `Noticias actualizadas : ${actualizadas}`
  );

  console.log(
    `Noticias sin cambios : ${sinCambios}`
  );

  console.log(
    "=============================================="
  );
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

  let urlResuelta = "";

  try {
    urlResuelta =
      await resolverUrlGoogleNews(
        urlGoogle
      );
  } catch (error) {
    console.log(
      `No se pudo resolver Google News: ${
        error?.message || error
      }`
    );
  }

  // ==========================================================
  // DETERMINAR URL FINAL
  // ==========================================================

  let fuenteUrl = "";
  let urlOficial = "";
  let urlGoogleNews = "";
  let urlPendienteResolver = false;

  // ----------------------------------------------------------
  // 1. URL oficial obtenida mediante decoder
  // ----------------------------------------------------------

  if (
    esArticuloValido(
      fuente,
      urlResuelta
    )
  ) {
    fuenteUrl = urlResuelta;
    urlOficial = urlResuelta;
  }

  // ----------------------------------------------------------
  // 2. URL oficial declarada por Google News
  // ----------------------------------------------------------

  if (
    !fuenteUrl &&
    esArticuloValido(
      fuente,
      urlFuenteDeclarada
    )
  ) {
    fuenteUrl =
      urlFuenteDeclarada;

    urlOficial =
      urlFuenteDeclarada;
  }

  // ----------------------------------------------------------
  // 3. FALLBACK
  //
  // Si Google News no pudo resolver la URL,
  // NO descartamos la noticia.
  // Guardamos el enlace de Google News.
  // ----------------------------------------------------------

  if (
    !fuenteUrl &&
    urlGoogle &&
    urlGoogle.includes(
      "news.google.com"
    )
  ) {
    fuenteUrl =
      urlGoogle;

    urlGoogleNews =
      urlGoogle;

    urlPendienteResolver =
      true;

    console.log(
      "URL oficial no resuelta. Se guardará el enlace de Google News como respaldo."
    );
  }

  // ----------------------------------------------------------
  // 4. FALLBACK ADICIONAL
  //
  // Intentar localizar la noticia por título
  // directamente en el dominio de la fuente.
  // ----------------------------------------------------------

  if (
    !fuenteUrl
  ) {
    const urlPorTitulo =
      await buscarUrlOficialPorTitulo(
        fuente,
        titulo
      );

    if (
      esArticuloValido(
        fuente,
        urlPorTitulo
      )
    ) {
      fuenteUrl =
        urlPorTitulo;

      urlOficial =
        urlPorTitulo;

      urlPendienteResolver =
        false;

      console.log(
        `URL oficial recuperada por título: ${urlPorTitulo}`
      );
    }
  }

  // ----------------------------------------------------------
  // 5. Solo ignorar si realmente no existe ningún enlace
  // ----------------------------------------------------------

  if (!fuenteUrl) {
    return {
      estado: "ignorada",
      razon:
        "no-se-encontro-ningun-enlace",
      titulo,
    };
  }

  // ==========================================================
  // DEDUPLICACIÓN
  // ==========================================================

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

  // ==========================================================
  // CREAR NOTICIA
  // ==========================================================

  const documentoId =
    huella.slice(
      0,
      40
    );

  // ==========================================================
  // OBTENER IMAGEN Y CONTENIDO DE LA PÁGINA OFICIAL
  // ==========================================================

  let imagenUrl =
    obtenerImagen(item);

  let contenido =
    "";

  if (
    urlOficial &&
    esArticuloValido(
      fuente,
      urlOficial
    )
  ) {
    const datosPagina =
      await obtenerDatosDesdePaginaOficial(
        urlOficial
      );

    if (
      datosPagina.imagenUrl
    ) {
      imagenUrl =
        datosPagina.imagenUrl;
    }

    if (
      datosPagina.contenido
    ) {
      contenido =
        datosPagina.contenido;
    }
  }

  const noticia = {
    titulo,

    resumen:
      resumen ||
      "Noticia publicada por una fuente oficial.",

    contenido,

    imagenUrl,

    categoria:
      determinarCategoria(
        titulo,
        resumen
      ),

    fuente:
      fuente.nombre,

    fuenteId:
      fuente.id,

    // Puede ser la URL oficial o,
    // como respaldo, la URL de Google News.
    fuenteUrl,

    // URL original de Google News.
    urlGoogleNews:
      urlGoogleNews || "",

    // URL oficial cuando conseguimos resolverla.
    urlOficial:
      urlOficial || "",

    // true cuando la URL oficial todavía
    // no pudo resolverse.
    urlPendienteResolver,

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
    urlOficial,
    urlPendienteResolver,
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

      if (
        resultado.urlPendienteResolver
      ) {
        console.log(
          "  AVISO: se guardó enlace de Google News como respaldo."
        );
      }
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

  // Enriquecer documentos antiguos que ya están en Firebase
  // sin tocar su sistema actual de URLs ni su deduplicación.
  await enriquecerNoticiasExistentes();

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
      "ERROR FATAL:",
      error
    );

    process.exitCode = 1;
  }
);
