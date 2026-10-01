/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// Importación de funciones específicas de Firebase Firestore para manipular y consultar datos
import {addDoc,collection,deleteDoc,doc,getDocs,orderBy,query,
  serverTimestamp,updateDoc} from "firebase/firestore";
// db: instancia de Firestore configurada en el proyecto.
// Permite acceder a la base de datos para consultar, crear, modificar o eliminar información.
import { db } from "./firebase";

export type TipoCentroMedico =
  | "hospital"
  | "clinica"
  | "centro_salud"
  | "consultorio"
  | "laboratorio"
  | "otro";

export type EstadoCentroMedico =
  | "pendiente"
  | "activo"
  | "oculto";

export type CentroMedicoAdmin = {
  id: string;

  nombre: string;
  tipo: TipoCentroMedico;

  direccion: string;
  telefono: string;
  website: string;

  horario: string;
  servicios: string[];

  lat: number;
  lon: number;

  fuente: string;

  estado: EstadoCentroMedico;

  creadoPor: string;
  fechaCreacion?: any;

  actualizadoPor?: string;
  fechaActualizacion?: any;
};

function normalizarTipo(
  valor: unknown
): TipoCentroMedico {
  if (
    valor === "hospital" ||
    valor === "clinica" ||
    valor === "centro_salud" ||
    valor === "consultorio" ||
    valor === "laboratorio" ||
    valor === "otro"
  ) {
    return valor;
  }

  return "otro";
}

function normalizarEstado(
  valor: unknown
): EstadoCentroMedico {
  if (
    valor === "pendiente" ||
    valor === "activo" ||
    valor === "oculto"
  ) {
    return valor;
  }

  return "pendiente";
}

export async function obtenerCentrosMedicos(): Promise<
  CentroMedicoAdmin[]
> {
  const referencia = collection(
    db,
    "centrosMedicos"
  );

  const consulta = query(
    referencia,
    orderBy("fechaCreacion", "desc")
  );

  const snapshot = await getDocs(consulta);

  const centros: CentroMedicoAdmin[] = [];

  snapshot.forEach((documento) => {
    const datos = documento.data();

    centros.push({
      id: documento.id,

      nombre: datos.nombre ?? "",

      tipo: normalizarTipo(
        datos.tipo
      ),

      direccion:
        datos.direccion ?? "",

      telefono:
        datos.telefono ?? "",

      website:
        datos.website ?? "",

      horario:
        datos.horario ?? "",

      servicios:
        Array.isArray(
          datos.servicios
        )
          ? datos.servicios
          : [],

      lat:
        typeof datos.lat === "number"
          ? datos.lat
          : 0,

      lon:
        typeof datos.lon === "number"
          ? datos.lon
          : 0,

      fuente:
        datos.fuente ?? "",

      estado:
        normalizarEstado(
          datos.estado
        ),

      creadoPor:
        datos.creadoPor ?? "",

      fechaCreacion:
        datos.fechaCreacion ?? null,

      actualizadoPor:
        datos.actualizadoPor ?? "",

      fechaActualizacion:
        datos.fechaActualizacion ?? null,
    });
  });

  return centros;
}

type CrearCentroMedico = {
  nombre: string;
  tipo: TipoCentroMedico;

  direccion: string;
  telefono?: string;
  website?: string;

  horario?: string;
  servicios?: string[];

  lat: number;
  lon: number;

  fuente: string;

  estado?: EstadoCentroMedico;

  creadoPor: string;
};

export async function crearCentroMedico(
  datos: CrearCentroMedico
) {
  const referencia = collection(
    db,
    "centrosMedicos"
  );

  return await addDoc(referencia, {
    nombre:
      datos.nombre.trim(),

    tipo: datos.tipo,

    direccion:
      datos.direccion.trim(),

    telefono:
      datos.telefono?.trim() ?? "",

    website:
      datos.website?.trim() ?? "",

    horario:
      datos.horario?.trim() ?? "",

    servicios:
      datos.servicios ?? [],

    lat: datos.lat,
    lon: datos.lon,

    fuente:
      datos.fuente.trim(),

    estado:
      datos.estado ?? "pendiente",

    creadoPor:
      datos.creadoPor,

    fechaCreacion:
      serverTimestamp(),

    actualizadoPor:
      datos.creadoPor,

    fechaActualizacion:
      serverTimestamp(),
  });
}

export async function actualizarCentroMedico(
  id: string,
  datos: Partial<
    Omit<
      CentroMedicoAdmin,
      "id"
    >
  >,
  usuarioUid: string
) {
  const referencia = doc(
    db,
    "centrosMedicos",
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

export async function cambiarEstadoCentroMedico(
  id: string,
  estado: EstadoCentroMedico,
  usuarioUid: string
) {
  const referencia = doc(
    db,
    "centrosMedicos",
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

export async function eliminarCentroMedico(
  id: string
) {
  await deleteDoc(
    doc(
      db,
      "centrosMedicos",
      id
    )
  );
}