/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// initializeApp: inicializa Firebase Admin para que las funciones del servidor puedan utilizar los servicios de Firebase.
// applicationDefault: permite utilizar las credenciales predeterminadas disponibles para autenticar Firebase Admin en el entorno donde se ejecuta.
import { applicationDefault, initializeApp } from "firebase-admin/app";
// getAuth: obtiene el servicio de Authentication de Firebase Admin.
// Permite consultar y administrar usuarios de Firebase desde código que se ejecuta en el servidor.
import { getAuth } from "firebase-admin/auth";
// getFirestore: obtiene la instancia de Firestore para poder consultar, crear, modificar o eliminar datos desde el servidor.
import { getFirestore } from "firebase-admin/firestore";

initializeApp({
  credential: applicationDefault(),
});
// const declara una variable cuyo valor no se reasigna. 
// auth: almacena la instancia del servicio de autenticación de Firebase Admin.
// db: almacena la instancia de Firestore. De esta manera, las funciones posteriores pueden utilizar auth y db para trabajar con los usuarios y los datos.
const auth = getAuth();
const db = getFirestore();

async function sincronizarUsuarios() {
  try {
    let siguientePageToken;
    let total = 0;

    do {
      const resultado = await auth.listUsers(1000, siguientePageToken);

      for (const usuario of resultado.users) {
        const referencia = db.collection("usuarios").doc(usuario.uid);

        await referencia.set(
          {
            uid: usuario.uid,
            email: usuario.email || "",
            emailVerificado: usuario.emailVerified || false,
            nombre: usuario.displayName || "",
            activo: !usuario.disabled,
          },
          { merge: true }
        );

        total++;

        console.log(
          `Sincronizado: ${usuario.email || usuario.uid}`
        );
      }

      siguientePageToken = resultado.pageToken;
    } while (siguientePageToken);

    console.log(`\nUsuarios sincronizados: ${total}`);
  } catch (error) {
    console.error("Error sincronizando usuarios:", error);
    process.exit(1);
  }
}

sincronizarUsuarios();