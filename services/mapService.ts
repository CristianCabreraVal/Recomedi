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
   URL DE OVERPASS

   Overpass permite realizar consultas sobre los datos de
   OpenStreetMap.
============================================================ */

const OVERPASS_URL =
  "https://overpass-api.de/api/interpreter";


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
     RADIO DE BÚSQUEDA

     5000 metros = 5 kilómetros.
  ---------------------------------------------------------- */

  const radio = 5000;


  /* ----------------------------------------------------------
     CONSULTA OVERPASS

     Se buscan establecimientos que tengan uno de los valores
     médicos definidos en las etiquetas "amenity" o "healthcare".

     "nwr" permite consultar:
     - nodes
     - ways
     - relations

     "out center tags" solicita las etiquetas y el centro
     geométrico de ways/relations.
  ---------------------------------------------------------- */

  const consulta = `
[out:json][timeout:25];

(
  nwr[
    "amenity"~"^(hospital|clinic|doctors|health_post)$"
  ](around:${radio},${lat},${lon});

  nwr[
    "healthcare"~"^(hospital|clinic|doctor|centre|health_post)$"
  ](around:${radio},${lat},${lon});
);

out center tags;
`;


  try {

    /* ========================================================
       PETICIÓN A OVERPASS
    ======================================================== */

    const respuesta = await fetch(
      OVERPASS_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded; charset=UTF-8",

          "Accept":
            "application/json",

          // Identifica la aplicación ante el servidor.
          "User-Agent":
            "Recomedi/1.0 (aplicacion-movil)",
        },

        /* ----------------------------------------------------
           Overpass espera la consulta dentro del parámetro
           "data".
        ---------------------------------------------------- */

        body:
          "data=" +
          encodeURIComponent(consulta),
      }
    );


    /* ========================================================
       COMPROBAR RESPUESTA
    ======================================================== */

    if (!respuesta.ok) {

      // Intentamos recuperar el mensaje devuelto por Overpass.
      const mensaje =
        await respuesta.text();

      console.error(
        "Respuesta de Overpass:",
        mensaje
      );

      throw new Error(
        `Error de Overpass: ${respuesta.status}`
      );
    }


    /* ========================================================
       CONVERTIR RESPUESTA A JSON
    ======================================================== */

    const json =
      await respuesta.json();


    /* --------------------------------------------------------
       Si la respuesta no tiene "elements", devolvemos una
       lista vacía en lugar de intentar procesar datos inválidos.
    -------------------------------------------------------- */

    if (
      !json ||
      !Array.isArray(json.elements)
    ) {
      return [];
    }


    /* ========================================================
       RESULTADOS
    ======================================================== */

    const resultados: CentroMedico[] = [];


    /* ========================================================
       PROCESAR CADA ELEMENTO

       Overpass puede devolver:
       - node
       - way
       - relation
    ======================================================== */

    for (
      const elemento of json.elements
    ) {

      /* ------------------------------------------------------
         Las etiquetas pueden no existir.
         En ese caso utilizamos un objeto vacío.
      ------------------------------------------------------ */

      const tags =
        elemento.tags ?? {};


      /* ------------------------------------------------------
         VARIABLES PARA LAS COORDENADAS
      ------------------------------------------------------ */

      let latitud:
        number | undefined;

      let longitud:
        number | undefined;


      /* ======================================================
         ELEMENTO TIPO NODE

         Los nodes tienen directamente:
         elemento.lat
         elemento.lon
      ====================================================== */

      if (
        typeof elemento.lat === "number" &&
        typeof elemento.lon === "number"
      ) {

        latitud =
          elemento.lat;

        longitud =
          elemento.lon;
      }


      /* ======================================================
         ELEMENTO TIPO WAY / RELATION

         Debido a "out center tags", Overpass entrega las
         coordenadas centrales dentro de "elemento.center".
      ====================================================== */

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


      /* ------------------------------------------------------
         Si no conseguimos coordenadas, no podemos mostrar
         el establecimiento en el mapa.
      ------------------------------------------------------ */

      if (
        latitud === undefined ||
        longitud === undefined
      ) {
        continue;
      }


      /* ======================================================
         CALCULAR DISTANCIA

         Se calcula la distancia entre:
         ubicación del usuario
         y
         ubicación del establecimiento.
      ====================================================== */

      const distanciaKm =
        calcularDistanciaKm(
          lat,
          lon,
          latitud,
          longitud
        );


      /* ======================================================
         CREAR OBJETO DEL CENTRO MÉDICO

         Aquí transformamos los datos de OpenStreetMap a la
         estructura que utilizan las pantallas de mapa.
      ====================================================== */

      resultados.push({

        /* ----------------------------------------------------
           ID ÚNICO

           Combina el tipo de elemento y el ID proporcionado
           por OpenStreetMap.
        ---------------------------------------------------- */

        id:
          `${elemento.type}-${elemento.id}`,

        /* Coordenadas del establecimiento */

        lat:
          latitud,

        lon:
          longitud,

        /* ----------------------------------------------------
           NOMBRE

           Primero intentamos utilizar el nombre oficial o
           proporcionado por OpenStreetMap.

           Si no existe, generamos uno según el tipo.
        ---------------------------------------------------- */

        display_name:
          tags.name ||
          tags.official_name ||
          obtenerNombrePorTipo(tags),

        /* Distancia calculada en kilómetros */

        distanciaKm,

        /* ----------------------------------------------------
           INFORMACIÓN ADICIONAL

           Estos campos son los que posteriormente utilizan
           mapa.tsx y mapa.web.tsx.
        ---------------------------------------------------- */

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
            tags["addr:housenumber"],

          city:
            tags["addr:city"],

          speciality:
            tags["healthcare:speciality"],
        },
      });
    }


    /* ========================================================
       ELIMINAR DUPLICADOS

       Un mismo establecimiento puede aparecer más de una vez
       porque la consulta busca mediante diferentes etiquetas
       (amenity y healthcare).

       Map utiliza el ID como clave para conservar solamente
       una instancia de cada establecimiento.
    ======================================================== */

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


    /* ========================================================
       ORDENAR RESULTADOS

       El establecimiento más cercano aparece primero.
    ======================================================== */

    unicos.sort(
      (a, b) =>
        a.distanciaKm -
        b.distanciaKm
    );


    /* ========================================================
       LIMITAR RESULTADOS

       Para evitar cargar demasiada información en los mapas,
       solamente devolvemos los primeros 20 centros.
    ======================================================== */

    return unicos.slice(
      0,
      20
    );

  } catch (error) {

    /* ========================================================
       ERROR GENERAL

       El error se registra y se vuelve a lanzar para que
       mapa.tsx o mapa.web.tsx puedan manejarlo.
    ======================================================== */

    console.error(
      "Error consultando Overpass:",
      error
    );

    throw error;
  }
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

  /* Radio aproximado de la Tierra en kilómetros. */
  const radioTierra =
    6371;


  /* Diferencias entre coordenadas convertidas a radianes. */

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
      gradosARadianes(lat1)
    ) *

    Math.cos(
      gradosARadianes(lat2)
    ) *

    Math.sin(
      diferenciaLon / 2
    ) ** 2;


  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
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

  /* ----------------------------------------------------------
     AMENITY
  ---------------------------------------------------------- */

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


  /* ----------------------------------------------------------
     HEALTHCARE
  ---------------------------------------------------------- */

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


  /* ----------------------------------------------------------
     VALOR POR DEFECTO
  ---------------------------------------------------------- */

  return "Centro médico";
}