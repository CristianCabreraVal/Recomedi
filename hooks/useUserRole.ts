/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
//Hooks de React utilizados para manejar:
//useEffect: ejecutar procesos al cargar la pantalla.
//useState: guardar información que cambia durante el uso.
import { useEffect, useState } from "react";
// Importación de funciones específicas de Firebase Firestore para manipular y consultar datos
import {doc,getDoc} from "firebase/firestore";
// auth: instancia de Firebase Authentication configurada para gestionar la autenticación de los usuarios.
// db: instancia de Firestore utilizada para leer y guardar información en la base de datos.
import {auth,db} from "../services/firebase";

type Rol =
  | "usuario"
  | "moderador"
  | "admin";
// export permite que ese componente sea utilizado por otros archivos por de medio imports.
// function declara una función. En React, una función como esta puede utilizarse como componente cuando devuelve elementos de interfaz.
export function useUserRole() {
  const [rol, setRol] =
    useState<Rol>("usuario");

  const [cargandoRol, setCargandoRol] =
    useState(true);

  useEffect(() => {
    const cargarRol = async () => {
      try {
        const usuario =
          auth.currentUser;

        if (!usuario) {
          setRol("usuario");
          return;
        }

        const referencia = doc(
          db,
          "usuarios",
          usuario.uid
        );

        const snap =
          await getDoc(referencia);

        if (!snap.exists()) {
          setRol("usuario");
          return;
        }

        const datos = snap.data();

        const rolFirebase =
          datos.rol;

        if (
          rolFirebase === "admin" ||
          rolFirebase === "moderador" ||
          rolFirebase === "usuario"
        ) {
          console.log(
            "Rol detectado:",
            rolFirebase
          );

          setRol(rolFirebase);
        } else {
          console.log(
            "Rol detectado: usuario"
          );

          setRol("usuario");
        }
      } catch (error) {
        console.error(
          "Error obteniendo rol:",
          error
        );

        setRol("usuario");
      } finally {
        setCargandoRol(false);
      }
    };

    cargarRol();
  }, []);

  return {
    rol,
    cargandoRol,
    esAdmin: rol === "admin",
    esModerador:
      rol === "moderador",
    esUsuario:
      rol === "usuario",
  };
}