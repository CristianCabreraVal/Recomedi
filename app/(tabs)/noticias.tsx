/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
import {useEffect,useRef,useState} from "react";
 // importa los componentes de React Native que se van a utilizar en la pantalla
import {ActivityIndicator,Image,Linking,Modal,Platform,Pressable,
  ScrollView,StyleSheet,Text,useWindowDimensions,View,} from "react-native";
// Ionicons: permite usar iconos para complementar la interfaz de usuario
import {Ionicons} from "@expo/vector-icons";
// Importación del hook personalizado para obtener los colores del tema actual (claro u oscuro)
import {useTheme} from "../../hooks/useTheme";
import {escucharNoticiasPublicadas,type Noticia} from "../../services/noticiasService";
// export permite utilizar este componente desde otros archivos.
// function declara el componente.
// export default indica que este es el componente principal que se exporta desde este archivo.
export default function NoticiasScreen() {
/*const: declara una variable cuyo valor no se reasigna.
Se utiliza para guardar valores, funciones, resultados de
hooks o referencias que serán utilizados posteriormente por el componente.
*/
  const { width } =
    useWindowDimensions();
  // useTheme obtiene los colores utilizados actualmente por la aplicación 
  const { colors } =
    useTheme();

  const [
    noticias,
    setNoticias,
  ] = useState<Noticia[]>([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    currentNews,
    setCurrentNews,
  ] = useState(0);

  const [
    noticiaSeleccionada,
    setNoticiaSeleccionada,
  ] = useState<Noticia | null>(null);

  const [
    modalVisible,
    setModalVisible,
  ] = useState(false);

  const scrollNoticiasRef =
    useRef<ScrollView | null>(null);

  const esWeb =
    Platform.OS === "web";

  const anchoTarjeta =
    esWeb
      ? Math.min(width * 0.58, 700)
      : Math.min(width * 0.88, 560);

  /*
   * ==========================================================
   * CARGA DE NOTICIAS EN TIEMPO REAL
   * ==========================================================
   */

  useEffect(() => {
    setCargando(true);

    const desuscribirse =
      escucharNoticiasPublicadas(
        (resultado) => {
          setNoticias(resultado);

          setCurrentNews(
            (actual) => {
              if (
                resultado.length === 0
              ) {
                return 0;
              }

              if (
                actual >=
                resultado.length
              ) {
                return (
                  resultado.length - 1
                );
              }

              return actual;
            }
          );

          setCargando(false);
        },
        (error) => {
          console.error(
            "Error escuchando noticias publicadas:",
            error
          );

          setCargando(false);
        }
      );

    return () => {
      desuscribirse();
    };
  }, []);

  /*
   * ==========================================================
   * FECHA
   * ==========================================================
   */

  const formatearFecha = (
    fecha: unknown
  ): string => {
    if (!fecha) {
      return "Fecha no disponible";
    }

    try {
      let fechaFinal:
        | Date
        | null = null;

      if (
        fecha instanceof Date
      ) {
        fechaFinal = fecha;
      } else if (
        typeof fecha === "object" &&
        fecha !== null
      ) {
        const dato =
          fecha as {
            toDate?: () => Date;
            seconds?: number;
          };

        if (
          typeof dato.toDate ===
          "function"
        ) {
          fechaFinal =
            dato.toDate();
        } else if (
          typeof dato.seconds ===
          "number"
        ) {
          fechaFinal =
            new Date(
              dato.seconds * 1000
            );
        }
      } else if (
        typeof fecha === "string" ||
        typeof fecha === "number"
      ) {
        const temporal =
          new Date(fecha);

        if (
          !Number.isNaN(
            temporal.getTime()
          )
        ) {
          fechaFinal = temporal;
        }
      }

      if (!fechaFinal) {
        return "Fecha no disponible";
      }

      return fechaFinal.toLocaleDateString(
        "es-CO",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      );
    } catch (error) {
      console.error(
        "Error formateando fecha:",
        error
      );

      return "Fecha no disponible";
    }
  };

  /*
   * ==========================================================
   * FUENTE
   * ==========================================================
   */

  const obtenerUrlFuente = (
    noticia: Noticia
  ): string => {
    return (
      noticia.urlOficial ||
      noticia.fuenteUrl ||
      noticia.urlGoogleNews ||
      ""
    );
  };

  const abrirFuente = async (
    noticia: Noticia
  ): Promise<void> => {
    const url =
      obtenerUrlFuente(noticia);

    if (!url) {
      return;
    }

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error(
        "Error abriendo fuente:",
        error
      );
    }
  };

  /*
   * ==========================================================
   * NOTICIA COMPLETA
   * ==========================================================
   */

  const abrirNoticia = (
    noticia: Noticia
  ): void => {
    setNoticiaSeleccionada(
      noticia
    );

    setModalVisible(true);
  };

  const cerrarNoticia = (): void => {
    setModalVisible(false);

    setTimeout(() => {
      setNoticiaSeleccionada(null);
    }, 200);
  };

  /*
   * ==========================================================
   * PÁRRAFOS
   * ==========================================================
   */

  const obtenerParrafos = (
    contenido: string
  ): string[] => {
    if (!contenido) {
      return [];
    }

    const texto =
      contenido
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();

    if (!texto) {
      return [];
    }

    const bloques =
      texto
        .split(/\n\s*\n/)
        .map((parrafo) =>
          parrafo.trim()
        )
        .filter(
          (parrafo) =>
            parrafo.length > 0
        );

    if (
      bloques.length > 1
    ) {
      return bloques;
    }

    return texto
      .split("\n")
      .map((parrafo) =>
        parrafo.trim()
      )
      .filter(
        (parrafo) =>
          parrafo.length > 0
      );
  };

  /*
   * ==========================================================
   * NAVEGACIÓN
   * ==========================================================
   */

  const noticiaAnterior = (): void => {
    if (
      noticias.length === 0
    ) {
      return;
    }

    const nuevoIndice =
      currentNews > 0
        ? currentNews - 1
        : noticias.length - 1;

    setCurrentNews(
      nuevoIndice
    );

    scrollNoticiasRef.current?.scrollTo(
      {
        x:
          nuevoIndice * width,
        animated: true,
      }
    );
  };

  const noticiaSiguiente = (): void => {
    if (
      noticias.length === 0
    ) {
      return;
    }

    const nuevoIndice =
      currentNews <
      noticias.length - 1
        ? currentNews + 1
        : 0;

    setCurrentNews(
      nuevoIndice
    );

    scrollNoticiasRef.current?.scrollTo(
      {
        x:
          nuevoIndice * width,
        animated: true,
      }
    );
  };

  /*
   * ==========================================================
   * TARJETA DE NOTICIA
   * ==========================================================
   */

  const renderTarjeta = (
    noticia: Noticia
  ) => {
    return (
      <View
        style={[
          styles.page,
          {
            width: width,
          },
        ]}
      >
        <View
          style={[
            styles.card,
            {
              width: anchoTarjeta,
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
        >
          {/* ============================================== */}
          {/* CABECERA                                        */}
          {/* ============================================== */}

          <View
            style={
              styles.cardHeader
            }
          >
            <View
              style={[
                styles.newsBadge,
                {
                  backgroundColor:
                    colors.primary,
                },
              ]}
            >
              <Ionicons
                name="newspaper-outline"
                size={15}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.newsBadgeText
                }
              >
                NOTICIA
              </Text>
            </View>

            <View
              style={
                styles.dateContainer
              }
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color={
                  colors.textSecondary
                }
              />

              <Text
                style={[
                  styles.dateText,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
                numberOfLines={1}
              >
                {formatearFecha(
                  noticia.fechaPublicacion
                )}
              </Text>
            </View>
          </View>

          {/* ============================================== */}
          {/* CATEGORÍA                                      */}
          {/* ============================================== */}

          <View
            style={[
              styles.category,
              {
                backgroundColor:
                  colors.background,
                borderColor:
                  colors.border,
              },
            ]}
          >
            <Ionicons
              name="pricetag-outline"
              size={14}
              color={
                colors.primary
              }
            />

            <Text
              style={[
                styles.categoryText,
                {
                  color:
                    colors.primary,
                },
              ]}
            >
              {noticia.categoria ||
                "General"}
            </Text>
          </View>

          {/* ============================================== */}
          {/* TÍTULO                                         */}
          {/* ============================================== */}

          <Text
            style={[
              styles.title,
              {
                color:
                  colors.text,
              },
            ]}
            numberOfLines={4}
          >
            {noticia.titulo}
          </Text>

          {/* ============================================== */}
          {/* RESUMEN                                        */}
          {/* ============================================== */}

          <Text
            style={[
              styles.summary,
              {
                color:
                  colors.textSecondary,
              },
            ]}
            numberOfLines={4}
          >
            {noticia.resumen ||
              "No hay un resumen disponible para esta noticia."}
          </Text>

          {/* ============================================== */}
          {/* IMAGEN                                         */}
          {/* ============================================== */}

          {noticia.imagenUrl ? (
            <Image
              source={{
                uri: noticia.imagenUrl,
              }}
              style={
                styles.image
              }
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                {
                  backgroundColor:
                    colors.background,
                  borderColor:
                    colors.border,
                },
              ]}
            >
              <Ionicons
                name="image-outline"
                size={46}
                color={
                  colors.textSecondary
                }
              />

              <Text
                style={[
                  styles.placeholderText,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                Imagen no disponible
              </Text>
            </View>
          )}

          {/* ============================================== */}
          {/* FUENTE                                         */}
          {/* ============================================== */}

          <View
            style={
              styles.sourceInfo
            }
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={17}
              color={
                colors.primary
              }
            />

            <Text
              style={[
                styles.sourceText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
              numberOfLines={1}
            >
              {noticia.fuente ||
                "Fuente oficial"}
            </Text>
          </View>

          {/* ============================================== */}
          {/* BOTÓN                                          */}
          {/* ============================================== */}

          <Pressable
            onPress={() =>
              abrirNoticia(noticia)
            }
            style={({ pressed }) => [
              styles.readMoreButton,
              {
                backgroundColor:
                  colors.primary,
                opacity:
                  pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons
              name="book-outline"
              size={18}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.readMoreText
              }
            >
              Leer más
            </Text>

            <Ionicons
              name="arrow-forward"
              size={19}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      </View>
    );
  };

  /*
   * ==========================================================
   * PANTALLA PRINCIPAL
   * ==========================================================
   */

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
      <ScrollView
        style={
          styles.mainScroll
        }
        contentContainerStyle={[
          styles.mainContent,
          esWeb &&
            styles.webMainContent,
        ]}
        showsVerticalScrollIndicator={
          false
        }
        nestedScrollEnabled={true}
      >
        {/* ================================================== */}
        {/* HEADER ESPECÍFICO                                  */}
        {/* ================================================== */}

        {esWeb ? (
          <View
            style={[
              styles.webHero,
              {
                backgroundColor:
                  colors.card,
                borderColor:
                  colors.border,
              },
            ]}
          >
            {/* ---------------------------------------------- */}
            {/* ICONOS DECORATIVOS                              */}
            {/* ---------------------------------------------- */}

            <View
              style={
                styles.webHeroTop
              }
            >
              <View
                style={
                  styles.webIconGroup
                }
              >
                <View
                  style={[
                    styles.decorativeIcon,
                    {
                      backgroundColor:
                        colors.background,
                      borderColor:
                        colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="heart-outline"
                    size={20}
                    color={
                      colors.primary
                    }
                  />
                </View>

                <View
                  style={[
                    styles.decorativeIcon,
                    {
                      backgroundColor:
                        colors.background,
                      borderColor:
                        colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="pulse-outline"
                    size={20}
                    color={
                      colors.primary
                    }
                  />
                </View>

                <View
                  style={[
                    styles.decorativeIcon,
                    {
                      backgroundColor:
                        colors.background,
                      borderColor:
                        colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="medical-outline"
                    size={20}
                    color={
                      colors.primary
                    }
                  />
                </View>

                <View
                  style={[
                    styles.decorativeIcon,
                    {
                      backgroundColor:
                        colors.background,
                      borderColor:
                        colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={
                      colors.primary
                    }
                  />
                </View>
              </View>

              <View
                style={[
                  styles.liveBadge,
                  {
                    backgroundColor:
                      colors.background,
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.liveDot,
                    {
                      backgroundColor:
                        colors.primary,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.liveText,
                    {
                      color:
                        colors.primary,
                    },
                  ]}
                >
                  ACTUALIZACIÓN EN TIEMPO REAL
                </Text>
              </View>
            </View>

            {/* ---------------------------------------------- */}
            {/* TÍTULO                                          */}
            {/* ---------------------------------------------- */}

            <View
              style={
                styles.webHeroCenter
              }
            >
              <View
                style={[
                  styles.webMainIcon,
                  {
                    backgroundColor:
                      colors.background,
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="newspaper"
                  size={38}
                  color={
                    colors.primary
                  }
                />

                <View
                  style={[
                    styles.webMainIconSmall,
                    {
                      backgroundColor:
                        colors.primary,
                      borderColor:
                        colors.card,
                    },
                  ]}
                >
                  <Ionicons
                    name="add"
                    size={12}
                    color="#FFFFFF"
                  />
                </View>
              </View>

              <Text
                style={[
                  styles.webTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Noticias
              </Text>

              <Text
                style={[
                  styles.webSubtitle,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                Información de salud, prevención
                y actualidad para tu bienestar
              </Text>
            </View>

            {/* ---------------------------------------------- */}
            {/* INDICADORES                                     */}
            {/* ---------------------------------------------- */}

            <View
              style={
                styles.webStats
              }
            >
              <View
                style={[
                  styles.webStat,
                  {
                    backgroundColor:
                      colors.background,
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="newspaper-outline"
                  size={21}
                  color={
                    colors.primary
                  }
                />

                <View
                  style={
                    styles.webStatText
                  }
                >
                  <Text
                    style={[
                      styles.webStatNumber,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    {noticias.length}
                  </Text>

                  <Text
                    style={[
                      styles.webStatLabel,
                      {
                        color:
                          colors.textSecondary,
                      },
                    ]}
                  >
                    Noticias disponibles
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.webStat,
                  {
                    backgroundColor:
                      colors.background,
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="cloud-done-outline"
                  size={21}
                  color={
                    colors.primary
                  }
                />

                <View
                  style={
                    styles.webStatText
                  }
                >
                  <Text
                    style={[
                      styles.webStatStatus,
                      {
                        color:
                          colors.primary,
                      },
                    ]}
                  >
                    EN LÍNEA
                  </Text>

                  <Text
                    style={[
                      styles.webStatLabel,
                      {
                        color:
                          colors.textSecondary,
                      },
                    ]}
                  >
                    Sincronización activa
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.webStat,
                  {
                    backgroundColor:
                      colors.background,
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={21}
                  color={
                    colors.primary
                  }
                />

                <View
                  style={
                    styles.webStatText
                  }
                >
                  <Text
                    style={[
                      styles.webStatStatus,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    VERIFICADAS
                  </Text>

                  <Text
                    style={[
                      styles.webStatLabel,
                      {
                        color:
                          colors.textSecondary,
                      },
                    ]}
                  >
                    Fuentes identificadas
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View
            style={
              styles.mobileHeader
            }
          >
            <View
              style={
                styles.mobileHeaderLeft
              }
            >
              <View
                style={[
                  styles.mobileMainIcon,
                  {
                    backgroundColor:
                      colors.card,
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="newspaper"
                  size={27}
                  color={
                    colors.primary
                  }
                />
              </View>

              <View
                style={
                  styles.mobileHeaderTexts
                }
              >
                <View
                  style={
                    styles.mobileTitleRow
                  }
                >
                  <Text
                    style={[
                      styles.mobileTitle,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    Noticias
                  </Text>

                  <Ionicons
                    name="pulse-outline"
                    size={21}
                    color={
                      colors.primary
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.mobileSubtitle,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  Salud y actualidad
                </Text>
              </View>
            </View>

            <View
              style={
                styles.mobileHeaderIcons
              }
            >
              <View
                style={[
                  styles.smallHeaderIcon,
                  {
                    backgroundColor:
                      colors.card,
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="heart-outline"
                  size={18}
                  color={
                    colors.primary
                  }
                />
              </View>

              <View
                style={[
                  styles.smallHeaderIcon,
                  {
                    backgroundColor:
                      colors.card,
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color={
                    colors.primary
                  }
                />
              </View>
            </View>
          </View>
        )}

        {/* ================================================== */}
        {/* ESTADO DE CARGA                                    */}
        {/* ================================================== */}

        {cargando ? (
          <View
            style={
              styles.loadingContainer
            }
          >
            <View
              style={[
                styles.loadingIcon,
                {
                  backgroundColor:
                    colors.card,
                  borderColor:
                    colors.border,
                },
              ]}
            >
              <Ionicons
                name="sync-outline"
                size={32}
                color={
                  colors.primary
                }
              />
            </View>

            <ActivityIndicator
              size="large"
              color={
                colors.primary
              }
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
              Cargando noticias...
            </Text>
          </View>
        ) : noticias.length ===
          0 ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <View
              style={[
                styles.emptyIcon,
                {
                  backgroundColor:
                    colors.card,
                  borderColor:
                    colors.border,
                },
              ]}
            >
              <Ionicons
                name="newspaper-outline"
                size={50}
                color={
                  colors.textSecondary
                }
              />
            </View>

            <Text
              style={[
                styles.emptyTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              No hay noticias disponibles
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
              En este momento no hay noticias
              publicadas.
            </Text>
          </View>
        ) : (
          <View
            style={
              styles.carouselContainer
            }
          >
            {/* ================================================== */}
            {/* CARRUSEL                                           */}
            {/* ================================================== */}

            <View
              style={
                styles.carouselWrapper
              }
            >
              <ScrollView
                ref={
                  scrollNoticiasRef
                }
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={
                  false
                }
                nestedScrollEnabled={
                  true
                }
                scrollEventThrottle={
                  16
                }
                decelerationRate="fast"
                onMomentumScrollEnd={(
                  event
                ) => {
                  const posicion =
                    event.nativeEvent
                      .contentOffset.x;

                  const indice =
                    Math.round(
                      posicion /
                        width
                    );

                  setCurrentNews(
                    indice
                  );
                }}
              >
                {noticias.map(
                  (noticia) => (
                    <View
                      key={
                        noticia.id
                      }
                      style={{
                        width:
                          width,
                        alignItems:
                          "center",
                      }}
                    >
                      {renderTarjeta(
                        noticia
                      )}
                    </View>
                  )
                )}
              </ScrollView>

              {/* ============================================ */}
              {/* FLECHA IZQUIERDA - SOLO WEB                  */}
              {/* ============================================ */}

              {esWeb &&
              noticias.length > 1 ? (
                <Pressable
                  onPress={
                    noticiaAnterior
                  }
                  style={({ pressed }) => [
                    styles.arrowButton,
                    styles.arrowLeft,
                    {
                      backgroundColor:
                        colors.card,
                      borderColor:
                        colors.border,
                      opacity:
                        pressed ? 0.65 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="chevron-back"
                    size={25}
                    color={
                      colors.primary
                    }
                  />
                </Pressable>
              ) : null}

              {/* ============================================ */}
              {/* FLECHA DERECHA - SOLO WEB                    */}
              {/* ============================================ */}

              {esWeb &&
              noticias.length > 1 ? (
                <Pressable
                  onPress={
                    noticiaSiguiente
                  }
                  style={({ pressed }) => [
                    styles.arrowButton,
                    styles.arrowRight,
                    {
                      backgroundColor:
                        colors.card,
                      borderColor:
                        colors.border,
                      opacity:
                        pressed ? 0.65 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={25}
                    color={
                      colors.primary
                    }
                  />
                </Pressable>
              ) : null}
            </View>

            {/* ================================================== */}
            {/* PAGINACIÓN                                          */}
            {/* ================================================== */}

            <View
              style={
                styles.pagination
              }
            >
              {noticias.map(
                (
                  noticia,
                  index
                ) => (
                  <Pressable
                    key={
                      noticia.id
                    }
                    onPress={() => {
                      setCurrentNews(
                        index
                      );

                      scrollNoticiasRef.current?.scrollTo(
                        {
                          x:
                            index *
                            width,
                          animated:
                            true,
                        }
                      );
                    }}
                    style={
                      styles.paginationArea
                    }
                  >
                    <View
                      style={[
                        styles.paginationDot,
                        {
                          width:
                            index ===
                            currentNews
                              ? 24
                              : 7,
                          backgroundColor:
                            index ===
                            currentNews
                              ? colors.primary
                              : colors.border,
                        },
                      ]}
                    />
                  </Pressable>
                )
              )}
            </View>

            {/* ================================================== */}
            {/* AYUDA                                              */}
            {/* ================================================== */}

            {noticias.length > 1 ? (
              <View
                style={
                  styles.navigationHint
                }
              >
                <Ionicons
                  name={
                    esWeb
                      ? "swap-horizontal-outline"
                      : "hand-left-outline"
                  }
                  size={16}
                  color={
                    colors.textSecondary
                  }
                />

                <Text
                  style={[
                    styles.navigationHintText,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  {esWeb
                    ? "Usa las flechas para cambiar de noticia"
                    : "Desliza para cambiar de noticia"}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        <View
          style={{
            height: 30,
          }}
        />
      </ScrollView>

      {/* ==================================================== */}
      {/* MODAL DE NOTICIA COMPLETA                            */}
      {/* ==================================================== */}

      <Modal
        visible={
          modalVisible &&
          noticiaSeleccionada !==
            null
        }
        animationType="slide"
        transparent={false}
        onRequestClose={
          cerrarNoticia
        }
      >
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor:
                colors.background,
            },
          ]}
        >
          {noticiaSeleccionada ? (
            <>
              {/* ============================================ */}
              {/* HEADER DEL MODAL                              */}
              {/* ============================================ */}

              <View
                style={[
                  styles.modalHeader,
                  {
                    backgroundColor:
                      colors.card,
                    borderBottomColor:
                      colors.border,
                  },
                ]}
              >
                <View
                  style={
                    styles.modalHeaderLeft
                  }
                >
                  <View
                    style={[
                      styles.modalHeaderIcon,
                      {
                        backgroundColor:
                          colors.background,
                        borderColor:
                          colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="newspaper"
                      size={21}
                      color={
                        colors.primary
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.modalHeaderTextContainer
                    }
                  >
                    <Text
                      style={[
                        styles.modalHeaderTitle,
                        {
                          color:
                            colors.text,
                        },
                      ]}
                    >
                      Noticia
                    </Text>

                    <Text
                      style={[
                        styles.modalHeaderSubtitle,
                        {
                          color:
                            colors.textSecondary,
                        },
                      ]}
                    >
                      Información completa
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={
                    cerrarNoticia
                  }
                  style={({ pressed }) => [
                    styles.closeButton,
                    {
                      backgroundColor:
                        colors.background,
                      borderColor:
                        colors.border,
                      opacity:
                        pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={
                      colors.text
                    }
                  />
                </Pressable>
              </View>

              {/* ============================================ */}
              {/* CONTENIDO                                     */}
              {/* ============================================ */}

              <ScrollView
                style={
                  styles.modalScroll
                }
                contentContainerStyle={
                  styles.modalContent
                }
                showsVerticalScrollIndicator={
                  true
                }
                nestedScrollEnabled={
                  true
                }
              >
                {/* IMAGEN */}

                {noticiaSeleccionada.imagenUrl ? (
                  <Image
                    source={{
                      uri: noticiaSeleccionada.imagenUrl,
                    }}
                    style={
                      styles.fullImage
                    }
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.fullImagePlaceholder,
                      {
                        backgroundColor:
                          colors.card,
                        borderColor:
                          colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="image-outline"
                      size={60}
                      color={
                        colors.textSecondary
                      }
                    />

                    <Text
                      style={[
                        styles.placeholderText,
                        {
                          color:
                            colors.textSecondary,
                        },
                      ]}
                    >
                      Imagen no disponible
                    </Text>
                  </View>
                )}

                {/* META */}

                <View
                  style={
                    styles.metaRow
                  }
                >
                  <View
                    style={[
                      styles.fullCategory,
                      {
                        backgroundColor:
                          colors.background,
                        borderColor:
                          colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="pricetag-outline"
                      size={14}
                      color={
                        colors.primary
                      }
                    />

                    <Text
                      style={[
                        styles.fullCategoryText,
                        {
                          color:
                            colors.primary,
                        },
                      ]}
                    >
                      {noticiaSeleccionada.categoria ||
                        "General"}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.fullDate
                    }
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color={
                        colors.textSecondary
                      }
                    />

                    <Text
                      style={[
                        styles.fullDateText,
                        {
                          color:
                            colors.textSecondary,
                        },
                      ]}
                    >
                      {formatearFecha(
                        noticiaSeleccionada.fechaPublicacion
                      )}
                    </Text>
                  </View>
                </View>

                {/* TÍTULO */}

                <Text
                  style={[
                    styles.fullTitle,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  {
                    noticiaSeleccionada.titulo
                  }
                </Text>

                {/* RESUMEN */}

                {noticiaSeleccionada.resumen ? (
                  <View
                    style={[
                      styles.summaryBox,
                      {
                        backgroundColor:
                          colors.card,
                        borderColor:
                          colors.border,
                        borderLeftColor:
                          colors.primary,
                      },
                    ]}
                  >
                    <View
                      style={
                        styles.summaryHeader
                      }
                    >
                      <Ionicons
                        name="information-circle-outline"
                        size={21}
                        color={
                          colors.primary
                        }
                      />

                      <Text
                        style={[
                          styles.summaryTitle,
                          {
                            color:
                              colors.primary,
                          },
                        ]}
                      >
                        Resumen
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.fullSummary,
                        {
                          color:
                            colors.text,
                        },
                      ]}
                    >
                      {
                        noticiaSeleccionada.resumen
                      }
                    </Text>
                  </View>
                ) : null}

                {/* DIVISOR */}

                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor:
                        colors.border,
                    },
                  ]}
                />

                {/* CABECERA CONTENIDO */}

                <View
                  style={
                    styles.contentHeader
                  }
                >
                  <View
                    style={[
                      styles.contentIcon,
                      {
                        backgroundColor:
                          colors.card,
                        borderColor:
                          colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={22}
                      color={
                        colors.primary
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.contentHeaderTexts
                    }
                  >
                    <Text
                      style={[
                        styles.contentTitle,
                        {
                          color:
                            colors.text,
                        },
                      ]}
                    >
                      Contenido completo
                    </Text>

                    <Text
                      style={[
                        styles.contentSubtitle,
                        {
                          color:
                            colors.textSecondary,
                        },
                      ]}
                    >
                      Toda la información de la noticia
                    </Text>
                  </View>
                </View>

                {/* CONTENIDO */}

                {obtenerParrafos(
                  noticiaSeleccionada.contenido
                ).length > 0 ? (
                  obtenerParrafos(
                    noticiaSeleccionada.contenido
                  ).map(
                    (
                      parrafo,
                      index
                    ) => (
                      <Text
                        key={`${noticiaSeleccionada.id}-${index}`}
                        style={[
                          styles.paragraph,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        {parrafo}
                      </Text>
                    )
                  )
                ) : (
                  <View
                    style={[
                      styles.noContent,
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
                        styles.noContentIcon,
                        {
                          backgroundColor:
                            colors.background,
                        },
                      ]}
                    >
                      <Ionicons
                        name="document-outline"
                        size={31}
                        color={
                          colors.textSecondary
                        }
                      />
                    </View>

                    <Text
                      style={[
                        styles.noContentTitle,
                        {
                          color:
                            colors.text,
                        },
                      ]}
                    >
                      No hay contenido completo disponible
                    </Text>

                    <Text
                      style={[
                        styles.noContentText,
                        {
                          color:
                            colors.textSecondary,
                        },
                      ]}
                    >
                      Esta noticia todavía no tiene
                      contenido editorial almacenado.
                    </Text>
                  </View>
                )}

                {/* FUENTE */}

                <View
                  style={[
                    styles.sourceCard,
                    {
                      backgroundColor:
                        colors.card,
                      borderColor:
                        colors.border,
                    },
                  ]}
                >
                  <View
                    style={
                      styles.sourceHeader
                    }
                  >
                    <View
                      style={[
                        styles.sourceIcon,
                        {
                          backgroundColor:
                            colors.background,
                          borderColor:
                            colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="business-outline"
                        size={21}
                        color={
                          colors.primary
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.sourceDetails
                      }
                    >
                      <Text
                        style={[
                          styles.sourceLabel,
                          {
                            color:
                              colors.textSecondary,
                          },
                        ]}
                      >
                        FUENTE DE LA NOTICIA
                      </Text>

                      <Text
                        style={[
                          styles.sourceName,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        {noticiaSeleccionada.fuente ||
                          "Fuente oficial"}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() =>
                      abrirFuente(
                        noticiaSeleccionada
                      )
                    }
                    disabled={
                      !obtenerUrlFuente(
                        noticiaSeleccionada
                      )
                    }
                    style={({ pressed }) => [
                      styles.sourceButton,
                      {
                        backgroundColor:
                          colors.primary,
                        opacity:
                          pressed
                            ? 0.7
                            : obtenerUrlFuente(
                                noticiaSeleccionada
                              )
                              ? 1
                              : 0.45,
                      },
                    ]}
                  >
                    <Ionicons
                      name="open-outline"
                      size={19}
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.sourceButtonText
                      }
                    >
                      Ver fuente original
                    </Text>
                  </Pressable>
                </View>

                <View
                  style={{
                    height: 40,
                  }}
                />
              </ScrollView>
            </>
          ) : null}
        </View>
      </Modal>
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
  },

  mainScroll: {
    flex: 1,
  },

  mainContent: {
    paddingTop: 12,
    paddingBottom: 20,
  },

  webMainContent: {
    paddingTop: 24,
  },

  /*
   * ==========================================================
   * HEADER WEB
   * ==========================================================
   */

  webHero: {
    width: "92%",
    maxWidth: 1180,
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 28,
    padding: 28,
    marginBottom: 20,
  },

  webHeroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  webIconGroup: {
    flexDirection: "row",
    alignItems: "center",
  },

  decorativeIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },

  liveText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  webHeroCenter: {
    alignItems: "center",
    justifyContent: "center",
  },

  webMainIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 14,
  },

  webMainIconSmall: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  webTitle: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "900",
    textAlign: "center",
  },

  webSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 7,
    textAlign: "center",
    maxWidth: 620,
  },

  webStats: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 27,
  },

  webStat: {
    flex: 1,
    minHeight: 72,
    maxWidth: 300,
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 5,
  },

  webStatText: {
    flex: 1,
    marginLeft: 10,
  },

  webStatNumber: {
    fontSize: 22,
    fontWeight: "900",
  },

  webStatStatus: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  webStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },

  /*
   * ==========================================================
   * HEADER ANDROID
   * ==========================================================
   */

  mobileHeader: {
    width: "100%",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  mobileHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  mobileMainIcon: {
    width: 53,
    height: 53,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  mobileHeaderTexts: {
    marginLeft: 12,
    flex: 1,
  },

  mobileTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  mobileTitle: {
    fontSize: 29,
    fontWeight: "900",
    marginRight: 7,
  },

  mobileSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  mobileHeaderIcons: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },

  smallHeaderIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },

  /*
   * ==========================================================
   * CARGANDO / VACÍO
   * ==========================================================
   */

  loadingContainer: {
    minHeight: 450,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  loadingText: {
    fontSize: 15,
    marginTop: 13,
  },

  emptyContainer: {
    minHeight: 450,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 105,
    height: 105,
    borderRadius: 53,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
  },

  /*
   * ==========================================================
   * CARRUSEL
   * ==========================================================
   */

  carouselContainer: {
    width: "100%",
  },

  carouselWrapper: {
    width: "100%",
    position: "relative",
  },

  page: {
    alignItems: "center",
    justifyContent: "flex-start",
  },

  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  newsBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  newsBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 6,
  },

  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    marginLeft: 10,
  },

  dateText: {
    fontSize: 11,
    marginLeft: 5,
  },

  category: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginBottom: 11,
  },

  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 5,
  },

  title: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "800",
    marginBottom: 8,
  },

  summary: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },

  image: {
    width: "100%",
    height: 200,
    borderRadius: 17,
    marginBottom: 13,
  },

  imagePlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  placeholderText: {
    fontSize: 13,
    marginTop: 7,
  },

  sourceInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  sourceText: {
    flex: 1,
    fontSize: 12,
    marginLeft: 7,
  },

  readMoreButton: {
    height: 50,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  readMoreText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginHorizontal: 8,
  },

  /*
   * ==========================================================
   * FLECHAS
   * ==========================================================
   */

  arrowButton: {
    position: "absolute",
    top: "45%",
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,

    ...(Platform.OS === "web"
      ? {
          cursor: "pointer",
        }
      : {}),
  },

  arrowLeft: {
    left: 18,
  },

  arrowRight: {
    right: 18,
  },

  /*
   * ==========================================================
   * PAGINACIÓN
   * ==========================================================
   */

  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },

  paginationArea: {
    padding: 5,
  },

  paginationDot: {
    height: 7,
    borderRadius: 4,
  },

  navigationHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },

  navigationHintText: {
    fontSize: 11,
    marginLeft: 5,
  },

  /*
   * ==========================================================
   * MODAL
   * ==========================================================
   */

  modalContainer: {
    flex: 1,
  },

  modalHeader: {
    minHeight: 68,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },

  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  modalHeaderIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  modalHeaderTextContainer: {
    marginLeft: 11,
  },

  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  modalHeaderSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  modalScroll: {
    flex: 1,
  },

  modalContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  fullImage: {
    width: "100%",
    height: 245,
    borderRadius: 20,
    marginBottom: 17,
  },

  fullImagePlaceholder: {
    width: "100%",
    height: 245,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  fullCategory: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  fullCategoryText: {
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 5,
  },

  fullDate: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    marginLeft: 10,
  },

  fullDateText: {
    fontSize: 11,
    marginLeft: 5,
  },

  fullTitle: {
    fontSize: 29,
    lineHeight: 38,
    fontWeight: "900",
    marginBottom: 18,
  },

  summaryBox: {
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 13,
    padding: 15,
    marginBottom: 20,
  },

  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  summaryTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 7,
  },

  fullSummary: {
    fontSize: 15,
    lineHeight: 23,
  },

  divider: {
    width: "100%",
    height: 1,
    marginBottom: 20,
  },

  contentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  contentIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  contentHeaderTexts: {
    flex: 1,
    marginLeft: 11,
  },

  contentTitle: {
    fontSize: 19,
    fontWeight: "800",
  },

  contentSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  paragraph: {
    fontSize: 16,
    lineHeight: 29,
    marginBottom: 18,
  },

  noContent: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },

  noContentIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  noContentTitle: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 10,
  },

  noContentText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },

  sourceCard: {
    borderWidth: 1,
    borderRadius: 17,
    padding: 15,
    marginTop: 8,
  },

  sourceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  sourceIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  sourceDetails: {
    flex: 1,
    marginLeft: 11,
  },

  sourceLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
    marginBottom: 3,
  },

  sourceName: {
    fontSize: 15,
    fontWeight: "700",
  },

  sourceButton: {
    height: 48,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  sourceButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 7,
  },
});