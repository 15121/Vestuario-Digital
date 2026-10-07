import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useFocusEffect } from '@react-navigation/native';

import {
  getAdminRequests,
  updateAdminRequestStatus,
} from '../services/database';


// =========================================================
// HELPERS MULTIPLATAFORMA
// Alert.alert con botones NO funciona en web (react-native-web)
// =========================================================

const showMessage = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
};

const confirmAction = (title, message, confirmText, onConfirm) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: confirmText, onPress: onConfirm },
  ]);
};


// =========================================================
// ÍCONOS SEGÚN EL TIPO DE REGISTRO
// (los "type" son los que guarda database.js)
// =========================================================

const TYPE_ICONS = {
  'Registro de usuario': 'person-add-outline',
  'Edición de datos': 'create-outline',
  'Restablecer contraseña': 'key-outline',
  'Eliminación de cuenta': 'trash-outline',
  'Cambio de email': 'mail-outline',
  'Cuenta suspendida': 'ban-outline',
  'Cuenta reactivada': 'checkmark-circle-outline',
};

const getIconForType = (type) =>
  TYPE_ICONS[type] || 'document-text-outline';


// =========================================================
// ESTADOS
// La base guarda 'pending' / 'resolved'.
// Se aceptan también 'pendiente' / 'resuelta' por si
// existen registros viejos.
// =========================================================

const isPendingStatus = (status) => {
  const value = String(status || '').toLowerCase();

  return (
    value === 'pending' ||
    value === 'pendiente'
  );
};


// =========================================================
// FORMATO DE FECHA
// =========================================================

const formatRequestDate = (isoDate) => {
  if (!isoDate) {
    return 'Sin fecha';
  }

  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();

  const diffDays = Math.round(
    (startOfToday - startOfDate) /
      (24 * 60 * 60 * 1000)
  );

  const time = date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (diffDays === 0) {
    return `Hoy, ${time}`;
  }

  if (diffDays === 1) {
    return `Ayer, ${time}`;
  }

  if (diffDays > 1 && diffDays < 7) {
    return `Hace ${diffDays} días`;
  }

  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};


// =========================================================
// PANTALLA
// =========================================================

export default function AdminRequestsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('Todas');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // -------------------------------------------------------
  // Cargar registros desde la base de datos
  // -------------------------------------------------------

  const loadRequests = useCallback(async () => {
    try {
      const result = await getAdminRequests();

      setRequests(
        Array.isArray(result) ? result : []
      );
    } catch (error) {
      console.log(
        'Error al cargar registros:',
        error
      );

      showMessage(
        'Error',
        'No se pudieron cargar los registros.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Recarga cada vez que se entra a la pantalla
  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await loadRequests();
    } finally {
      setRefreshing(false);
    }
  };

  // -------------------------------------------------------
  // Contadores
  // -------------------------------------------------------

  const pendingCount = useMemo(
    () =>
      requests.filter((item) =>
        isPendingStatus(item.status)
      ).length,
    [requests]
  );

  const resolvedCount =
    requests.length - pendingCount;

  // -------------------------------------------------------
  // Filtrado
  // -------------------------------------------------------

  const filteredRecords = useMemo(() => {
    if (activeTab === 'Pendientes') {
      return requests.filter((item) =>
        isPendingStatus(item.status)
      );
    }

    if (activeTab === 'Resueltas') {
      return requests.filter(
        (item) => !isPendingStatus(item.status)
      );
    }

    return requests;
  }, [requests, activeTab]);

  // -------------------------------------------------------
  // Marcar como resuelta
  // -------------------------------------------------------

  const handleResolve = (item) => {
    confirmAction(
      'Marcar como resuelta',
      `¿Querés marcar "${item.type}" como resuelta?`,
      'Resolver',
      async () => {
        try {
          setUpdatingId(item.id);

          await updateAdminRequestStatus(
            item.id,
            'resolved'
          );

          await loadRequests();
        } catch (error) {
          console.log(
            'Error al actualizar registro:',
            error
          );

          showMessage(
            'Error',
            'No se pudo actualizar el registro.'
          );
        } finally {
          setUpdatingId(null);
        }
      }
    );
  };

  // -------------------------------------------------------
  // Render de cada registro
  // -------------------------------------------------------

  const renderRecord = (item) => {
    const isPending = isPendingStatus(item.status);

    // Si el usuario fue eliminado, userName viene vacío
    // y se usa "details" (nombre + email guardados).
    const userLabel =
      item.userName ||
      item.userEmail ||
      'Usuario eliminado';

    const description =
      item.details ||
      'Sin detalles adicionales';

    return (
      <View
        key={String(item.id)}
        style={[
          styles.recordCard,
          isDesktop && styles.desktopRecordCard,
        ]}
      >
        {/* ICONO */}

        <View style={styles.recordIconContainer}>
          <Ionicons
            name={getIconForType(item.type)}
            size={22}
            color="#764DC6"
          />
        </View>

        {/* INFORMACIÓN */}

        <View style={styles.recordInfo}>
          <Text
            style={styles.recordTitle}
            numberOfLines={1}
          >
            {item.type || 'Registro'}
          </Text>

          <Text
            style={styles.recordDescription}
            numberOfLines={2}
          >
            {description}
          </Text>

          <View style={styles.recordMeta}>
            <Text
              style={styles.recordUser}
              numberOfLines={1}
            >
              {userLabel}
            </Text>

            <Text style={styles.recordSeparator}>
              •
            </Text>

            <Text style={styles.recordDate}>
              {formatRequestDate(item.date)}
            </Text>
          </View>
        </View>

        {/* ESTADO / ACCIÓN */}

        <View style={styles.recordRight}>
          <View
            style={[
              styles.statusBadge,
              isPending
                ? styles.pendingBadge
                : styles.resolvedBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isPending
                  ? styles.pendingText
                  : styles.resolvedText,
              ]}
            >
              {isPending ? 'Pendiente' : 'Resuelta'}
            </Text>
          </View>

          {isPending && (
            <TouchableOpacity
              style={styles.resolveButton}
              onPress={() => handleResolve(item)}
              disabled={updatingId === item.id}
              activeOpacity={0.8}
            >
              {updatingId === item.id ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Text style={styles.resolveButtonText}>
                  Resolver
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // -------------------------------------------------------
  // Pestañas
  // -------------------------------------------------------

  const tabs = [
    { key: 'Todas', label: 'Todas', count: requests.length },
    { key: 'Pendientes', label: 'Pendientes', count: pendingCount },
    { key: 'Resueltas', label: 'Resueltas', count: resolvedCount },
  ];

  const emptyText =
    activeTab === 'Pendientes'
      ? 'No hay registros pendientes.'
      : activeTab === 'Resueltas'
      ? 'No hay registros resueltos.'
      : 'Todavía no hay actividad registrada.';

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
        <View style={styles.headerContent}>

          <View>
            <Text style={styles.headerTitle}>
              Solicitudes
            </Text>

            <Text style={styles.headerSubtitle}>
              Registros de actividad
            </Text>
          </View>

          <View style={styles.rootIndicator}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#764DC6"
            />

            <Text style={styles.rootIndicatorText}>
              Root
            </Text>
          </View>

        </View>
      </View>

      {/* =========================================
          CONTENIDO
      ========================================= */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#B87EEE"
          />
        }
      >

        {/* TÍTULO */}

        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            Registros
          </Text>

          <Text style={styles.subtitle}>
            Consultá las solicitudes y actividades realizadas.
          </Text>
        </View>

        {/* PESTAÑAS */}

        <View
          style={[
            styles.tabsContainer,
            isDesktop && styles.desktopTabsContainer,
          ]}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  isActive && styles.activeTab,
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive && styles.activeTabText,
                  ]}
                >
                  {tab.label} ({tab.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* LISTADO */}

        <View
          style={[
            styles.recordsContainer,
            isDesktop && styles.desktopRecordsContainer,
          ]}
        >

          {loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator
                size="large"
                color="#764DC6"
              />

              <Text style={styles.emptyText}>
                Cargando registros...
              </Text>
            </View>
          ) : filteredRecords.length > 0 ? (
            filteredRecords.map(renderRecord)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-outline"
                size={42}
                color="#B87EEE"
              />

              <Text style={styles.emptyTitle}>
  {activeTab === 'Pendientes'
    ? 'Función en desarrollo'
    : 'No hay registros'}
</Text>

<Text style={styles.emptyText}>
  {activeTab === 'Pendientes'
    ? 'La gestión de solicitudes pendientes estará disponible en futuras actualizaciones.'
    : emptyText}
</Text>
            </View>
          )}

        </View>

      </ScrollView>

    </View>
  );
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
    borderBottomWidth: 1,
    borderBottomColor: '#E8E1EC',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },

  desktopHeader: {
    paddingHorizontal: '8%',
    paddingVertical: 20,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#4A3B53',
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#7D6A88',
  },

  rootIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8E9FE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  rootIndicatorText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#764DC6',
  },

  // SCROLL

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 30,
  },

  desktopScrollContent: {
    paddingHorizontal: '8%',
    paddingTop: 28,
  },

  // TÍTULO

  titleContainer: {
    marginBottom: 18,
  },

  title: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#4A3B53',
  },

  subtitle: {
    marginTop: 3,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#7D6A88',
  },

  // PESTAÑAS

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E8E1EC',
  },

  desktopTabsContainer: {
    maxWidth: 650,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
  },

  activeTab: {
    backgroundColor: '#764DC6',
  },

  tabText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#7D6A88',
  },

  activeTabText: {
    color: '#FFFFFF',
  },

  // LISTADO

  recordsContainer: {
    width: '100%',
  },

  desktopRecordsContainer: {
    maxWidth: 900,
  },

  // TARJETA

  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E1EC',
  },

  desktopRecordCard: {
    padding: 17,
  },

  recordIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8E9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  recordInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  recordTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4A3B53',
  },

  recordDescription: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#7D6A88',
    marginTop: 2,
  },

  recordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  recordUser: {
    flexShrink: 1,
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#8A7A94',
  },

  recordSeparator: {
    fontSize: 10,
    color: '#B0A5B5',
    marginHorizontal: 5,
  },

  recordDate: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#9A8FA3',
  },

  // ESTADO

  recordRight: {
    alignItems: 'flex-end',
    gap: 6,
  },

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  pendingBadge: {
    backgroundColor: '#FFF3D9',
  },

  resolvedBadge: {
    backgroundColor: '#E9F7EF',
  },

  statusText: {
    fontSize: 9,
    fontFamily: 'Poppins_600SemiBold',
  },

  pendingText: {
    color: '#A97800',
  },

  resolvedText: {
    color: '#378357',
  },

  resolveButton: {
    minWidth: 68,
    minHeight: 28,
    borderRadius: 9,
    backgroundColor: '#764DC6',
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resolveButtonText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },

  // SIN REGISTROS / CARGA

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 45,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E8E1EC',
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4A3B53',
  },

  emptyText: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#8A7A94',
    textAlign: 'center',
  },
});