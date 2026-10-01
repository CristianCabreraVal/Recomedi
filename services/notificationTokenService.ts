/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// Importación de funciones específicas de Firebase Firestore para manipular y consultar datos
import {doc,getDoc,serverTimestamp,setDoc} from "firebase/firestore";
// auth: instancia de Firebase Authentication utilizada para gestionar el usuario autenticado.
// db: instancia de Firestore utilizada para trabajar con la base de datos.
import {auth,db} from "./firebase";
// obtenerTokenFCM: función propia del proyecto utilizada para obtener el token FCM asociado al dispositivo.
// El token permite identificar el dispositivo dentro del sistema de notificaciones push.
import {obtenerTokenFCM} from "./notificationService";

export async function registrarTokenFCMEnFirestore(): Promise<string | null> {
  try {
    const usuario = auth.currentUser;

    if (!usuario) {
      console.log("No hay usuario autenticado.");
      return null;
    }

    console.log("Usuario autenticado:", usuario.uid);

    const token = await obtenerTokenFCM();

    if (!token) {
      console.log("No se obtuvo token FCM.");
      return null;
    }

    console.log("Token FCM obtenido correctamente.");

    const referencia = doc(
      db,
      "usuarios",
      usuario.uid,
      "notificationTokens",
      "android"
    );

    const documentoExistente = await getDoc(referencia);

    const datos: Record<string, unknown> = {
      uid: usuario.uid,
      token,
      platform: "android",
      enabled: true,
      updatedAt: serverTimestamp(),
    };

    // Solo se crea una vez.
    if (!documentoExistente.exists()) {
      datos.createdAt = serverTimestamp();
    }

    await setDoc(
      referencia,
      datos,
      {
        merge: true,
      }
    );

    console.log(
      "TOKEN FCM GUARDADO CORRECTAMENTE"
    );

    return token;
  } catch (error) {
    console.error(
      "Error registrando token FCM:",
      error
    );

    return null;
  }
}

export async function activarTokenFCM(): Promise<boolean> {
  const token =
    await registrarTokenFCMEnFirestore();

  return token !== null;
}