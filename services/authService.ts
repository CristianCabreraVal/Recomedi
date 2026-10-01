/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// createUserWithEmailAndPassword: crea una cuenta utilizando correo y contraseña.
// signInWithEmailAndPassword: inicia sesión con correo y contraseña.
// signOut: cierra la sesión actual.
// User: tipo que representa la información de un usuario autenticado de Firebase.
import {createUserWithEmailAndPassword,signInWithEmailAndPassword,
  signOut,User} from "firebase/auth";
// Instancias de autenticación configurada de Firebase
import { auth } from "./firebase";
// crearUsuarioFirestore: función propia del proyecto que crea o guarda en Firestore el perfil correspondiente al usuario registrado.
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
// export permite que ese componente sea utilizado por otros archivos por de medio imports.
// function declara una función. En React, una función como esta puede utilizarse como componente cuando devuelve elementos de interfaz.
export function obtenerUsuarioActual(): User | null {
  return auth.currentUser;
}