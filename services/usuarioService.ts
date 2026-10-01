/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// Importación de funciones específicas de Firebase Firestore para manipular y consultar datos
import {doc,getDoc,setDoc} from "firebase/firestore";
import { User } from "firebase/auth";
// db: instancia de Firestore configurada en el proyecto.
// Permite acceder a la base de datos para consultar, crear, modificar o eliminar información.
import { db } from "./firebase";
// configuracionDefault: contiene los valores iniciales que se utilizan cuando un usuario todavía no tiene una configuración personalizada.
import { configuracionDefault } from "../utils/configuracionDefault";

export async function crearUsuarioFirestore(
  user: User
): Promise<void> {
  const referencia = doc(db, "usuarios", user.uid);

  const snapshot = await getDoc(referencia);

  if (snapshot.exists()) {
    return;
  }

  await setDoc(referencia, {
    email: user.email ?? "",
    configuracion: configuracionDefault,
  });
}