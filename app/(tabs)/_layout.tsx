/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
//Componentes visuales de React Native utilizados paraconstruir la pantalla de carga.
// Pressable: crea botones o elementos que pueden ser presionados
// StyleSheet: permite definir los estilos de los para mantener un diseño
import {Pressable,StyleSheet,} from "react-native";
// Tabs: controla la navegación mediante pestañas
// useRouter: permite navegar manualmente hacia otras rutas
import { Tabs, useRouter } from "expo-router";
// Ionicons: permite usar iconos para complementar la interfaz de usuario
import { Ionicons } from "@expo/vector-icons";
//useSafeAreaInsets: obtiene el espacio que el dispositivo reserva para el sistema, como la barra de navegación inferior
// Esto evita que la barra de pestañas quede debajo de los controles del sistema
import { useSafeAreaInsets } from "react-native-safe-area-context";
// Importaciones propias que traen funciones de otros archivos
// Importación del hook personalizado para obtener los colores del tema actual (claro u oscuro)
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
   no aparecen dentro de la barra inferior
============================================================ */
// export default indica que este es el componente principal que se exporta desde este archivo.
export default function Layout() {

  /* ------------------------------------------------------------
     HERRAMIENTAS DE NAVEGACIÓN Y TEMA
  ------------------------------------------------------------ */
/*const: declara una variable cuyo valor no se reasigna.
Se utiliza para guardar valores, funciones, resultados de
hooks o referencias que serán utilizados posteriormente por el componente.
*/
  // useRouter permite al usuario navegar desde botones o eventos hacia otras rutas de la aplicación.
  const router = useRouter();

  // useTheme obtiene los colores utilizados actualmente por la aplicación 
  const { colors } = useTheme();

  // Obtiene el espacio seguro del dispositivo, evita cubrir elementos de la interfaz con la barra de navegación del sistema.
  // insets representa el espacio que queda debajo de la aplicación y que puede ser ocupado por la navegación del sistema.
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

  // Botón de la esquina superior izquierda (Configuración).
  headerButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,

    justifyContent: "center",
    alignItems: "center",
  },

});