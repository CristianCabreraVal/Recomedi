/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
//Componentes visuales de React Native utilizados paraconstruir la pantalla de carga.
import {ActivityIndicator,Alert,KeyboardAvoidingView,Modal,Platform,Pressable,
  ScrollView,StyleSheet,Text,TextInput,useWindowDimensions,View} from "react-native";
import { useState } from "react";
// Ionicons: permite usar iconos para complementar la interfaz de usuario
import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
// Importación del hook personalizado para obtener los colores del tema actual (claro u oscuro)
import { useTheme } from "../hooks/useTheme";
import {MotivoReporte,registrarReporte} from "../services/reportesService";

/* ============================================================
   PROPS
============================================================ */

type Props = {
  recursoId: string;
  recursoNombre: string;
  motivos: MotivoReporte[];
  textoBoton?: string;
  descripcionBoton?: string;
};
// export default indica que este es el componente principal que se exporta desde este archivo.
export default function BotonReportar({
  recursoId,
  recursoNombre,
  motivos,
  textoBoton = "Reportar un problema",
  descripcionBoton = "Ayúdanos a mejorar esta pantalla",
}: Props) {
  const { colors } = useTheme();

  const pathname = usePathname();

  const { width } =
    useWindowDimensions();

  const pantallaWeb =
    Platform.OS === "web";

  const pantallaAncha =
    width >= 700;

  /* ==========================================================
     ESTADOS
  ========================================================== */

  const [mostrarModal, setMostrarModal] =
    useState(false);

  const [motivoSeleccionado, setMotivoSeleccionado] =
    useState<string | null>(null);

  const [descripcion, setDescripcion] =
    useState("");

  const [enviando, setEnviando] =
    useState(false);

  /* ==========================================================
     ABRIR MODAL
  ========================================================== */

  const abrirModal = () => {
    setMotivoSeleccionado(null);
    setDescripcion("");
    setMostrarModal(true);
  };

  /* ==========================================================
     CERRAR MODAL
  ========================================================== */

  const cerrarModal = () => {
    if (enviando) {
      return;
    }

    setMostrarModal(false);
    setMotivoSeleccionado(null);
    setDescripcion("");
  };

  /* ==========================================================
     ENVIAR REPORTE
  ========================================================== */

  const enviar = async () => {
    if (!motivoSeleccionado) {
      Alert.alert(
        "Selecciona un motivo",
        "Indica qué problema encontraste."
      );

      return;
    }

    if (!descripcion.trim()) {
      Alert.alert(
        "Falta una descripción",
        "Cuéntanos brevemente qué problema encontraste."
      );

      return;
    }

    try {
      setEnviando(true);

      const resultado =
        await registrarReporte({
          pagina: pathname || "/",
          recursoId,
          recursoNombre,
          tipo: motivoSeleccionado,
          descripcion,
        });

      setMostrarModal(false);
      setMotivoSeleccionado(null);
      setDescripcion("");

      if (resultado === "creado") {
        Alert.alert(
          "Reporte enviado",
          "Gracias. El reporte quedó registrado para revisión."
        );
      } else {
        Alert.alert(
          "Reporte actualizado",
          "La nueva información fue agregada al reporte existente."
        );
      }
    } catch (error: any) {
      console.error(
        "Error enviando reporte:",
        error
      );

      Alert.alert(
        "No fue posible enviar el reporte",
        error?.message ||
          "Ocurrió un error inesperado."
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      {/* ======================================================
          BOTÓN GENERAL DE LA PANTALLA
      ====================================================== */}

      <View
        style={[
          styles.wrapper,
          pantallaAncha &&
            styles.wrapperWide,
        ]}
      >
        <Pressable
          onPress={abrirModal}
          style={({ pressed }) => [
            styles.boton,

            {
              backgroundColor:
                colors.card,

              borderColor:
                colors.border,

              opacity:
                pressed ? 0.82 : 1,
            },

            pantallaWeb &&
              pantallaAncha &&
              styles.botonWeb,
          ]}
        >
          {/* ICONO */}

          <View
            style={[
              styles.icono,
              {
                backgroundColor:
                  colors.background,
              },
            ]}
          >
            <Ionicons
              name="flag-outline"
              size={18}
              color="#DC2626"
            />
          </View>

          {/* TEXTO */}

          <View
            style={styles.textoContainer}
          >
            <Text
              style={[
                styles.titulo,
                {
                  color: colors.text,
                },
              ]}
              numberOfLines={1}
            >
              {textoBoton}
            </Text>

            <Text
              style={[
                styles.descripcion,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
              numberOfLines={2}
            >
              {descripcionBoton}
            </Text>
          </View>

          {/* INDICADOR */}

          <View
            style={[
              styles.indicador,
              {
                backgroundColor:
                  colors.background,
              },
            ]}
          >
            <Ionicons
              name="chevron-forward"
              size={17}
              color={
                colors.textSecondary
              }
            />
          </View>
        </Pressable>
      </View>

      {/* ======================================================
          MODAL
      ====================================================== */}

      <Modal
        visible={mostrarModal}
        transparent
        animationType={
          pantallaWeb
            ? "fade"
            : "slide"
        }
        onRequestClose={
          cerrarModal
        }
      >
        <KeyboardAvoidingView
          style={[
            styles.overlay,
            pantallaWeb &&
              styles.overlayWeb,
          ]}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : "height"
          }
        >
          {/* FONDO */}

          <Pressable
            style={styles.fondo}
            onPress={cerrarModal}
          />

          {/* PANEL */}

          <View
            style={[
              styles.modal,
              {
                backgroundColor:
                  colors.card,
              },

              pantallaWeb &&
                styles.modalWeb,

              pantallaWeb &&
                pantallaAncha &&
                styles.modalWebWide,
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === "ios"
                  ? "interactive"
                  : "on-drag"
              }
              contentContainerStyle={
                styles.modalContent
              }
            >
              {/* ==============================================
                  CABECERA
              ============================================== */}

              <View
                style={
                  styles.modalHeader
                }
              >
                <View
                  style={[
                    styles.modalHeaderIcon,
                    {
                      backgroundColor:
                        colors.background,
                    },
                  ]}
                >
                  <Ionicons
                    name="flag"
                    size={21}
                    color="#DC2626"
                  />
                </View>

                <View
                  style={
                    styles.modalHeaderText
                  }
                >
                  <Text
                    style={[
                      styles.modalTitle,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    Reportar un problema
                  </Text>

                  <Text
                    style={[
                      styles.modalSubtitle,
                      {
                        color:
                          colors.textSecondary,
                      },
                    ]}
                  >
                    Tu reporte ayudará a mejorar
                    Recomedi.
                  </Text>
                </View>

                <Pressable
                  onPress={cerrarModal}
                  disabled={enviando}
                  style={
                    styles.closeButton
                  }
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color={
                      colors.textSecondary
                    }
                  />
                </Pressable>
              </View>

              {/* ==============================================
                  PANTALLA REPORTADA
              ============================================== */}

              <View
                style={[
                  styles.contextBox,
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
                    styles.contextLabel,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  PANTALLA
                </Text>

                <Text
                  style={[
                    styles.contextTitle,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {recursoNombre}
                </Text>
              </View>

              {/* ==============================================
                  MOTIVOS
              ============================================== */}

              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                ¿Qué problema encontraste?
              </Text>

              <View
                style={
                  styles.motivosContainer
                }
              >
                {motivos.map(
                  (motivo) => {
                    const seleccionado =
                      motivoSeleccionado ===
                      motivo.id;

                    return (
                      <Pressable
                        key={motivo.id}
                        onPress={() =>
                          setMotivoSeleccionado(
                            motivo.id
                          )
                        }
                        disabled={
                          enviando
                        }
                        style={[
                          styles.motivo,
                          {
                            backgroundColor:
                              seleccionado
                                ? colors.background
                                : colors.card,

                            borderColor:
                              seleccionado
                                ? colors.primary
                                : colors.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.radio,
                            {
                              borderColor:
                                seleccionado
                                  ? colors.primary
                                  : colors.border,
                            },
                          ]}
                        >
                          {seleccionado && (
                            <View
                              style={[
                                styles.radioInner,
                                {
                                  backgroundColor:
                                    colors.primary,
                                },
                              ]}
                            />
                          )}
                        </View>

                        <Text
                          style={[
                            styles.motivoText,
                            {
                              color:
                                colors.text,
                            },
                          ]}
                        >
                          {
                            motivo.nombre
                          }
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </View>

              {/* ==============================================
                  DESCRIPCIÓN
              ============================================== */}

              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Cuéntanos qué pasó
              </Text>

              <TextInput
                value={
                  descripcion
                }
                onChangeText={
                  setDescripcion
                }
                editable={
                  !enviando
                }
                multiline
                maxLength={500}
                placeholder="Describe brevemente el problema..."
                placeholderTextColor={
                  colors.textSecondary
                }
                textAlignVertical="top"
                style={[
                  styles.input,
                  {
                    color:
                      colors.text,

                    backgroundColor:
                      colors.background,

                    borderColor:
                      colors.border,
                  },
                ]}
              />

              <Text
                style={[
                  styles.counter,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                {
                  descripcion.length
                }
                /500
              </Text>

              {/* ==============================================
                  ACCIONES
              ============================================== */}

              <View
                style={
                  styles.actions
                }
              >
                <Pressable
                  onPress={
                    cerrarModal
                  }
                  disabled={
                    enviando
                  }
                  style={[
                    styles.cancelButton,
                    {
                      borderColor:
                        colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cancelText,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    Cancelar
                  </Text>
                </Pressable>

                <Pressable
                  onPress={enviar}
                  disabled={enviando}
                  style={[
                    styles.sendButton,
                    {
                      backgroundColor:
                        colors.primary,
                    },
                  ]}
                >
                  {enviando ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="paper-plane-outline"
                        size={17}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.sendText
                        }
                      >
                        Enviar
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>

              <View
                style={
                  styles.bottomSpace
                }
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
/* StyleSheet.create permite agrupar los estilos utilizados por los componentes de este archivo.
 Cada propiedad dentro de styles representa un conjunto de 
 características visuales que puede aplicarse mediante:
 style={styles.nombre}
 */
const styles =
  StyleSheet.create({
    wrapper: {
      width: "100%",
      marginTop: 18,
      marginBottom: 8,
    },

    wrapperWide: {
      alignSelf: "center",
    },

    boton: {
      width: "100%",

      minHeight: 62,

      flexDirection: "row",
      alignItems: "center",

      paddingHorizontal: 13,
      paddingVertical: 10,

      borderWidth: 1,
      borderRadius: 19,
    },

    botonWeb: {
      minHeight: 64,
    },

    icono: {
      width: 40,
      height: 40,

      borderRadius: 13,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 11,
    },

    textoContainer: {
      flex: 1,
      minWidth: 0,
    },

    titulo: {
      fontSize: 14,
      fontWeight: "800",
    },

    descripcion: {
      fontSize: 11.5,
      lineHeight: 16,

      marginTop: 2,
    },

    indicador: {
      width: 34,
      height: 34,

      borderRadius: 11,

      alignItems: "center",
      justifyContent: "center",

      marginLeft: 10,
    },

    overlay: {
      flex: 1,

      justifyContent: "flex-end",

      backgroundColor:
        "rgba(0,0,0,0.45)",
    },

    overlayWeb: {
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },

    fondo: {
  ...StyleSheet.absoluteFill,
},

    modal: {
      width: "100%",

      maxHeight: "90%",

      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,

      overflow: "hidden",
    },

    modalWeb: {
      borderRadius: 26,

      maxWidth: 540,

      maxHeight: "88%",
    },

    modalWebWide: {
      width: "100%",
    },

    modalContent: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 28,
    },

    modalHeader: {
      flexDirection: "row",
      alignItems: "center",

      marginBottom: 18,
    },

    modalHeaderIcon: {
      width: 43,
      height: 43,

      borderRadius: 14,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 10,
    },

    modalHeaderText: {
      flex: 1,
      minWidth: 0,
    },

    modalTitle: {
      fontSize: 18,
      fontWeight: "800",
    },

    modalSubtitle: {
      fontSize: 12,
      lineHeight: 17,

      marginTop: 3,
    },

    closeButton: {
      width: 38,
      height: 38,

      borderRadius: 12,

      alignItems: "center",
      justifyContent: "center",
    },

    contextBox: {
      borderWidth: 1,

      borderRadius: 15,

      padding: 12,

      marginBottom: 20,
    },

    contextLabel: {
      fontSize: 9,

      fontWeight: "900",

      letterSpacing: 1,
    },

    contextTitle: {
      fontSize: 14,

      fontWeight: "700",

      lineHeight: 19,

      marginTop: 4,
    },

    sectionTitle: {
      fontSize: 14,

      fontWeight: "800",

      marginBottom: 9,
    },

    motivosContainer: {
      gap: 8,

      marginBottom: 20,
    },

    motivo: {
      minHeight: 48,

      flexDirection: "row",
      alignItems: "center",

      borderWidth: 1,

      borderRadius: 14,

      paddingHorizontal: 12,
    },

    radio: {
      width: 20,
      height: 20,

      borderRadius: 10,

      borderWidth: 2,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 10,
    },

    radioInner: {
      width: 8,
      height: 8,

      borderRadius: 4,
    },

    motivoText: {
      flex: 1,

      fontSize: 13,

      lineHeight: 18,
    },

    input: {
      width: "100%",

      minHeight: 115,

      borderWidth: 1,

      borderRadius: 15,

      paddingHorizontal: 13,
      paddingVertical: 12,

      fontSize: 13.5,

      lineHeight: 20,
    },

    counter: {
      fontSize: 10.5,

      textAlign: "right",

      marginTop: 5,

      marginBottom: 17,
    },

    actions: {
      flexDirection: "row",

      gap: 9,
    },

    cancelButton: {
      flex: 1,

      minHeight: 47,

      borderWidth: 1,

      borderRadius: 14,

      alignItems: "center",
      justifyContent: "center",
    },

    cancelText: {
      fontSize: 13,

      fontWeight: "700",
    },

    sendButton: {
      flex: 1,

      minHeight: 47,

      borderRadius: 14,

      flexDirection: "row",

      alignItems: "center",
      justifyContent: "center",

      gap: 7,
    },

    sendText: {
      color: "#FFFFFF",

      fontSize: 13,

      fontWeight: "800",
    },

    bottomSpace: {
      height: 15,
    },
  });