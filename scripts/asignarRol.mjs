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

initializeApp({
  credential: applicationDefault(),
});

const email = process.argv[2];
const nuevoRol = process.argv[3];

const rolesValidos = [
  "usuario",
  "moderador",
  "admin",
];

if (!email || !nuevoRol) {
  console.error(
    "Uso: node scripts/asignarRol.mjs correo rol"
  );

  console.error(
    "Ejemplo: node scripts/asignarRol.mjs usuario@email.com admin"
  );

  process.exit(1);
}

if (!rolesValidos.includes(nuevoRol)) {
  console.error(
    `Rol inválido. Roles permitidos: ${rolesValidos.join(", ")}`
  );

  process.exit(1);
}

try {
  // const declara una variable cuyo valor no se reasigna. 
  // auth: almacena la instancia del servicio de autenticación de Firebase Admin.
  const auth = getAuth();

  const usuario =
    await auth.getUserByEmail(email);

  const claimsActuales =
    usuario.customClaims || {};

  await auth.setCustomUserClaims(
    usuario.uid,
    {
      ...claimsActuales,
      role: nuevoRol,
    }
  );

  console.log("");
  console.log("=================================");
  console.log("ROL ACTUALIZADO CORRECTAMENTE");
  console.log("=================================");
  console.log(`Correo: ${usuario.email}`);
  console.log(`UID: ${usuario.uid}`);
  console.log(`Rol: ${nuevoRol}`);
  console.log("");
  console.log(
    "El usuario debe volver a iniciar sesión"
  );
  console.log(
    "o renovar su token para recibir el nuevo rol."
  );
  console.log("");
} catch (error) {
  console.error(
    "No fue posible asignar el rol:"
  );

  console.error(error);

  process.exit(1);
}