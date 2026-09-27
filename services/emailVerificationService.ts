import {
    getIdToken,
    reload,
    sendEmailVerification,
} from "firebase/auth";

import {
    doc,
    setDoc,
} from "firebase/firestore";

import { auth, db } from "./firebase";

/**
 * Envía el correo de verificación al usuario actualmente autenticado.
 */
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