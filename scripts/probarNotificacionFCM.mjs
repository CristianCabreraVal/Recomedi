import {
    cert,
    getApps,
    initializeApp,
} from "firebase-admin/app";

import {
    getFirestore,
} from "firebase-admin/firestore";

import {
    getMessaging,
} from "firebase-admin/messaging";


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