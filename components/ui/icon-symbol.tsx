/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView, SymbolViewProps, type SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
// importa los componentes de React Native que se van a utilizar en la pantalla
import { OpaqueColorValue, StyleProp, TextStyle, ViewStyle } from "react-native";

type IconMapping = Record<
  string,
  ComponentProps<typeof MaterialIcons>["name"]
>;

const MAPPING: IconMapping = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "person.fill": "person",
  "gearshape.fill": "settings",
  "magnifyingglass": "search",
  "heart.fill": "favorite",
};

export type IconSymbolName = keyof typeof MAPPING;

type IconSymbolProps = {
  name: IconSymbolName;
  size?: number;
  color?: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = "regular",
}: IconSymbolProps) {
  return (
    <SymbolView
      name={name as SymbolViewProps["name"]}
      weight={weight}
      tintColor={color}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}

export function IconSymbolFallback({
  name,
  size = 24,
  color,
  style,
}: Omit<IconSymbolProps, "weight">) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style as StyleProp<TextStyle>}
    />
  );
}