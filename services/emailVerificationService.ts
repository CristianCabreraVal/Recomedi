/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// getIdToken: obtiene el token de identificación del usuario autenticado, utilizado para demostrar su identidad ante Firebase.
// reload: vuelve a cargar desde Firebase la información actual del usuario autenticado.
// sendEmailVerification: envía al usuario un correo para verificar su dirección de correo electrónico.
import {getIdToken,reload,sendEmailVerification} from "firebase/auth";
// Importación de funciones específicas de Firebase Firestore para manipular y consultar datos
import {doc,setDoc} from "firebase/firestore";
// Instancias de autenticación y base de datos configuradas de Firebase
import { auth, db } from "./firebase";
// Envía el correo de verificación al usuario actualmente autenticado.
export async function enviarCorreoVerificacion() {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error(
      "No hay un usuario autenticado."
    );
  }

  await sendEmailVerification(usuario);

  return true;
}

/**
 * Actualiza desde Firebase Authentication
 * el estado real de emailVerified y lo guarda
 * en el documento del usuario en Firestore.
 */
export async function sincronizarVerificacionEmail() {
  const usuario = auth.currentUser;

  if (!usuario) {
    return false;
  }

  /*
   * Recargar la información del usuario
   * para obtener el estado actualizado.
   */
  await reload(usuario);

  /*
   * Renovar el token para que las reglas de
   * Firestore reciban el email_verified actualizado.
   */
  await getIdToken(usuario, true);

  /*
   * Guardar el estado en Firestore.
   */
  await setDoc(
    doc(db, "usuarios", usuario.uid),
    {
      email: usuario.email || "",
      emailVerificado: usuario.emailVerified,
    },
    {
      merge: true,
    }
  );

  return usuario.emailVerified;
}