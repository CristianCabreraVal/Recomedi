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

   - Utiliza varias instancias de Overpass.
   - Si una instancia está saturada, prueba otra.
   - Comprueba que la respuesta realmente sea JSON.
   - Tiene timeout del lado de la aplicación.
   - Evita que un error temporal de Overpass rompa
     inmediatamente la búsqueda.
============================================================ */


/* ============================================================
   TIPO CENTRO MÉDICO

   Define la estructura que reciben mapa.tsx y mapa.web.tsx.
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

   Se utilizan varias instancias para evitar depender de un
   único servidor.

   IMPORTANTE:

   maps.mail.ru no se utiliza aquí porque su servicio indica
   que no dispone del encabezado CORS necesario para
   aplicaciones web.

   Estas instancias tienen cobertura global.
============================================================ */

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",

  "https://overpass.private.coffee/api/interpreter",
];


/* ============================================================
   CONFIGURACIÓN

   RADIO:
   5000 metros = 5 kilómetros.

   TIMEOUT:
   Tiempo máximo que nuestra aplicación esperará a una
   instancia antes de pasar a la siguiente.

   No aumentamos innecesariamente el timeout de Overpass.
   Overpass utiliza el timeout también para decidir si
   acepta una consulta. Un valor demasiado alto puede hacer
   que una consulta sea rechazada antes de ejecutarse.
============================================================ */

const RADIO_BUSQUEDA =
  5000;

const TIMEOUT_CLIENTE =
  3000000000000;


/* ============================================================
   BUSCAR CENTROS MÉDICOS

   Recibe:
   - lat: latitud del usuario.
   - lon: longitud del usuario.

   Devuelve:
   - Una lista de hasta 20 centros médicos cercanos.
============================================================ */

export async function buscarCentrosMedicos(
  lat: number,
  lon: number
): Promise<CentroMedico[]> {

  /* ----------------------------------------------------------
     VALIDAR COORDENADAS

     Evita enviar consultas inválidas a Overpass.
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

     Buscamos establecimientos médicos dentro de 5 km.

     "nwr" permite consultar:
     - nodes
     - ways
     - relations

     "out center tags" solicita:
     - etiquetas
     - centro geométrico para ways y relations
  ---------------------------------------------------------- */

  const consulta = `
[out:json][timeout:25];

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


  /* ========================================================
     INTENTAR DIFERENTES INSTANCIAS

     Se prueban de forma SECUENCIAL.

     No se hacen las peticiones simultáneamente para evitar
     generar varias consultas al mismo tiempo desde la misma IP.
  ======================================================== */

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

         Permite cancelar la petición si tarda demasiado.
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
              },

              /*
               * Overpass espera la consulta dentro del
               * parámetro "data".
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
         LEER RESPUESTA

         La leemos como texto primero.

         Esto es importante porque Overpass puede devolver
         HTML/XML cuando ocurre un error.
      ====================================================== */

      const contenido =
        await respuesta.text();


      /* ======================================================
         COMPROBAR ESTADO HTTP

         Si es 504, 429, 400, 500, etc., probamos la
         siguiente instancia.
      ====================================================== */

      if (!respuesta.ok) {

        console.warn(
          `Overpass respondió HTTP ${respuesta.status}:`,
          overpassUrl
        );


        /*
         * Mostramos solamente una parte del contenido para
         * no llenar completamente la consola.
         */
        console.warn(
          "Respuesta de Overpass:",
          contenido.slice(
            0,
            1000
          )
        );


        ultimoError =
          new Error(
            `Error HTTP ${respuesta.status} en Overpass`
          );


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
         DETECTAR ERRORES DE OVERPASS

         Algunas respuestas de error pueden devolver HTTP
         200 pero contener mensajes de error en el contenido.

         Por eso también comprobamos el texto.
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
            1000
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
            1000
          )
        );


        ultimoError =
          error;


        continue;
      }


      /* ======================================================
         VALIDAR ESTRUCTURA

         Si la respuesta no tiene elements, consideramos que
         no existen resultados válidos.
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
         SI LLEGAMOS AQUÍ:

         La consulta fue correcta.

         Continuamos normalmente con el procesamiento que ya
         tenía Recomedi.
      ====================================================== */

      console.log(
        "Consulta Overpass exitosa:",
        overpassUrl
      );


      /* ======================================================
         RESULTADOS
      ====================================================== */

      const resultados: CentroMedico[] =
        [];


      /* ======================================================
         PROCESAR CADA ELEMENTO

         Overpass puede devolver:
         - node
         - way
         - relation
      ====================================================== */

      for (
        const elemento of json.elements
      ) {

        /* ----------------------------------------------------
           Las etiquetas pueden no existir.
        ---------------------------------------------------- */

        const tags =
          elemento.tags ??
          {};


        /* ----------------------------------------------------
           VARIABLES PARA LAS COORDENADAS
        ---------------------------------------------------- */

        let latitud:
          number | undefined;

        let longitud:
          number | undefined;


        /* ====================================================
           ELEMENTO TIPO NODE

           Los nodes tienen directamente:
           elemento.lat
           elemento.lon
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
           ELEMENTO TIPO WAY / RELATION

           Debido a "out center tags", Overpass entrega las
           coordenadas centrales dentro de "elemento.center".
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
           Si no conseguimos coordenadas, no podemos mostrar
           el establecimiento en el mapa.
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
           CREAR OBJETO DEL CENTRO MÉDICO
        ==================================================== */

        resultados.push({

          /* --------------------------------------------------
             ID ÚNICO
          -------------------------------------------------- */

          id:
            `${elemento.type}-${elemento.id}`,

          /* --------------------------------------------------
             COORDENADAS
          -------------------------------------------------- */

          lat:
            latitud,

          lon:
            longitud,

          /* --------------------------------------------------
             NOMBRE

             Primero buscamos:
             1. name
             2. official_name
             3. nombre generado por tipo
          -------------------------------------------------- */

          display_name:
            tags.name ||
            tags.official_name ||
            obtenerNombrePorTipo(
              tags
            ),

          /* --------------------------------------------------
             DISTANCIA
          -------------------------------------------------- */

          distanciaKm,

          /* --------------------------------------------------
             INFORMACIÓN ADICIONAL
          -------------------------------------------------- */

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

         Un establecimiento puede aparecer tanto en amenity
         como en healthcare.
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
         ORDENAR RESULTADOS

         El establecimiento más cercano aparece primero.
      ====================================================== */

      unicos.sort(
        (a, b) =>
          a.distanciaKm -
          b.distanciaKm
      );


      /* ======================================================
         LIMITAR RESULTADOS

         Devolvemos solamente los primeros 20.
      ====================================================== */

      return unicos.slice(
        0,
        20
      );

    } catch (
      error
    ) {

      /* ======================================================
         ERROR DE UNA INSTANCIA

         No detenemos inmediatamente todo el proceso.

         Guardamos el error y probamos la siguiente instancia.
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

   Utiliza la fórmula de Haversine para calcular la distancia
   aproximada entre dos coordenadas geográficas.

   Resultado:
   kilómetros.
============================================================ */

function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {

  /* ----------------------------------------------------------
     Radio aproximado de la Tierra en kilómetros.
  ---------------------------------------------------------- */

  const radioTierra =
    6371;


  /* ----------------------------------------------------------
     Diferencias entre coordenadas convertidas a radianes.
  ---------------------------------------------------------- */

  const diferenciaLat =
    gradosARadianes(
      lat2 - lat1
    );

  const diferenciaLon =
    gradosARadianes(
      lon2 - lon1
    );


  /* ----------------------------------------------------------
     Parte principal de la fórmula de Haversine.
  ---------------------------------------------------------- */

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

   JavaScript utiliza radianes en las funciones trigonométricas.
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
   NOMBRE SEGÚN EL TIPO

   Algunos establecimientos de OpenStreetMap no tienen un
   nombre definido.

   En ese caso generamos un nombre utilizando sus etiquetas.
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