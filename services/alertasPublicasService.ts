/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// Importación de funciones específicas de Firebase Firestore para manipular y consultar datos
import {collection,onSnapshot,query,where,
  type Unsubscribe} from "firebase/firestore";
// db: instancia de Firestore configurada en el proyecto.
// Permite acceder a la base de datos para consultar, crear, modificar o eliminar información.
import { db } from "./firebase";

export type AlertaPublica = {
  id: string;
  titulo: string;
  descripcion: string;
  contenido: string;
  imagenUrl: string;
  nivel:
    | "informativa"
    | "moderada"
    | "alta"
    | "critica";
  categoria: string;
  zona: string;
  fuente: string;
  fuenteUrl: string;
  fechaInicio: any;
  fechaFin: any;
};
// export permite que ese componente sea utilizado por otros archivos por de medio imports.
// function declara una función. En React, una función como esta puede utilizarse como componente cuando devuelve elementos de interfaz.
export function escucharAlertasActivas(
  alCambiar: (
    alertas: AlertaPublica[]
  ) => void,
  alError?: (error: Error) => void
): Unsubscribe {
  const referencia = collection(
    db,
    "alertas"
  );

  const consulta = query(
    referencia,
    where("estado", "==", "activa")
  );

  return onSnapshot(
    consulta,
    (snapshot) => {
      const alertas: AlertaPublica[] =
        snapshot.docs.map((documento) => {
          const datos =
            documento.data();

          return {
            id: documento.id,
            titulo:
              datos.titulo ?? "Alerta sanitaria",
            descripcion:
              datos.descripcion ?? "",
            contenido:
              datos.contenido ?? "",
            imagenUrl:
              datos.imagenUrl ?? "",
            nivel:
              datos.nivel ?? "informativa",
            categoria:
              datos.categoria ?? "",
            zona:
              datos.zona ?? "",
            fuente:
              datos.fuente ?? "",
            fuenteUrl:
              datos.fuenteUrl ?? "",
            fechaInicio:
              datos.fechaInicio ?? null,
            fechaFin:
              datos.fechaFin ?? null,
          };
        });

      alertas.sort((a, b) => {
        const fechaA =
          a.fechaInicio?.toMillis
            ? a.fechaInicio.toMillis()
            : 0;

        const fechaB =
          b.fechaInicio?.toMillis
            ? b.fechaInicio.toMillis()
            : 0;

        return fechaB - fechaA;
      });

      alCambiar(alertas);
    },
    (error) => {
      console.error(
        "Error escuchando alertas activas:",
        error
      );

      if (alError) {
        alError(error);
      }
    }
  );
}