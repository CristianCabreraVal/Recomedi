/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
import { useRouter } from "expo-router";
//Componentes visuales de React Native utilizados paraconstruir la pantalla de carga.
import {ScrollView,StyleSheet,Text,TouchableOpacity,View} from "react-native";
// Ionicons: permite usar iconos para complementar la interfaz de usuario
import { Ionicons } from "@expo/vector-icons";
// Componente para evitar que el contenido se solape con los bordes físicos del dispositivo (notch, barra de estado)
import { SafeAreaView } from "react-native-safe-area-context";

import { signOut } from "firebase/auth";
// Instancias de autenticación configurada de Firebase
import { auth } from "../../services/firebase";
// Importación del hook personalizado para obtener los colores del tema actual (claro u oscuro)
import { useTheme } from "../../hooks/useTheme";
// export permite utilizar este componente desde otros archivos.
// function declara el componente.
// export default indica que este es el componente principal que se exporta desde este archivo.
export default function ModeradorPanel() {
/*const: declara una variable cuyo valor no se reasigna.
Se utiliza para guardar valores, funciones, resultados de
hooks o referencias que serán utilizados posteriormente por el componente.
*/
  const { colors } = useTheme();
  // useRouter permite al usuario navegar desde botones o eventos hacia otras rutas de la aplicación.
  const router = useRouter();

  async function cerrarSesion() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(
        "Error cerrando sesión:",
        error
      );
    }
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={
          styles.scroll
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* ==================================================
            ENCABEZADO
        ================================================== */}

        <View style={styles.header}>
          <View
            style={[
              styles.headerIcon,
              {
                backgroundColor:
                  colors.card,
              },
            ]}
          >
            <Ionicons
              name="shield-half"
              size={30}
              color={colors.primary}
            />
          </View>

          <View
            style={styles.headerText}
          >
            <Text
              style={[
                styles.title,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Panel de moderador
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Moderación de Recomedi
            </Text>
          </View>
        </View>

        {/* ==================================================
            TARJETA DE BIENVENIDA
        ================================================== */}

        <View
          style={[
            styles.welcomeCard,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
        >
          <Ionicons
            name="person-circle"
            size={50}
            color={colors.primary}
          />

          <View
            style={
              styles.welcomeContent
            }
          >
            <Text
              style={[
                styles.welcomeTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Moderador
            </Text>

            <Text
              style={[
                styles.welcomeText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Tienes acceso a las funciones de moderación de Recomedi.
            </Text>
          </View>
        </View>

        {/* ==================================================
            GESTIÓN
        ================================================== */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                colors.text,
            },
          ]}
        >
          Gestión
        </Text>

        <ModeradorOption
          icon="people"
          title="Usuarios"
          description="Gestionar usuarios y estados de las cuentas"
          colors={colors}
          onPress={() =>
            router.push(
              "/moderador/usuarios"
            )
          }
        />

        <ModeradorOption
          icon="newspaper"
          title="Noticias"
          description="Administrar noticias de Recomedi"
          colors={colors}
          onPress={() =>
            router.push(
              "/moderador/noticias"
            )
          }
        />

        <ModeradorOption
          icon="warning"
          title="Alertas sanitarias"
          description="Gestionar alertas y epidemias"
          colors={colors}
          onPress={() =>
            router.push(
              "/moderador/alertas"
            )
          }
        />

        <ModeradorOption
          icon="flag"
          title="Reportes"
          description="Revisar reportes enviados por usuarios"
          colors={colors}
          onPress={() =>
            router.push(
              "/moderador/reportes"
            )
          }
        />

        {/* ==================================================
            CERRAR SESIÓN
        ================================================== */}

        <TouchableOpacity
          onPress={
            cerrarSesion
          }
          style={[
            styles.logoutButton,
            {
              borderColor:
                colors.border,
            },
          ]}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={
              colors.textSecondary
            }
          />

          <Text
            style={[
              styles.logoutText,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            Cerrar sesión
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ModeradorOption({
  icon,
  title,
  description,
  colors,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  colors: any;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={
        onPress
      }
      activeOpacity={
        0.8
      }
      style={[
        styles.option,
        {
          backgroundColor:
            colors.card,
          borderColor:
            colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.optionIcon,
          {
            backgroundColor:
              colors.background,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={23}
          color={
            colors.primary
          }
        />
      </View>

      <View
        style={
          styles.optionContent
        }
      >
        <Text
          style={[
            styles.optionTitle,
            {
              color:
                colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.optionDescription,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          {description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={
          colors.textSecondary
        }
      />
    </TouchableOpacity>
  );
}
/* StyleSheet.create permite agrupar los estilos utilizados por los componentes de este archivo.
 Cada propiedad dentro de styles representa un conjunto de 
 características visuales que puede aplicarse mediante:
 style={styles.nombre}
 */
const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },

    scroll: {
      padding: 20,
      paddingBottom: 40,
    },

    header: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 24,
    },

    headerIcon: {
      width: 58,
      height: 58,
      borderRadius: 18,
      justifyContent:
        "center",
      alignItems:
        "center",
      marginRight: 13,
    },

    headerText: {
      flex: 1,
    },

    title: {
      fontSize: 26,
      fontWeight:
        "800",
    },

    subtitle: {
      fontSize: 13,
      marginTop: 4,
    },

    welcomeCard: {
      borderWidth: 1,
      borderRadius: 19,
      padding: 17,
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 28,
    },

    welcomeContent: {
      flex: 1,
      marginLeft: 13,
    },

    welcomeTitle: {
      fontSize: 17,
      fontWeight:
        "800",
    },

    welcomeText: {
      fontSize: 13,
      lineHeight: 19,
      marginTop: 4,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight:
        "800",
      marginBottom: 12,
    },

    option: {
      minHeight: 76,
      borderRadius: 17,
      borderWidth: 1,
      paddingHorizontal: 13,
      marginBottom: 11,
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    optionIcon: {
      width: 45,
      height: 45,
      borderRadius: 14,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    optionContent: {
      flex: 1,
      marginLeft: 12,
      marginRight: 8,
    },

    optionTitle: {
      fontSize: 15,
      fontWeight:
        "800",
    },

    optionDescription: {
      fontSize: 12,
      lineHeight: 17,
      marginTop: 3,
    },

    logoutButton: {
      height: 48,
      borderWidth: 1,
      borderRadius: 13,
      flexDirection:
        "row",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginTop: 20,
      gap: 8,
    },

    logoutText: {
      fontSize: 14,
      fontWeight:
        "700",
    },
  });