import { useEffect, useState } from "react";

import { auth } from "../services/firebase";

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

        const token =
          await usuario.getIdTokenResult(true);

        const rolFirebase =
          token.claims.role;

        if (
          rolFirebase === "admin" ||
          rolFirebase === "moderador" ||
          rolFirebase === "usuario"
        ) {
          setRol(rolFirebase);
        } else {
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