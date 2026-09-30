/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// Importación de funciones específicas de Firebase Firestore para manipular y consultar datos
import {doc,getDoc,setDoc,updateDoc,} from "firebase/firestore";
import { db } from "./firebase";
import { Configuracion } from "../models/Configuracion";
import { configuracionDefault } from "../utils/configuracionDefault";

function obtenerReferenciaConfiguracion(uid: string) {
  return doc(db, "usuarios", uid, "configuracion", "preferencias");
}

export async function obtenerConfiguracion(
  uid: string
): Promise<Configuracion> {
  const referencia = obtenerReferenciaConfiguracion(uid);
  const snapshot = await getDoc(referencia);

  if (!snapshot.exists()) {
    await setDoc(referencia, configuracionDefault);

    return configuracionDefault;
  }

  return {
    ...configuracionDefault,
    ...(snapshot.data() as Partial<Configuracion>),
  };
}

export async function guardarConfiguracion(
  uid: string,
  configuracion: Configuracion
): Promise<void> {
  const referencia = obtenerReferenciaConfiguracion(uid);

  await setDoc(referencia, configuracion);
}

export async function actualizarConfiguracion(
  uid: string,
  cambios: Partial<Configuracion>
): Promise<void> {
  const referencia = obtenerReferenciaConfiguracion(uid);

  await updateDoc(referencia, cambios);
}