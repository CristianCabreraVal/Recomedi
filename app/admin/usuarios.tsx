import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useRouter } from "expo-router";

import {
  actualizarEstadoUsuario,
  actualizarRolUsuario,
  obtenerUsuarios,
  RolUsuario,
  UsuarioAdmin,
} from "../../services/adminService";

type FiltroRol = "todos" | "usuario" | "moderador" | "admin";
type FiltroEstado = "todos" | "activos" | "inactivos";

export default function UsuariosAdmin() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<FiltroRol>("todos");
  const [filtroEstado, setFiltroEstado] =
    useState<FiltroEstado>("todos");

  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState<UsuarioAdmin | null>(null);

  const [modalRol, setModalRol] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargarUsuarios = useCallback(async () => {
    try {
      const resultado = await obtenerUsuarios();
      setUsuarios(resultado);
    } catch (error) {
      console.error("Error cargando usuarios:", error);

      Alert.alert(
        "Error",
        "No fue posible cargar los usuarios."
      );
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const actualizar = async () => {
    setRefrescando(true);
    await cargarUsuarios();
  };

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const nombreCompleto =
        `${usuario.nombre} ${usuario.apellido}`.toLowerCase();

      const coincideBusqueda =
        !texto ||
        nombreCompleto.includes(texto) ||
        usuario.email.toLowerCase().includes(texto) ||
        usuario.uid.toLowerCase().includes(texto) ||
        usuario.telefono.toLowerCase().includes(texto);

      const coincideRol =
        filtroRol === "todos" ||
        usuario.rol === filtroRol;

      const coincideEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "activos" && usuario.activo) ||
        (filtroEstado === "inactivos" && !usuario.activo);

      return (
        coincideBusqueda &&
        coincideRol &&
        coincideEstado
      );
    });
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  const cambiarEstado = async (usuario: UsuarioAdmin) => {
    const nuevoEstado = !usuario.activo;

    Alert.alert(
      nuevoEstado ? "Activar usuario" : "Desactivar usuario",
      nuevoEstado
        ? `¿Quieres activar a ${usuario.nombre || "este usuario"}?`
        : `¿Quieres desactivar a ${usuario.nombre || "este usuario"}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: nuevoEstado ? "Activar" : "Desactivar",
          style: nuevoEstado ? "default" : "destructive",
          onPress: async () => {
            try {
              setGuardando(true);

              await actualizarEstadoUsuario(
                usuario.uid,
                nuevoEstado
              );

              setUsuarios((actuales) =>
                actuales.map((item) =>
                  item.uid === usuario.uid
                    ? {
                        ...item,
                        activo: nuevoEstado,
                      }
                    : item
                )
              );
            } catch (error) {
              console.error(
                "Error actualizando estado:",
                error
              );

              Alert.alert(
                "Error",
                "No fue posible actualizar el estado del usuario."
              );
            } finally {
              setGuardando(false);
            }
          },
        },
      ]
    );
  };

  const seleccionarRol = async (rol: RolUsuario) => {
    if (!usuarioSeleccionado) {
      return;
    }

    try {
      setGuardando(true);

      await actualizarRolUsuario(
        usuarioSeleccionado.uid,
        rol
      );

      setUsuarios((actuales) =>
        actuales.map((item) =>
          item.uid === usuarioSeleccionado.uid
            ? {
                ...item,
                rol,
              }
            : item
        )
      );

      setModalRol(false);
      setUsuarioSeleccionado(null);

      Alert.alert(
        "Rol actualizado",
        `El perfil ahora tiene el rol "${rol}".`
      );
    } catch (error) {
      console.error("Error actualizando rol:", error);

      Alert.alert(
        "Error",
        "No fue posible actualizar el rol."
      );
    } finally {
      setGuardando(false);
    }
  };

  const abrirSelectorRol = (usuario: UsuarioAdmin) => {
    setUsuarioSeleccionado(usuario);
    setModalRol(true);
  };

  const nombreUsuario = (usuario: UsuarioAdmin) => {
    const nombre = `${usuario.nombre} ${usuario.apellido}`.trim();

    return nombre || "Usuario sin nombre";
  };

  const inicialesUsuario = (usuario: UsuarioAdmin) => {
    const nombre = usuario.nombre?.trim();
    const apellido = usuario.apellido?.trim();

    const inicial1 = nombre
      ? nombre.charAt(0).toUpperCase()
      : "";

    const inicial2 = apellido
      ? apellido.charAt(0).toUpperCase()
      : "";

    return (
      inicial1 +
        inicial2 ||
      usuario.email?.charAt(0).toUpperCase() ||
      "U"
    );
  };

  const textoRol = (rol: RolUsuario) => {
    if (rol === "admin") {
      return "Administrador";
    }

    if (rol === "moderador") {
      return "Moderador";
    }

    return "Usuario";
  };

  const colorRol = (rol: RolUsuario) => {
    if (rol === "admin") {
      return "#7c3aed";
    }

    if (rol === "moderador") {
      return "#2563eb";
    }

    return "#64748b";
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Cargando usuarios...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <View style={styles.headerInfo}>
            <Text style={styles.title}>
              Usuarios
            </Text>

            <Text style={styles.subtitle}>
              Administración de usuarios de Recomedi
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={actualizar}
            />
          }
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.summaryCard}>
            <View>
              <Text style={styles.summaryTitle}>
                Usuarios registrados
              </Text>

              <Text style={styles.summaryNumber}>
                {usuarios.length}
              </Text>
            </View>

            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemNumber}>
                  {usuarios.filter((u) => u.activo).length}
                </Text>

                <Text style={styles.summaryItemLabel}>
                  Activos
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemNumber}>
                  {usuarios.filter((u) => !u.activo).length}
                </Text>

                <Text style={styles.summaryItemLabel}>
                  Inactivos
                </Text>
              </View>
            </View>
          </View>

          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por nombre, correo, teléfono o UID..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.sectionTitle}>
            Filtrar por rol
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {(
              [
                ["todos", "Todos"],
                ["usuario", "Usuarios"],
                ["moderador", "Moderadores"],
                ["admin", "Administradores"],
              ] as [FiltroRol, string][]
            ).map(([valor, texto]) => (
              <Pressable
                key={valor}
                style={[
                  styles.filterButton,
                  filtroRol === valor &&
                    styles.filterButtonActive,
                ]}
                onPress={() => setFiltroRol(valor)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filtroRol === valor &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {texto}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>
            Filtrar por estado
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {(
              [
                ["todos", "Todos"],
                ["activos", "Activos"],
                ["inactivos", "Inactivos"],
              ] as [FiltroEstado, string][]
            ).map(([valor, texto]) => (
              <Pressable
                key={valor}
                style={[
                  styles.filterButton,
                  filtroEstado === valor &&
                    styles.filterButtonActive,
                ]}
                onPress={() => setFiltroEstado(valor)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filtroEstado === valor &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {texto}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              Resultados
            </Text>

            <Text style={styles.resultsCount}>
              {usuariosFiltrados.length}
            </Text>
          </View>

          {usuariosFiltrados.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>
                🔎
              </Text>

              <Text style={styles.emptyTitle}>
                No se encontraron usuarios
              </Text>

              <Text style={styles.emptyText}>
                Prueba con otro término de búsqueda o cambia
                los filtros.
              </Text>
            </View>
          ) : (
            usuariosFiltrados.map((usuario) => (
              <View
                key={usuario.uid}
                style={styles.userCard}
              >
                <View style={styles.userTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {inicialesUsuario(usuario)}
                    </Text>
                  </View>

                  <View style={styles.userMain}>
                    <Text style={styles.userName}>
                      {nombreUsuario(usuario)}
                    </Text>

                    <Text style={styles.userEmail}>
                      {usuario.email || "Sin correo registrado"}
                    </Text>

                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.roleBadge,
                          {
                            backgroundColor:
                              `${colorRol(usuario.rol)}18`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.roleBadgeText,
                            {
                              color: colorRol(
                                usuario.rol
                              ),
                            },
                          ]}
                        >
                          {textoRol(usuario.rol)}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              usuario.activo
                                ? "#dcfce7"
                                : "#fee2e2",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color: usuario.activo
                                ? "#166534"
                                : "#991b1b",
                            },
                          ]}
                        >
                          {usuario.activo
                            ? "Activo"
                            : "Inactivo"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.detailsBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      UID
                    </Text>

                    <Text
                      style={styles.detailValue}
                      numberOfLines={1}
                    >
                      {usuario.uid}
                    </Text>
                  </View>

                  {usuario.telefono ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>
                        Teléfono
                      </Text>

                      <Text style={styles.detailValue}>
                        {usuario.telefono}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      Correo verificado
                    </Text>

                    <Text style={styles.detailValue}>
                      {usuario.emailVerificado
                        ? "Sí"
                        : "No"}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() =>
                      abrirSelectorRol(usuario)
                    }
                    disabled={guardando}
                  >
                    <Text style={styles.secondaryButtonText}>
                      Cambiar rol
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.statusButton,
                      usuario.activo
                        ? styles.deactivateButton
                        : styles.activateButton,
                    ]}
                    onPress={() =>
                      cambiarEstado(usuario)
                    }
                    disabled={guardando}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        usuario.activo
                          ? styles.deactivateText
                          : styles.activateText,
                      ]}
                    >
                      {usuario.activo
                        ? "Desactivar"
                        : "Activar"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <Modal
          visible={modalRol}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setModalRol(false);
            setUsuarioSeleccionado(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                Cambiar rol
              </Text>

              <Text style={styles.modalSubtitle}>
                {usuarioSeleccionado
                  ? nombreUsuario(usuarioSeleccionado)
                  : ""}
              </Text>

              {(
                [
                  ["usuario", "Usuario"],
                  ["moderador", "Moderador"],
                  ["admin", "Administrador"],
                ] as [RolUsuario, string][]
              ).map(([rol, texto]) => (
                <Pressable
                  key={rol}
                  style={[
                    styles.roleOption,
                    usuarioSeleccionado?.rol === rol &&
                      styles.roleOptionActive,
                  ]}
                  onPress={() => seleccionarRol(rol)}
                  disabled={guardando}
                >
                  <View>
                    <Text style={styles.roleOptionTitle}>
                      {texto}
                    </Text>

                    <Text style={styles.roleOptionDescription}>
                      {rol === "admin"
                        ? "Acceso administrativo"
                        : rol === "moderador"
                        ? "Gestión de contenido"
                        : "Acceso normal"}
                    </Text>
                  </View>

                  {usuarioSeleccionado?.rol === rol ? (
                    <Text style={styles.checkText}>
                      ✓
                    </Text>
                  ) : null}
                </Pressable>
              ))}

              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setModalRol(false);
                  setUsuarioSeleccionado(null);
                }}
              >
                <Text style={styles.cancelButtonText}>
                  Cancelar
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef2ff",
  },

  backButtonText: {
    fontSize: 32,
    lineHeight: 34,
    color: "#3730a3",
  },

  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 3,
    fontSize: 13,
    opacity: 0.65,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },

  summaryCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#eef2ff",
    marginBottom: 16,
  },

  summaryTitle: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.7,
  },

  summaryNumber: {
    marginTop: 4,
    fontSize: 34,
    fontWeight: "800",
  },

  summaryStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
  },

  summaryItemNumber: {
    fontSize: 19,
    fontWeight: "800",
  },

  summaryItemLabel: {
    marginTop: 3,
    fontSize: 12,
    opacity: 0.65,
  },

  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#c7d2fe",
  },

  searchInput: {
    minHeight: 50,
    borderRadius: 15,
    paddingHorizontal: 16,
    fontSize: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  sectionTitle: {
    marginTop: 18,
    marginBottom: 9,
    fontSize: 14,
    fontWeight: "700",
  },

  filterRow: {
    gap: 8,
  },

  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  filterButtonActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },

  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },

  filterButtonTextActive: {
    color: "#ffffff",
  },

  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 11,
  },

  resultsTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  resultsCount: {
    minWidth: 32,
    paddingHorizontal: 9,
    paddingVertical: 5,
    textAlign: "center",
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    fontSize: 12,
    fontWeight: "800",
  },

  userCard: {
    marginBottom: 14,
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  userTop: {
    flexDirection: "row",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e0e7ff",
  },

  avatarText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#4338ca",
  },

  userMain: {
    flex: 1,
    marginLeft: 12,
  },

  userName: {
    fontSize: 16,
    fontWeight: "800",
  },

  userEmail: {
    marginTop: 3,
    fontSize: 13,
    opacity: 0.65,
  },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 9,
  },

  roleBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },

  roleBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },

  detailsBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 3,
    gap: 10,
  },

  detailLabel: {
    fontSize: 11,
    fontWeight: "700",
    opacity: 0.55,
  },

  detailValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 11,
    fontWeight: "600",
  },

  actionsRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 14,
  },

  secondaryButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
  },

  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },

  statusButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },

  deactivateButton: {
    backgroundColor: "#fff7ed",
  },

  activateButton: {
    backgroundColor: "#ecfdf5",
  },

  statusButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },

  deactivateText: {
    color: "#c2410c",
  },

  activateText: {
    color: "#047857",
  },

  emptyCard: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  emptyIcon: {
    fontSize: 30,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "800",
  },

  emptyText: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 13,
    opacity: 0.65,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 22,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
  },

  modalCard: {
    width: "100%",
    maxWidth: 460,
    padding: 20,
    borderRadius: 22,
    backgroundColor: "#ffffff",
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: "800",
  },

  modalSubtitle: {
    marginTop: 4,
    marginBottom: 15,
    fontSize: 13,
    opacity: 0.6,
  },

  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  roleOptionActive: {
    borderColor: "#6366f1",
    backgroundColor: "#eef2ff",
  },

  roleOptionTitle: {
    fontSize: 14,
    fontWeight: "800",
  },

  roleOptionDescription: {
    marginTop: 3,
    fontSize: 12,
    opacity: 0.6,
  },

  checkText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#4f46e5",
  },

  cancelButton: {
    minHeight: 45,
    marginTop: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#e2e8f0",
  },

  cancelButtonText: {
    fontSize: 13,
    fontWeight: "800",
  },
});