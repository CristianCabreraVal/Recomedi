/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// HttpsError: permite generar errores controlados que pueden ser enviados al dispositivo que realizó la llamada a la función. 
// onCall: permite crear una función de Firebase que puede ser llamada directamente desde la aplicación. 
// En este caso se utiliza para registrar el token FCM utilizado por el sistema de notificaciones.
import {HttpsError,onCall} from "firebase-functions/v2/https";
// initializeApp: inicializa Firebase Admin para que las Cloud Functions puedan acceder a los servicios del proyecto.
import {initializeApp} from "firebase-admin/app";
// getAuth: obtiene el servicio de autenticación de Firebase Admin. 
// Se utiliza posteriormente para consultar o administrar información relacionada con los usuarios autenticados.
import {getAuth} from "firebase-admin/auth";
// FieldValue: proporciona valores especiales de Firestore que permiten realizar operaciones sobre los datos, como agregar o actualizar determinados valores.  
// getFirestore: obtiene la instancia de Firestore utilizada por la función para leer y guardar información en la base de datos.
import {FieldValue,getFirestore} from "firebase-admin/firestore";
// initializeApp() inicia el SDK de Firebase Admin. 
// Esto permite que las funciones del servidor puedan utilizar servicios de Firebase como Authentication y Firestore.
initializeApp();
// const declara una variable cuyo valor no se reasigna. 
// auth: almacena la instancia del servicio de autenticación de Firebase Admin.
// db: almacena la instancia de Firestore. De esta manera, las funciones posteriores pueden utilizar auth y db para trabajar con los usuarios y los datos.
const auth = getAuth();
const db = getFirestore();
// export permite que la función pueda ser reconocida y desplegada como una Cloud Function de Firebase. 
// const registra la función en una constante llamada registrarTokenFCM. 
// onCall crea una función invocable directamente desde la aplicación mediante una llamada de Firebase Functions.
// async indica que la función puede realizar operaciones asíncronas utilizando await.
// request contiene la información enviada a la función cuando la aplicación realiza la llamada.
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