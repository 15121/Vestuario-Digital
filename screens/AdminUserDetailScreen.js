import React, {
  useCallback,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useFocusEffect } from '@react-navigation/native';

import {
  getUserById,
  updateUserStatus,
  deleteUser,
} from '../services/database';


// =========================================
// HELPERS MULTIPLATAFORMA
// Alert.alert con botones NO funciona en web
// (react-native-web)
// =========================================

const showMessage = (title, message, onOk) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    if (onOk) onOk();
    return;
  }

  Alert.alert(
    title,
    message,
    onOk ? [{ text: 'Aceptar', onPress: onOk }] : undefined
  );
};

const confirmAction = ({
  title,
  message,
  confirmText,
  destructive = false,
  onConfirm,
}) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: confirmText,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
};

const getErrorMessage = (code) => {
  switch (code) {
    case 'ROOT_PROTECTED':
      return 'La cuenta Root está protegida y no puede modificarse ni eliminarse.';
    case 'USER_NOT_FOUND':
      return 'No se encontró el usuario.';
    case 'INVALID_STATUS':
      return 'El estado indicado no es válido.';
    default:
      return 'No se pudo completar la acción. Intentá nuevamente.';
  }
};


export default function AdminUserDetailScreen({
  navigation,
  route,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const userId = route?.params?.userId;
  const initialUser = route?.params?.user;

  const [user, setUser] = useState(initialUser || null);

  // Si ya recibimos el usuario por parámetros no mostramos
  // pantalla de carga (evita el parpadeo).
  const [loading, setLoading] = useState(!initialUser);

  const [busy, setBusy] = useState(false);

  // =========================================
  // CARGAR USUARIO
  // Se ejecuta cada vez que la pantalla toma foco,
  // así se actualiza al volver de "Editar datos".
  // =========================================

  const loadUser = useCallback(async () => {
    try {
      const targetId = userId ?? initialUser?.id;

      if (!targetId) {
        return;
      }

      const result = await getUserById(targetId);

      // null = el usuario ya no existe
      setUser(result || null);
    } catch (error) {
      console.log('Error al cargar usuario:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, initialUser?.id]);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  // =========================================
  // CAMBIAR ESTADO (SUSPENDER / REACTIVAR)
  // =========================================

  const handleToggleStatus = () => {
    if (!user || busy) return;

    // La cuenta Root no debe poder suspenderse
    if (user.role === 'root') {
      showMessage(
        'Cuenta Root',
        'La cuenta Root no puede suspenderse desde la gestión de usuarios.'
      );
      return;
    }

    const isSuspended = user.status === 'suspended';

    const newStatus = isSuspended
      ? 'active'
      : 'suspended';

    confirmAction({
      title: isSuspended
        ? 'Reactivar usuario'
        : 'Suspender usuario',
      message: isSuspended
        ? '¿Querés reactivar esta cuenta?'
        : '¿Querés suspender esta cuenta? El usuario no podrá iniciar sesión.',
      confirmText: isSuspended
        ? 'Reactivar'
        : 'Suspender',
      destructive: !isSuspended,
      onConfirm: async () => {
        try {
          setBusy(true);

          const updated = await updateUserStatus(
            user.id,
            newStatus
          );

          setUser(
            updated || {
              ...user,
              status: newStatus,
            }
          );
        } catch (error) {
          console.log(
            'Error al cambiar estado:',
            error
          );

          showMessage(
            'Error',
            getErrorMessage(error?.message)
          );
        } finally {
          setBusy(false);
        }
      },
    });
  };

  // =========================================
  // EDITAR USUARIO
  // =========================================

  const handleEdit = () => {
  if (!user) return;

  if (user.role === 'root') {
    showMessage(
      'Cuenta Root',
      'La cuenta Root no puede modificarse.'
    );
    return;
  }

  navigation.navigate('AdminEditUser', {
    userId: user.id,
    user,
  });
};

  // =========================================
  // ELIMINAR USUARIO
  // =========================================

  const handleDelete = () => {
    if (!user || busy) return;

    if (user.role === 'root') {
      showMessage(
        'Cuenta Root',
        'La cuenta Root no puede eliminarse.'
      );
      return;
    }

    const fullName =
      `${user.name || ''} ${user.lastname || ''}`.trim() ||
      user.email ||
      'este usuario';

    confirmAction({
      title: 'Eliminar cuenta',
      message: `¿Querés eliminar permanentemente la cuenta de ${fullName}? Se borrarán también sus prendas, outfits, historial y maletas. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      destructive: true,
      onConfirm: async () => {
        try {
          setBusy(true);

          await deleteUser(user.id);

          showMessage(
            'Cuenta eliminada',
            'El usuario fue eliminado correctamente.',
            () => navigation.goBack()
          );
        } catch (error) {
          console.log(
            'Error al eliminar usuario:',
            error
          );

          showMessage(
            'No se pudo eliminar',
            getErrorMessage(error?.message)
          );
        } finally {
          setBusy(false);
        }
      },
    });
  };

  // =========================================
  // VOLVER
  // =========================================

  const handleBack = () => {
    navigation.goBack();
  };

  // =========================================
  // CARGANDO
  // =========================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#764DC6"
        />

        <Text style={styles.loadingText}>
          Cargando usuario...
        </Text>
      </View>
    );
  }

  // =========================================
  // USUARIO NO ENCONTRADO
  // =========================================

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="person-outline"
          size={50}
          color="#B87EEE"
        />

        <Text style={styles.emptyTitle}>
          Usuario no encontrado
        </Text>

        <TouchableOpacity
          style={styles.backButtonEmpty}
          onPress={handleBack}
        >
          <Text style={styles.backButtonEmptyText}>
            Volver
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isRoot = user.role === 'root';
  const isSuspended = user.status === 'suspended';

  return (
    <View style={styles.container}>

      {/* =========================================
          HEADER
      ========================================= */}

      <View
        style={[
          styles.header,
          isDesktop && styles.desktopHeader,
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color="#4A3B53"
          />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            Gestión de Usuario
          </Text>

          <Text style={styles.headerSubtitle}>
            Información y acciones administrativas
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* =========================================
            PERFIL
        ========================================= */}

        <View style={styles.profileCard}>

          <View style={styles.largeAvatar}>
            <Ionicons
              name={
                isRoot
                  ? 'shield-checkmark-outline'
                  : 'person-outline'
              }
              size={34}
              color="#764DC6"
            />
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName}>
                {user.name || 'Sin nombre'}{' '}
                {user.lastname || ''}
              </Text>

              {isRoot && (
                <View style={styles.rootBadge}>
                  <Text style={styles.rootBadgeText}>
                    Root
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.profileEmail}>
              {user.email || 'Sin correo'}
            </Text>

            <View style={styles.profileStatusRow}>
              <View
                style={[
                  styles.statusDot,
                  isSuspended
                    ? styles.suspendedDot
                    : styles.activeDot,
                ]}
              />

              <Text
                style={[
                  styles.profileStatus,
                  isSuspended
                    ? styles.suspendedText
                    : styles.activeText,
                ]}
              >
                {isSuspended
                  ? 'Cuenta suspendida'
                  : 'Cuenta activa'}
              </Text>
            </View>
          </View>

        </View>

        {/* =========================================
            INFORMACIÓN DEL USUARIO
        ========================================= */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Información del usuario
          </Text>

          <View style={styles.infoCard}>

            <InfoRow
              icon="person-outline"
              label="Nombre"
              value={
                `${user.name || ''} ${
                  user.lastname || ''
                }`.trim() || 'Sin información'
              }
            />

            <InfoRow
              icon="mail-outline"
              label="Correo electrónico"
              value={
                user.email || 'Sin información'
              }
            />

            <InfoRow
              icon="shield-outline"
              label="Rol"
              value={
                isRoot
                  ? 'Root'
                  : 'Usuario'
              }
            />

            <InfoRow
              icon="ellipse-outline"
              label="Estado"
              value={
                isSuspended
                  ? 'Suspendido'
                  : 'Activo'
              }
            />

            <InfoRow
              icon="calendar-outline"
              label="Fecha de registro"
              value={
                user.createdAt
                  ? formatDate(user.createdAt)
                  : 'Sin información'
              }
            />

            <InfoRow
              icon="time-outline"
              label="Último acceso"
              value={
                user.lastAccess
                  ? formatDate(user.lastAccess)
                  : 'Sin registros'
              }
              last
            />

          </View>
        </View>

        {/* =========================================
            ACCIONES
        ========================================= */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Acciones
          </Text>

          <View style={styles.actionsCard}>

            {/* SUSPENDER / REACTIVAR */}

            <TouchableOpacity
              style={[
                styles.actionButton,
                isRoot && styles.disabledActionButton,
              ]}
              onPress={handleToggleStatus}
              disabled={isRoot || busy}
            >
              <View
                style={[
                  styles.actionIcon,
                  isRoot
                    ? styles.disabledActionIcon
                    : isSuspended
                    ? styles.reactivateIcon
                    : styles.suspendIcon,
                ]}
              >
                <Ionicons
                  name={
                    isSuspended
                      ? 'checkmark-circle-outline'
                      : 'pause-circle-outline'
                  }
                  size={21}
                  color={
                    isRoot
                      ? '#A9A0AE'
                      : '#FFFFFF'
                  }
                />
              </View>

              <View style={styles.actionInfo}>
                <Text
                  style={[
                    styles.actionTitle,
                    isRoot &&
                      styles.disabledActionText,
                  ]}
                >
                  {isSuspended
                    ? 'Reactivar usuario'
                    : 'Suspender usuario'}
                </Text>

                <Text style={styles.actionDescription}>
                  {isRoot
                    ? 'La cuenta Root no puede suspenderse'
                    : isSuspended
                    ? 'Permitir nuevamente el acceso'
                    : 'Impedir temporalmente el acceso'}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={19}
                color="#A59AAE"
              />
            </TouchableOpacity>

            {/* EDITAR */}

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEdit}
              disabled={busy}
            >
              <View
                style={[
                  styles.actionIcon,
                  styles.editIcon,
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={21}
                  color="#FFFFFF"
                />
              </View>

              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>
                  Editar datos
                </Text>

                <Text style={styles.actionDescription}>
                  Modificar información del usuario
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={19}
                color="#A59AAE"
              />
            </TouchableOpacity>

            {/* ELIMINAR */}

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.lastActionButton,
                isRoot && styles.disabledActionButton,
              ]}
              onPress={handleDelete}
              disabled={isRoot || busy}
            >
              <View
                style={[
                  styles.actionIcon,
                  isRoot
                    ? styles.disabledActionIcon
                    : styles.deleteIcon,
                ]}
              >
                <Ionicons
                  name="trash-outline"
                  size={21}
                  color={
                    isRoot
                      ? '#A9A0AE'
                      : '#FFFFFF'
                  }
                />
              </View>

              <View style={styles.actionInfo}>
                <Text
                  style={[
                    styles.actionTitle,
                    isRoot &&
                      styles.disabledActionText,
                  ]}
                >
                  Eliminar cuenta
                </Text>

                <Text style={styles.actionDescription}>
                  {isRoot
                    ? 'La cuenta Root no puede eliminarse'
                    : 'Eliminar permanentemente al usuario'}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={19}
                color="#A59AAE"
              />
            </TouchableOpacity>

          </View>
        </View>

      </ScrollView>
    </View>
  );
}

// =========================================
// COMPONENTE FILA DE INFORMACIÓN
// =========================================

function InfoRow({
  icon,
  label,
  value,
  last = false,
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !last && styles.infoRowBorder,
      ]}
    >
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={19}
          color="#764DC6"
        />
      </View>

      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text style={styles.infoValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// =========================================
// FORMATEAR FECHA
// =========================================

function formatDate(date) {
  try {
    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return 'Sin información';
    }

    return parsed.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    return 'Sin información';
  }
}

// =========================================
// ESTILOS
// =========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8E9FE',
  },

  // HEADER

  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E1EC',
  },

  desktopHeader: {
    paddingHorizontal: '8%',
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  headerTitleContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#4A3B53',
  },

  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#7D6A88',
    marginTop: 1,
  },

  // SCROLL

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  desktopScrollContent: {
    paddingHorizontal: '8%',
  },

  // PERFIL

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E8E1EC',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  largeAvatar: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#F8E9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  profileInfo: {
    flex: 1,
  },

  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  profileName: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#4A3B53',
  },

  profileEmail: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#7D6A88',
  },

  profileStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },

  profileStatus: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },

  activeDot: {
    backgroundColor: '#54A978',
  },

  suspendedDot: {
    backgroundColor: '#C58A31',
  },

  activeText: {
    color: '#378357',
  },

  suspendedText: {
    color: '#A97800',
  },

  rootBadge: {
    marginLeft: 8,
    backgroundColor: '#F0E5FA',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  rootBadgeText: {
    fontSize: 9,
    fontFamily: 'Poppins_600SemiBold',
    color: '#764DC6',
  },

  // SECCIONES

  section: {
    marginBottom: 22,
  },

  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    color: '#4A3B53',
    marginBottom: 10,
  },

  // INFORMACIÓN

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E1EC',
    paddingHorizontal: 15,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },

  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBF2',
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#F8E9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  infoTextContainer: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#9A8FA3',
  },

  infoValue: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4A3B53',
    marginTop: 1,
  },

  // ACCIONES

  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E1EC',
    paddingHorizontal: 15,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBF2',
  },

  lastActionButton: {
    borderBottomWidth: 0,
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  suspendIcon: {
    backgroundColor: '#B87EEE',
  },

  reactivateIcon: {
    backgroundColor: '#54A978',
  },

  editIcon: {
    backgroundColor: '#764DC6',
  },

  deleteIcon: {
    backgroundColor: '#C85D70',
  },

  disabledActionButton: {
    opacity: 0.65,
  },

  disabledActionIcon: {
    backgroundColor: '#D8D2DA',
  },

  actionInfo: {
    flex: 1,
  },

  actionTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4A3B53',
  },

  actionDescription: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#8A7A94',
    marginTop: 2,
  },

  disabledActionText: {
    color: '#8A7A94',
  },

  // LOADING

  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8E9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7D6A88',
  },

  // ERROR / VACÍO

  emptyContainer: {
    flex: 1,
    backgroundColor: '#F8E9FE',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4A3B53',
  },

  backButtonEmpty: {
    marginTop: 18,
    backgroundColor: '#764DC6',
    borderRadius: 10,
    paddingHorizontal: 25,
    paddingVertical: 10,
  },

  backButtonEmptyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
});