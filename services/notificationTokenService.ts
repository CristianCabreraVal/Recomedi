import {
    doc,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

import {
    auth,
    db,
} from "./firebase";

import {
    obtenerTokenFCM,
} from "./notificationService";


/* ==========================================================
   CREAR ID ÚNICO PARA EL USUARIO + TOKEN
========================================================== */

function obtenerIdDocumento(
  uid: string,
  token: string
): string {
  return `${uid}_${encodeURIComponent(token)}`;
}


/* ==========================================================
   REGISTRAR TOKEN FCM
========================================================== */

export async function registrarTokenFCMEnFirestore(): Promise<
  string | null
> {
  try {
    const usuario =
      auth.currentUser;

    if (!usuario) {
      console.log(
        "No hay un usuario autenticado."
      );

      return null;
    }

    console.log(
      "Usuario autenticado:",
      usuario.uid
    );

    const token =
      await obtenerTokenFCM();

    if (!token) {
      console.log(
        "No se obtuvo el token FCM."
      );

      return null;
    }

    console.log(
      "Token FCM obtenido correctamente."
    );

    /*
     * El documento pertenece directamente al usuario.
     *
     * Esto evita que un token que haya sido registrado
     * anteriormente por otra cuenta provoque conflictos.
     */
    const idDocumento =
      obtenerIdDocumento(
        usuario.uid,
        token
      );

    const referencia =
      doc(
        db,
        "notificationTokens",
        idDocumento
      );

    await setDoc(
      referencia,
      {
        uid: usuario.uid,
        token: token,
        platform: "android",
        enabled: true,
        updatedAt: serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    console.log(
      "======================================"
    );

    console.log(
      "TOKEN FCM REGISTRADO CORRECTAMENTE"
    );

    console.log(
      "UID:",
      usuario.uid
    );

    console.log(
      "======================================"
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


/* ==========================================================
   ACTIVAR TOKEN FCM
========================================================== */

export async function activarTokenFCM(): Promise<boolean> {
  try {
    const usuario =
      auth.currentUser;

    if (!usuario) {
      console.log(
        "No hay usuario autenticado."
      );

      return false;
    }

    const token =
      await obtenerTokenFCM();

    if (!token) {
      return false;
    }

    const idDocumento =
      obtenerIdDocumento(
        usuario.uid,
        token
      );

    const referencia =
      doc(
        db,
        "notificationTokens",
        idDocumento
      );

    await setDoc(
      referencia,
      {
        uid: usuario.uid,
        token: token,
        platform: "android",
        enabled: true,
        updatedAt: serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    console.log(
      "Token FCM activado correctamente."
    );

    return true;

  } catch (error) {
    console.error(
      "Error activando token FCM:",
      error
    );

    return false;
  }
}