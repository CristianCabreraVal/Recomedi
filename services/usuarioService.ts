import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { User } from "firebase/auth";
import { db } from "./firebase";
import { configuracionDefault } from "../utils/configuracionDefault";

export async function crearUsuarioFirestore(
  user: User
): Promise<void> {
  const referencia = doc(db, "usuarios", user.uid);

  const snapshot = await getDoc(referencia);

  if (snapshot.exists()) {
    return;
  }

  await setDoc(referencia, {
    email: user.email ?? "",
    configuracion: configuracionDefault,
  });
}