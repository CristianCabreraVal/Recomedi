/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// Importación de funciones específicas de Firebase Firestore para manipular y consultar datos
import {doc,getDoc,setDoc,updateDoc,deleteDoc} from "firebase/firestore";

import { db } from "./firebase";

/**
 * Obtener un documento
 */
export async function getDocument(
    coleccion: string,
    id: string
) {
    const referencia = doc(db, coleccion, id);

    const documento = await getDoc(referencia);

    if (!documento.exists()) {
        return null;
    }

    return documento.data();
}

/**
 * Crear o reemplazar documento
 */
export async function setDocument(
    coleccion: string,
    id: string,
    datos: any
) {
    const referencia = doc(db, coleccion, id);

    await setDoc(referencia, datos);
}

/**
 * Actualizar documento
 */
export async function updateDocument(
    coleccion: string,
    id: string,
    datos: any
) {
    const referencia = doc(db, coleccion, id);

    await updateDoc(referencia, datos);
}

/**
 * Eliminar documento
 */
export async function deleteDocument(
    coleccion: string,
    id: string
) {
    const referencia = doc(db, coleccion, id);

    await deleteDoc(referencia);
}