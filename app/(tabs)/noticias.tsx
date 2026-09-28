import React, { useState } from "react";
import {View,Text,StyleSheet,FlatList,ScrollView,useWindowDimensions,
NativeSyntheticEvent,NativeScrollEvent,} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../hooks/useTheme";
import BotonReportar from "../../components/BotonReportar";

import {
  MOTIVOS_NOTICIAS,
} from "../../services/reportesService";

const newsData = [
  {
    id: "1",
    title: "Nueva campaña de vacunación",
    description:
      "El gobierno anuncia jornadas gratuitas de vacunación.",
    category: "Salud Pública",
    date: "13 Mayo 2026",
  },

  {
    id: "2",
    title: "Aumento de enfermedades respiratorias",
    description:
      "Se recomienda uso de mascarilla en lugares cerrados.",
    category: "Prevención",
    date: "12 Mayo 2026",
  },
];

export default function News() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  // El tamaño de la tarjeta se adapta a móvil y web.
  const cardWidth = Math.min(width - 40, 900);

  // Altura fija para permitir desplazamiento vertical dentro de la noticia.
  const cardHeight = width < 700 ? 460 : 500;

  const [currentNews, setCurrentNews] = useState(0);

  // Actualiza el indicador de noticia mientras el usuario desliza.
  const actualizarNoticia = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offsetX = event.nativeEvent.contentOffset.x;

    const index = Math.round(offsetX / cardWidth);

    if (
      index >= 0 &&
      index < newsData.length &&
      index !== currentNews
    ) {
      setCurrentNews(index);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* ============================================================
          ENCABEZADO
      ============================================================ */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTitleRow}>
          {/* Icono principal de noticias */}
          <View
            style={[
              styles.headerIcon,
              {
                backgroundColor: colors.card,
              },
            ]}
          >
            <Ionicons
              name="newspaper"
              size={25}
              color={colors.primary}
            />
          </View>

          {/* Título y descripción de la sección */}
          <View style={styles.headerTextContainer}>
            <Text
              style={[
                styles.header,
                { color: colors.text },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Noticias de Salud
            </Text>

            <Text
              style={[
                styles.subheader,
                { color: colors.textSecondary },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Información y novedades médicas
            </Text>
          </View>
        </View>
      </View>

      {/* ============================================================
          CONTENEDOR PRINCIPAL DEL CARRUSEL
      ============================================================ */}
      <View
        style={[
          styles.carouselContainer,
          {
            width: cardWidth,
          },
        ]}
      >
        <FlatList
          data={newsData}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          directionalLockEnabled
          decelerationRate="fast"
          onScroll={actualizarNoticia}
          scrollEventThrottle={16}
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.card,
                {
                  width: cardWidth,
                  height: cardHeight,
                  backgroundColor: colors.card,
                },
              ]}
            >
              {/* ====================================================
                  CABECERA TIPO RELOJ
              ==================================================== */}
              <View style={styles.cardHeader}>
                {/* Identificador de noticia */}
                <View>
                  <Text
                    style={[
                      styles.cardSectionLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    ACTUALIZACIÓN
                  </Text>

                  <Text
                    style={[
                      styles.newsNumber,
                      { color: colors.text },
                    ]}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </Text>
                </View>

                {/* Fecha */}
                <View style={styles.dateContainer}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={colors.primary}
                  />

                  <Text
                    style={[
                      styles.date,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.date}
                  </Text>
                </View>
              </View>

              {/* Línea visual de separación */}
              <View
                style={[
                  styles.separator,
                  {
                    backgroundColor: colors.background,
                  },
                ]}
              />

              {/* ====================================================
                  CONTENIDO DESPLAZABLE DE LA NOTICIA
              ==================================================== */}
              <ScrollView
                style={styles.articleScroll}
                contentContainerStyle={styles.articleContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled
              >
                {/* Categoría */}
                <View
                  style={[
                    styles.categoryBadge,
                    {
                      backgroundColor: colors.background,
                    },
                  ]}
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={15}
                    color={colors.primary}
                  />

                  <Text
                    style={[
                      styles.category,
                      { color: colors.primary },
                    ]}
                  >
                    {item.category}
                  </Text>
                </View>

                {/* Título */}
                <Text
                  style={[
                    styles.title,
                    { color: colors.text },
                  ]}
                >
                  {item.title}
                </Text>

                {/* Descripción */}
                <Text
                  style={[
                    styles.description,
                    { color: colors.textSecondary },
                  ]}
                >
                  {item.description}
                </Text>
              </ScrollView>

              {/* ====================================================
                  PIE DE LA TARJETA
              ==================================================== */}
              <View style={styles.cardFooter}>
                <View style={styles.footerInfo}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.footerText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Desliza para continuar
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward-circle-outline"
                  size={25}
                  color={colors.primary}
                />
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text
              style={[
                styles.empty,
                { color: colors.textSecondary },
              ]}
            >
              No hay noticias disponibles
            </Text>
          }
        />

        {/* ============================================================
            INDICADORES DEL CARRUSEL
        ============================================================ */}
        {newsData.length > 1 && (
          <View style={styles.pagination}>
            <Text
              style={[
                styles.paginationText,
                { color: colors.textSecondary },
              ]}
            >
              {String(currentNews + 1).padStart(2, "0")} /{" "}
              {String(newsData.length).padStart(2, "0")}
            </Text>

            <View style={styles.paginationDots}>
              {newsData.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.paginationDot,
                    {
                      backgroundColor:
                        index === currentNews
                          ? colors.primary
                          : colors.textSecondary,
                      opacity:
                        index === currentNews ? 1 : 0.3,
                    },
                    index === currentNews &&
                      styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}
      </View>
      <BotonReportar
  recursoId="noticias"
  recursoNombre="Noticias de salud"
  motivos={MOTIVOS_NOTICIAS}
  textoBoton="Reportar un problema"
  descripcionBoton="Ayúdanos a mejorar las noticias"
/>
    </View>
  );
}

/* ============================================================
   ESTILOS
============================================================ */

const styles = StyleSheet.create({
  /* ==========================================================
     ESTRUCTURA GENERAL
  ========================================================== */
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },

  /* ==========================================================
     ENCABEZADO
  ========================================================== */
  headerContainer: {
    marginBottom: 18,
  },

  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  header: {
    fontSize: 30,
    fontWeight: "800",
  },

  subheader: {
    fontSize: 14,
    marginTop: 3,
  },

  /* ==========================================================
     CARRUSEL
  ========================================================== */
  carouselContainer: {
    flex: 1,
    alignSelf: "center",
  },

  /* ==========================================================
     TARJETA PRINCIPAL
  ========================================================== */
  card: {
    borderRadius: 30,
    padding: 24,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 7,
    },

    elevation: 5,
  },

  /* ==========================================================
     CABECERA DE TARJETA
  ========================================================== */
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cardSectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  newsNumber: {
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 38,
  },

  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
  },

  date: {
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 6,
  },

  separator: {
    height: 1,
    marginVertical: 18,
  },

  /* ==========================================================
     CONTENIDO INTERNO DE LA NOTICIA
  ========================================================== */
  articleScroll: {
    flex: 1,
  },

  articleContent: {
    paddingBottom: 15,
  },

  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",

    paddingHorizontal: 11,
    paddingVertical: 7,

    borderRadius: 999,
    marginBottom: 18,
  },

  category: {
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 6,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 35,
  },

  description: {
    fontSize: 16,
    lineHeight: 26,
    marginTop: 16,
  },

  /* ==========================================================
     PIE DE TARJETA
  ========================================================== */
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginTop: 14,
    paddingTop: 14,

    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    flex: 1,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 8,
  },

  footerText: {
    fontSize: 12,
    fontWeight: "700",
  },

  /* ==========================================================
     PAGINACIÓN
  ========================================================== */
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginTop: 12,
    paddingBottom: 8,
  },

  paginationText: {
    fontSize: 11,
    fontWeight: "800",
    marginRight: 10,
  },

  paginationDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },

  paginationDotActive: {
    width: 18,
  },

  /* ==========================================================
     ESTADO VACÍO
  ========================================================== */
  empty: {
    textAlign: "center",
    marginTop: 40,
  },
});