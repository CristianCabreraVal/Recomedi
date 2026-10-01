/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// cert: permite crear las credenciales de Firebase Admin a partir de un certificado del proyecto.
// getApps: permite consultar las aplicaciones de Firebase Admin ya inicializadas.
// initializeApp: inicializa Firebase Admin.
import {cert,getApps,initializeApp} from "firebase-admin/app";
// getFirestore: obtiene el servicio de Firestore de Firebase Admin.
// Permite que el código del servidor pueda leer y modificar información de la base de datos.
import {getFirestore} from "firebase-admin/firestore";
// getMessaging: obtiene el servicio de Firebase Cloud Messaging (FCM).
// Permite trabajar con el sistema de notificaciones push desde funciones del servidor.
import {getMessaging} from "firebase-admin/messaging";


/* ==========================================================
   OBTENER CREDENCIALES
========================================================== */

function obtenerCredencialesFirebase() {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error(
      "No existe FIREBASE_SERVICE_ACCOUNT_JSON."
    );
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON no contiene un JSON válido."
    );
  }
}


/* ==========================================================
   INICIAR FIREBASE
========================================================== */

if (getApps().length === 0) {
  initializeApp({
    credential: cert(
      obtenerCredencialesFirebase()
    ),
  });
}

const db =
  getFirestore();

const messaging =
  getMessaging();


/* ==========================================================
   OBTENER TOKEN ANDROID
========================================================== */

async function obtenerTokenAndroid() {
  const snapshot =
    await db
      .collection("notificationTokens")
      .where(
        "platform",
        "==",
        "android"
      )
      .where(
        "enabled",
        "==",
        true
      )
      .limit(1)
      .get();

  if (snapshot.empty) {
    throw new Error(
      "No existe ningún token Android registrado."
    );
  }

  const documento =
    snapshot.docs[0];

  const datos =
    documento.data();

  if (!datos.token) {
    throw new Error(
      "El documento no contiene un token FCM."
    );
  }

  console.log(
    "Usuario encontrado:",
    datos.uid
  );

  return datos.token;
}


/* ==========================================================
   ENVIAR NOTIFICACIÓN
========================================================== */

async function enviarNotificacion() {
  try {
    console.log(
      "Buscando dispositivo Android..."
    );

    const token =
      await obtenerTokenAndroid();

    console.log(
      "Token FCM encontrado."
    );

    const mensaje = {
      token,

      notification: {
        title: "🔔 Recomedi",
        body: "Esta es una notificación enviada mediante Firebase Cloud Messaging.",
      },

      data: {
        tipo: "alerta",
        origen: "prueba",
      },
    };

    const respuesta =
      await messaging.send(
        mensaje
      );

    console.log(
      "================================="
    );

    console.log(
      "NOTIFICACIÓN ENVIADA CORRECTAMENTE"
    );

    console.log(
      "ID:",
      respuesta
    );

    console.log(
      "================================="
    );
  } catch (error) {
    console.error(
      "Error enviando notificación FCM:"
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
}


enviarNotificacion();