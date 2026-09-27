import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useEffect, useState } from "react";

import { SafeAreaView } from "react-native-safe-area-context";

import { WebView } from "react-native-webview";

import { Ionicons } from "@expo/vector-icons";

import * as Location from "expo-location";

import { buscarCentrosMedicos } from "../../services/mapService";

import { useTheme } from "../../hooks/useTheme";


/* ============================================================
   TIPO DE UBICACIÓN

   Guarda las coordenadas obtenidas mediante expo-location.
============================================================ */

type Ubicacion = {
  latitude: number;
  longitude: number;
};


export default function Mapa() {
  const { colors } = useTheme();


  /* ==========================================================
     ESTADOS

     ubicacion:
     Coordenadas actuales del usuario.

     lugares:
     Centros médicos encontrados.

     loading:
     Estado inicial mientras se obtiene la ubicación.

     buscandoLugares:
     Estado de búsqueda de establecimientos.
  ========================================================== */

  const [ubicacion, setUbicacion] =
    useState<Ubicacion | null>(null);

  const [lugares, setLugares] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [buscandoLugares, setBuscandoLugares] =
    useState(false);


  /* ==========================================================
     CARGA INICIAL

     Al entrar en la pantalla se solicita la ubicación y
     posteriormente se buscan los centros médicos cercanos.
  ========================================================== */

  useEffect(() => {
    cargarUbicacion();
  }, []);


  /* ==========================================================
     OBTENER UBICACIÓN

     1. Solicita permiso.
     2. Obtiene la posición.
     3. Guarda las coordenadas.
     4. Busca los centros médicos.
  ========================================================== */

  async function cargarUbicacion() {
    try {
      setLoading(true);

      const permiso =
        await Location.requestForegroundPermissionsAsync();

      if (permiso.status !== "granted") {
        Alert.alert(
          "Ubicación",
          "Se necesita permiso de ubicación para encontrar centros médicos cercanos."
        );

        setLoading(false);
        return;
      }

      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

      const lat =
        location.coords.latitude;

      const lng =
        location.coords.longitude;

      const nuevaUbicacion = {
        latitude: lat,
        longitude: lng,
      };

      setUbicacion(nuevaUbicacion);

      setLoading(false);

      buscarHospitales(
        lat,
        lng
      );
    } catch (error) {
      console.log(
        "Error obteniendo ubicación:",
        error
      );

      setLoading(false);

      Alert.alert(
        "Ubicación",
        "No fue posible obtener tu ubicación actual."
      );
    }
  }


  /* ==========================================================
     BUSCAR CENTROS MÉDICOS

     Consulta mapService usando las coordenadas del usuario.
  ========================================================== */

  async function buscarHospitales(
    lat: number,
    lng: number
  ) {
    try {
      setBuscandoLugares(true);

      const data =
        await buscarCentrosMedicos(
          lat,
          lng
        );

      setLugares(data);
    } catch (error) {
      console.log(
        "Error buscando centros médicos:",
        error
      );

      setLugares([]);

      Alert.alert(
        "Centros médicos",
        "No fue posible cargar los centros médicos cercanos."
      );
    } finally {
      setBuscandoLugares(false);
    }
  }


  /* ==========================================================
     ESTADO DE CARGA

     Pantalla mostrada mientras obtenemos la ubicación.
  ========================================================== */

  if (loading) {
    return (
      <View
        style={[
          styles.loading,
          {
            backgroundColor:
              colors.background,
          },
        ]}
      >
        <View
          style={[
            styles.loadingIcon,
            {
              backgroundColor:
                colors.card,
            },
          ]}
        >
          <Ionicons
            name="navigate-outline"
            size={30}
            color={colors.primary}
          />
        </View>

        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text
          style={[
            styles.loadingText,
            {
              color: colors.text,
            },
          ]}
        >
          Obteniendo tu ubicación...
        </Text>

        <Text
          style={[
            styles.loadingSubtitle,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          Necesitamos tu ubicación para
          encontrar centros médicos cercanos.
        </Text>
      </View>
    );
  }


  /* ==========================================================
     GENERAR MAPA

     El HTML recibe la ubicación y los centros encontrados.
  ========================================================== */

  const mapaHtml =
    generarMapaHtml(
      ubicacion,
      lugares
    );


  /* ==========================================================
     INTERFAZ PRINCIPAL
  ========================================================== */

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
        showsVerticalScrollIndicator={true}
        contentContainerStyle={
          styles.scroll
        }
      >

        <View style={styles.content}>

          {/* ==================================================
              ENCABEZADO
          ================================================== */}

          <View
            style={
              styles.headerContainer
            }
          >
            <View
              style={
                styles.headerTextContainer
              }
            >
              <Text
                style={[
                  styles.eyebrow,
                  {
                    color:
                      colors.primary,
                  },
                ]}
              >
                MAPA DE SALUD
              </Text>

              <Text
                style={[
                  styles.header,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Centros médicos cercanos
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
                Hospitales, clínicas y centros de salud
                cerca de tu ubicación.
              </Text>
            </View>

            <View
              style={[
                styles.headerBadge,
                {
                  backgroundColor:
                    colors.card,
                  borderColor:
                    colors.border,
                },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={15}
                color={colors.primary}
              />

              <Text
                style={[
                  styles.headerBadgeText,
                  {
                    color:
                      colors.primary,
                  },
                ]}
              >
                5 km
              </Text>
            </View>
          </View>


          {/* ==================================================
              MAPA
          ================================================== */}

          {ubicacion && (
            <View
              style={[
                styles.mapCard,
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
                  styles.mapHeader
                }
              >
                <View>
                  <Text
                    style={[
                      styles.mapTitle,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    Mapa
                  </Text>

                  <Text
                    style={[
                      styles.mapSubtitle,
                      {
                        color:
                          colors.textSecondary,
                      },
                    ]}
                  >
                    Tu ubicación y centros cercanos
                  </Text>
                </View>

                <View
                  style={[
                    styles.mapStatus,
                    {
                      backgroundColor:
                        colors.background,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          colors.primary,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.mapStatusText,
                      {
                        color:
                          colors.primary,
                      },
                    ]}
                  >
                    Activo
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.mapContainer
                }
              >
                <WebView
                  originWhitelist={["*"]}
                  source={{
                    html: mapaHtml,
                  }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View
                      style={[
                        styles.mapLoading,
                        {
                          backgroundColor:
                            colors.background,
                        },
                      ]}
                    >
                      <ActivityIndicator
                        size="large"
                        color={colors.primary}
                      />

                      <Text
                        style={[
                          styles.mapLoadingText,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        Cargando mapa...
                      </Text>
                    </View>
                  )}
                />
              </View>
            </View>
          )}


          {/* ==================================================
              BÚSQUEDA
          ================================================== */}

          {buscandoLugares && (
            <View
              style={[
                styles.searchingCard,
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
                  styles.searchingIcon,
                  {
                    backgroundColor:
                      colors.background,
                  },
                ]}
              >
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                />
              </View>

              <View
                style={
                  styles.searchingContent
                }
              >
                <Text
                  style={[
                    styles.searchingTitle,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  Buscando centros médicos
                </Text>

                <Text
                  style={[
                    styles.searchingText,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  Consultando establecimientos cercanos...
                </Text>
              </View>
            </View>
          )}


          {/* ==================================================
              RESUMEN DE RESULTADOS
          ================================================== */}

          <View
            style={
              styles.resultsHeader
            }
          >
            <View
              style={
                styles.resultsHeaderText
              }
            >
              <Text
                style={[
                  styles.resultsTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Centros encontrados
              </Text>

              <Text
                style={[
                  styles.resultsSubtitle,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                {lugares.length > 0
                  ? `${lugares.length} establecimientos disponibles`
                  : "No encontramos establecimientos cerca de ti"}
              </Text>
            </View>

            <View
              style={[
                styles.resultsCount,
                {
                  backgroundColor:
                    colors.card,
                  borderColor:
                    colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.resultsCountNumber,
                  {
                    color:
                      colors.primary,
                  },
                ]}
              >
                {lugares.length}
              </Text>

              <Text
                style={[
                  styles.resultsCountLabel,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                lugares
              </Text>
            </View>
          </View>


          {/* ==================================================
              SIN RESULTADOS
          ================================================== */}

          {!buscandoLugares &&
            lugares.length === 0 && (
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
                <View
                  style={[
                    styles.emptyIcon,
                    {
                      backgroundColor:
                        colors.background,
                    },
                  ]}
                >
                  <Ionicons
                    name="medical-outline"
                    size={31}
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
                  No encontramos centros cercanos
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
                  No hay establecimientos registrados
                  cerca de tu ubicación.
                </Text>
              </View>
            )}


          {/* ==================================================
              LISTA DE CENTROS
          ================================================== */}

          <View
            style={
              styles.resultsList
            }
          >
            {lugares.map(
              (lugar, index) => (
                <View
                  key={
                    lugar.id || index
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

                  {/* ==========================================
                      CABECERA DE TARJETA
                  ========================================== */}

                  <View
                    style={
                      styles.cardHeader
                    }
                  >
                    <View
                      style={[
                        styles.cardIcon,
                        {
                          backgroundColor:
                            colors.background,
                        },
                      ]}
                    >
                      <Ionicons
                        name={obtenerIconoCentro(
                          lugar
                        )}
                        size={24}
                        color={
                          colors.primary
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.cardHeaderText
                      }
                    >
                      <Text
                        style={[
                          styles.cardType,
                          {
                            color:
                              colors.primary,
                          },
                        ]}
                      >
                        {obtenerTipoCentro(
                          lugar
                        ).toUpperCase()}
                      </Text>

                      <Text
                        style={[
                          styles.cardTitle,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {lugar.display_name ||
                          lugar.tags?.name ||
                          "Centro médico"}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.distanceBadge,
                        {
                          backgroundColor:
                            colors.background,
                        },
                      ]}
                    >
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color={
                          colors.primary
                        }
                      />

                      <Text
                        style={[
                          styles.distanceText,
                          {
                            color:
                              colors.primary,
                          },
                        ]}
                      >
                        {formatearDistanciaCorta(
                          lugar.distanciaKm
                        )}
                      </Text>
                    </View>
                  </View>


                  {/* ==========================================
                      INFORMACIÓN
                  ========================================== */}

                  <View
                    style={
                      styles.infoContainer
                    }
                  >

                    {/* DISTANCIA */}

                    <View
                      style={
                        styles.infoRowCompact
                      }
                    >
                      <Ionicons
                        name="navigate-outline"
                        size={15}
                        color={
                          colors.primary
                        }
                      />

                      <Text
                        style={[
                          styles.infoCompactText,
                          {
                            color:
                              colors.textSecondary,
                          },
                        ]}
                      >
                        {formatearDistancia(
                          lugar.distanciaKm
                        )}
                      </Text>
                    </View>


                    {/* DIRECCIÓN */}

                    {obtenerDireccion(
                      lugar
                    ) !== "" && (
                      <View
                        style={
                          styles.infoRowCompact
                        }
                      >
                        <Ionicons
                          name="home-outline"
                          size={15}
                          color={
                            colors.primary
                          }
                        />

                        <Text
                          style={[
                            styles.infoCompactText,
                            {
                              color:
                                colors.textSecondary,
                            },
                          ]}
                        >
                          {obtenerDireccion(
                            lugar
                          )}
                        </Text>
                      </View>
                    )}


                    {/* HORARIO */}

                    {lugar.tags?.opening_hours && (
                      <View
                        style={
                          styles.infoRow
                        }
                      >
                        <View
                          style={[
                            styles.infoIcon,
                            {
                              backgroundColor:
                                colors.background,
                            },
                          ]}
                        >
                          <Ionicons
                            name="time-outline"
                            size={15}
                            color={
                              colors.primary
                            }
                          />
                        </View>

                        <View
                          style={
                            styles.infoContent
                          }
                        >
                          <Text
                            style={[
                              styles.infoLabel,
                              {
                                color:
                                  colors.textSecondary,
                              },
                            ]}
                          >
                            Horario
                          </Text>

                          <Text
                            style={[
                              styles.infoValue,
                              {
                                color:
                                  colors.text,
                              },
                            ]}
                          >
                            {formatearHorario(
                              lugar.tags
                                .opening_hours
                            )}
                          </Text>
                        </View>
                      </View>
                    )}


                    {/* ESPECIALIDAD */}

                    {lugar.tags?.speciality && (
                      <View
                        style={
                          styles.infoRow
                        }
                      >
                        <View
                          style={[
                            styles.infoIcon,
                            {
                              backgroundColor:
                                colors.background,
                            },
                          ]}
                        >
                          <Ionicons
                            name="medkit-outline"
                            size={15}
                            color={
                              colors.primary
                            }
                          />
                        </View>

                        <View
                          style={
                            styles.infoContent
                          }
                        >
                          <Text
                            style={[
                              styles.infoLabel,
                              {
                                color:
                                  colors.textSecondary,
                              },
                            ]}
                          >
                            Especialidad
                          </Text>

                          <Text
                            style={[
                              styles.infoValue,
                              {
                                color:
                                  colors.text,
                              },
                            ]}
                          >
                            {formatearEspecialidad(
                              lugar.tags
                                .speciality
                            )}
                          </Text>
                        </View>
                      </View>
                    )}


                    {/* TELÉFONO */}

                    {lugar.tags?.phone && (
                      <View
                        style={
                          styles.infoRow
                        }
                      >
                        <View
                          style={[
                            styles.infoIcon,
                            {
                              backgroundColor:
                                colors.background,
                            },
                          ]}
                        >
                          <Ionicons
                            name="call-outline"
                            size={15}
                            color={
                              colors.primary
                            }
                          />
                        </View>

                        <View
                          style={
                            styles.infoContent
                          }
                        >
                          <Text
                            style={[
                              styles.infoLabel,
                              {
                                color:
                                  colors.textSecondary,
                              },
                            ]}
                          >
                            Teléfono
                          </Text>

                          <Text
                            style={[
                              styles.infoValue,
                              {
                                color:
                                  colors.text,
                              },
                            ]}
                          >
                            {lugar.tags.phone}
                          </Text>
                        </View>
                      </View>
                    )}


                    {/* SITIO WEB */}

                    {lugar.tags?.website && (
                      <View
                        style={
                          styles.infoRow
                        }
                      >
                        <View
                          style={[
                            styles.infoIcon,
                            {
                              backgroundColor:
                                colors.background,
                            },
                          ]}
                        >
                          <Ionicons
                            name="globe-outline"
                            size={15}
                            color={
                              colors.primary
                            }
                          />
                        </View>

                        <View
                          style={
                            styles.infoContent
                          }
                        >
                          <Text
                            style={[
                              styles.infoLabel,
                              {
                                color:
                                  colors.textSecondary,
                              },
                            ]}
                          >
                            Sitio web
                          </Text>

                          <Text
                            style={[
                              styles.infoValue,
                              {
                                color:
                                  colors.text,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {lugar.tags.website}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>


                  {/* ==========================================
                      FUENTE
                  ========================================== */}

                  <View
                    style={[
                      styles.cardFooter,
                      {
                        borderTopColor:
                          colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={13}
                      color={
                        colors.textSecondary
                      }
                    />

                    <Text
                      style={[
                        styles.footerText,
                        {
                          color:
                            colors.textSecondary,
                        },
                      ]}
                    >
                      Información registrada en OpenStreetMap
                    </Text>
                  </View>

                </View>
              )
            )}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


/* ============================================================
   GENERAR MAPA HTML

   Esta parte mantiene la lógica original del mapa:
   - Leaflet
   - OpenStreetMap
   - Marcador del usuario
   - Marcadores de centros médicos
   - Popups
============================================================ */

function generarMapaHtml(
  ubicacion: Ubicacion | null,
  lugares: any[]
) {
  if (!ubicacion) {
    return `
      <!DOCTYPE html>
      <html>
        <body>
          <h3>No se pudo obtener la ubicación.</h3>
        </body>
      </html>
    `;
  }

  const lugaresJson =
    JSON.stringify(lugares).replace(
      /</g,
      "\\u003c"
    );

  return `
<!DOCTYPE html>
<html>

<head>

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  />

  <style>

    html,
    body,
    #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }

    body {
      overflow: hidden;
    }

    .user-marker {
      width: 18px;
      height: 18px;
      background: #2563EB;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow:
        0 2px 8px rgba(0,0,0,0.3);
    }

    .medical-marker {
      width: 18px;
      height: 18px;
      background: #DC2626;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow:
        0 2px 8px rgba(0,0,0,0.3);
    }

    .popup-title {
      font-size: 15px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .popup-type {
      font-size: 12px;
      color: #2563EB;
      margin-bottom: 4px;
    }

    .popup-info {
      font-size: 12px;
      line-height: 18px;
    }

  </style>

</head>

<body>

  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <script>

    const userLatitude =
      ${ubicacion.latitude};

    const userLongitude =
      ${ubicacion.longitude};

    const lugares =
      ${lugaresJson};


    /* ========================================================
       CREAR MAPA
    ======================================================== */

    const map =
      L.map("map", {
        zoomControl: true
      }).setView(
        [
          userLatitude,
          userLongitude
        ],
        14
      );


    /* ========================================================
       OPENSTREETMAP
    ======================================================== */

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,

        attribution:
          '&copy; OpenStreetMap contributors'
      }
    ).addTo(map);


    /* ========================================================
       UBICACIÓN DEL USUARIO
    ======================================================== */

    const userIcon =
      L.divIcon({
        className: "",

        html:
          '<div class="user-marker"></div>',

        iconSize: [24, 24],

        iconAnchor: [12, 12]
      });


    L.marker(
      [
        userLatitude,
        userLongitude
      ],
      {
        icon: userIcon
      }
    )
      .addTo(map)
      .bindPopup(
        "<div class='popup-title'>Tu ubicación</div>"
      );


    /* ========================================================
       CENTROS MÉDICOS
    ======================================================== */

    lugares.forEach((lugar) => {

      const latitude =
        Number(lugar.lat);

      const longitude =
        Number(lugar.lon);


      if (
        Number.isNaN(latitude) ||
        Number.isNaN(longitude)
      ) {
        return;
      }


      const nombre =
        lugar.tags?.name ||
        lugar.display_name ||
        "Centro médico";


      const tipo =
        obtenerTipoCentroMapa(lugar);


      const distancia =
        formatearDistanciaMapa(
          Number(
            lugar.distanciaKm || 0
          )
        );


      const horario =
        lugar.tags?.opening_hours
          ? formatearHorarioMapa(
              lugar.tags.opening_hours
            )
          : "";


      const medicalIcon =
        L.divIcon({
          className: "",

          html:
            '<div class="medical-marker"></div>',

          iconSize: [24, 24],

          iconAnchor: [12, 12]
        });


      let popup =
        "<div class='popup-title'>" +
        nombre +
        "</div>";


      popup +=
        "<div class='popup-type'>" +
        tipo +
        "</div>";


      popup +=
        "<div class='popup-info'>" +
        distancia +
        "</div>";


      if (horario) {
        popup +=
          "<div class='popup-info'>🕒 " +
          horario +
          "</div>";
      }


      L.marker(
        [
          latitude,
          longitude
        ],
        {
          icon: medicalIcon
        }
      )
        .addTo(map)
        .bindPopup(popup);

    });


    /* ========================================================
       TIPO DE CENTRO PARA EL MAPA
    ======================================================== */

    function obtenerTipoCentroMapa(
      lugar
    ) {

      if (
        lugar.tags?.amenity === "hospital" ||
        lugar.tags?.healthcare === "hospital"
      ) {
        return "Hospital";
      }


      if (
        lugar.tags?.amenity === "clinic" ||
        lugar.tags?.healthcare === "clinic"
      ) {
        return "Clínica";
      }


      if (
        lugar.tags?.amenity === "doctors" ||
        lugar.tags?.healthcare === "doctor"
      ) {
        return "Consultorio médico";
      }


      if (
        lugar.tags?.amenity === "health_post" ||
        lugar.tags?.healthcare === "health_post"
      ) {
        return "Puesto de salud";
      }


      if (
        lugar.tags?.healthcare === "centre"
      ) {
        return "Centro de salud";
      }


      return "Centro médico";
    }


    /* ========================================================
       DISTANCIA PARA EL POPUP
    ======================================================== */

    function formatearDistanciaMapa(
      distancia
    ) {

      if (distancia < 1) {
        return Math.round(
          distancia * 1000
        ) + " m de distancia";
      }


      return distancia.toFixed(1) +
        " km de distancia";
    }


    /* ========================================================
       HORARIO PARA EL POPUP
    ======================================================== */

    function formatearHorarioMapa(
      horario
    ) {

      if (!horario) {
        return "";
      }


      if (
        horario.trim() === "24/7"
      ) {
        return "Abierto las 24 horas";
      }


      return horario
        .replace(
          /\\bMo-Fr\\b/g,
          "Lunes a viernes"
        )
        .replace(
          /\\bMo-Sa\\b/g,
          "Lunes a sábado"
        )
        .replace(
          /\\bMo-Su\\b/g,
          "Lunes a domingo"
        )
        .replace(
          /\\bSa-Su\\b/g,
          "Sábado y domingo"
        )
        .replace(
          /\\bMo\\b/g,
          "Lun"
        )
        .replace(
          /\\bTu\\b/g,
          "Mar"
        )
        .replace(
          /\\bWe\\b/g,
          "Mié"
        )
        .replace(
          /\\bTh\\b/g,
          "Jue"
        )
        .replace(
          /\\bFr\\b/g,
          "Vie"
        )
        .replace(
          /\\bSa\\b/g,
          "Sáb"
        )
        .replace(
          /\\bSu\\b/g,
          "Dom"
        );
    }


    /* ========================================================
       AJUSTAR MAPA

       Leaflet recalcula su tamaño después de cargarse el
       WebView para evitar zonas vacías.
    ======================================================== */

    setTimeout(() => {
      map.invalidateSize();
    }, 300);

  </script>

</body>

</html>
`;
}


/* ============================================================
   FUNCIONES DE PRESENTACIÓN
============================================================ */

function obtenerTipoCentro(
  lugar: any
): string {

  if (
    lugar.tags?.amenity === "hospital" ||
    lugar.tags?.healthcare === "hospital"
  ) {
    return "Hospital";
  }


  if (
    lugar.tags?.amenity === "clinic" ||
    lugar.tags?.healthcare === "clinic"
  ) {
    return "Clínica";
  }


  if (
    lugar.tags?.amenity === "doctors" ||
    lugar.tags?.healthcare === "doctor"
  ) {
    return "Consultorio médico";
  }


  if (
    lugar.tags?.amenity === "health_post" ||
    lugar.tags?.healthcare === "health_post"
  ) {
    return "Puesto de salud";
  }


  if (
    lugar.tags?.healthcare === "centre"
  ) {
    return "Centro de salud";
  }


  return "Centro médico";
}


/* ============================================================
   ICONO SEGÚN TIPO
============================================================ */

function obtenerIconoCentro(
  lugar: any
): keyof typeof Ionicons.glyphMap {

  const tipo =
    obtenerTipoCentro(lugar);


  switch (tipo) {

    case "Hospital":
      return "medkit";

    case "Clínica":
      return "medical";

    case "Consultorio médico":
      return "person";

    case "Puesto de salud":
      return "medkit-outline";

    case "Centro de salud":
      return "medical-outline";

    default:
      return "medical-outline";
  }
}


/* ============================================================
   DISTANCIA COMPLETA
============================================================ */

function formatearDistancia(
  distancia: number
): string {

  if (
    typeof distancia !== "number" ||
    Number.isNaN(distancia)
  ) {
    return "Distancia no disponible";
  }


  if (distancia < 1) {
    return `${Math.round(
      distancia * 1000
    )} metros de distancia`;
  }


  return `${distancia.toFixed(
    1
  )} km de distancia`;
}


/* ============================================================
   DISTANCIA COMPACTA

   Se utiliza en la cabecera de las tarjetas para ocupar
   menos espacio.
============================================================ */

function formatearDistanciaCorta(
  distancia: number
): string {

  if (
    typeof distancia !== "number" ||
    Number.isNaN(distancia)
  ) {
    return "--";
  }


  if (distancia < 1) {
    return `${Math.round(
      distancia * 1000
    )} m`;
  }


  return `${distancia.toFixed(
    1
  )} km`;
}


/* ============================================================
   DIRECCIÓN
============================================================ */

function obtenerDireccion(
  lugar: any
): string {

  const calle =
    lugar.tags?.street || "";

  const numero =
    lugar.tags?.houseNumber || "";

  const ciudad =
    lugar.tags?.city || "";


  return [
    calle,
    numero,
    ciudad,
  ]
    .filter(Boolean)
    .join(" ");
}


/* ============================================================
   ESPECIALIDAD
============================================================ */

function formatearEspecialidad(
  especialidad: string
): string {

  return especialidad
    .split(";")
    .map((item) =>
      item
        .replace(
          /_/g,
          " "
        )
        .trim()
    )
    .filter(Boolean)
    .join(", ");
}


/* ============================================================
   HORARIO
============================================================ */

function formatearHorario(
  horario: string
): string {

  if (!horario) {
    return "";
  }


  if (
    horario.trim() === "24/7"
  ) {
    return "Abierto las 24 horas";
  }


  return horario
    .replace(
      /\bMo-Fr\b/g,
      "Lunes a viernes"
    )
    .replace(
      /\bMo-Sa\b/g,
      "Lunes a sábado"
    )
    .replace(
      /\bMo-Su\b/g,
      "Lunes a domingo"
    )
    .replace(
      /\bSa-Su\b/g,
      "Sábado y domingo"
    )
    .replace(
      /\bMo\b/g,
      "Lun"
    )
    .replace(
      /\bTu\b/g,
      "Mar"
    )
    .replace(
      /\bWe\b/g,
      "Mié"
    )
    .replace(
      /\bTh\b/g,
      "Jue"
    )
    .replace(
      /\bFr\b/g,
      "Vie"
    )
    .replace(
      /\bSa\b/g,
      "Sáb"
    )
    .replace(
      /\bSu\b/g,
      "Dom"
    )
    .replace(
      /;/g,
      " · "
    )
    .replace(
      /\s*-\s*/g,
      " – "
    );
}


/* ============================================================
   ESTILOS
============================================================ */

const styles = StyleSheet.create({

  /* ==========================================================
     CONTENEDOR
  ========================================================== */

  container: {
    flex: 1,
  },

  scroll: {
    paddingBottom: 40,
  },

  content: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 16,
  },


  /* ==========================================================
     CARGA
  ========================================================== */

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  loadingIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 17,
  },

  loadingText: {
    marginTop: 11,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  loadingSubtitle: {
    maxWidth: 340,
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },


  /* ==========================================================
     ENCABEZADO
  ========================================================== */

  headerContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  headerTextContainer: {
    flex: 1,
    paddingRight: 10,
  },

  eyebrow: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  header: {
    fontSize: 25,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
  },

  headerBadge: {
    minHeight: 34,
    paddingHorizontal: 9,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  headerBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },


  /* ==========================================================
     MAPA
  ========================================================== */

  mapCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 10,
    marginBottom: 15,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
    paddingHorizontal: 3,
  },

  mapTitle: {
    fontSize: 14,
    fontWeight: "800",
  },

  mapSubtitle: {
    marginTop: 2,
    fontSize: 10,
  },

  mapStatus: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  mapStatusText: {
    fontSize: 9,
    fontWeight: "800",
  },

  mapContainer: {
    height: 300,
    width: "100%",
    borderRadius: 13,
    overflow: "hidden",
  },

  mapLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  mapLoadingText: {
    marginTop: 9,
    fontSize: 13,
    fontWeight: "600",
  },


  /* ==========================================================
     BÚSQUEDA
  ========================================================== */

  searchingCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  searchingIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },

  searchingContent: {
    flex: 1,
  },

  searchingTitle: {
    fontSize: 12,
    fontWeight: "800",
  },

  searchingText: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 15,
  },


  /* ==========================================================
     RESULTADOS
  ========================================================== */

  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },

  resultsHeaderText: {
    flex: 1,
    paddingRight: 10,
  },

  resultsTitle: {
    fontSize: 19,
    fontWeight: "800",
  },

  resultsSubtitle: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 16,
  },

  resultsCount: {
    minWidth: 61,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  resultsCountNumber: {
    fontSize: 16,
    fontWeight: "800",
  },

  resultsCountLabel: {
    marginTop: 1,
    fontSize: 7,
    fontWeight: "700",
  },

  resultsList: {
    width: "100%",
  },


  /* ==========================================================
     TARJETA
  ========================================================== */

  card: {
    padding: 13,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 1,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  cardIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },

  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  cardType: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.7,
    marginBottom: 2,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 19,
  },

  distanceBadge: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: 6,
  },

  distanceText: {
    fontSize: 8,
    fontWeight: "800",
  },


  /* ==========================================================
     INFORMACIÓN COMPACTA
  ========================================================== */

  infoContainer: {
    width: "100%",
  },

  infoRowCompact: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  infoCompactText: {
    flex: 1,
    marginLeft: 7,
    fontSize: 11,
    lineHeight: 17,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 7,
  },

  infoIcon: {
    width: 25,
    height: 25,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 7,
  },

  infoContent: {
    flex: 1,
    minWidth: 0,
  },

  infoLabel: {
    fontSize: 8,
    fontWeight: "700",
    marginBottom: 1,
  },

  infoValue: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "600",
  },


  /* ==========================================================
     PIE
  ========================================================== */

  cardFooter: {
    marginTop: 9,
    paddingTop: 8,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  footerText: {
    flex: 1,
    marginLeft: 4,
    fontSize: 8,
    lineHeight: 12,
  },


  /* ==========================================================
     SIN RESULTADOS
  ========================================================== */

  emptyCard: {
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 20,
    paddingVertical: 27,
    alignItems: "center",
  },

  emptyIcon: {
    width: 57,
    height: 57,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 11,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 5,
    maxWidth: 330,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
});