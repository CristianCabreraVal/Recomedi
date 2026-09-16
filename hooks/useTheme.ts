import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useTheme = () => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const data = await AsyncStorage.getItem("config");
      if (data) {
        const config = JSON.parse(data);
        setDark(config.modoOscuro ?? false);
      }
    };
    cargar();
  }, []);

  return dark;
};