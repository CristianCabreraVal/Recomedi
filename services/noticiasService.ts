import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "./firebase";

export type EstadoNoticia =
  | "pendiente"
  | "publicada"
  | "rechazada";

export type Noticia = {
  id: string;
  titulo: string;
  resumen: string;
  contenido: string;
  imagenUrl: string;
  categoria: string;
  fuente: string;
  fuenteId: string;
  fuenteUrl: string;
  urlGoogleNews?: string;
  urlOficial?: string;
  urlPendienteResolver?: boolean;
  fechaPublicacion: unknown;
  fechaCaptura: unknown;
  estado: EstadoNoticia;
  tipo: string;
  creadoAutomaticamente: boolean;
  revisado: boolean;
  creadoPor: string;
  revisadoPor?: string;
  fechaRevision?: unknown;
};

const COLECCION = "noticias";

function convertirFechaAMillis(
  fecha: unknown
): number {
  if (!fecha) {
    return 0;
  }

  if (
    typeof fecha === "object" &&
    fecha !== null &&
    "toMillis" in fecha &&
    typeof (
      fecha as {
        toMillis?: unknown;
      }
    ).toMillis === "function"
  ) {
    return (
      fecha as {
        toMillis: () => number;
      }
    ).toMillis();
  }

  if (
    typeof fecha === "object" &&
    fecha !== null &&
    "seconds" in fecha
  ) {
    const segundos = Number(
      (
        fecha as {
          seconds?: unknown;
        }
      ).seconds
    );

    const nanosegundos = Number(
      (
        fecha as {
          nanoseconds?: unknown;
        }
      ).nanoseconds ?? 0
    );

    if (Number.isFinite(segundos)) {
      return (
        segundos * 1000 +
        nanosegundos / 1_000_000
      );
    }
  }

  if (fecha instanceof Date) {
    const tiempo =
      fecha.getTime();

    return Number.isNaN(
      tiempo
    )
      ? 0
      : tiempo;
  }

  if (typeof fecha === "string") {
    const tiempo =
      new Date(fecha).getTime();

    return Number.isNaN(
      tiempo
    )
      ? 0
      : tiempo;
  }

  return 0;
}

function convertirNoticia(
  id: string,
  datos: Record<string, any>
): Noticia {
  const estado =
    datos.estado ===
      "publicada" ||
    datos.estado ===
      "rechazada" ||
    datos.estado ===
      "pendiente"
      ? datos.estado
      : "pendiente";

  return {
    id,

    titulo:
      datos.titulo || "",

    resumen:
      datos.resumen || "",

    contenido:
      datos.contenido || "",

    imagenUrl:
      datos.imagenUrl || "",

    categoria:
      datos.categoria ||
      "general",

    fuente:
      datos.fuente || "",

    fuenteId:
      datos.fuenteId || "",

    fuenteUrl:
      datos.fuenteUrl || "",

    urlGoogleNews:
      datos.urlGoogleNews || "",

    urlOficial:
      datos.urlOficial || "",

    urlPendienteResolver:
      datos.urlPendienteResolver ===
      true,

    fechaPublicacion:
      datos.fechaPublicacion ??
      null,

    fechaCaptura:
      datos.fechaCaptura ??
      null,

    estado,

    tipo:
      datos.tipo || "externa",

    creadoAutomaticamente:
      datos.creadoAutomaticamente ===
      true,

    revisado:
      datos.revisado === true,

    creadoPor:
      datos.creadoPor || "",

    revisadoPor:
      datos.revisadoPor || "",

    fechaRevision:
      datos.fechaRevision ??
      null,
  };
}

export async function obtenerNoticiasPendientes(): Promise<
  Noticia[]
> {
  const referencia =
    collection(
      db,
      COLECCION
    );

  const consulta = query(
    referencia,
    where(
      "estado",
      "==",
      "pendiente"
    )
  );

  const resultado =
    await getDocs(
      consulta
    );

  const noticias =
    resultado.docs.map(
      (documento) =>
        convertirNoticia(
          documento.id,
          documento.data()
        )
    );

  noticias.sort(
    (a, b) =>
      convertirFechaAMillis(
        b.fechaCaptura
      ) -
      convertirFechaAMillis(
        a.fechaCaptura
      )
  );

  return noticias;
}

export async function obtenerNoticiasPublicadas(): Promise<
  Noticia[]
> {
  const referencia =
    collection(
      db,
      COLECCION
    );

  const consulta = query(
    referencia,
    where(
      "estado",
      "==",
      "publicada"
    )
  );

  const resultado =
    await getDocs(
      consulta
    );

  const noticias =
    resultado.docs.map(
      (documento) =>
        convertirNoticia(
          documento.id,
          documento.data()
        )
    );

  noticias.sort(
    (a, b) =>
      convertirFechaAMillis(
        b.fechaPublicacion
      ) -
      convertirFechaAMillis(
        a.fechaPublicacion
      )
  );

  return noticias;
}
export function escucharNoticiasPublicadas(
  callback: (noticias: Noticia[]) => void,
  onError?: (error: Error) => void
): () => void {
  const referencia = collection(
    db,
    COLECCION
  );

  const consulta = query(
    referencia,
    where(
      "estado",
      "==",
      "publicada"
    )
  );

  const desuscribirse = onSnapshot(
    consulta,
    (resultado) => {
      const noticias =
        resultado.docs.map(
          (documento) =>
            convertirNoticia(
              documento.id,
              documento.data()
            )
        );

      noticias.sort(
        (a, b) =>
          convertirFechaAMillis(
            b.fechaPublicacion
          ) -
          convertirFechaAMillis(
            a.fechaPublicacion
          )
      );

      callback(noticias);
    },
    (error) => {
      console.error(
        "Error escuchando noticias publicadas:",
        error
      );

      onError?.(error);
    }
  );

  return desuscribirse;
}

export async function aprobarNoticia(
  id: string,
  uidModerador: string
): Promise<void> {
  const referencia =
    doc(
      db,
      COLECCION,
      id
    );

  await updateDoc(
    referencia,
    {
      estado:
        "publicada",

      revisado:
        true,

      revisadoPor:
        uidModerador,

      fechaRevision:
        serverTimestamp(),

      fechaPublicacion:
        serverTimestamp(),
    }
  );
}

export async function rechazarNoticia(
  id: string,
  uidModerador: string
): Promise<void> {
  const referencia =
    doc(
      db,
      COLECCION,
      id
    );

  await updateDoc(
    referencia,
    {
      estado:
        "rechazada",

      revisado:
        true,

      revisadoPor:
        uidModerador,

      fechaRevision:
        serverTimestamp(),
    }
  );
}

export async function editarNoticia(
  id: string,
  datos: {
    titulo: string;
    resumen: string;
    contenido: string;
    categoria: string;
    imagenUrl: string;
  }
): Promise<void> {
  const referencia =
    doc(
      db,
      COLECCION,
      id
    );

  await updateDoc(
    referencia,
    {
      titulo:
        datos.titulo.trim(),

      resumen:
        datos.resumen.trim(),

      contenido:
        datos.contenido.trim(),

      categoria:
        datos.categoria.trim(),

      imagenUrl:
        datos.imagenUrl.trim(),
    }
  );
}

export async function crearNoticiaManual(
  datos: {
    titulo: string;
    resumen: string;
    contenido: string;
    categoria: string;
    imagenUrl: string;
    fuente: string;
    fuenteUrl: string;
  },
  uidAdministrador: string
): Promise<void> {
  await addDoc(
    collection(
      db,
      COLECCION
    ),
    {
      titulo:
        datos.titulo.trim(),

      resumen:
        datos.resumen.trim(),

      contenido:
        datos.contenido.trim(),

      categoria:
        datos.categoria.trim(),

      imagenUrl:
        datos.imagenUrl.trim(),

      fuente:
        datos.fuente.trim(),

      fuenteUrl:
        datos.fuenteUrl.trim(),

      estado:
        "pendiente",

      tipo:
        "manual",

      creadoAutomaticamente:
        false,

      revisado:
        false,

      creadoPor:
        uidAdministrador,

      fechaCaptura:
        serverTimestamp(),

      fechaPublicacion:
        null,

      fechaRevision:
        null,
    }
  );
}