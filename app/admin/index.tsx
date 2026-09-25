import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { SafeAreaView } from "react-native-safe-area-context";

import { signOut } from "firebase/auth";

import { auth } from "../../services/firebase";

import { useTheme } from "../../hooks/useTheme";

export default function AdminPanel() {
  const { colors } = useTheme();

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
        showsVerticalScrollIndicator={false}
      >
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
              name="shield-checkmark"
              size={30}
              color={colors.primary}
            />
          </View>

          <View style={styles.headerText}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              Panel administrativo
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
              Gestión de Recomedi
            </Text>
          </View>
        </View>

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

          <View style={styles.welcomeContent}>
            <Text
              style={[
                styles.welcomeTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Administrador
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
              Tienes acceso a las funciones administrativas de Recomedi.
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Gestión
        </Text>

      <AdminOption
  icon="people"
  title="Usuarios"
  description="Gestionar usuarios y roles"
  colors={colors}
  onPress={() =>
    router.push("/admin/usuarios")
  }
/>

        <AdminOption
          icon="newspaper"
          title="Noticias"
          description="Administrar noticias de Recomedi"
          colors={colors}
          onPress={() =>
            console.log("Noticias")
          }
        />

        <AdminOption
          icon="warning"
          title="Alertas sanitarias"
          description="Gestionar alertas y epidemias"
          colors={colors}
          onPress={() =>
            console.log("Alertas")
          }
        />

        <AdminOption
          icon="medical"
          title="Centros médicos"
          description="Gestionar información de centros"
          colors={colors}
          onPress={() =>
            console.log(
              "Centros médicos"
            )
          }
        />

        <AdminOption
          icon="flag"
          title="Reportes"
          description="Revisar reportes enviados por usuarios"
          colors={colors}
          onPress={() =>
            console.log("Reportes")
          }
        />

        <AdminOption
          icon="stats-chart"
          title="Estadísticas"
          description="Consultar estadísticas de la aplicación"
          colors={colors}
          onPress={() =>
            console.log("Estadísticas")
          }
        />

        <TouchableOpacity
          onPress={cerrarSesion}
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
            color={colors.textSecondary}
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

function AdminOption({
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
      onPress={onPress}
      activeOpacity={0.8}
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
          color={colors.primary}
        />
      </View>

      <View style={styles.optionContent}>
        <Text
          style={[
            styles.optionTitle,
            {
              color: colors.text,
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
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scroll: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  headerIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },

  welcomeCard: {
    borderWidth: 1,
    borderRadius: 19,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },

  welcomeContent: {
    flex: 1,
    marginLeft: 13,
  },

  welcomeTitle: {
    fontSize: 17,
    fontWeight: "800",
  },

  welcomeText: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },

  option: {
    minHeight: 76,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 13,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  optionIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  optionContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: "800",
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 8,
  },

  logoutText: {
    fontSize: 14,
    fontWeight: "700",
  },
});