/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// Importación de funciones específicas de Firebase Firestore para manipular y consultar datos
import {collection,getDocs,orderBy,query,updateDoc,doc} from "firebase/firestore";
// db: instancia de Firestore configurada en el proyecto.
// Permite acceder a la base de datos para consultar, crear, modificar o eliminar información.
import { db } from "./firebase";

import type {EstadoReporte,Reporte} from "./reportesService";

/* ============================================================
   OBTENER REPORTES
============================================================ */

export async function obtenerReportesAdmin(): Promise<
  Reporte[]
> {
  const referencia = collection(
    db,
    "reportes"
  );

  const consulta = query(
    referencia,
    orderBy(
      "ultimaActividad",
      "desc"
    )
  );

  const snapshot =
    await getDocs(consulta);

  return snapshot.docs.map(
    (documento) => {
      const datos = documento.data();

      return {
        id: documento.id,

        pagina:
          datos.pagina ?? "",

        recursoId:
          datos.recursoId ?? "",

        recursoNombre:
          datos.recursoNombre ??
          "Recurso sin nombre",

        grupoClave:
          datos.grupoClave ?? "",

        tipo:
          datos.tipo ?? "otro",

        descripcion:
          datos.descripcion ?? "",

        ultimaDescripcion:
          datos.ultimaDescripcion ??
          datos.descripcion ??
          "",

        creadoPor:
          datos.creadoPor ?? "",

        fechaCreacion:
          datos.fechaCreacion ?? null,

        primerReporte:
          datos.primerReporte ?? null,

        ultimaActividad:
          datos.ultimaActividad ?? null,

        vecesReportado:
          Number(
            datos.vecesReportado ?? 1
          ),

        estado:
          datos.estado ??
          "pendiente",

        revisadoPor:
          datos.revisadoPor,

        fechaRevision:
          datos.fechaRevision,

        respuestaAdmin:
          datos.respuestaAdmin,
      };
    }
  );
}

/* ============================================================
   CAMBIAR ESTADO
============================================================ */

export async function cambiarEstadoReporte(
  reporteId: string,
  estado: EstadoReporte,
  usuarioUid: string,
  respuestaAdmin?: string
) {
  const referencia = doc(
    db,
    "reportes",
    reporteId
  );

  const datos: any = {
    estado,
    revisadoPor: usuarioUid,
    fechaRevision: new Date(),
  };

  if (
    respuestaAdmin !== undefined
  ) {
    datos.respuestaAdmin =
      respuestaAdmin;
  }

  await updateDoc(
    referencia,
    datos
  );
}