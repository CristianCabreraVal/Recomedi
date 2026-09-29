/* Pantalla principal de Recomedi.

  Muestra:
 * Logo y saludo del usuario.
 * Recomendación personalizada.
 * Recordatorios.
 * Recomendaciones generadas.
 * Acceso a centros de salud.
 * Noticias y alertas.
 
 * La interfaz se adapta entre móvil y pantallas grandes
 * utilizando useWindowDimensions.
 */
/* ============================================================
   IMPORTS
   ============================================================ */
/*
 * Componentes de React Native utilizados para construir
 * la interfaz de la pantalla.
 *
 * - Alert: muestra mensajes emergentes.
 * - Image: muestra el logo de Recomedi.
 * - ScrollView: permite desplazarse verticalmente.
 * - StyleSheet: organiza los estilos.
 * - Text: muestra textos.
 * - TouchableOpacity: crea elementos pulsables.
 * - View: organiza grupos de componentes.
 * - useWindowDimensions: obtiene el tamaño actual de la ventana.
 */
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";


/*
 * useRouter permite cambiar de pantalla utilizando
 * Expo Router.
 */
import { useRouter } from "expo-router";


/*
 * Hooks de React utilizados para manejar:
 * - useEffect: ejecutar procesos al cargar la pantalla.
 * - useState: guardar información que cambia durante el uso.
 */
import {
  useEffect,
  useState,
} from "react";


/*
 * SafeAreaView evita que el contenido quede detrás de
 * elementos del sistema del dispositivo.
 */


/*
 * AsyncStorage permite guardar y recuperar información
 * localmente en el dispositivo.
 *
 * En esta pantalla se utiliza para recuperar el perfil
 * guardado del usuario.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";


/*
 * Ionicons proporciona los iconos utilizados en la
 * interfaz.
 */
import {
  Ionicons,
} from "@expo/vector-icons";


/*
 * Servicio encargado de enviar la recomendación al
 * sistema de notificaciones.
 */



/*
 * useTheme proporciona el modo oscuro y los colores
 * utilizados por la aplicación.
 */
import {
  useTheme,
} from "../../hooks/useTheme";


/*
 * Función del módulo de ML que genera las recomendaciones
 * según el perfil del usuario.
 */
import {
  generarRecomendaciones,
} from "../../ml/recomendaciones";

import BotonReportar from "../../components/BotonReportar";

import {
  MOTIVOS_INICIO,
} from "../../services/reportesService";
/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */

export default function Home() {

  /*
   * Obtiene el estado actual del modo oscuro.
   *
   * dark = true  → tema oscuro.
   * dark = false → tema claro.
   */
  const { dark } = useTheme();


  /*
   * router permite navegar entre las pantallas de Recomedi.
   */
  const router = useRouter();


  /*
   * Obtiene el ancho actual de la ventana.
   *
   * Esto permite cambiar la distribución de la interfaz
   * dependiendo de si la aplicación se está ejecutando
   * en móvil, tablet o web.
   */
  const {
    width,
  } = useWindowDimensions();


  /*
   * Determina si el dispositivo o ventana se considera
   * móvil.
   *
   * Menos de 700 px:
   * → interfaz adaptada para móvil.
   */
  const esMovil =
    width < 700;


  /*
   * Determina si existe suficiente espacio horizontal
   * para utilizar una distribución tipo dashboard.
   *
   * 900 px o más:
   * → contenido en varias zonas horizontales.
   */
  const pantallaAncha =
    width >= 900;


  /* ==========================================================
     ESTADOS
     ========================================================== */

  /*
   * Guarda los datos del usuario recuperados desde
   * AsyncStorage.
   *
   * Se utiliza null cuando todavía no existe un perfil
   * local guardado.
   */
  const [usuario, setUsuario] =
    useState<any>(null);


  /*
   * Contiene las recomendaciones generadas para el usuario.
   */
  const [
    recomendaciones,
    setRecomendaciones,
  ] = useState<string[]>([]);


  /*
   * Guarda la última recomendación mostrada.
   *
   * Se utiliza para:
   * - mostrarla dentro de la tarjeta principal;
   * - evitar repetir inmediatamente la misma recomendación.
   */
  const [
    ultimaRecomendacion,
    setUltimaRecomendacion,
  ] = useState<string | null>(null);


  /* ==========================================================
     GENERAR RECOMENDACIÓN
     ========================================================== */

  /*
   * Genera una recomendación aleatoria.
   *
   * También:
   * - evita repetir inmediatamente la recomendación anterior;
   * - muestra un Alert;
   * - envía la recomendación al servicio de notificaciones.
   */
  const probarRecomendacion =
    async () => {

      try {

        /*
         * Si no existen recomendaciones disponibles,
         * mostramos un mensaje y detenemos la función.
         */
        if (
          recomendaciones.length === 0
        ) {

          const mensaje =
            "No hay recomendaciones disponibles en este momento.";


          // Guarda el mensaje para mostrarlo en la tarjeta.
          setUltimaRecomendacion(
            mensaje
          );


          // Mantiene el aviso emergente original de Recomedi.
          Alert.alert(
            "Recomedi",
            mensaje
          );


          return;
        }


        /*
         * Guardará la posición de la recomendación elegida
         * dentro del arreglo.
         */
        let indice: number;


        /*
         * Elegimos una posición aleatoria.
         */
        do {

          indice =
            Math.floor(
              Math.random() *
              recomendaciones.length
            );

        /*
         * Si hay más de una recomendación, repetimos la
         * elección mientras sea igual a la anterior.
         */
        } while (
          recomendaciones.length > 1 &&
          recomendaciones[indice] ===
            ultimaRecomendacion
        );


        /*
         * Obtiene el texto correspondiente a la posición
         * elegida.
         */
        const nuevaRecomendacion =
          recomendaciones[indice];


        /*
         * Guarda la nueva recomendación para mostrarla
         * dentro de la pantalla.
         */
        setUltimaRecomendacion(
          nuevaRecomendacion
        );


        /*
         * Mantiene el aviso emergente que ya utilizaba
         * Recomedi.
         */
        Alert.alert(
          "Recomendación de Recomedi",
          nuevaRecomendacion
        );


        /*
         * Envía la recomendación al servicio de notificaciones.
         */
       

      } catch (error) {

        /*
         * Registra el error para facilitar la depuración.
         */
        console.error(
          "Error generando recomendación:",
          error
        );


        const mensaje =
          "No fue posible generar la recomendación.";


        // Muestra el mensaje de error dentro de la tarjeta.
        setUltimaRecomendacion(
          mensaje
        );


        // Informa al usuario mediante un Alert.
        Alert.alert(
          "Recomedi",
          mensaje
        );
      }
    };


  /* ==========================================================
     CARGAR USUARIO Y RECOMENDACIONES
     ========================================================== */

  /*
   * Al abrir la pantalla:
   *
   * 1. Busca el perfil almacenado localmente.
   * 2. Si existe, genera recomendaciones personalizadas.
   * 3. Si no existe, genera recomendaciones generales.
   */
  useEffect(() => {

    const cargarUsuario =
      async () => {

        try {

          /*
           * Recupera el usuario guardado en AsyncStorage.
           */
          const data =
            await AsyncStorage.getItem(
              "usuario"
            );


          /*
           * Si no existe información del usuario,
           * generamos recomendaciones generales.
           */
          if (!data) {

            setUsuario(null);


            const rec =
              generarRecomendaciones();


            setRecomendaciones(
              rec
            );


            return;
          }


          /*
           * Convierte el texto JSON almacenado en un
           * objeto JavaScript.
           */
          const user =
            JSON.parse(data);


          /*
           * Guarda el perfil en el estado.
           */
          setUsuario(
            user
          );


          /*
           * Genera recomendaciones utilizando los datos
           * del perfil.
           */
          const rec =
            generarRecomendaciones(
              user
            );


          setRecomendaciones(
            rec
          );

        } catch (error) {

          /*
           * Si ocurre un error al cargar el perfil,
           * mostramos recomendaciones generales para
           * que la pantalla siga siendo útil.
           */
          console.error(
            "Error cargando usuario:",
            error
          );


          const rec =
            generarRecomendaciones();


          setRecomendaciones(
            rec
          );
        }
      };


    /*
     * Ejecuta la carga inicial.
     */
    cargarUsuario();

  }, []);


  /* ==========================================================
     INTERFAZ
     ========================================================== */

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            dark
              ? "#121212"
              : "#F3F4F6",
        },
      ]}
    >

      {/*
       * ScrollView permite que toda la pantalla pueda
       * desplazarse verticalmente.
       *
       * En web también mantiene visible el indicador
       * de desplazamiento.
       */}
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={
          styles.scrollContent
        }
      >

        {/*
         * Contenedor central.
         *
         * En pantallas grandes evita que el contenido
         * se extienda demasiado horizontalmente.
         */}
        <View style={styles.content}>


          {/* ==================================================
              HEADER
          ================================================== */}

          <View
            style={[
              styles.header,

              /*
               * En móvil se reduce ligeramente el espacio
               * horizontal del encabezado.
               */
              esMovil &&
                styles.headerMobile,
            ]}
          >

            <View
              style={
                styles.brandArea
              }
            >

              {/*
               * Logo de Recomedi.
               *
               * Se utiliza solamente width + aspectRatio.
               * Esto permite conservar la proporción original
               * de la imagen y adaptar su tamaño al dispositivo.
               *
               * En móvil ocupa una parte menor de la pantalla.
               * En web puede crecer hasta un máximo definido.
               */}
              <Image
                source={require(
                  "../../assets/images/Recomedi.png"
                )}
                resizeMode="contain"
                style={[
                  styles.logo,
                  {
                    width: esMovil
                      ? Math.min(
                          width * 0.40,
                          175
                        )
                      : 300,
                  },
                ]}
              />


              {/*
               * Saludo dinámico.
               *
               * Si existe un usuario:
               * → muestra su nombre.
               *
               * Si no:
               * → muestra el mensaje general.
               */}
              <Text
                style={[
                  styles.subtitle,
                  {
                    color:
                      dark
                        ? "#AAB4C3"
                        : "#64748B",
                  },
                ]}
              >
                {usuario
                  ? `Hola, ${usuario.nombre}`
                  : "Tu salud, más fácil"}
              </Text>

            </View>


            {/*
             * Icono decorativo del encabezado.
             *
             * No contiene lógica de navegación.
             */}
            <View
              style={[
                styles.headerIcon,
                {
                  backgroundColor:
                    dark
                      ? "#172554"
                      : "#EFF6FF",
                },
              ]}
            >
              <Ionicons
                name="heart"
                size={
                  esMovil
                    ? 21
                    : 24
                }
                color="#2563EB"
              />
            </View>

          </View>


          {/* ==================================================
              DASHBOARD PRINCIPAL
          ================================================== */}

          {/*
           * En pantallas grandes:
           *
           * recomendación + estadísticas
           *
           * En móvil:
           *
           * recomendación
           * estadísticas
           *
           * una debajo de otra.
           */}
          <View
            style={[
              styles.dashboardTop,
              pantallaAncha &&
                styles.dashboardTopWide,
            ]}
          >

            {/* ==================================================
                RECOMENDACIÓN PRINCIPAL
            ================================================== */}

            <View
              style={[
                styles.mainCard,
                pantallaAncha &&
                  styles.mainCardWide,
              ]}
            >

              <View
                style={
                  styles.mainCardBody
                }
              >

                <View
                  style={
                    styles.mainCardContent
                  }
                >

                  <View
                    style={
                      styles.mainCardTop
                    }
                  >

                    <View
                      style={
                        styles.mainCardIcon
                      }
                    >
                      <Ionicons
                        name="sparkles"
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>

                    <Text
                      style={
                        styles.mainLabel
                      }
                    >
                      RECOMENDACIÓN
                    </Text>

                  </View>


                  <Text
                    style={
                      styles.mainTitle
                    }
                  >
                    Recomendación personalizada
                  </Text>


                  <Text
                    style={
                      styles.mainText
                    }
                  >
                    {ultimaRecomendacion ??
                      "Descubre una recomendación para cuidar mejor tu salud."}
                  </Text>


                  {/*
                   * Botón para solicitar otra recomendación.
                   *
                   * Solo ocupa el espacio necesario.
                   */}
                  <TouchableOpacity
                    style={
                      styles.button
                    }
                    onPress={
                      probarRecomendacion
                    }
                  >
                    <Text
                      style={
                        styles.buttonText
                      }
                    >
                      Ver recomendación
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="#2563EB"
                    />
                  </TouchableOpacity>

                </View>


                {/*
                 * Elemento decorativo.
                 *
                 * No representa una métrica médica real.
                 * Su finalidad es aprovechar el espacio visual
                 * disponible en la tarjeta.
                 */}
                <View
                  style={[
                    styles.mainVisual,

                    /*
                     * En móvil reducimos el elemento para que
                     * no compita con el texto.
                     */
                    esMovil &&
                      styles.mainVisualMobile,
                  ]}
                >
                  <Ionicons
                    name="heart"
                    size={
                      esMovil
                        ? 42
                        : 58
                    }
                    color="#FFFFFF"
                  />
                </View>

              </View>
            </View>


            {/* ==================================================
                ESTADÍSTICAS
            ================================================== */}

            <View
              style={[
                styles.statsColumn,
                pantallaAncha &&
                  styles.statsColumnWide,
              ]}
            >

              {/* RECORDATORIOS */}

              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor:
                      dark
                        ? "#1E293B"
                        : "#FFFFFF",
                  },
                ]}
              >

                <View
                  style={
                    styles.statIcon
                  }
                >
                  <Ionicons
                    name="calendar"
                    size={22}
                    color="#2563EB"
                  />
                </View>

                <Text
                  style={[
                    styles.statNumber,
                    {
                      color:
                        dark
                          ? "#FFFFFF"
                          : "#111827",
                    },
                  ]}
                >
                  2
                </Text>

                <Text
                  style={[
                    styles.statText,
                    {
                      color:
                        dark
                          ? "#AAB4C3"
                          : "#64748B",
                    },
                  ]}
                >
                  Recordatorios
                </Text>

              </View>


              {/* RECOMENDACIONES */}

              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor:
                      dark
                        ? "#1E293B"
                        : "#FFFFFF",
                  },
                ]}
              >

                <View
                  style={[
                    styles.statIcon,
                    {
                      backgroundColor:
                        dark
                          ? "#2E1065"
                          : "#F5F3FF",
                    },
                  ]}
                >
                  <Ionicons
                    name="sparkles"
                    size={22}
                    color="#7C3AED"
                  />
                </View>

                <Text
                  style={[
                    styles.statNumber,
                    {
                      color:
                        dark
                          ? "#FFFFFF"
                          : "#111827",
                    },
                  ]}
                >
                  {
                    recomendaciones.length
                  }
                </Text>

                <Text
                  style={[
                    styles.statText,
                    {
                      color:
                        dark
                          ? "#AAB4C3"
                          : "#64748B",
                    },
                  ]}
                >
                  Recomendaciones
                </Text>

              </View>

            </View>

          </View>


          {/* ==================================================
              RECORDATORIOS DETALLADOS
          ================================================== */}

          {/*
           * Se mantienen los dos recordatorios visibles.
           *
           * El contador anterior indica cantidad.
           * Esta sección permite saber qué representa esa cantidad.
           */}
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor:
                  dark
                    ? "#1E1E1E"
                    : "#FFFFFF",
              },
            ]}
          >

            <View
              style={
                styles.sectionHeader
              }
            >
              <Ionicons
                name="calendar"
                size={22}
                color="#2563EB"
              />

              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color:
                      dark
                        ? "#FFFFFF"
                        : "#111827",
                  },
                ]}
              >
                Recordatorios importantes
              </Text>
            </View>


            <View
              style={[
                styles.reminderGrid,
                !pantallaAncha &&
                  styles.reminderGridMobile,
              ]}
            >

              {/* CHEQUEO MÉDICO */}

              <View
                style={
                  styles.reminderItem
                }
              >

                <View
                  style={[
                    styles.reminderIcon,
                    {
                      backgroundColor:
                        dark
                          ? "#172554"
                          : "#EFF6FF",
                    },
                  ]}
                >
                  <Ionicons
                    name="medical"
                    size={21}
                    color="#2563EB"
                  />
                </View>

                <View
                  style={
                    styles.reminderContent
                  }
                >
                  <Text
                    style={[
                      styles.reminderTitle,
                      {
                        color:
                          dark
                            ? "#FFFFFF"
                            : "#111827",
                      },
                    ]}
                  >
                    Chequeo médico
                  </Text>

                  <Text
                    style={[
                      styles.reminderText,
                      {
                        color:
                          dark
                            ? "#AAB4C3"
                            : "#64748B",
                      },
                    ]}
                  >
                    Cada 8-10 meses
                  </Text>
                </View>

              </View>


              {/* REVISIÓN DENTAL */}

              <View
                style={
                  styles.reminderItem
                }
              >

                <View
                  style={[
                    styles.reminderIcon,
                    {
                      backgroundColor:
                        dark
                          ? "#2E1065"
                          : "#F5F3FF",
                    },
                  ]}
                >
                  <Ionicons
                    name="happy"
                    size={21}
                    color="#7C3AED"
                  />
                </View>

                <View
                  style={
                    styles.reminderContent
                  }
                >
                  <Text
                    style={[
                      styles.reminderTitle,
                      {
                        color:
                          dark
                            ? "#FFFFFF"
                            : "#111827",
                      },
                    ]}
                  >
                    Revisión dental
                  </Text>

                  <Text
                    style={[
                      styles.reminderText,
                      {
                        color:
                          dark
                            ? "#AAB4C3"
                            : "#64748B",
                      },
                    ]}
                  >
                    Cada 6 meses
                  </Text>
                </View>

              </View>

            </View>
          </View>


          {/* ==================================================
              RECOMENDACIONES
          ================================================== */}

          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor:
                  dark
                    ? "#1E1E1E"
                    : "#FFFFFF",
              },
            ]}
          >

            <View
              style={
                styles.sectionHeader
              }
            >
              <Ionicons
                name="sparkles"
                size={22}
                color="#7C3AED"
              />

              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color:
                      dark
                        ? "#FFFFFF"
                        : "#111827",
                  },
                ]}
              >
                Recomendaciones
              </Text>
            </View>


            {/*
             * Si existen recomendaciones, mostramos cada una.
             */
            recomendaciones.length > 0 ? (

              <View
                style={
                  styles.recommendationList
                }
              >

                {/*
                 * Recorremos el arreglo de recomendaciones
                 * para crear un elemento visual por cada una.
                 */}
                {recomendaciones.map(
                  (
                    recomendacion,
                    index
                  ) => (

                    <View
                      key={`${recomendacion}-${index}`}
                      style={[
                        styles.recommendationItem,
                        {
                          backgroundColor:
                            dark
                              ? "#252525"
                              : "#F8FAFC",
                        },
                      ]}
                    >

                      <View
                        style={
                          styles.recommendationIcon
                        }
                      >
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color="#7C3AED"
                        />
                      </View>

                      <Text
                        style={[
                          styles.recommendationText,
                          {
                            color:
                              dark
                                ? "#D1D5DB"
                                : "#374151",
                          },
                        ]}
                      >
                        {recomendacion}
                      </Text>

                    </View>
                  )
                )}

              </View>

            ) : (

              /*
               * Si todavía no hay recomendaciones,
               * mostramos un mensaje explicativo.
               */
              <Text
                style={[
                  styles.emptyText,
                  {
                    color:
                      dark
                        ? "#AAB4C3"
                        : "#64748B",
                  },
                ]}
              >
                Completa tu perfil para obtener recomendaciones.
              </Text>

            )}

          </View>


          {/* ==================================================
              CENTROS DE SALUD
          ================================================== */}

          {/*
           * Acceso directo al módulo de mapa.
           *
           * Se conserva TouchableOpacity para mantener
           * la navegación original.
           */}
          <TouchableOpacity
            style={[
              styles.healthAccess,
              {
                backgroundColor:
                  dark
                    ? "#1E293B"
                    : "#FFFFFF",
              },
            ]}
            onPress={() =>
              router.push("/mapa")
            }
          >

            <View
              style={[
                styles.healthIcon,
                {
                  backgroundColor:
                    dark
                      ? "#172554"
                      : "#EFF6FF",
                },
              ]}
            >
              <Ionicons
                name="location"
                size={27}
                color="#2563EB"
              />
            </View>

            <View
              style={
                styles.healthContent
              }
            >
              <Text
                style={[
                  styles.healthTitle,
                  {
                    color:
                      dark
                        ? "#FFFFFF"
                        : "#111827",
                  },
                ]}
              >
                Centros de salud
              </Text>

              <Text
                style={[
                  styles.healthText,
                  {
                    color:
                      dark
                        ? "#AAB4C3"
                        : "#64748B",
                  },
                ]}
              >
                Hospitales y droguerías cercanas
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={24}
              color={
                dark
                  ? "#94A3B8"
                  : "#64748B"
              }
            />

          </TouchableOpacity>


          {/* ==================================================
              NOTICIAS Y ALERTAS
          ================================================== */}

          <View
            style={[
              styles.infoRow,
              !pantallaAncha &&
                styles.infoRowMobile,
            ]}
          >

            {/* ==================================================
                NOTICIAS
            ================================================== */}

            <TouchableOpacity
              style={[
                styles.infoCard,
                {
                  backgroundColor:
                    dark
                      ? "#1E293B"
                      : "#FFFFFF",
                },
              ]}
              onPress={() =>
                router.push("/noticias")
              }
            >

              <View
                style={
                  styles.infoCardTop
                }
              >

                <View
                  style={[
                    styles.infoIcon,
                    {
                      backgroundColor:
                        dark
                          ? "#172554"
                          : "#EFF6FF",
                    },
                  ]}
                >
                  <Ionicons
                    name="newspaper"
                    size={25}
                    color="#2563EB"
                  />
                </View>

                <View
                  style={
                    styles.infoArrow
                  }
                >
                  <Ionicons
                    name="arrow-forward"
                    size={19}
                    color="#2563EB"
                  />
                </View>

              </View>

              <Text
                style={[
                  styles.infoTitle,
                  {
                    color:
                      dark
                        ? "#FFFFFF"
                        : "#111827",
                  },
                ]}
              >
                Noticias de salud
              </Text>

              <Text
                style={[
                  styles.infoText,
                  {
                    color:
                      dark
                        ? "#AAB4C3"
                        : "#64748B",
                  },
                ]}
              >
                Información y novedades médicas.
              </Text>

            </TouchableOpacity>


            {/* ==================================================
                ALERTAS
            ================================================== */}

            <TouchableOpacity
              style={[
                styles.infoCard,
                {
                  backgroundColor:
                    dark
                      ? "#1E293B"
                      : "#FFFFFF",
                },
              ]}
              onPress={() =>
                router.push("/epidemia")
              }
            >

              <View
                style={
                  styles.infoCardTop
                }
              >

                <View
                  style={[
                    styles.infoIcon,
                    {
                      backgroundColor:
                        dark
                          ? "#450A0A"
                          : "#FEF2F2",
                    },
                  ]}
                >
                  <Ionicons
                    name="warning"
                    size={25}
                    color="#DC2626"
                  />
                </View>

                <View
                  style={[
                    styles.infoArrow,
                    {
                      backgroundColor:
                        dark
                          ? "#450A0A"
                          : "#FEF2F2",
                    },
                  ]}
                >
                  <Ionicons
                    name="arrow-forward"
                    size={19}
                    color="#DC2626"
                  />
                </View>

              </View>

              <Text
                style={[
                  styles.infoTitle,
                  {
                    color:
                      dark
                        ? "#FFFFFF"
                        : "#111827",
                  },
                ]}
              >
                Alertas sanitarias
              </Text>

              <Text
                style={[
                  styles.infoText,
                  {
                    color:
                      dark
                        ? "#AAB4C3"
                        : "#64748B",
                  },
                ]}
              >
                Brotes, alertas y situaciones cercanas.
              </Text>

            </TouchableOpacity>

          </View>

        </View>
        <BotonReportar
  recursoId="inicio"
  recursoNombre="Página de inicio de Recomedi"
  motivos={MOTIVOS_INICIO}
  textoBoton="Reportar un problema"
  descripcionBoton="Ayúdanos a mejorar esta pantalla"
/>
      </ScrollView>
    </View>
  );
}


/* ================================================================
   ESTILOS
================================================================ */

/*
 * Los estilos están organizados por sección de la pantalla.
 *
 * Las partes que modifican la distribución según el tamaño
 * de pantalla se combinan con estilos dinámicos dentro del JSX.
 */

const styles = StyleSheet.create({

  /* ==========================================================
     CONTENEDOR GENERAL
  ========================================================== */

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },


  /*
   * Espacio inferior de la pantalla para evitar que el último
   * componente quede pegado al borde.
   */
  scrollContent: {
    paddingBottom: 40,
  },


  /*
   * En web se limita el ancho máximo para que la aplicación
   * mantenga una apariencia de dashboard.
   */
  content: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },


  /* ==========================================================
     HEADER
  ========================================================== */

  /*
   * Organiza el logo y el icono superior.
   */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },


  /*
   * En móvil reducimos un poco el espacio inferior.
   */
  headerMobile: {
    marginBottom: 16,
  },


  /*
   * Área que contiene el logo y el saludo.
   */
  brandArea: {
    flex: 1,
    minWidth: 0,
  },


  /*
   * El logo utiliza aspectRatio para conservar las proporciones
   * de la imagen original.
   *
   * No se establece una altura fija porque el ancho cambia
   * dependiendo del dispositivo.
   */
  logo: {
    aspectRatio: 560 / 453,
    alignSelf: "flex-start",
  },


  /*
   * Saludo debajo del logo.
   */
  subtitle: {
    fontSize: 16,
    marginTop: 3,
  },


  /*
   * Icono del corazón ubicado en el extremo del encabezado.
   */
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 15,
  },


  /* ==========================================================
     DASHBOARD PRINCIPAL
  ========================================================== */

  /*
   * Distribución utilizada inicialmente en móvil.
   */
  dashboardTop: {
    marginBottom: 18,
  },


  /*
   * Se activa cuando pantallaAncha es true.
   *
   * Permite colocar la recomendación y estadísticas
   * horizontalmente.
   */
  dashboardTopWide: {
    flexDirection: "row",
    gap: 16,
  },


  /*
   * Tarjeta principal de recomendación.
   */
  mainCard: {
    backgroundColor: "#2563EB",
    padding: 24,
    borderRadius: 28,
    marginBottom: 16,

    shadowColor: "#2563EB",
    shadowOpacity: 0.25,
    shadowRadius: 18,

    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 7,
  },


  /*
   * En una pantalla ancha la tarjeta comparte el espacio
   * horizontal con las estadísticas.
   */
  mainCardWide: {
    flex: 1.8,
    marginBottom: 0,
  },


  /*
   * Contiene el texto y el elemento visual de la recomendación.
   */
  mainCardBody: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 270,
  },


  /*
   * Permite que el bloque textual ocupe el espacio disponible.
   */
  mainCardContent: {
    flex: 1,
    alignItems: "center",
  },


  mainCardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },


  mainCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,

    backgroundColor:
      "rgba(255,255,255,0.18)",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 10,
  },


  mainLabel: {
    color: "#BFDBFE",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },


  mainTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },


  mainText: {
    color: "#DBEAFE",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 620,
    marginBottom: 18,
  },


  /*
   * Elemento decorativo de la tarjeta principal.
   */
  mainVisual: {
    width: 120,
    height: 120,
    borderRadius: 60,

    backgroundColor:
      "rgba(255,255,255,0.14)",

    alignItems: "center",
    justifyContent: "center",

    marginLeft: 18,
    marginRight: 8,
  },


  /*
   * En móvil reducimos el círculo para liberar espacio
   * para el texto.
   */
  mainVisualMobile: {
    width: 86,
    height: 86,
    borderRadius: 43,
    marginLeft: 10,
    marginRight: 0,
  },


  /*
   * Botón principal.
   *
   * Se ajusta al contenido en lugar de ocupar todo el ancho.
   */
  button: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",

    backgroundColor: "#FFFFFF",

    paddingVertical: 11,
    paddingHorizontal: 16,

    borderRadius: 14,
    gap: 7,
  },


  buttonText: {
    color: "#2563EB",
    fontWeight: "700",
  },


  /* ==========================================================
     ESTADÍSTICAS
  ========================================================== */

  /*
   * En móvil las estadísticas quedan una debajo de otra.
   */
  statsColumn: {
    gap: 16,
  },


  /*
   * En pantallas anchas pasan a ocupar una columna lateral.
   */
  statsColumnWide: {
    flex: 1,
  },


  statCard: {
    minHeight: 127,
    padding: 18,

    borderRadius: 24,

    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },


  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,

    backgroundColor: "#EFF6FF",

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 7,
  },


  statNumber: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
  },


  statText: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },


  /* ==========================================================
     SECCIONES
  ========================================================== */

  sectionCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,

    shadowColor: "#000",
    shadowOpacity: 0.06,
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
    marginBottom: 14,
  },


  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 9,
  },


  /* ==========================================================
     RECORDATORIOS
  ========================================================== */

  /*
   * En pantallas grandes se muestran los dos recordatorios
   * horizontalmente.
   */
  reminderGrid: {
    flexDirection: "row",
    gap: 14,
  },


  /*
   * En móvil los recordatorios vuelven a una columna para
   * evitar que el texto quede demasiado comprimido.
   */
  reminderGridMobile: {
    flexDirection: "column",
  },


  reminderItem: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",

    padding: 14,

    borderRadius: 18,

    backgroundColor: "#F8FAFC",
  },


  reminderIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 13,
  },


  reminderContent: {
    flex: 1,
    minWidth: 0,
  },


  reminderTitle: {
    fontSize: 16,
    fontWeight: "800",
  },


  reminderText: {
    fontSize: 13,
    marginTop: 4,
  },


  /* ==========================================================
     RECOMENDACIONES
  ========================================================== */

  recommendationList: {
    gap: 10,
  },


  recommendationItem: {
    flexDirection: "row",
    alignItems: "center",

    padding: 13,

    borderRadius: 16,
  },


  recommendationIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,

    backgroundColor: "#F5F3FF",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 11,
  },


  recommendationText: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 21,
  },


  emptyText: {
    fontSize: 14,
    lineHeight: 21,
  },


  /* ==========================================================
     CENTROS DE SALUD
  ========================================================== */

  healthAccess: {
    flexDirection: "row",
    alignItems: "center",

    padding: 18,

    borderRadius: 24,
    marginBottom: 16,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },


  healthIcon: {
    width: 52,
    height: 52,

    borderRadius: 17,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 14,
  },


  healthContent: {
    flex: 1,
    minWidth: 0,
  },


  healthTitle: {
    fontSize: 18,
    fontWeight: "800",
  },


  healthText: {
    fontSize: 13,
    marginTop: 4,
  },


  /* ==========================================================
     NOTICIAS / ALERTAS
  ========================================================== */

  /*
   * En web se colocan lado a lado.
   */
  infoRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 10,
  },


  /*
   * En móvil pasan a una columna.
   */
  infoRowMobile: {
    flexDirection: "column",
  },


  infoCard: {
    flex: 1,
    minHeight: 175,

    padding: 20,

    borderRadius: 24,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },


  infoCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },


  infoIcon: {
    width: 50,
    height: 50,

    borderRadius: 16,

    alignItems: "center",
    justifyContent: "center",
  },


  infoArrow: {
    width: 38,
    height: 38,

    borderRadius: 13,

    backgroundColor: "#EFF6FF",

    alignItems: "center",
    justifyContent: "center",
  },


  infoTitle: {
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 7,
  },


  infoText: {
    fontSize: 14,
    lineHeight: 21,
  },
});