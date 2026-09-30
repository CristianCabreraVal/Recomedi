/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
// Instancias de autenticación configurada de Firebase
import { auth } from "./firebase";
import { crearUsuarioFirestore } from "./usuarioService";

export async function registrarUsuario(
  email: string,
  password: string
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await crearUsuarioFirestore(credential.user);

  return credential.user;
}

export async function iniciarSesion(
  email: string,
  password: string
): Promise<User> {
  const credential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return credential.user;
}

export async function cerrarSesion(): Promise<void> {
  await signOut(auth);
}

export function obtenerUsuarioActual(): User | null {
  return auth.currentUser;
}