import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "./firebase";

/* ============================================================
   TIPOS
============================================================ */

export type EstadoReporte =
  | "pendiente"
  | "en_revision"
  | "resuelto"
  | "rechazado";

export type MotivoReporte = {
  id: string;
  nombre: string;
};

export type CrearReporte = {
  pagina: string;
  recursoId: string;
  recursoNombre: string;
  tipo: string;
  descripcion: string;
};

export type Reporte = {
  id: string;

  pagina: string;

  recursoId: string;

  recursoNombre: string;

  grupoClave: string;

  tipo: string;

  descripcion: string;

  ultimaDescripcion: string;

  creadoPor: string;

  fechaCreacion: any;

  primerReporte: any;

  ultimaActividad: any;

  vecesReportado: number;

  estado: EstadoReporte;

  revisadoPor?: string;

  fechaRevision?: any;

  respuestaAdmin?: string;
};
export const MOTIVOS_NOTICIAS: MotivoReporte[] = [
  {
    id: "informacion_incorrecta",
    nombre: "La información no es correcta",
  },
  {
    id: "noticia_desactualizada",
    nombre: "La noticia está desactualizada",
  },
  {
    id: "contenido_repetido",
    nombre: "El contenido está repetido",
  },
  {
    id: "enlace_no_funciona",
    nombre: "El enlace no funciona",
  },
  {
    id: "otro",
    nombre: "Otro problema",
  },
];

export const MOTIVOS_GENERALES: MotivoReporte[] = [
  {
    id: "error_funcional",
    nombre: "Una función no funciona correctamente",
  },
  {
    id: "informacion_incorrecta",
    nombre: "La información no es correcta",
  },
  {
    id: "contenido_desactualizado",
    nombre: "Hay información desactualizada",
  },
  {
    id: "error_visual",
    nombre: "Hay un problema visual",
  },
  {
    id: "otro",
    nombre: "Otro problema",
  },
];

/* ============================================================
   MOTIVOS — INICIO
============================================================ */

export const MOTIVOS_INICIO: MotivoReporte[] = [
  {
    id: "informacion_incorrecta",
    nombre: "La información no es correcta",
  },
  {
    id: "contenido_desactualizado",
    nombre: "La información está desactualizada",
  },
  {
    id: "enlace_no_funciona",
    nombre: "Un enlace no funciona",
  },
  {
    id: "error_visual",
    nombre: "Hay un problema visual",
  },
  {
    id: "otro",
    nombre: "Otro problema",
  },
];

/* ============================================================
   MOTIVOS — ALERTAS
============================================================ */

export const MOTIVOS_ALERTAS: MotivoReporte[] = [
  {
    id: "alerta_desactualizada",
    nombre: "La alerta parece desactualizada",
  },
  {
    id: "alerta_incorrecta",
    nombre: "La información de la alerta no es correcta",
  },
  {
    id: "ubicacion_incorrecta",
    nombre: "La ubicación indicada no es correcta",
  },
  {
    id: "alerta_no_aplica",
    nombre: "La alerta ya no parece aplicar",
  },
  {
    id: "otro",
    nombre: "Otro problema",
  },
];

/* ============================================================
   MOTIVOS — CENTROS MÉDICOS
============================================================ */

export const MOTIVOS_CENTROS: MotivoReporte[] = [
  {
    id: "centro_no_existe",
    nombre: "El centro ya no existe",
  },
  {
    id: "direccion_incorrecta",
    nombre: "La dirección no es correcta",
  },
  {
    id: "telefono_incorrecto",
    nombre: "El teléfono no es correcto",
  },
  {
    id: "horario_incorrecto",
    nombre: "El horario no es correcto",
  },
  {
    id: "informacion_incorrecta",
    nombre: "Otra información no es correcta",
  },
  {
    id: "otro",
    nombre: "Otro problema",
  },
];

/* ============================================================
   CREAR O ACUMULAR REPORTE
============================================================ */

export async function registrarReporte(
  datos: CrearReporte
): Promise<"creado" | "actualizado"> {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error(
      "Debes iniciar sesión para enviar un reporte."
    );
  }

  const descripcion = datos.descripcion.trim();

  if (!descripcion) {
    throw new Error(
      "Escribe una descripción antes de enviar el reporte."
    );
  }

  const paginaNormalizada =
    datos.pagina.trim() || "/";

  const recursoIdNormalizado =
    datos.recursoId.trim() || "sin-recurso";

  const recursoNombreNormalizado =
    datos.recursoNombre.trim() || "Recurso sin nombre";

  const tipoNormalizado =
    datos.tipo.trim() || "otro";

  const grupoClave =
    `${paginaNormalizada}|${recursoIdNormalizado}|${tipoNormalizado}`;

  /* ----------------------------------------------------------
     BUSCAR REPORTES DEL USUARIO

     Solo filtramos por creadoPor en Firestore.
     Así evitamos depender de un índice compuesto.
  ---------------------------------------------------------- */

  const referenciaReportes =
    collection(db, "reportes");

  const consulta = query(
    referenciaReportes,
    where("creadoPor", "==", usuario.uid)
  );

  const snapshot = await getDocs(consulta);

  /* ----------------------------------------------------------
     BUSCAR SI YA EXISTE EL MISMO REPORTE
  ---------------------------------------------------------- */

  const reportesCoincidentes =
    snapshot.docs.filter((documento) => {
      const reporte = documento.data();

      return (
        reporte.pagina === paginaNormalizada &&
        reporte.recursoId === recursoIdNormalizado &&
        reporte.tipo === tipoNormalizado
      );
    });

  /*
    Preferimos uno que todavía no esté cerrado.
    Si ya fue resuelto o rechazado, reutilizamos ese mismo
    documento y lo volvemos a poner como pendiente.
  */

  const reporteExistente =
    reportesCoincidentes.find((documento) => {
      const estado = documento.data().estado;

      return (
        estado !== "resuelto" &&
        estado !== "rechazado"
      );
    }) ?? reportesCoincidentes[0];

  /* ==========================================================
     ACTUALIZAR REPORTE EXISTENTE
  ========================================================== */

  if (reporteExistente) {
    const referencia = doc(
      db,
      "reportes",
      reporteExistente.id
    );

    await updateDoc(referencia, {
      ultimaDescripcion: descripcion,
      ultimaActividad: serverTimestamp(),

      /*
        10 reportes repetidos del mismo usuario
        => 1 documento con vecesReportado = 10
      */
      vecesReportado: increment(1),

      /*
        Al volver a reportarlo, vuelve a estar pendiente.
      */
      estado: "pendiente",
    });

    return "actualizado";
  }

  /* ==========================================================
     CREAR NUEVO REPORTE
  ========================================================== */

  await addDoc(referenciaReportes, {
    pagina: paginaNormalizada,

    recursoId: recursoIdNormalizado,

    recursoNombre: recursoNombreNormalizado,

    grupoClave,

    tipo: tipoNormalizado,

    descripcion,

    ultimaDescripcion: descripcion,

    creadoPor: usuario.uid,

    fechaCreacion: serverTimestamp(),

    primerReporte: serverTimestamp(),

    ultimaActividad: serverTimestamp(),

    vecesReportado: 1,

    estado: "pendiente",
  });

  return "creado";
}