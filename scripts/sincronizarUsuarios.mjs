import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({
  credential: applicationDefault(),
});

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