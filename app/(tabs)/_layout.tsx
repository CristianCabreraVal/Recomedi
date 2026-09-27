/* 
importes que traen archivos o librerias para su utilizacion en el codigo, como react-native, expo-router, react, etc.
{} indica que se esta importando especificamente sea una funcion especifica de la libreria, como useRouter, useEffect
 from indica de donde se esta importando la libreria o el archivo
 */
import {Pressable,StyleSheet,} from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
/* 
imports que traen funciones existentes en otros archivos para su utilizacion en este archivo
*/
import { useTheme } from "../../hooks/useTheme";


/* ============================================================
   LAYOUT PRINCIPAL DE LAS PESTAÑAS

   Este archivo controla la navegación principal de Recomedi.

   Aquí se configuran:
   - Las cinco secciones principales de la aplicación.
   - La barra inferior.
   - El encabezado superior.
   - Los accesos globales a Perfil y Configuración.

   Perfil y Configuración siguen siendo rutas válidas, pero
   no aparecen dentro de la barra inferior porque utilizan
   href: null.
============================================================ */

export default function Layout() {

  /* ------------------------------------------------------------
     HERRAMIENTAS DE NAVEGACIÓN Y TEMA
  ------------------------------------------------------------ */

  // Permite enviar al usuario a Perfil o Configuración.
  const router = useRouter();

  // Obtiene los colores definidos por el tema de Recomedi.
  const { colors } = useTheme();

  // Obtiene el espacio seguro del dispositivo.
  // Es especialmente importante en Android para evitar que
  // la barra inferior quede debajo de la navegación del sistema.
  const insets = useSafeAreaInsets();


  /* ------------------------------------------------------------
     ESTRUCTURA DE NAVEGACIÓN
  ------------------------------------------------------------ */

  return (
    <Tabs
      screenOptions={{
        /* ======================================================
           HEADER SUPERIOR

           Se activa para que Perfil y Configuración estén
           disponibles desde las distintas secciones principales.
        ====================================================== */

        headerShown: true,

        // No necesitamos un título adicional en el centro.
        // Cada pantalla puede tener su propio contenido y título.
        headerTitle: "",

        // Mantiene el encabezado visualmente limpio.
        headerTitleAlign: "center",

        // Color utilizado por los elementos del encabezado.
        headerTintColor: colors.primary,

        // Apariencia del espacio superior.
        headerStyle: {
          backgroundColor: colors.background,
          shadowColor: "transparent",
          elevation: 0,
          borderBottomWidth: 0,
        },


        /* ======================================================
           CONFIGURACIÓN

           Aparece en la esquina superior izquierda.

           Como forma parte del header, el espacio de la pantalla
           se calcula teniendo en cuenta este elemento y no se
           coloca encima del contenido.
        ====================================================== */

        headerLeft: () => (
          <Pressable
            onPress={() => router.push("/configuracion")}
            style={styles.headerButton}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Abrir configuración"
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={colors.primary}
            />
          </Pressable>
        ),


        /* ======================================================
           PERFIL

           Aparece en la esquina superior derecha.

           Se mantiene disponible en las diferentes secciones
           que utilizan este layout.
        ====================================================== */

        headerRight: () => (
          <Pressable
            onPress={() => router.push("/perfil")}
            style={styles.headerButton}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil"
          >
            <Ionicons
              name="person-circle-outline"
              size={28}
              color={colors.primary}
            />
          </Pressable>
        ),


        /* ======================================================
           BARRA INFERIOR
        ====================================================== */

        tabBarActiveTintColor: colors.primary,

        tabBarInactiveTintColor:
          colors.textSecondary,

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },

        tabBarStyle: {
          /*
             La altura base de la barra es 68.

             Se añade el espacio inferior del dispositivo para
             evitar que los botones queden debajo de la navegación
             del sistema Android.
          */
          height: 68 + insets.bottom,

          paddingBottom: insets.bottom,

          paddingTop: 6,

          borderTopWidth: 0,

          backgroundColor: colors.card,

          shadowColor: "#000",

          shadowOpacity: 0.08,

          shadowRadius: 12,

          shadowOffset: {
            width: 0,
            height: -4,
          },

          elevation: 8,
        },
      }}
    >

      {/* ======================================================
          INICIO
      ====================================================== */}

      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "home"
                  : "home-outline"
              }
              size={size}
              color={color}
            />
          ),
        }}
      />


      {/* ======================================================
          MAPA
      ====================================================== */}

      <Tabs.Screen
        name="mapa"
        options={{
          title: "Mapa",

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "map"
                  : "map-outline"
              }
              size={size}
              color={color}
            />
          ),
        }}
      />


      {/* ======================================================
          NOTICIAS
      ====================================================== */}

      <Tabs.Screen
        name="noticias"
        options={{
          title: "Noticias",

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "newspaper"
                  : "newspaper-outline"
              }
              size={size}
              color={color}
            />
          ),
        }}
      />


      {/* ======================================================
          ALERTAS
      ====================================================== */}

      <Tabs.Screen
        name="epidemia"
        options={{
          title: "Alertas",

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "warning"
                  : "warning-outline"
              }
              size={size}
              color={color}
            />
          ),
        }}
      />


      {/* ======================================================
          ACTIVIDAD
      ====================================================== */}

      <Tabs.Screen
        name="actividad"
        options={{
          title: "Actividad",

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "fitness"
                  : "fitness-outline"
              }
              size={size}
              color={color}
            />
          ),
        }}
      />


      {/* ======================================================
          PERFIL

          La ruta continúa existiendo y puede abrirse con:

          router.push("/perfil")

          Pero se elimina de la barra inferior mediante
          href: null.
      ====================================================== */}

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",

          href: null,
        }}
      />


      {/* ======================================================
          CONFIGURACIÓN

          La ruta continúa existiendo y puede abrirse con:

          router.push("/configuracion")

          Pero no ocupa un espacio dentro de la barra inferior.
      ====================================================== */}

      <Tabs.Screen
        name="configuracion"
        options={{
          title: "Ajustes",

          href: null,
        }}
      />

    </Tabs>
  );
}


/* ============================================================
   ESTILOS DEL HEADER

   Los botones tienen un área táctil mayor que el icono.
   Esto facilita pulsarlos tanto en móvil como en dispositivos
   con diferentes tamaños de pantalla.

   No se utiliza position: "absolute", por lo que estos botones
   no se superponen al contenido de las pantallas.
============================================================ */

const styles = StyleSheet.create({

  headerButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,

    justifyContent: "center",
    alignItems: "center",
  },

});