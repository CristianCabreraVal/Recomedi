/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// Importación de funciones específicas de Firebase Firestore para manipular y consultar datos
import {addDoc,collection,deleteDoc,doc,getDocs,orderBy,query,serverTimestamp,updateDoc} from "firebase/firestore";

import { db } from "./firebase";

export type NivelAlerta =
  | "informativa"
  | "moderada"
  | "alta"
  | "critica";

export type EstadoAlerta =
  | "pendiente"
  | "activa"
  | "finalizada"
  | "rechazada"
  | "archivada";

export type AlertaSanitaria = {
  id: string;

  titulo: string;
  descripcion: string;
  contenido: string;

  imagenUrl: string;

  nivel: NivelAlerta;
  categoria: string;
  zona: string;

  fuente: string;
  fuenteUrl: string;

  fechaInicio: any;
  fechaFin: any;

  estado: EstadoAlerta;

  creadoPor: string;
  fechaCreacion?: any;

  actualizadoPor?: string;
  fechaActualizacion?: any;
};

function normalizarNivel(valor: unknown): NivelAlerta {
  if (
    valor === "informativa" ||
    valor === "moderada" ||
    valor === "alta" ||
    valor === "critica"
  ) {
    return valor;
  }

  return "informativa";
}

function normalizarEstado(
  valor: unknown
): EstadoAlerta {
  if (
    valor === "pendiente" ||
    valor === "activa" ||
    valor === "finalizada" ||
    valor === "rechazada" ||
    valor === "archivada"
  ) {
    return valor;
  }

  return "pendiente";
}

export async function obtenerAlertas(): Promise<
  AlertaSanitaria[]
> {
  const referencia = collection(db, "alertas");

  const consulta = query(
    referencia,
    orderBy("fechaCreacion", "desc")
  );

  const snapshot = await getDocs(consulta);

  const alertas: AlertaSanitaria[] = [];

  snapshot.forEach((documento) => {
    const datos = documento.data();

    alertas.push({
      id: documento.id,

      titulo: datos.titulo ?? "",
      descripcion: datos.descripcion ?? "",
      contenido: datos.contenido ?? "",

      imagenUrl: datos.imagenUrl ?? "",

      nivel: normalizarNivel(datos.nivel),
      categoria: datos.categoria ?? "",
      zona: datos.zona ?? "",

      fuente: datos.fuente ?? "",
      fuenteUrl: datos.fuenteUrl ?? "",

      fechaInicio: datos.fechaInicio ?? null,
      fechaFin: datos.fechaFin ?? null,

      estado: normalizarEstado(datos.estado),

      creadoPor: datos.creadoPor ?? "",
      fechaCreacion: datos.fechaCreacion ?? null,

      actualizadoPor:
        datos.actualizadoPor ?? "",
      fechaActualizacion:
        datos.fechaActualizacion ?? null,
    });
  });

  return alertas;
}

type CrearAlerta = {
  titulo: string;
  descripcion: string;
  contenido: string;
  imagenUrl?: string;

  nivel: NivelAlerta;
  categoria: string;
  zona: string;

  fuente: string;
  fuenteUrl?: string;

  fechaInicio?: any;
  fechaFin?: any;

  estado?: EstadoAlerta;

  creadoPor: string;
};

export async function crearAlerta(
  datos: CrearAlerta
) {
  const referencia = collection(
    db,
    "alertas"
  );

  return await addDoc(referencia, {
    titulo: datos.titulo.trim(),
    descripcion: datos.descripcion.trim(),
    contenido: datos.contenido.trim(),

    imagenUrl:
      datos.imagenUrl?.trim() ?? "",

    nivel: datos.nivel,
    categoria: datos.categoria.trim(),
    zona: datos.zona.trim(),

    fuente: datos.fuente.trim(),
    fuenteUrl:
      datos.fuenteUrl?.trim() ?? "",

    fechaInicio:
      datos.fechaInicio ?? null,

    fechaFin:
      datos.fechaFin ?? null,

    estado:
      datos.estado ?? "pendiente",

    creadoPor: datos.creadoPor,

    fechaCreacion:
      serverTimestamp(),

    actualizadoPor:
      datos.creadoPor,

    fechaActualizacion:
      serverTimestamp(),
  });
}

export async function actualizarAlerta(
  id: string,
  datos: Partial<
    Omit<
      AlertaSanitaria,
      "id"
    >
  >,
  usuarioUid: string
) {
  const referencia = doc(
    db,
    "alertas",
    id
  );

  await updateDoc(referencia, {
    ...datos,

    actualizadoPor:
      usuarioUid,

    fechaActualizacion:
      serverTimestamp(),
  });
}

export async function cambiarEstadoAlerta(
  id: string,
  estado: EstadoAlerta,
  usuarioUid: string
) {
  const referencia = doc(
    db,
    "alertas",
    id
  );

  await updateDoc(referencia, {
    estado,

    actualizadoPor:
      usuarioUid,

    fechaActualizacion:
      serverTimestamp(),
  });
}

export async function eliminarAlerta(
  id: string
) {
  await deleteDoc(
    doc(db, "alertas", id)
  );
}