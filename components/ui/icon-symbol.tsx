import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView, SymbolViewProps, type SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
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