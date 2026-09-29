import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
    useCallback,
    useState,
} from "react";

import {
    useFocusEffect,
    useRouter,
} from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import { auth } from "../../services/firebase";

import {
    aprobarNoticia,
    editarNoticia,
    obtenerNoticiasPendientes,
    rechazarNoticia,
    type Noticia,
} from "../../services/noticiasService";

import { useTheme } from "../../hooks/useTheme";

export default function AdminNoticias() {
  const { colors } = useTheme();
  const router = useRouter();

  const [noticias, setNoticias] =
    useState<Noticia[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [actualizando, setActualizando] =
    useState(false);

  const [noticiaEditando, setNoticiaEditando] =
    useState<Noticia | null>(null);

  const [titulo, setTitulo] =
    useState("");

  const [resumen, setResumen] =
    useState("");

  const [contenido, setContenido] =
    useState("");

  const [categoria, setCategoria] =
    useState("");

  const [imagenUrl, setImagenUrl] =
    useState("");

  const [guardando, setGuardando] =
    useState(false);

  /* ============================================================
     CARGAR NOTICIAS
  ============================================================ */

  const cargarNoticias =
    useCallback(async () => {
      try {
        setCargando(true);

        const resultado =
          await obtenerNoticiasPendientes();

        setNoticias(resultado);
      } catch (error) {
        console.error(
          "Error cargando noticias pendientes:",
          error
        );

        mostrarMensaje(
          "Noticias",
          "No se pudieron cargar las noticias pendientes."
        );
      } finally {
        setCargando(false);
      }
    }, []);

  /* ============================================================
     CARGAR AL ENTRAR
  ============================================================ */

  useFocusEffect(
    useCallback(() => {
      cargarNoticias();
    }, [cargarNoticias])
  );

  /* ============================================================
     MENSAJES
  ============================================================ */

  function mostrarMensaje(
    titulo: string,
    mensaje: string
  ) {
    if (Platform.OS === "web") {
      window.alert(
        `${titulo}\n\n${mensaje}`
      );
      return;
    }

    Alert.alert(
      titulo,
      mensaje
    );
  }

  /* ============================================================
     REFRESCAR
  ============================================================ */

  const refrescar = async () => {
    try {
      setActualizando(true);
      await cargarNoticias();
    } finally {
      setActualizando(false);
    }
  };

  /* ============================================================
     ABRIR FUENTE
  ============================================================ */

  const abrirFuente =
    async (
      noticia: Noticia
    ) => {
      const url =
        noticia.urlOficial ||
        noticia.fuenteUrl ||
        noticia.urlGoogleNews ||
        "";

      if (!url) {
        mostrarMensaje(
          "Fuente no disponible",
          "Esta noticia no tiene una URL disponible."
        );

        return;
      }

      try {
        await Linking.openURL(url);
      } catch (error) {
        console.error(
          "Error abriendo fuente:",
          error
        );

        mostrarMensaje(
          "Error",
          "No se pudo abrir la fuente de la noticia."
        );
      }
    };

  /* ============================================================
     PREPARAR EDICIÓN
  ============================================================ */

  const prepararEdicion =
    (
      noticia: Noticia
    ) => {
      setNoticiaEditando(noticia);

      setTitulo(noticia.titulo);
      setResumen(noticia.resumen);
      setContenido(noticia.contenido);
      setCategoria(noticia.categoria);
      setImagenUrl(noticia.imagenUrl);
    };

  /* ============================================================
     CERRAR EDICIÓN
  ============================================================ */

  const cerrarEdicion =
    () => {
      if (guardando) {
        return;
      }

      setNoticiaEditando(null);

      setTitulo("");
      setResumen("");
      setContenido("");
      setCategoria("");
      setImagenUrl("");
    };

  /* ============================================================
     GUARDAR EDICIÓN
  ============================================================ */

  const guardarEdicion =
    async () => {
      if (!noticiaEditando) {
        return;
      }

      if (
        !titulo.trim() ||
        !resumen.trim() ||
        !contenido.trim()
      ) {
        mostrarMensaje(
          "Datos incompletos",
          "Completa título, resumen y contenido."
        );

        return;
      }

      try {
        setGuardando(true);

        await editarNoticia(
          noticiaEditando.id,
          {
            titulo:
              titulo.trim(),

            resumen:
              resumen.trim(),

            contenido:
              contenido.trim(),

            categoria:
              categoria.trim(),

            imagenUrl:
              imagenUrl.trim(),
          }
        );

        setNoticias(
          (actuales) =>
            actuales.map(
              (noticia) =>
                noticia.id ===
                noticiaEditando.id
                  ? {
                      ...noticia,
                      titulo:
                        titulo.trim(),
                      resumen:
                        resumen.trim(),
                      contenido:
                        contenido.trim(),
                      categoria:
                        categoria.trim(),
                      imagenUrl:
                        imagenUrl.trim(),
                    }
                  : noticia
            )
        );

        cerrarEdicion();

        mostrarMensaje(
          "Noticia actualizada",
          "Los cambios se guardaron correctamente."
        );
      } catch (error) {
        console.error(
          "Error editando noticia:",
          error
        );

        mostrarMensaje(
          "Error",
          "No se pudo guardar la noticia."
        );
      } finally {
        setGuardando(false);
      }
    };

  /* ============================================================
     PUBLICAR
  ============================================================ */

  const confirmarPublicacion =
    (
      noticia: Noticia
    ) => {
      const ejecutar =
        async () => {
          const uid =
            auth.currentUser?.uid;

          if (!uid) {
            mostrarMensaje(
              "Sesión requerida",
              "No se encontró el usuario autenticado."
            );

            return;
          }

          try {
            await aprobarNoticia(
              noticia.id,
              uid
            );

            setNoticias(
              (actuales) =>
                actuales.filter(
                  (item) =>
                    item.id !==
                    noticia.id
                )
            );
          } catch (error) {
            console.error(
              "Error publicando noticia:",
              error
            );

            mostrarMensaje(
              "Error",
              "No se pudo publicar la noticia."
            );
          }
        };

      if (Platform.OS === "web") {
        const confirmado =
          window.confirm(
            `¿Publicar "${noticia.titulo}"?`
          );

        if (confirmado) {
          ejecutar();
        }

        return;
      }

      Alert.alert(
        "Publicar noticia",
        `¿Deseas publicar "${noticia.titulo}"?`,
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Publicar",
            onPress: ejecutar,
          },
        ]
      );
    };

  /* ============================================================
     RECHAZAR
  ============================================================ */

  const confirmarRechazo =
    (
      noticia: Noticia
    ) => {
      const ejecutar =
        async () => {
          const uid =
            auth.currentUser?.uid;

          if (!uid) {
            mostrarMensaje(
              "Sesión requerida",
              "No se encontró el usuario autenticado."
            );

            return;
          }

          try {
            await rechazarNoticia(
              noticia.id,
              uid
            );

            setNoticias(
              (actuales) =>
                actuales.filter(
                  (item) =>
                    item.id !==
                    noticia.id
                )
            );
          } catch (error) {
            console.error(
              "Error rechazando noticia:",
              error
            );

            mostrarMensaje(
              "Error",
              "No se pudo rechazar la noticia."
            );
          }
        };

      if (Platform.OS === "web") {
        const confirmado =
          window.confirm(
            `¿Rechazar "${noticia.titulo}"?`
          );

        if (confirmado) {
          ejecutar();
        }

        return;
      }

      Alert.alert(
        "Rechazar noticia",
        `¿Deseas rechazar "${noticia.titulo}"?`,
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Rechazar",
            style: "destructive",
            onPress: ejecutar,
          },
        ]
      );
    };

  /* ============================================================
     IMAGEN
  ============================================================ */

  const mostrarImagen =
    (
      url: string
    ) =>
      Boolean(
        url &&
          /^https?:\/\//i.test(url)
      );

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >

      {/* ======================================================
          HEADER FIJO
          
          IMPORTANTE:
          Está fuera del ScrollView.
          Por eso permanece visible cuando bajas.
      ====================================================== */}

      <View
        style={[
          styles.headerWrapper,
          {
            backgroundColor:
              colors.background,
            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <View
          style={
            styles.header
          }
        >
          <Pressable
            onPress={() =>
              router.back()
            }
            style={[
              styles.backButton,
              {
                backgroundColor:
                  colors.card,
              },
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={
                colors.text
              }
            />
          </Pressable>

          <View
            style={
              styles.headerTextContainer
            }
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
              Revisar noticias
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
              Revisa, edita y decide
              qué noticias pasan a
              publicación.
            </Text>
          </View>
        </View>
      </View>

      {/* ======================================================
          CONTENIDO CON SCROLL
          
          TODO lo que está aquí sí se desplaza.
      ====================================================== */}

      <ScrollView
        style={
          styles.scrollView
        }
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              actualizando
            }
            onRefresh={
              refrescar
            }
            tintColor={
              colors.primary
            }
            colors={[
              colors.primary,
            ]}
          />
        }
      >

        {/* ======================================================
            RESUMEN
        ====================================================== */}

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
        >
          <View>
            <Text
              style={[
                styles.summaryNumber,
                {
                  color:
                    colors.primary,
                },
              ]}
            >
              {noticias.length}
            </Text>

            <Text
              style={[
                styles.summaryLabel,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Noticias pendientes
            </Text>
          </View>

          <Pressable
            onPress={
              refrescar
            }
            disabled={
              actualizando
            }
            style={[
              styles.primaryButton,
              {
                backgroundColor:
                  colors.primary,
              },
              actualizando &&
                styles.disabledButton,
            ]}
          >
            {actualizando ? (
              <ActivityIndicator
                color="#ffffff"
              />
            ) : (
              <>
                <Ionicons
                  name="refresh"
                  size={20}
                  color="#ffffff"
                />

                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Actualizar
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* ======================================================
            CARGANDO
        ====================================================== */}

        {cargando ? (
          <View
            style={
              styles.loadingContainer
            }
          >
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

          /* ====================================================
             VACÍO
          ==================================================== */

          <View
            style={[
              styles.emptyCard,
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
              size={40}
              color={
                colors.textSecondary
              }
            />

            <Text
              style={[
                styles.emptyTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              No hay noticias pendientes
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
              Cuando GitHub recolecte
              nuevas noticias aparecerán
              aquí para su revisión.
            </Text>
          </View>

        ) : (

          /* ====================================================
             NOTICIAS
          ==================================================== */

          noticias.map(
            (
              noticia
            ) => (
              <View
                key={
                  noticia.id
                }
                style={[
                  styles.card,
                  {
                    backgroundColor:
                      colors.card,
                    borderColor:
                      colors.border,
                  },
                ]}
              >

                {/* =================================================
                    IMAGEN
                ================================================= */}

                {mostrarImagen(
                  noticia.imagenUrl
                ) ? (
                  <Image
                    source={{
                      uri:
                        noticia.imagenUrl,
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
                        borderBottomColor:
                          colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="image-outline"
                      size={36}
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

                <View
                  style={
                    styles.cardBody
                  }
                >

                  {/* =================================================
                      BADGES
                  ================================================= */}

                  <View
                    style={
                      styles.badgesRow
                    }
                  >
                    <View
                      style={[
                        styles.badge,
                        {
                          borderColor:
                            colors.border,
                          backgroundColor:
                            colors.background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        Pendiente
                      </Text>
                    </View>

                    {noticia.categoria ? (
                      <View
                        style={[
                          styles.badge,
                          {
                            borderColor:
                              colors.border,
                            backgroundColor:
                              colors.background,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            {
                              color:
                                colors.textSecondary,
                            },
                          ]}
                        >
                          {
                            noticia.categoria
                          }
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* =================================================
                      TÍTULO
                  ================================================= */}

                  <Text
                    style={[
                      styles.cardTitle,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    {
                      noticia.titulo
                    }
                  </Text>

                  {/* =================================================
                      RESUMEN
                  ================================================= */}

                  <Text
                    style={[
                      styles.fieldLabel,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    Resumen
                  </Text>

                  <Text
                    style={[
                      styles.detailText,
                      {
                        color:
                          colors.textSecondary,
                      },
                    ]}
                  >
                    {noticia.resumen ||
                      "Sin resumen disponible."}
                  </Text>

                  {/* =================================================
                      CONTENIDO
                  ================================================= */}

                  <Text
                    style={[
                      styles.fieldLabel,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    Contenido
                  </Text>

                  {noticia.contenido ? (
                    <View
                      style={[
                        styles.contentBox,
                        {
                          backgroundColor:
                            colors.background,
                          borderColor:
                            colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailText,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                        numberOfLines={
                          10
                        }
                      >
                        {
                          noticia.contenido
                        }
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.detailText,
                        {
                          color:
                            colors.textSecondary,
                        },
                      ]}
                    >
                      Esta noticia no tiene
                      contenido editorial.
                    </Text>
                  )}

                  {/* =================================================
                      FUENTE
                  ================================================= */}

                  <View
                    style={[
                      styles.sourceBox,
                      {
                        borderTopColor:
                          colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.fieldLabel,
                        {
                          color:
                            colors.text,
                        },
                      ]}
                    >
                      Fuente
                    </Text>

                    <Text
                      style={[
                        styles.detailText,
                        {
                          color:
                            colors.textSecondary,
                        },
                      ]}
                    >
                      {noticia.fuente ||
                        "Fuente oficial"}
                    </Text>
                  </View>

                  {/* =================================================
                      ACCIONES
                  ================================================= */}

                  <View
                    style={
                      styles.actions
                    }
                  >

                    {/* VER FUENTE */}

                    <Pressable
                      onPress={() =>
                        abrirFuente(
                          noticia
                        )
                      }
                      style={[
                        styles.actionButton,
                        {
                          borderColor:
                            colors.border,
                          backgroundColor:
                            colors.background,
                        },
                      ]}
                    >
                      <Ionicons
                        name="open-outline"
                        size={18}
                        color={
                          colors.text
                        }
                      />

                      <Text
                        style={[
                          styles.actionButtonText,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        Ver fuente
                      </Text>
                    </Pressable>

                    {/* EDITAR */}

                    <Pressable
                      onPress={() =>
                        prepararEdicion(
                          noticia
                        )
                      }
                      style={[
                        styles.actionButton,
                        {
                          borderColor:
                            colors.border,
                          backgroundColor:
                            colors.background,
                        },
                      ]}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={
                          colors.text
                        }
                      />

                      <Text
                        style={[
                          styles.actionButtonText,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        Editar
                      </Text>
                    </Pressable>

                    {/* RECHAZAR */}

                    <Pressable
                      onPress={() =>
                        confirmarRechazo(
                          noticia
                        )
                      }
                      style={[
                        styles.actionButton,
                        {
                          borderColor:
                            colors.border,
                          backgroundColor:
                            colors.background,
                        },
                      ]}
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={18}
                        color={
                          colors.text
                        }
                      />

                      <Text
                        style={[
                          styles.actionButtonText,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        Rechazar
                      </Text>
                    </Pressable>

                    {/* PUBLICAR */}

                    <Pressable
                      onPress={() =>
                        confirmarPublicacion(
                          noticia
                        )
                      }
                      style={[
                        styles.primaryActionButton,
                        {
                          backgroundColor:
                            colors.primary,
                        },
                      ]}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color="#ffffff"
                      />

                      <Text
                        style={
                          styles.primaryActionText
                        }
                      >
                        Publicar
                      </Text>
                    </Pressable>

                  </View>
                </View>
              </View>
            )
          )
        )}

      </ScrollView>

      {/* ============================================================
          MODAL EDICIÓN
      ============================================================ */}

      <Modal
        visible={
          noticiaEditando !==
          null
        }
        animationType="slide"
        transparent
        onRequestClose={
          cerrarEdicion
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor:
                  colors.card,
              },
            ]}
          >

            <ScrollView
              contentContainerStyle={
                styles.modalContent
              }
              showsVerticalScrollIndicator={
                false
              }
            >

              {/* =================================================
                  HEADER DEL MODAL
              ================================================= */}

              <View
                style={
                  styles.formHeader
                }
              >
                <View
                  style={
                    styles.formHeaderText
                  }
                >
                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    Editar noticia
                  </Text>

                  <Text
                    style={[
                      styles.formSubtitle,
                      {
                        color:
                          colors.textSecondary,
                      },
                    ]}
                  >
                    Modifica la información
                    de la noticia.
                  </Text>
                </View>

                <Pressable
                  onPress={
                    cerrarEdicion
                  }
                  disabled={
                    guardando
                  }
                  style={
                    styles.modalCloseButton
                  }
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={
                      colors.textSecondary
                    }
                  />
                </Pressable>
              </View>

              {/* =================================================
                  TÍTULO
              ================================================= */}

              <Text
                style={[
                  styles.fieldLabel,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Título
              </Text>

              <TextInput
                value={titulo}
                onChangeText={
                  setTitulo
                }
                placeholder="Título"
                placeholderTextColor={
                  colors.textSecondary
                }
                style={[
                  styles.input,
                  {
                    color:
                      colors.text,
                    borderColor:
                      colors.border,
                    backgroundColor:
                      colors.background,
                  },
                ]}
              />

              {/* =================================================
                  RESUMEN
              ================================================= */}

              <Text
                style={[
                  styles.fieldLabel,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Resumen
              </Text>

              <TextInput
                value={resumen}
                onChangeText={
                  setResumen
                }
                placeholder="Resumen breve"
                placeholderTextColor={
                  colors.textSecondary
                }
                multiline
                style={[
                  styles.input,
                  styles.textAreaSmall,
                  {
                    color:
                      colors.text,
                    borderColor:
                      colors.border,
                    backgroundColor:
                      colors.background,
                  },
                ]}
              />

              {/* =================================================
                  CONTENIDO
              ================================================= */}

              <Text
                style={[
                  styles.fieldLabel,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Contenido
              </Text>

              <TextInput
                value={contenido}
                onChangeText={
                  setContenido
                }
                placeholder="Contenido completo"
                placeholderTextColor={
                  colors.textSecondary
                }
                multiline
                textAlignVertical="top"
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    color:
                      colors.text,
                    borderColor:
                      colors.border,
                    backgroundColor:
                      colors.background,
                  },
                ]}
              />

              {/* =================================================
                  CATEGORÍA
              ================================================= */}

              <Text
                style={[
                  styles.fieldLabel,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Categoría
              </Text>

              <TextInput
                value={categoria}
                onChangeText={
                  setCategoria
                }
                placeholder="Categoría"
                placeholderTextColor={
                  colors.textSecondary
                }
                style={[
                  styles.input,
                  {
                    color:
                      colors.text,
                    borderColor:
                      colors.border,
                    backgroundColor:
                      colors.background,
                  },
                ]}
              />

              {/* =================================================
                  URL
              ================================================= */}

              <Text
                style={[
                  styles.fieldLabel,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                URL de imagen
              </Text>

              <TextInput
                value={imagenUrl}
                onChangeText={
                  setImagenUrl
                }
                placeholder="https://..."
                placeholderTextColor={
                  colors.textSecondary
                }
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.input,
                  {
                    color:
                      colors.text,
                    borderColor:
                      colors.border,
                    backgroundColor:
                      colors.background,
                  },
                ]}
              />

              {/* =================================================
                  PREVISUALIZACIÓN
              ================================================= */}

              {mostrarImagen(
                imagenUrl
              ) ? (
                <Image
                  source={{
                    uri:
                      imagenUrl,
                  }}
                  style={
                    styles.previewImage
                  }
                  resizeMode="cover"
                />
              ) : null}

              {/* =================================================
                  BOTONES DEL MODAL
              ================================================= */}

              <View
                style={
                  styles.formButtons
                }
              >

                {/* CANCELAR */}

                <Pressable
                  onPress={
                    cerrarEdicion
                  }
                  disabled={
                    guardando
                  }
                  style={[
                    styles.secondaryButton,
                    {
                      borderColor:
                        colors.border,
                      backgroundColor:
                        colors.background,
                    },
                    guardando &&
                      styles.disabledButton,
                  ]}
                >
                  <Text
                    style={{
                      color:
                        colors.text,
                      fontWeight:
                        "700",
                    }}
                  >
                    Cancelar
                  </Text>
                </Pressable>

                {/* GUARDAR */}

                <Pressable
                  onPress={
                    guardarEdicion
                  }
                  disabled={
                    guardando
                  }
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor:
                        colors.primary,
                    },
                    guardando &&
                      styles.disabledButton,
                  ]}
                >
                  {guardando ? (
                    <ActivityIndicator
                      color="#ffffff"
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="save-outline"
                        size={19}
                        color="#ffffff"
                      />

                      <Text
                        style={
                          styles.primaryButtonText
                        }
                      >
                        Guardar cambios
                      </Text>
                    </>
                  )}
                </Pressable>

              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

/* ==============================================================
   ESTILOS
============================================================== */

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
    },

    /* ==========================================================
       HEADER FIJO
    ========================================================== */

    headerWrapper: {
      borderBottomWidth: 1,
    },

    header: {
      width: "100%",
      maxWidth: 1100,
      alignSelf: "center",

      flexDirection: "row",
      alignItems: "center",

      gap: 12,

      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 16,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 12,

      alignItems: "center",
      justifyContent: "center",
    },

    headerTextContainer: {
      flex: 1,
    },

    title: {
      fontSize: 28,
      fontWeight: "800",
    },

    subtitle: {
      marginTop: 4,
      fontSize: 14,
      lineHeight: 20,
    },

    /* ==========================================================
       SCROLL
    ========================================================== */

    scrollView: {
      flex: 1,
    },

    content: {
      padding: 20,
      paddingBottom: 40,

      width: "100%",
      maxWidth: 1100,
      alignSelf: "center",
    },

    /* ==========================================================
       LOADING
    ========================================================== */

    loadingContainer: {
      minHeight: 240,

      justifyContent: "center",
      alignItems: "center",

      gap: 12,
    },

    loadingText: {
      fontSize: 15,
    },

    /* ==========================================================
       RESUMEN
    ========================================================== */

    summaryCard: {
      borderWidth: 1,
      borderRadius: 18,

      padding: 18,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      gap: 12,

      marginBottom: 18,
    },

    summaryNumber: {
      fontSize: 28,
      fontWeight: "800",
    },

    summaryLabel: {
      fontSize: 13,
      marginTop: 2,
    },

    /* ==========================================================
       BOTÓN PRINCIPAL
    ========================================================== */

    primaryButton: {
      minHeight: 46,

      borderRadius: 12,

      paddingHorizontal: 16,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 8,
    },

    primaryButtonText: {
      color: "#ffffff",
      fontWeight: "800",
    },

    /* ==========================================================
       CARDS
    ========================================================== */

    card: {
      borderWidth: 1,
      borderRadius: 18,

      overflow: "hidden",

      marginBottom: 12,
    },

    cardBody: {
      padding: 16,
    },

    image: {
      width: "100%",
      height: 220,
    },

    imagePlaceholder: {
      height: 180,

      alignItems: "center",
      justifyContent: "center",

      gap: 8,

      borderBottomWidth: 1,
    },

    placeholderText: {
      fontSize: 14,
    },

    /* ==========================================================
       BADGES
    ========================================================== */

    badgesRow: {
      flexDirection: "row",
      flexWrap: "wrap",

      gap: 8,

      marginBottom: 10,
    },

    badge: {
      borderWidth: 1,
      borderRadius: 9,

      paddingHorizontal: 10,
      paddingVertical: 6,
    },

    badgeText: {
      fontSize: 13,
      fontWeight: "700",
    },

    /* ==========================================================
       TEXTO
    ========================================================== */

    cardTitle: {
      fontSize: 19,
      lineHeight: 25,

      fontWeight: "800",

      marginBottom: 14,
    },

    fieldLabel: {
      fontSize: 13,
      fontWeight: "800",

      marginBottom: 7,
      marginTop: 10,
    },

    detailText: {
      fontSize: 14,
      lineHeight: 21,

      marginBottom: 8,
    },

    contentBox: {
      borderWidth: 1,
      borderRadius: 12,

      padding: 14,

      marginBottom: 8,
    },

    sourceBox: {
      borderTopWidth: 1,

      marginTop: 8,
      paddingTop: 12,
    },

    /* ==========================================================
       ACCIONES
    ========================================================== */

    actions: {
      flexDirection: "row",
      flexWrap: "wrap",

      gap: 8,

      marginTop: 10,
    },

    actionButton: {
      minHeight: 40,

      borderWidth: 1,
      borderRadius: 10,

      paddingHorizontal: 12,

      justifyContent: "center",
      alignItems: "center",

      flexDirection: "row",

      gap: 6,
    },

    actionButtonText: {
      fontWeight: "700",
      fontSize: 14,
    },

    primaryActionButton: {
      minHeight: 40,

      borderRadius: 10,

      paddingHorizontal: 14,

      justifyContent: "center",
      alignItems: "center",

      flexDirection: "row",

      gap: 6,
    },

    primaryActionText: {
      color: "#ffffff",

      fontWeight: "800",
      fontSize: 14,
    },

    disabledButton: {
      opacity: 0.6,
    },

    /* ==========================================================
       VACÍO
    ========================================================== */

    emptyCard: {
      borderWidth: 1,
      borderRadius: 18,

      padding: 30,

      alignItems: "center",
      justifyContent: "center",

      gap: 8,

      marginTop: 10,
    },

    emptyTitle: {
      fontSize: 18,

      fontWeight: "800",

      textAlign: "center",
    },

    emptyText: {
      fontSize: 14,

      textAlign: "center",
      lineHeight: 20,

      maxWidth: 500,
    },

    /* ==========================================================
       MODAL
    ========================================================== */

    modalOverlay: {
      flex: 1,

      backgroundColor:
        "rgba(0,0,0,0.55)",

      justifyContent: "center",

      padding: 16,
    },

    modalCard: {
      width: "100%",

      maxWidth: 850,
      maxHeight: "92%",

      alignSelf: "center",

      borderRadius: 18,

      overflow: "hidden",
    },

    modalContent: {
      padding: 18,
      paddingBottom: 30,
    },

    formHeader: {
      flexDirection: "row",

      justifyContent: "space-between",
      alignItems: "center",

      marginBottom: 16,
    },

    formHeaderText: {
      flex: 1,

      paddingRight: 10,
    },

    sectionTitle: {
      fontSize: 19,
      fontWeight: "800",
    },

    formSubtitle: {
      marginTop: 4,
      fontSize: 13,
    },

    modalCloseButton: {
      width: 42,
      height: 42,

      borderRadius: 12,

      alignItems: "center",
      justifyContent: "center",
    },

    input: {
      minHeight: 48,

      borderWidth: 1,
      borderRadius: 12,

      paddingHorizontal: 14,

      marginBottom: 12,

      fontSize: 15,
    },

    textAreaSmall: {
      minHeight: 82,

      textAlignVertical: "top",

      paddingTop: 12,
    },

    textArea: {
      minHeight: 180,

      textAlignVertical: "top",

      paddingTop: 12,
    },

    previewImage: {
      width: "100%",
      height: 220,

      borderRadius: 12,

      marginTop: 4,
      marginBottom: 10,
    },

    formButtons: {
      flexDirection: "row",

      justifyContent: "flex-end",

      flexWrap: "wrap",

      gap: 10,

      marginTop: 8,
    },

    secondaryButton: {
      minHeight: 46,

      borderRadius: 12,

      paddingHorizontal: 16,

      borderWidth: 1,

      alignItems: "center",
      justifyContent: "center",

      flexDirection: "row",

      gap: 8,
    },
  });