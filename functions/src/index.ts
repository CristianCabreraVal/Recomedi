import {
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";

import {
  initializeApp,
} from "firebase-admin/app";

import {
  getAuth,
} from "firebase-admin/auth";

import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";



initializeApp();

const auth = getAuth();
const db = getFirestore();



export const registrarTokenFCM = onCall(
  async (request) => {

    /* ========================================================
       COMPROBAR AUTENTICACIÓN
    ======================================================== */

    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Debes iniciar sesión para registrar el dispositivo."
      );
    }


    /* ========================================================
       DATOS RECIBIDOS
    ======================================================== */

    const data =
      request.data as {
        token?: unknown;
        platform?: unknown;
      };


    /* ========================================================
       VALIDAR TOKEN
    ======================================================== */

    if (
      typeof data.token !== "string" ||
      !data.token.trim()
    ) {
      throw new HttpsError(
        "invalid-argument",
        "El token FCM no es válido."
      );
    }


    /* ========================================================
       VALIDAR PLATAFORMA
    ======================================================== */

    if (
      data.platform !== "android"
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Esta función solamente permite dispositivos Android."
      );
    }


    /* ========================================================
       UID DEL USUARIO
    ======================================================== */

    const uid =
      request.auth.uid;

    const token =
      data.token.trim();


    /* ========================================================
       DOCUMENTO DEL TOKEN
    ======================================================== */

    const tokenId =
      encodeURIComponent(token);

    const referencia =
      db
        .collection("notificationTokens")
        .doc(tokenId);


    /* ========================================================
       GUARDAR TOKEN
    ======================================================== */

    await referencia.set(
      {
        uid,

        token,

        platform: "android",

        enabled: true,

        updatedAt:
          FieldValue.serverTimestamp(),

        createdAt:
          FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      }
    );


    /* ========================================================
       RESPUESTA
    ======================================================== */

    return {
      ok: true,
    };
  }
);

/* ============================================================
   VERIFICAR ADMIN
============================================================ */

function verificarAdministrador(
  request: any
) {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Debes iniciar sesión."
    );
  }

  const rol =
    request.auth.token?.role;

  if (rol !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "No tienes permisos de administrador."
    );
  }
}

/* ============================================================
   LISTAR USUARIOS
============================================================ */

export const listarUsuarios = onCall(
  async (request) => {
    verificarAdministrador(request);

    try {
      const resultado =
        await auth.listUsers(1000);

      const usuarios =
        resultado.users.map(
          (usuario) => ({
            uid: usuario.uid,
            email:
              usuario.email ?? "",
            displayName:
              usuario.displayName ?? "",
            disabled:
              usuario.disabled,

            creationTime:
              usuario.metadata.creationTime ??
              null,

            lastSignInTime:
              usuario.metadata.lastSignInTime ??
              null,

            role:
              usuario.customClaims?.role ??
              "usuario",
          })
        );

      return {
        usuarios,
      };
    } catch (error) {
      console.error(
        "Error listando usuarios:",
        error
      );

      throw new HttpsError(
        "internal",
        "No fue posible obtener los usuarios."
      );
    }
  }
);

/* ============================================================
   CAMBIAR ROL
============================================================ */

export const cambiarRolUsuario = onCall(
  async (request) => {
    verificarAdministrador(request);

    const uid =
      request.data?.uid;

    const nuevoRol =
      request.data?.rol;

    const rolesValidos = [
      "usuario",
      "moderador",
      "admin",
    ];

    if (
      typeof uid !== "string" ||
      !uid.trim()
    ) {
      throw new HttpsError(
        "invalid-argument",
        "UID de usuario inválido."
      );
    }

    if (
      !rolesValidos.includes(nuevoRol)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Rol inválido."
      );
    }

    /*
     * Evitar que el administrador
     * se quite sus propios permisos.
     */
    if (
      request.auth?.uid === uid &&
      nuevoRol !== "admin"
    ) {
      throw new HttpsError(
        "failed-precondition",
        "No puedes quitarte tu propio rol de administrador."
      );
    }

    try {
      const usuario =
        await auth.getUser(uid);

      const claimsActuales =
        usuario.customClaims || {};

      await auth.setCustomUserClaims(
        uid,
        {
          ...claimsActuales,
          role: nuevoRol,
        }
      );

      return {
        success: true,
        uid,
        rol: nuevoRol,
      };
    } catch (error) {
      console.error(
        "Error cambiando rol:",
        error
      );

      throw new HttpsError(
        "internal",
        "No fue posible cambiar el rol."
      );
    }
  }
);

/* ============================================================
   ACTIVAR / DESACTIVAR USUARIO
============================================================ */

export const cambiarEstadoUsuario = onCall(
  async (request) => {
    verificarAdministrador(request);

    const uid =
      request.data?.uid;

    const disabled =
      request.data?.disabled;

    if (
      typeof uid !== "string" ||
      !uid.trim()
    ) {
      throw new HttpsError(
        "invalid-argument",
        "UID de usuario inválido."
      );
    }

    if (
      typeof disabled !== "boolean"
    ) {
      throw new HttpsError(
        "invalid-argument",
        "El estado del usuario es inválido."
      );
    }

    /*
     * No permitir desactivar
     * al administrador actual.
     */
    if (
      request.auth?.uid === uid &&
      disabled === true
    ) {
      throw new HttpsError(
        "failed-precondition",
        "No puedes desactivar tu propia cuenta."
      );
    }

    try {
      await auth.updateUser(
        uid,
        {
          disabled,
        }
      );

      return {
        success: true,
        uid,
        disabled,
      };
    } catch (error) {
      console.error(
        "Error cambiando estado:",
        error
      );

      throw new HttpsError(
        "internal",
        "No fue posible actualizar el estado del usuario."
      );
    }
  }
);

/* ============================================================
   ELIMINAR USUARIO
============================================================ */

export const eliminarUsuario = onCall(async (request) => {
  verificarAdministrador(request);

  const uid = request.data?.uid;

  if (typeof uid !== "string" || !uid.trim()) {
    throw new HttpsError(
      "invalid-argument",
      "UID de usuario inválido."
    );
  }

  if (request.auth?.uid === uid) {
    throw new HttpsError(
      "failed-precondition",
      "No puedes eliminar tu propia cuenta."
    );
  }

  try {
    console.log("=== INICIO ELIMINACION ===");
    console.log("UID recibido:", uid);
    console.log("Administrador:", request.auth?.uid);

    // 1. Eliminar documento y subcolecciones de Firestore
    console.log("Eliminando datos de Firestore...");

    const referenciaUsuario = db.doc(`usuarios/${uid}`);

    await db.recursiveDelete(referenciaUsuario);

    console.log("Firestore eliminado correctamente.");

    // 2. Eliminar usuario de Firebase Authentication
    console.log("Eliminando usuario de Authentication...");

    await auth.deleteUser(uid);

    console.log("Authentication eliminado correctamente.");

    console.log("=== ELIMINACION COMPLETADA ===");

    return {
      success: true,
      uid,
    };
  } catch (error: any) {
    console.error("=== ERROR ELIMINANDO USUARIO ===");
    console.error("UID:", uid);
    console.error("Mensaje:", error?.message);
    console.error("Código:", error?.code);
    console.error("Error completo:", error);

    throw new HttpsError(
      "internal",
      error?.message || "No fue posible eliminar el usuario."
    );
  }
});