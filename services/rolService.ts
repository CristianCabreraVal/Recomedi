import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export type RolUsuario = "usuario" | "moderador" | "admin";

export async function obtenerRolUsuario(
  uid: string
): Promise<RolUsuario> {
  const referencia = doc(db, "usuarios", uid);
  const resultado = await getDoc(referencia);

  if (!resultado.exists()) {
    return "usuario";
  }

  const datos = resultado.data();

  if (
    datos.rol === "admin" ||
    datos.rol === "moderador" ||
    datos.rol === "usuario"
  ) {
    return datos.rol;
  }

  return "usuario";
}