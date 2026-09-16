import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc
} from "firebase/firestore";

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