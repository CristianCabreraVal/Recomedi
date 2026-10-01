/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// applicationDefault: proporciona credenciales predeterminadas para autenticar Firebase Admin en el entorno donde se ejecuta.
// getApps: permite comprobar qué aplicaciones de Firebase Admin ya han sido inicializadas.
// initializeApp: inicializa Firebase Admin para poder utilizar sus servicios desde el servidor.
import {applicationDefault,getApps,initializeApp} from "firebase-admin/app";
// getFirestore: obtiene el servicio de Firestore de Firebase Admin.
// Permite que el código del servidor pueda leer y modificar información de la base de datos.
import {getFirestore} from "firebase-admin/firestore";
// getMessaging: obtiene el servicio de Firebase Cloud Messaging (FCM).
// Permite trabajar con el sistema de notificaciones push desde funciones del servidor.
import {getMessaging} from "firebase-admin/messaging";
function iniciarFirebase() {
  if (getApps().length === 0) {
    initializeApp({
      credential: applicationDefault(),
      projectId: "recomedi-3fcef",
    });
  }
}
iniciarFirebase();

const db = getFirestore();
const messaging = getMessaging();

/*
 * Categorías disponibles para las pruebas.
 */
const NOTIFICACIONES = {
  noticia: {
    titulo: "📰 Nueva noticia",
    cuerpo:
      "Hay una nueva noticia disponible en Recomedi.",
  },

  alerta: {
    titulo: "🚨 Nueva alerta",
    cuerpo:
      "Tienes una alerta importante de epidemia.",
  },

  actividad: {
    titulo: "📋 Recordatorio de actividad",
    cuerpo:
      "Recuerda registrar tu actividad fisica diaria en Recomedi.",
  },

  hidratacion: {
    titulo: "💧 Recordatorio de hidratación",
    cuerpo:
      "recuerda tomar agua frecuentemente para mantenerte hidratado.",
  },

  cuidado: {
    titulo: "❤️ Cuidado personal",
    cuerpo:
      "Recuerda cuidar de ti mismo y priorizar tu bienestar.",
  },

  chequeo: {
    titulo: "🩺 Recordatorio de chequeo",
    cuerpo:
      "Recuerda programar tu chequeo médico regular para mantener tu salud en buen estado.",
  },
};

/*
 * Leer el tipo desde la terminal.
 *
 * Ejemplo:
 * node scripts/enviarNotificacionFCM.mjs noticia
 */
const tipo =
  process.argv[2]?.toLowerCase() ||
  "noticia";

if (!NOTIFICACIONES[tipo]) {
  console.error(
    "Tipo de notificación no válido."
  );

  console.log(
    "\nTipos disponibles:"
  );

  Object.keys(
    NOTIFICACIONES
  ).forEach((item) => {
    console.log(
      `- ${item}`
    );
  });

  process.exit(1);
}

/*
 * Documento donde guardamos el token
 * del dispositivo actual.
 */
const uid =
  "DKeluNgVIFN8lNw5xGgyB0VzHAk1";

const referencia =
  db
    .collection("usuarios")
    .doc(uid)
    .collection("notificationTokens")
    .doc("android");

const documento =
  await referencia.get();

if (!documento.exists) {
  throw new Error(
    "No existe el token Android para este usuario."
  );
}

const datos =
  documento.data();

const token =
  datos?.token;

if (!token) {
  throw new Error(
    "El documento Android no contiene token FCM."
  );
}

const configuracion =
  NOTIFICACIONES[tipo];

console.log(
  "\n========================================"
);

console.log(
  "     PRUEBA DE NOTIFICACIÓN RECOMEDI"
);

console.log(
  "========================================"
);

console.log(
  "Tipo:",
  tipo
);

console.log(
  "UID:",
  uid
);

console.log(
  "Token encontrado:",
  token
);

console.log(
  "========================================\n"
);

const mensaje = {
  token,

  notification: {
    title:
      configuracion.titulo,

    body:
      configuracion.cuerpo,
  },

  data: {
    tipo,
    origen:
      "prueba-recomedi",

    /*
     * Identificador de prueba.
     *
     * En noticias será el identificador
     * que posteriormente utilizaremos
     * para abrir la noticia concreta.
     */
    noticiaId:
      tipo === "noticia"
        ? "prueba-001"
        : "",
  },

  android: {
    notification: {
      channelId:
        "recomedi",
    },
  },
};

try {
  const respuesta =
    await messaging.send(
      mensaje
    );

  console.log(
    "✅ Notificación enviada correctamente."
  );

  console.log(
    "Message ID:",
    respuesta
  );
} catch (error) {
  console.error(
    "❌ Error enviando la notificación:"
  );

  console.error(
    error
  );

  process.exitCode = 1;
}