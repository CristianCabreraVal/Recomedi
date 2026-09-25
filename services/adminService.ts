import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";

export type RolUsuario = "usuario" | "moderador" | "admin";

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

const convertirRol = (rol: unknown): RolUsuario => {
  if (rol === "admin" || rol === "moderador" || rol === "usuario") {
    return rol;
  }

  return "usuario";
};

export async function obtenerUsuarios(): Promise<UsuarioAdmin[]> {
  const referencia = collection(db, "usuarios");

  const snapshot = await getDocs(referencia);

  const usuarios: UsuarioAdmin[] = [];

  snapshot.forEach((documento) => {
    const datos = documento.data();

    usuarios.push({
      uid: documento.id,
      email: datos.email || "",
      nombre: datos.nombre || "",
      apellido: datos.apellido || "",
      telefono: datos.telefono || "",
      rol: convertirRol(datos.rol),
      activo: datos.activo ?? true,
      emailVerificado: datos.emailVerificado ?? false,
    });
  });

  usuarios.sort((a, b) => {
    const nombreA = `${a.nombre} ${a.apellido}`.trim().toLowerCase();
    const nombreB = `${b.nombre} ${b.apellido}`.trim().toLowerCase();

    return nombreA.localeCompare(nombreB);
  });

  return usuarios;
}

export async function actualizarEstadoUsuario(
  uid: string,
  activo: boolean
) {
  const referencia = doc(db, "usuarios", uid);

  await updateDoc(referencia, {
    activo,
  });
}

export async function actualizarRolUsuario(
  uid: string,
  rol: RolUsuario
) {
  const referencia = doc(db, "usuarios", uid);

  await updateDoc(referencia, {
    rol,
  });
}