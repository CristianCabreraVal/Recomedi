/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// Importación de funciones específicas de Firebase Firestore para manipular y consultar datos
import { doc, getDoc } from "firebase/firestore";
// db: instancia de Firestore configurada en el proyecto.
// Permite acceder a la base de datos para consultar, crear, modificar o eliminar información.
import { db } from "./firebase";

export type RolUsuario = "usuario" | "moderador" | "admin";

export async function obtenerRolUsuario(
  uid: string
): Promise<RolUsuario> {
  const referencia = doc(db, "usuarios", uid);
  const resultado = await getDoc(referencia);

  if (!resultado.exists()) {
    return "usuario";
  }

  const datos = resultado.data();

  if (
    datos.rol === "admin" ||
    datos.rol === "moderador" ||
    datos.rol === "usuario"
  ) {
    return datos.rol;
  }

  return "usuario";
}