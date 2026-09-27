import {
    applicationDefault,
    initializeApp,
} from "firebase-admin/app";

import {
    getAuth,
} from "firebase-admin/auth";

import {
    getFirestore,
} from "firebase-admin/firestore";

initializeApp({
  credential: applicationDefault(),
  projectId: "recomedi-3fcef",
});

const auth = getAuth();
const db = getFirestore();

const ROLES_VALIDOS = [
  "usuario",
  "moderador",
  "admin",
];

async function migrarRoles() {
  try {
    console.log("Iniciando migración de roles...\n");

    let siguientePageToken;
    let procesados = 0;
    let actualizados = 0;
    let conservados = 0;

    do {
      const resultado = await auth.listUsers(
        1000,
        siguientePageToken
      );

      for (const usuarioAuth of resultado.users) {
        const uid = usuarioAuth.uid;

        const referencia = db
          .collection("usuarios")
          .doc(uid);

        const documento = await referencia.get();

        // Si no existe el perfil en Firestore,
        // lo creamos con datos básicos.
        if (!documento.exists) {
          let rolInicial = "usuario";

          const rolClaim =
            usuarioAuth.customClaims?.role;

          if (
            rolClaim &&
            ROLES_VALIDOS.includes(rolClaim)
          ) {
            rolInicial = rolClaim;
          }

          await referencia.set(
            {
              uid,
              email:
                usuarioAuth.email || "",
              emailVerificado:
                usuarioAuth.emailVerified || false,
              rol: rolInicial,
              activo:
                !usuarioAuth.disabled,
            },
            {
              merge: true,
            }
          );

          console.log(
            `CREADO: ${
              usuarioAuth.email || uid
            } → ${rolInicial}`
          );

          actualizados++;
          procesados++;

          continue;
        }

        const datos = documento.data();

        const rolActual =
          datos?.rol;

        // Si ya tiene un rol válido,
        // lo conservamos.
        if (
          rolActual &&
          ROLES_VALIDOS.includes(rolActual)
        ) {
          await referencia.set(
            {
              uid,
              email:
                datos.email ||
                usuarioAuth.email ||
                "",
              emailVerificado:
                usuarioAuth.emailVerified ||
                false,
            },
            {
              merge: true,
            }
          );

          console.log(
            `CONSERVADO: ${
              usuarioAuth.email || uid
            } → ${rolActual}`
          );

          conservados++;
          procesados++;

          continue;
        }

        // Si no tiene rol, revisamos primero
        // el Custom Claim existente.
        const rolClaim =
          usuarioAuth.customClaims?.role;

        const nuevoRol =
          rolClaim &&
          ROLES_VALIDOS.includes(rolClaim)
            ? rolClaim
            : "usuario";

        await referencia.set(
          {
            uid,
            email:
              datos.email ||
              usuarioAuth.email ||
              "",
            emailVerificado:
              usuarioAuth.emailVerified ||
              false,
            rol: nuevoRol,
            activo:
              datos.activo ??
              !usuarioAuth.disabled,
          },
          {
            merge: true,
          }
        );

        console.log(
          `ACTUALIZADO: ${
            usuarioAuth.email || uid
          } → ${nuevoRol}`
        );

        actualizados++;
        procesados++;
      }

      siguientePageToken =
        resultado.pageToken;

    } while (siguientePageToken);

    console.log("\n==============================");
    console.log("Migración finalizada");
    console.log("==============================");
    console.log(
      `Procesados: ${procesados}`
    );
    console.log(
      `Actualizados: ${actualizados}`
    );
    console.log(
      `Conservados: ${conservados}`
    );

  } catch (error) {
    console.error(
      "\nError durante la migración:"
    );

    console.error(error);

    process.exit(1);
  }
}

migrarRoles();