import { useEffect, useState } from "react";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../services/firebase";

type Rol =
  | "usuario"
  | "moderador"
  | "admin";

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