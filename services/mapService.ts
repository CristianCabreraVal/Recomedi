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

const OVERPASS_URL =
  "https://overpass-api.de/api/interpreter";

export async function buscarCentrosMedicos(
  lat: number,
  lon: number
): Promise<CentroMedico[]> {
  const radio = 5000;

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
const respuesta = await fetch(
  OVERPASS_URL,
  {
    method: "POST",
    headers: {
      "Content-Type":
        "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "application/json",

      // Identifica nuestra aplicación ante Overpass
      "User-Agent":
        "Recomedi/1.0 (aplicacion-movil)",
    },
    body:
      "data=" +
      encodeURIComponent(consulta),
  }
);

    if (!respuesta.ok) {
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

    const json = await respuesta.json();

    if (
      !json ||
      !Array.isArray(json.elements)
    ) {
      return [];
    }

    const resultados: CentroMedico[] = [];

    for (const elemento of json.elements) {
      const tags = elemento.tags ?? {};

      let latitud: number | undefined;
      let longitud: number | undefined;

      /*
       * ELEMENTO TIPO NODE
       */
      if (
        typeof elemento.lat === "number" &&
        typeof elemento.lon === "number"
      ) {
        latitud = elemento.lat;
        longitud = elemento.lon;
      }

      /*
       * ELEMENTO TIPO WAY / RELATION
       *
       * "out center" proporciona el centro
       * de estos elementos.
       */
      else if (
        elemento.center &&
        typeof elemento.center.lat === "number" &&
        typeof elemento.center.lon === "number"
      ) {
        latitud = elemento.center.lat;
        longitud = elemento.center.lon;
      }

      if (
        latitud === undefined ||
        longitud === undefined
      ) {
        continue;
      }

      const distanciaKm =
        calcularDistanciaKm(
          lat,
          lon,
          latitud,
          longitud
        );

      resultados.push({
        id: `${elemento.type}-${elemento.id}`,

        lat: latitud,

        lon: longitud,

        display_name:
          tags.name ||
          tags.official_name ||
          obtenerNombrePorTipo(tags),

        distanciaKm,

tags: {
  name: tags.name,

  amenity: tags.amenity,

  healthcare: tags.healthcare,

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

    /*
     * ELIMINAR DUPLICADOS
     */
    const unicos = Array.from(
      new Map(
        resultados.map((lugar) => [
          lugar.id,
          lugar,
        ])
      ).values()
    );

    /*
     * ORDENAR DEL MÁS CERCANO
     * AL MÁS LEJANO
     */
    unicos.sort(
      (a, b) =>
        a.distanciaKm - b.distanciaKm
    );

    /*
     * MÁXIMO 20 RESULTADOS
     */
    return unicos.slice(0, 20);
  } catch (error) {
    console.error(
      "Error consultando Overpass:",
      error
    );

    throw error;
  }
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
  const radioTierra = 6371;

  const diferenciaLat =
    gradosARadianes(lat2 - lat1);

  const diferenciaLon =
    gradosARadianes(lon2 - lon1);

  const a =
    Math.sin(diferenciaLat / 2) ** 2 +
    Math.cos(
      gradosARadianes(lat1)
    ) *
      Math.cos(
        gradosARadianes(lat2)
      ) *
      Math.sin(diferenciaLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return radioTierra * c;
}

/* ============================================================
   GRADOS → RADIANES
============================================================ */

function gradosARadianes(
  grados: number
): number {
  return (
    (grados * Math.PI) / 180
  );
}

/* ============================================================
   NOMBRE SEGÚN EL TIPO
============================================================ */

function obtenerNombrePorTipo(
  tags: any
): string {
  if (tags.amenity === "hospital") {
    return "Hospital";
  }

  if (tags.amenity === "clinic") {
    return "Clínica";
  }

  if (tags.amenity === "doctors") {
    return "Consultorio médico";
  }

  if (tags.amenity === "health_post") {
    return "Puesto de salud";
  }

  if (tags.amenity === "pharmacy") {
    return "Farmacia";
  }

  if (tags.healthcare === "hospital") {
    return "Hospital";
  }

  if (tags.healthcare === "clinic") {
    return "Clínica";
  }

  if (tags.healthcare === "doctor") {
    return "Consultorio médico";
  }

  if (tags.healthcare === "centre") {
    return "Centro de salud";
  }

  return "Centro médico";
}