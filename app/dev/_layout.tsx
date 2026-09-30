import { Stack } from "expo-router";
// export permite utilizar este componente desde otros archivos.
// function declara el componente.
// export default indica que este es el componente principal que se exporta desde este archivo.
export default function DevLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    />
  );
}