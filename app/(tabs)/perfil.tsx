/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
import { useFocusEffect, useRouter, } from "expo-router";
import { useCallback, useState, } from "react";
 // importa los componentes de React Native que se van a utilizar en la pantalla
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
// Importación de funciones específicas de Firebase Firestore para manipular y consultar datos
import { doc, getDoc } from "firebase/firestore";
// Importación del hook personalizado para obtener los colores del tema actual (claro u oscuro)
import { useTheme } from "../../hooks/useTheme";
import { useUserRole } from "../../hooks/useUserRole";
// Instancias de autenticación y base de datos configuradas de Firebase
import { auth, db, } from "../../services/firebase";
// Importa la funcion de un boton para reportar
import BotonReportar from "../../components/BotonReportar";
import {registrarTokenFCMEnFirestore,} from "../../services/notificationTokenService";
import { MOTIVOS_GENERALES } from "@/services/reportesService";
// export permite utilizar este componente desde otros archivos.
// function declara el componente.
// export default indica que este es el componente principal que se exporta desde este archivo.
export default function Perfil() {
/*const: declara una variable cuyo valor no se reasigna.
Se utiliza para guardar valores, funciones, resultados de
hooks o referencias que serán utilizados posteriormente por el componente.
*/
  const registrarDispositivoFCM = async () => {
  try {
    /*Obtiene el token FCM y registra el dispositivo en Firestore mediante la función del servicio.
    El token permite identificar este dispositivo dentro del sistema de notificaciones.
     */
    const token =
      await registrarTokenFCMEnFirestore();
    // Comprueba si el registro del dispositivo fue realizado.
    if (!token) {
      Alert.alert(
        "Error",
        "No se pudo registrar el dispositivo para recibir notificaciones."
      );

      return;
    }

    Alert.alert(
      "Notificaciones activadas",
      "Este dispositivo quedó registrado correctamente para recibir notificaciones."
    );
  } catch (error) {
    console.error(
      "Error registrando dispositivo:",
      error
    );

    Alert.alert(
      "Error",
      "No se pudo registrar el dispositivo."
    );
  }
};
// Obtenemos la paleta de colores actual dependiendo del tema del dispositivo
  const { colors } = useTheme();
//Se utiliza para adaptar la interfaz dependiendo del tamaño del dispositivo o ventana.
  const { width } = useWindowDimensions();
//esMovil indica si la interfaz está siendo mostrada en una pantalla menor a 700 píxeles de ancho.
const esMovil = width < 700;
//useUserRole obtiene información del rol del usuario actual.
  const {rol,cargandoRol,esAdmin,esModerador,} = useUserRole();
//useState permite almacenar información que puede cambiar durante la ejecución del componente.
  const [usuario, setUsuario] =
    useState<any>(null);
//indica si la pantalla o los datos necesarios todavía están siendo cargados.
  const [cargando, setCargando] =
    useState(true);
// router permite enviar al usuario a otras pantallas mediante código
  const router = useRouter();

  /* ============================================================
     CARGAR PERFIL
  ============================================================ */

  useFocusEffect(
    useCallback(() => {
      const cargar = async () => {
        try {
          setCargando(true);

          const uid =
            auth.currentUser?.uid;

          if (!uid) {
            setUsuario(null);
            return;
          }

          const referencia = doc(
            db,
            "usuarios",
            uid
          );

          const snap =
            await getDoc(referencia);

          if (snap.exists()) {
            setUsuario(
              snap.data()
            );
          } else {
            setUsuario(null);
          }
        } catch (error) {
          console.log(
            "Error cargando perfil:",
            error
          );

          setUsuario(null);
        } finally {
          setCargando(false);
        }
      };

      cargar();
    }, [])
  );

  /* ============================================================
   CARGANDO PERFIL
============================================================ */

if (cargando) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text
          style={[
            styles.loadingText,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          Cargando perfil...
        </Text>
      </View>
    </View>
  );
}

/* ============================================================
   SI NO EXISTE PERFIL
============================================================ */

if (!usuario) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <View style={styles.emptyCard}>
        <Text
          style={[
            styles.header,
            {
              color:
                colors.primary,
            },
          ]}
        >
          Perfil
        </Text>

        <Text
          style={[
            styles.emptyText,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          Aún no has creado tu perfil
        </Text>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor:
                colors.primary,
            },
          ]}
          onPress={() =>
            router.push("/perfil/form")
          }
        >
          <Text style={styles.buttonText}>
            Crear Perfil
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ============================================================
   CALCULAR IMC
============================================================ */

const alturaMetros =
  Number(usuario.altura) / 100;

const peso =
  Number(usuario.peso);

const imc =
  alturaMetros > 0
    ? peso /
      (alturaMetros * alturaMetros)
    : 0;

/* ============================================================
   PANTALLA PRINCIPAL
============================================================ */

return (
  <View
    style={[
      styles.container,
      {
        backgroundColor: colors.background,
      },
    ]}
  >
    <ScrollView
      showsVerticalScrollIndicator={true}
      contentContainerStyle={styles.scrollContent}
    >

      {/* ======================================================
          ROL
          Se muestra únicamente a administradores/moderadores.
      ====================================================== */}
      {!cargandoRol &&
        (esAdmin || esModerador) && (
          <View
            style={[
              styles.roleCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={styles.roleEmoji}>
              {esAdmin ? "👑" : "🛡️"}
            </Text>

            <View style={styles.roleContent}>
              <Text
                style={[
                  styles.roleTitle,
                  { color: colors.text },
                ]}
              >
                {esAdmin
                  ? "Cuenta de administrador"
                  : "Cuenta de moderador"}
              </Text>

              <Text
                style={[
                  styles.roleText,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                Rol actual:{" "}
                <Text
                  style={[
                    styles.roleValue,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  {rol}
                </Text>
              </Text>
            </View>
          </View>
        )}

      {/* ======================================================
          CABECERA
      ====================================================== */}
      <View style={styles.profileCard}>
        <View style={styles.profileIdentity}>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {usuario.nombre
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </Text>
          </View>

          <View style={styles.identityText}>
            <Text style={styles.name}>
              {usuario.nombre}
            </Text>

            <Text style={styles.subtitle}>
              Perfil médico personal
            </Text>
          </View>

        </View>

        <View style={styles.profileBadge}>
          <Text style={styles.profileBadgeText}>
            👤  Mi perfil
          </Text>
        </View>
      </View>

      {/* ======================================================
          INFORMACIÓN PERSONAL
          
          Los cuatro datos se presentan como módulos,
          aprovechando el espacio en lugar de formar una lista.
      ====================================================== */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>
            📋
          </Text>

          <View>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text },
              ]}
            >
              Información personal
            </Text>

            <Text
              style={[
                styles.sectionSubtitle,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Datos registrados en tu perfil
            </Text>
          </View>
        </View>

        <View style={styles.personalGrid}>

          {/* EDAD */}
          <View
            style={[
              styles.dataBox,
              {
                backgroundColor:
                  colors.background,
              },
            ]}
          >
            <Text style={styles.dataEmoji}>
              🗓️
            </Text>

            <Text
              style={[
                styles.dataLabel,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Edad
            </Text>

            <Text
              style={[
                styles.dataValue,
                { color: colors.text },
              ]}
            >
              {usuario.edad} años
            </Text>
          </View>

          {/* PESO */}
          <View
            style={[
              styles.dataBox,
              {
                backgroundColor:
                  colors.background,
              },
            ]}
          >
            <Text style={styles.dataEmoji}>
              ⚖️
            </Text>

            <Text
              style={[
                styles.dataLabel,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Peso
            </Text>

            <Text
              style={[
                styles.dataValue,
                { color: colors.text },
              ]}
            >
              {usuario.peso} kg
            </Text>
          </View>

          {/* ALTURA */}
          <View
            style={[
              styles.dataBox,
              {
                backgroundColor:
                  colors.background,
              },
            ]}
          >
            <Text style={styles.dataEmoji}>
              ↕️
            </Text>

            <Text
              style={[
                styles.dataLabel,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Altura
            </Text>

            <Text
              style={[
                styles.dataValue,
                { color: colors.text },
              ]}
            >
              {usuario.altura} cm
            </Text>
          </View>

          {/* GÉNERO */}
          <View
            style={[
              styles.dataBox,
              {
                backgroundColor:
                  colors.background,
              },
            ]}
          >
            <Text style={styles.dataEmoji}>
              👥
            </Text>

            <Text
              style={[
                styles.dataLabel,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Género
            </Text>

            <Text
              style={[
                styles.dataValue,
                { color: colors.text },
              ]}
            >
              {usuario.genero}
            </Text>
          </View>

        </View>
      </View>

      {/* ======================================================
          IMC

          Se conserva el cálculo existente y solamente cambia
          su presentación visual.
      ====================================================== */}
      <View
        style={[
          styles.imcCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.imcHeader}>
          <Text style={styles.sectionEmoji}>
            📊
          </Text>

          <View>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text },
              ]}
            >
              Índice de Masa Corporal
            </Text>

            <Text
              style={[
                styles.sectionSubtitle,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Cálculo basado en peso y altura
            </Text>
          </View>
        </View>

        <View style={styles.imcMain}>
          <Text style={styles.imc}>
            {imc.toFixed(1)}
          </Text>

          <View
            style={[
              styles.imcStatus,
              {
                backgroundColor:
                  colors.background,
              },
            ]}
          >
            <Text style={styles.imcStatusEmoji}>
              ●
            </Text>

            <Text
              style={[
                styles.imcText,
                {
                  color: colors.text,
                },
              ]}
            >
              {imc < 18.5
                ? "Bajo peso"
                : imc < 25
                ? "Peso saludable"
                : imc < 30
                ? "Sobrepeso"
                : "Obesidad"}
            </Text>
          </View>
        </View>
      </View>

      {/* ======================================================
          CONDICIONES MÉDICAS
      ====================================================== */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>
            🩺
          </Text>

          <View>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text },
              ]}
            >
              Condiciones médicas
            </Text>

            <Text
              style={[
                styles.sectionSubtitle,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Información registrada en tu perfil
            </Text>
          </View>
        </View>

        <View style={styles.conditions}>
          {usuario.condiciones?.length > 0 ? (
            usuario.condiciones.map(
              (
                item: string,
                index: number
              ) => (
                <View
                  key={index}
                  style={[
                    styles.condition,
                    {
                      backgroundColor:
                        colors.background,
                      borderColor:
                        colors.border,
                    },
                  ]}
                >
                  <Text style={styles.conditionEmoji}>
                    ✓
                  </Text>

                  <Text
                    style={[
                      styles.conditionText,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    {item}
                  </Text>
                </View>
              )
            )
          ) : (
            <View style={styles.emptyCondition}>
              <Text style={styles.emptyConditionEmoji}>
                ✓
              </Text>

              <Text
                style={[
                  styles.emptyConditionText,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                Sin condiciones registradas
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ======================================================
          EDITAR PERFIL
      ====================================================== */}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor:
              colors.primary,
          },
        ]}
        onPress={() =>
          router.push("/perfil/form")
        }
      >
        <Text style={styles.buttonText}>
          ✎  Editar Perfil
        </Text>
      </TouchableOpacity>
      <BotonReportar
        recursoId="actividad"
        recursoNombre="Actividad y estadísticas"
        motivos={MOTIVOS_GENERALES}
        textoBoton="Reportar un problema"
        descripcionBoton="Reporta un problema con tus datos o estadísticas"
      />

    

    </ScrollView>
  </View>
);
}
/* StyleSheet.create permite agrupar los estilos utilizados por los componentes de este archivo.
 Cada propiedad dentro de styles representa un conjunto de 
 características visuales que puede aplicarse mediante:
 style={styles.nombre}
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },

  // Limita el ancho para que la versión web no se estire demasiado.
  scrollContent: {
    width: "100%",
    maxWidth: 1050,
    alignSelf: "center",
    paddingBottom: 35,
  },

  /* ==========================================================
     ROL
  ========================================================== */

  roleCard: {
    flexDirection: "row",
    alignItems: "center",

    padding: 16,
    borderRadius: 20,
    borderWidth: 1,

    marginBottom: 16,
  },

  roleEmoji: {
    fontSize: 28,
    marginRight: 13,
  },

  roleContent: {
    flex: 1,
  },

  roleTitle: {
    fontSize: 16,
    fontWeight: "800",
  },

  roleText: {
    fontSize: 13,
    marginTop: 4,
  },

  roleValue: {
    fontWeight: "800",
  },

  /* ==========================================================
     CABECERA
  ========================================================== */

  profileCard: {
    backgroundColor: "#2563EB",

    borderRadius: 28,

    padding: 24,

    marginBottom: 18,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    shadowColor: "#2563EB",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 7,
    },

    elevation: 6,
  },

  profileIdentity: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,

    backgroundColor: "#FFFFFF",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 16,
  },

  avatarText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2563EB",
  },

  identityText: {
    flex: 1,
  },

  name: {
    fontSize: 27,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  subtitle: {
    color: "#DBEAFE",
    fontSize: 14,
    marginTop: 5,
  },

  profileBadge: {
    backgroundColor: "#FFFFFF",

    paddingHorizontal: 13,
    paddingVertical: 10,

    borderRadius: 15,

    marginLeft: 15,
  },

  profileBadgeText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "800",
  },

  /* ==========================================================
     SECCIONES
  ========================================================== */

  sectionCard: {
    padding: 20,

    borderRadius: 24,
    borderWidth: 1,

    marginBottom: 16,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 16,
  },

  sectionEmoji: {
    fontSize: 24,
    width: 42,
    textAlign: "center",
    marginRight: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  sectionSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },

  /* ==========================================================
     INFORMACIÓN PERSONAL
  ========================================================== */

  personalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  dataBox: {
    flex: 1,
    minWidth: 180,

    padding: 16,

    borderRadius: 18,
  },

  dataEmoji: {
    fontSize: 23,
    marginBottom: 8,
  },

  dataLabel: {
    fontSize: 12,
  },

  dataValue: {
    fontSize: 17,
    fontWeight: "800",
    marginTop: 3,
  },

  /* ==========================================================
     IMC
  ========================================================== */

  imcCard: {
    padding: 20,

    borderRadius: 24,
    borderWidth: 1,

    marginBottom: 16,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },

  imcHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  imcMain: {
    alignItems: "center",
    justifyContent: "center",

    paddingTop: 12,
  },

  imc: {
    fontSize: 54,
    fontWeight: "800",
    color: "#2563EB",
  },

  imcStatus: {
    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 13,
    paddingVertical: 8,

    borderRadius: 999,

    marginTop: 4,
  },

  imcStatusEmoji: {
    color: "#16A34A",
    fontSize: 13,
    marginRight: 7,
  },

  imcText: {
    fontSize: 14,
    fontWeight: "700",
  },

  /* ==========================================================
     CONDICIONES
  ========================================================== */

  conditions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  condition: {
    flexDirection: "row",
    alignItems: "center",

    paddingVertical: 10,
    paddingHorizontal: 13,

    borderRadius: 16,
    borderWidth: 1,
  },

  conditionEmoji: {
    color: "#16A34A",
    fontSize: 17,
    fontWeight: "800",
    marginRight: 7,
  },

  conditionText: {
    fontSize: 14,
    fontWeight: "600",
  },

  emptyCondition: {
    flexDirection: "row",
    alignItems: "center",
  },

  emptyConditionEmoji: {
    color: "#16A34A",
    fontSize: 20,
    fontWeight: "800",
    marginRight: 8,
  },

  emptyConditionText: {
    fontSize: 14,
  },

  /* ==========================================================
     BOTÓN
  ========================================================== */

  button: {
    alignSelf: "center",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingVertical: 14,
    paddingHorizontal: 24,

    borderRadius: 17,

    marginTop: 2,
    marginBottom: 25,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
    /* ==========================================================
     ESTADOS DE CARGA Y PERFIL VACÍO
  ========================================================== */

  // Centra el indicador mientras se consulta el perfil.
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Texto mostrado debajo del indicador de carga.
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },

  // Centra el contenido cuando todavía no existe un perfil.
  emptyCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Mensaje mostrado cuando el usuario todavía no tiene perfil.
  emptyText: {
    marginVertical: 15,
    fontSize: 15,
  },

  // Título usado en el estado de perfil vacío.
  header: {
    fontSize: 30,
    fontWeight: "800",
  },
});
