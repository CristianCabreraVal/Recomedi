/* ============================================================
   SERVICIO DE CENTROS MÉDICOS

   Este archivo se encarga de consultar establecimientos médicos
   cercanos utilizando la API de Overpass de OpenStreetMap.

   Flujo principal:

   1. Recibe latitud y longitud del usuario.
   2. Consulta establecimientos dentro de 5 km.
   3. Obtiene las coordenadas de cada establecimiento.
   4. Calcula la distancia desde el usuario.
   5. Elimina duplicados.
   6. Ordena los resultados por distancia.
   7. Devuelve como máximo 20 establecimientos.

   MEJORAS:

   - Usa varias instancias de Overpass.
   - Usa una instancia alternativa primero.
   - Si una instancia falla, prueba la siguiente.
   - Comprueba que la respuesta realmente sea JSON.
   - Tiene timeout real de 15 segundos.
   - Evita que Android quede cargando indefinidamente.
============================================================ */


/* ============================================================
   TIPO CENTRO MÉDICO
============================================================ */

export type CentroMedico = {
  id: string;

  lat: number;

  lon: number;

  display_name: string;

  distanciaKm: number;

  tags: {
    name?: string;
    amenity?: string;
    healthcare?: string;
    phone?: string;
    website?: string;
    opening_hours?: string;
    street?: string;
    houseNumber?: string;
    city?: string;
    speciality?: string;
  };
};


/* ============================================================
   INSTANCIAS DE OVERPASS

   Private.coffee actualmente aparece como una instancia
   pública global de Overpass.

   overpass-api.de queda como respaldo.
============================================================ */

const OVERPASS_URLS = [
  "https://overpass.private.coffee/api/interpreter",

  "https://overpass-api.de/api/interpreter",
];


/* ============================================================
   CONFIGURACIÓN
============================================================ */

const RADIO_BUSQUEDA =
  2000;


/*
 * Tiempo máximo que esperamos una respuesta HTTP.
 *
 * 15 segundos es suficiente para una consulta local
 * relativamente pequeña y evita dejar Android esperando
 * indefinidamente.
 */
const TIMEOUT_CLIENTE =
  30000;


/*
 * Timeout solicitado a Overpass.
 *
 * Debe ser coherente con el timeout del cliente.
 */
const TIMEOUT_OVERPASS =
  30;


/* ============================================================
   BUSCAR CENTROS MÉDICOS
============================================================ */

export async function buscarCentrosMedicos(
  lat: number,
  lon: number
): Promise<CentroMedico[]> {

  /* ----------------------------------------------------------
     VALIDAR COORDENADAS
  ---------------------------------------------------------- */

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {
    throw new Error(
      "Las coordenadas proporcionadas no son válidas."
    );
  }


  /* ----------------------------------------------------------
     CONSULTA OVERPASS

     Buscamos:

     amenity:
     - hospital
     - clinic
     - doctors
     - health_post

     healthcare:
     - hospital
     - clinic
     - doctor
     - centre
     - health_post

     Radio:
     5 km.
  ---------------------------------------------------------- */

  const consulta = `
[out:json][timeout:${TIMEOUT_OVERPASS}];

(
  nwr[
    "amenity"~"^(hospital|clinic|doctors|health_post)$"
  ](around:${RADIO_BUSQUEDA},${lat},${lon});

  nwr[
    "healthcare"~"^(hospital|clinic|doctor|centre|health_post)$"
  ](around:${RADIO_BUSQUEDA},${lat},${lon});
);

out center tags;
`;


  /* ==========================================================
     INTENTAR DIFERENTES INSTANCIAS

     Se hacen de forma secuencial para evitar consultas
     simultáneas.
  ========================================================== */

  let ultimoError: unknown =
    null;


  for (
    const overpassUrl of OVERPASS_URLS
  ) {

    try {

      console.log(
        "Consultando Overpass:",
        overpassUrl
      );


      /* ======================================================
         ABORT CONTROLLER
      ====================================================== */

      const controller =
        new AbortController();


      const timeout =
        setTimeout(
          () => {
            controller.abort();
          },
          TIMEOUT_CLIENTE
        );


      let respuesta: Response;


      try {

        /* ====================================================
           PETICIÓN A OVERPASS
        ==================================================== */

        respuesta =
          await fetch(
            overpassUrl,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/x-www-form-urlencoded; charset=UTF-8",

                "Accept":
                  "application/json",

                /*
                 * Identifica la aplicación que realiza
                 * la consulta.
                 */
                "User-Agent":
                  "Recomedi/1.0 (aplicacion de salud)",
              },

              /*
               * Overpass espera la consulta dentro
               * del parámetro data.
               */
              body:
                "data=" +
                encodeURIComponent(
                  consulta
                ),

              signal:
                controller.signal,
            }
          );

      } finally {

        clearTimeout(
          timeout
        );
      }


      /* ======================================================
         LEER RESPUESTA COMO TEXTO

         Esto permite detectar HTML de error como el 406
         que estás viendo actualmente.
      ====================================================== */

      const contenido =
        await respuesta.text();


      /* ======================================================
         COMPROBAR ESTADO HTTP
      ====================================================== */

      if (!respuesta.ok) {

        console.warn(
          `Overpass respondió HTTP ${respuesta.status}:`,
          overpassUrl
        );


        console.warn(
          "Respuesta de Overpass:",
          contenido.slice(
            0,
            500
          )
        );


        ultimoError =
          new Error(
            `Error HTTP ${respuesta.status} en Overpass`
          );


        /*
         * Probamos la siguiente instancia.
         */
        continue;
      }


      /* ======================================================
         COMPROBAR RESPUESTA VACÍA
      ====================================================== */

      if (
        !contenido ||
        contenido.trim().length === 0
      ) {

        console.warn(
          "Overpass devolvió una respuesta vacía:",
          overpassUrl
        );


        ultimoError =
          new Error(
            "Overpass devolvió una respuesta vacía."
          );


        continue;
      }


      /* ======================================================
         DETECTAR POSIBLES ERRORES DE OVERPASS
      ====================================================== */

      const contenidoMinusculas =
        contenido.toLowerCase();


      const respuestaConError =
        contenidoMinusculas.includes(
          "dispatcher_client"
        ) ||
        contenidoMinusculas.includes(
          "runtime error"
        ) ||
        contenidoMinusculas.includes(
          "server is probably too busy"
        ) ||
        contenidoMinusculas.includes(
          "timeout"
        );


      if (
        respuestaConError
      ) {

        console.warn(
          "La instancia de Overpass está ocupada o tuvo un timeout:",
          overpassUrl
        );


        console.warn(
          "Respuesta:",
          contenido.slice(
            0,
            500
          )
        );


        ultimoError =
          new Error(
            "Servidor Overpass ocupado o con timeout."
          );


        continue;
      }


      /* ======================================================
         CONVERTIR RESPUESTA A JSON
      ====================================================== */

      let json: any;


      try {

        json =
          JSON.parse(
            contenido
          );

      } catch (
        error
      ) {

        console.warn(
          "Overpass no devolvió JSON válido:",
          overpassUrl
        );


        console.warn(
          "Contenido recibido:",
          contenido.slice(
            0,
            500
          )
        );


        ultimoError =
          error;


        continue;
      }


      /* ======================================================
         VALIDAR ESTRUCTURA
      ====================================================== */

      if (
        !json ||
        !Array.isArray(
          json.elements
        )
      ) {

        console.warn(
          "La respuesta de Overpass no contiene 'elements':",
          overpassUrl
        );


        ultimoError =
          new Error(
            "Respuesta de Overpass sin elementos."
          );


        continue;
      }


      /* ======================================================
         CONSULTA EXITOSA
      ====================================================== */

      console.log(
        "Consulta Overpass exitosa:",
        overpassUrl
      );

      console.log(
        "Elementos recibidos:",
        json.elements.length
      );


      /* ======================================================
         RESULTADOS
      ====================================================== */

      const resultados: CentroMedico[] =
        [];


      /* ======================================================
         PROCESAR CADA ELEMENTO
      ====================================================== */

      for (
        const elemento of json.elements
      ) {

        /* ----------------------------------------------------
           ETIQUETAS
        ---------------------------------------------------- */

        const tags =
          elemento.tags ??
          {};


        /* ----------------------------------------------------
           COORDENADAS
        ---------------------------------------------------- */

        let latitud:
          number | undefined;

        let longitud:
          number | undefined;


        /* ====================================================
           NODE
        ==================================================== */

        if (
          typeof elemento.lat === "number" &&
          typeof elemento.lon === "number"
        ) {

          latitud =
            elemento.lat;

          longitud =
            elemento.lon;
        }


        /* ====================================================
           WAY / RELATION

           "out center tags" proporciona las coordenadas
           centrales.
        ==================================================== */

        else if (
          elemento.center &&
          typeof elemento.center.lat === "number" &&
          typeof elemento.center.lon === "number"
        ) {

          latitud =
            elemento.center.lat;

          longitud =
            elemento.center.lon;
        }


        /* ----------------------------------------------------
           Sin coordenadas no podemos colocar el marcador.
        ---------------------------------------------------- */

        if (
          latitud === undefined ||
          longitud === undefined
        ) {
          continue;
        }


        /* ====================================================
           CALCULAR DISTANCIA
        ==================================================== */

        const distanciaKm =
          calcularDistanciaKm(
            lat,
            lon,
            latitud,
            longitud
          );


        /* ====================================================
           CREAR CENTRO MÉDICO
        ==================================================== */

        resultados.push({

          id:
            `${elemento.type}-${elemento.id}`,

          lat:
            latitud,

          lon:
            longitud,

          display_name:
            tags.name ||
            tags.official_name ||
            obtenerNombrePorTipo(
              tags
            ),

          distanciaKm,

          tags: {

            name:
              tags.name,

            amenity:
              tags.amenity,

            healthcare:
              tags.healthcare,

            phone:
              tags.phone ||
              tags["contact:phone"],

            website:
              tags.website ||
              tags["contact:website"],

            opening_hours:
              tags.opening_hours,

            street:
              tags["addr:street"],

            houseNumber:
              tags[
                "addr:housenumber"
              ],

            city:
              tags["addr:city"],

            speciality:
              tags[
                "healthcare:speciality"
              ],
          },
        });
      }


      /* ======================================================
         ELIMINAR DUPLICADOS
      ====================================================== */

      const unicos =
        Array.from(
          new Map(
            resultados.map(
              (lugar) => [
                lugar.id,
                lugar,
              ]
            )
          ).values()
        );


      /* ======================================================
         ORDENAR POR DISTANCIA
      ====================================================== */

      unicos.sort(
        (a, b) =>
          a.distanciaKm -
          b.distanciaKm
      );


      /* ======================================================
         DEVOLVER MÁXIMO 20
      ====================================================== */

      return unicos.slice(
        0,
        20
      );

    } catch (
      error
    ) {

      /* ======================================================
         ERROR DE ESTA INSTANCIA

         Guardamos el error y probamos otra instancia.
      ====================================================== */

      ultimoError =
        error;


      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {

        console.warn(
          "Timeout de conexión con Overpass:",
          overpassUrl
        );

      } else {

        console.warn(
          "Error conectando con Overpass:",
          overpassUrl,
          error
        );
      }
    }
  }


  /* ==========================================================
     NINGUNA INSTANCIA FUNCIONÓ
  ========================================================== */

  console.error(
    "Todas las instancias de Overpass fallaron.",
    ultimoError
  );


  throw new Error(
    "No fue posible obtener los centros médicos desde OpenStreetMap. Intenta nuevamente."
  );
}


/* ============================================================
   CALCULAR DISTANCIA
============================================================ */

function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {

  const radioTierra =
    6371;


  const diferenciaLat =
    gradosARadianes(
      lat2 - lat1
    );

  const diferenciaLon =
    gradosARadianes(
      lon2 - lon1
    );


  const a =
    Math.sin(
      diferenciaLat / 2
    ) ** 2 +

    Math.cos(
      gradosARadianes(
        lat1
      )
    ) *

    Math.cos(
      gradosARadianes(
        lat2
      )
    ) *

    Math.sin(
      diferenciaLon / 2
    ) ** 2;


  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(
        1 - a
      )
    );


  return (
    radioTierra * c
  );
}


/* ============================================================
   GRADOS → RADIANES
============================================================ */

function gradosARadianes(
  grados: number
): number {

  return (
    (grados * Math.PI) /
    180
  );
}


/* ============================================================
   OBTENER NOMBRE SEGÚN TIPO
============================================================ */

function obtenerNombrePorTipo(
  tags: any
): string {

  /* ==========================================================
     AMENITY
  ========================================================== */

  if (
    tags.amenity ===
    "hospital"
  ) {
    return "Hospital";
  }


  if (
    tags.amenity ===
    "clinic"
  ) {
    return "Clínica";
  }


  if (
    tags.amenity ===
    "doctors"
  ) {
    return "Consultorio médico";
  }


  if (
    tags.amenity ===
    "health_post"
  ) {
    return "Puesto de salud";
  }


  if (
    tags.amenity ===
    "pharmacy"
  ) {
    return "Farmacia";
  }


  /* ==========================================================
     HEALTHCARE
  ========================================================== */

  if (
    tags.healthcare ===
    "hospital"
  ) {
    return "Hospital";
  }


  if (
    tags.healthcare ===
    "clinic"
  ) {
    return "Clínica";
  }


  if (
    tags.healthcare ===
    "doctor"
  ) {
    return "Consultorio médico";
  }


  if (
    tags.healthcare ===
    "centre"
  ) {
    return "Centro de salud";
  }


  if (
    tags.healthcare ===
    "health_post"
  ) {
    return "Puesto de salud";
  }


  /* ==========================================================
     VALOR POR DEFECTO
  ========================================================== */

  return "Centro médico";
}