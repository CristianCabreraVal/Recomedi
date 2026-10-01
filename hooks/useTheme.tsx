/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// createContext: crea un contexto que permite compartir información entre componentes sin tener que pasarla manualmente por cada nivel.
// useContext: permite acceder a la información almacenada en un contexto.
// En Recomedi se utiliza, por ejemplo, para compartir el tema de la aplicación entre diferentes pantallas.
import {createContext,useContext,useEffect,useState,ReactNode,} from "react";
//AsyncStorage: permite guardar información de manera persistente en el dispositivo.
// Los datos pueden mantenerse aunque la aplicación se cierre y se vuelva a abrir.
// Se utiliza para configuraciones o datos locales que no necesitan estar directamente en Firestore.
import AsyncStorage from "@react-native-async-storage/async-storage";

type Theme = {
  dark: boolean;
  setDark: (value: boolean) => void;
  toggleTheme: () => void;

  colors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    primary: string;
    border: string;

    // Colores especiales para elementos que necesitan
    // conservar una apariencia determinada.
    mapBackground: string;
    mapText: string;
  };
};

const ThemeContext = createContext<Theme | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [dark, setDark] = useState(false);
useEffect(() => {
  const cargarTema = async () => {
    try {
      const data = await AsyncStorage.getItem("config");

      if (!data) {
        return;
      }

      try {
        const config = JSON.parse(data);

        setDark(Boolean(config?.modoOscuro));
      } catch (error) {
        console.warn(
          "La configuración guardada no es válida. Se restablecerá."
        );

        await AsyncStorage.removeItem("config");
        setDark(false);
      }
    } catch (error) {
      console.error("Error al cargar el tema:", error);
      setDark(false);
    }
  };

  cargarTema();
}, []);

  const cambiarTema = async (value: boolean) => {
    setDark(value);

    try {
      const data = await AsyncStorage.getItem("config");
      const config = data ? JSON.parse(data) : {};

      config.modoOscuro = value;

      await AsyncStorage.setItem("config", JSON.stringify(config));
    } catch (error) {
      console.error("Error al guardar el tema:", error);
    }
  };

  const toggleTheme = () => {
    cambiarTema(!dark);
  };

  const colors = dark
    ? {
        // Tema oscuro
        background: "#111827",
        card: "#1F2937",
        text: "#F9FAFB",
        textSecondary: "#D1D5DB",
        primary: "#60A5FA",
        border: "#374151",

        // Elementos especiales
        mapBackground: "#111827",
        mapText: "#FFFFFF",
      }
    : {
        // Tema claro
        background: "#F3F4F6",
        card: "#FFFFFF",
        text: "#111827",
        textSecondary: "#6B7280",
        primary: "#2563EB",
        border: "#E5E7EB",

        // Elementos especiales
        mapBackground: "#F3F4F6",
        mapText: "#111827",
      };

  return (
    <ThemeContext.Provider
      value={{
        dark,
        setDark: cambiarTema,
        toggleTheme,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme debe utilizarse dentro de ThemeProvider"
    );
  }

  return context;
};