import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";


import { db } from "./firebase";

export type RolUsuario =
  | "usuario"
  | "moderador"
  | "admin";

export type UsuarioAdmin = {
  uid: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
  rol: RolUsuario;
  activo: boolean;
  emailVerificado: boolean;
};

/* ============================================================
   NORMALIZAR ROL
============================================================ */

function normalizarRol(
  valor: unknown
): RolUsuario {
  if (
    valor === "admin" ||
    valor === "moderador" ||
    valor === "usuario"
  ) {
    return valor;
  }

  return "usuario";
}

/* ============================================================
   OBTENER USUARIOS
============================================================ */

export async function obtenerUsuarios(): Promise<
  UsuarioAdmin[]
> {
  const referencia = collection(
    db,
    "usuarios"
  );

  const snapshot =
    await getDocs(referencia);

  const usuarios: UsuarioAdmin[] = [];

  snapshot.forEach((documento) => {
    const datos =
      documento.data();

    usuarios.push({
      uid: documento.id,

      email:
        datos.email ?? "",

      nombre:
        datos.nombre ?? "",

      apellido:
        datos.apellido ?? "",

      telefono:
        datos.telefono ?? "",

      rol:
        normalizarRol(
          datos.rol
        ),

      activo:
        datos.activo ?? true,

      emailVerificado:
        datos.emailVerificado ?? false,
    });
  });

  usuarios.sort((a, b) => {
    const nombreA =
      `${a.nombre} ${a.apellido}`
        .trim()
        .toLowerCase();

    const nombreB =
      `${b.nombre} ${b.apellido}`
        .trim()
        .toLowerCase();

    return nombreA.localeCompare(
      nombreB
    );
  });

  return usuarios;
}

/* ============================================================
   ACTUALIZAR ESTADO DEL USUARIO
============================================================ */

export async function actualizarEstadoUsuario(
  uid: string,
  activo: boolean
) {
  const referencia =
    doc(db, "usuarios", uid);

  await updateDoc(
    referencia,
    {
      activo,
    }
  );
}

/* ============================================================
   ACTUALIZAR ROL DEL USUARIO
============================================================ */

export async function actualizarRolUsuario(
  uid: string,
  rol: RolUsuario
) {
  const referencia =
    doc(db, "usuarios", uid);

  await updateDoc(
    referencia,
    {
      rol,
    }
  );
}

/* ============================================================
   ELIMINAR USUARIO
============================================================ */

/*
 * IMPORTANTE:
 *
 * Esta función NO elimina directamente desde Firestore.
 *
 * En lugar de utilizar deleteDoc(), llama a la Cloud Function
 * "eliminarUsuario".
 *
 * La Cloud Function se encarga de:
 *
 * 1. Verificar que quien realiza la petición sea administrador.
 * 2. Impedir que el administrador se elimine a sí mismo.
 * 3. Eliminar usuarios/{uid}.
 * 4. Eliminar sus subcolecciones mediante recursiveDelete().
 * 5. Eliminar la cuenta de Firebase Authentication.
 */

export async function eliminarUsuarioDeFirestore(uid: string) {
  if (typeof uid !== "string" || !uid.trim()) {
    throw new Error("UID de usuario inválido.");
  }

  // Buscar toda la actividad del usuario
  const actividadRef = collection(db, "usuarios", uid, "actividad");
  const actividadSnapshot = await getDocs(actividadRef);

  // Eliminar cada actividad
  for (const documento of actividadSnapshot.docs) {
    await deleteDoc(documento.ref);
  }

  // Eliminar el perfil principal
  const usuarioRef = doc(db, "usuarios", uid);
  await deleteDoc(usuarioRef);
}