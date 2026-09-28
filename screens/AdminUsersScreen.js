import { Platform } from 'react-native';

import React, {
  useCallback,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  useFocusEffect,
} from '@react-navigation/native';

import {
  getAllUsers,
} from '../services/database';

import {
  COLORS,
} from '../theme/colours';

const showMessage = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
};
// ============================================================
// ADMIN USERS SCREEN
// ============================================================

export default function AdminUsersScreen({
  navigation,
}) {

  const {
    width,
  } = useWindowDimensions();

  const isDesktop =
    width > 768;


  // ==========================================================
  // ESTADOS
  // ==========================================================

  const [
    users,
    setUsers,
  ] = useState([]);

  const [
    filteredUsers,
    setFilteredUsers,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    activeFilter,
    setActiveFilter,
  ] = useState('Todos');

  const [
    loading,
    setLoading,
  ] = useState(true);


  // ==========================================================
  // CARGAR USUARIOS
  // ==========================================================

  const loadUsers = useCallback(
    async () => {

      try {

        setLoading(true);

        const result =
          await getAllUsers();

        const safeUsers =
          Array.isArray(result)
            ? result
            : [];

        setUsers(safeUsers);

      } catch (error) {

        console.log(
          'Error al cargar usuarios:',
          error
        );

        showMessage('Error', 'No se pudieron cargar los usuarios.');

      } finally {

        setLoading(false);

      }

    },
    []
  );


  // ==========================================================
  // RECARGAR AL VOLVER A LA PANTALLA
  // ==========================================================

  useFocusEffect(
    useCallback(() => {

      loadUsers();

    }, [
      loadUsers,
    ])
  );


  // ==========================================================
  // FILTRAR USUARIOS
  // ==========================================================

  React.useEffect(() => {

    let result = [
      ...users,
    ];


    // --------------------------------------------------------
    // FILTRO POR ESTADO
    // --------------------------------------------------------

    if (
      activeFilter === 'Activos'
    ) {

      result =
        result.filter(
          (user) =>
            user.status ===
            'active'
        );

    }


    if (
      activeFilter === 'Suspendidos'
    ) {

      result =
        result.filter(
          (user) =>
            user.status ===
            'suspended'
        );

    }


    // --------------------------------------------------------
    // BUSCADOR
    // --------------------------------------------------------

    const cleanSearch =
      search
        .trim()
        .toLowerCase();


    if (cleanSearch) {

      result =
        result.filter(
          (user) => {

            const fullName =
              `${user.name || ''} ${
                user.lastname || ''
              }`
                .trim()
                .toLowerCase();

            const email =
              (
                user.email || ''
              )
                .toLowerCase();

            return (
              fullName.includes(
                cleanSearch
              ) ||
              email.includes(
                cleanSearch
              )
            );

          }
        );

    }


    setFilteredUsers(
      result
    );

  }, [
    users,
    search,
    activeFilter,
  ]);


  // ==========================================================
  // NAVEGAR A GESTIÓN DE USUARIO
  // ==========================================================

  const handleManageUser = (
    user
  ) => {

    navigation.navigate(
      'AdminUserDetail',
      {
        userId: user.id,
        user,
      }
    );

  };


  // ==========================================================
  // LIMPIAR BÚSQUEDA
  // ==========================================================

  const clearSearch = () => {

    setSearch('');

  };


  // ==========================================================
  // CONTADORES
  // ==========================================================

  const totalUsers =
    users.length;

  const activeUsers =
    users.filter(
      (user) =>
        user.status ===
        'active'
    ).length;

  const suspendedUsers =
    users.filter(
      (user) =>
        user.status ===
        'suspended'
    ).length;


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <View
      style={[
        styles.root,

        isDesktop &&
          styles.desktopRoot,
      ]}
    >

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,

          isDesktop &&
            styles.desktopContent,
        ]}
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <View
          style={[
            styles.header,

            isDesktop &&
              styles.desktopHeader,
          ]}
        >

          <View
            style={styles.headerText}
          >

            <Text
              style={styles.title}
            >
              Usuarios
            </Text>

            <Text
              style={styles.subtitle}
            >
              Gestioná las cuentas registradas
            </Text>

          </View>


          {/* INDICADOR ROOT */}

          <View
            style={styles.rootBadge}
          >

            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color="#764DC6"
            />

            <Text
              style={styles.rootBadgeText}
            >
              Root
            </Text>

          </View>

        </View>


        {/* ================================================== */}
        {/* BUSCADOR */}
        {/* ================================================== */}

        <View
          style={styles.searchContainer}
        >

          <Ionicons
            name="search-outline"
            size={21}
            color="#9A8FA3"
          />

          <TextInput
            value={search}
            onChangeText={
              setSearch
            }
            placeholder="Buscar usuario..."
            placeholderTextColor="#A99EAE"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />


          {search.length > 0 && (

            <TouchableOpacity
              onPress={
                clearSearch
              }
              style={
                styles.clearButton
              }
              activeOpacity={0.7}
            >

              <Ionicons
                name="close-circle"
                size={20}
                color="#9A8FA3"
              />

            </TouchableOpacity>

          )}

        </View>


        {/* ================================================== */}
        {/* RESUMEN */}
        {/* ================================================== */}

        <View
          style={[
            styles.summaryRow,

            isDesktop &&
              styles.desktopSummaryRow,
          ]}
        >

          <SummaryItem
            label="Todos"
            value={totalUsers}
          />

          <SummaryItem
            label="Activos"
            value={activeUsers}
          />

          <SummaryItem
            label="Suspendidos"
            value={suspendedUsers}
          />

        </View>


        {/* ================================================== */}
        {/* FILTROS */}
        {/* ================================================== */}

        <View
          style={styles.filtersContainer}
        >

          <FilterButton
            label="Todos"
            active={
              activeFilter ===
              'Todos'
            }
            onPress={() =>
              setActiveFilter(
                'Todos'
              )
            }
          />

          <FilterButton
            label="Activos"
            active={
              activeFilter ===
              'Activos'
            }
            onPress={() =>
              setActiveFilter(
                'Activos'
              )
            }
          />

          <FilterButton
            label="Suspendidos"
            active={
              activeFilter ===
              'Suspendidos'
            }
            onPress={() =>
              setActiveFilter(
                'Suspendidos'
              )
            }
          />

        </View>


        {/* ================================================== */}
        {/* RESULTADOS */}
        {/* ================================================== */}

        <View
          style={styles.resultsHeader}
        >

          <Text
            style={styles.resultsTitle}
          >
            Usuarios registrados
          </Text>

          <Text
            style={styles.resultsCount}
          >
            {filteredUsers.length}
          </Text>

        </View>


        {/* ================================================== */}
        {/* LOADING */}
        {/* ================================================== */}

        {loading ? (

          <View
            style={styles.loadingContainer}
          >

            <ActivityIndicator
              size="large"
              color="#764DC6"
            />

            <Text
              style={styles.loadingText}
            >
              Cargando usuarios...
            </Text>

          </View>

        ) : filteredUsers.length === 0 ? (

          /* ================================================= */
          /* SIN RESULTADOS */
          /* ================================================= */

          <View
            style={styles.emptyContainer}
          >

            <View
              style={styles.emptyIcon}
            >

              <Ionicons
                name="people-outline"
                size={38}
                color="#9A8FA3"
              />

            </View>

            <Text
              style={styles.emptyTitle}
            >
              No se encontraron usuarios
            </Text>

            <Text
              style={styles.emptyText}
            >
              Probá modificando la búsqueda
              o el filtro seleccionado.
            </Text>

          </View>

        ) : (

          /* ================================================= */
          /* LISTA */
          /* ================================================= */

          <View
            style={[
              styles.usersGrid,

              isDesktop &&
                styles.desktopUsersGrid,
            ]}
          >

            {filteredUsers.map(
              (user) => (

                <UserCard
                  key={String(user.id)}
                  user={user}
                  onManage={() =>
                    handleManageUser(
                      user
                    )
                  }
                  isDesktop={
                    isDesktop
                  }
                />

              )
            )}

          </View>

        )}

      </ScrollView>

    </View>

  );
}


// ============================================================
// SUMMARY ITEM
// ============================================================

function SummaryItem({
  label,
  value,
}) {

  return (

    <View
      style={styles.summaryItem}
    >

      <Text
        style={styles.summaryValue}
      >
        {value}
      </Text>

      <Text
        style={styles.summaryLabel}
      >
        {label}
      </Text>

    </View>

  );
}


// ============================================================
// FILTER BUTTON
// ============================================================

function FilterButton({
  label,
  active,
  onPress,
}) {

  return (

    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.filterButton,

        active &&
          styles.filterButtonActive,
      ]}
    >

      <Text
        style={[
          styles.filterText,

          active &&
            styles.filterTextActive,
        ]}
      >
        {label}
      </Text>

    </TouchableOpacity>

  );
}


// ============================================================
// USER CARD
// ============================================================

function UserCard({
  user,
  onManage,
  isDesktop,
}) {

  const fullName =
    `${user.name || ''} ${
      user.lastname || ''
    }`
      .trim() ||
    'Usuario sin nombre';


  const isRoot =
    user.role === 'root';

  const isActive =
    user.status === 'active';


  return (

    <View
      style={[
        styles.userCard,

        isDesktop &&
          styles.desktopUserCard,
      ]}
    >

      {/* ================================================== */}
      {/* AVATAR */}
      {/* ================================================== */}

      <View
        style={[
          styles.avatar,

          isRoot &&
            styles.rootAvatar,
        ]}
      >

        <Text
          style={[
            styles.avatarText,

            isRoot &&
              styles.rootAvatarText,
          ]}
        >
          {getInitials(
            user.name,
            user.lastname
          )}
        </Text>

      </View>


      {/* ================================================== */}
      {/* INFORMACIÓN */}
      {/* ================================================== */}

      <View
        style={styles.userInfo}
      >

        <View
          style={styles.nameRow}
        >

          <Text
            style={styles.userName}
            numberOfLines={1}
          >
            {fullName}
          </Text>


          {isRoot && (

            <View
              style={styles.rootSmallBadge}
            >

              <Ionicons
                name="shield-checkmark"
                size={12}
                color="#764DC6"
              />

              <Text
                style={
                  styles.rootSmallBadgeText
                }
              >
                ROOT
              </Text>

            </View>

          )}

        </View>


        <Text
          style={styles.userEmail}
          numberOfLines={1}
        >
          {user.email || 'Sin email'}
        </Text>


        <View
          style={styles.statusRow}
        >

          <View
            style={[
              styles.statusDot,

              isActive
                ? styles.statusDotActive
                : styles.statusDotSuspended,
            ]}
          />


          <Text
            style={[
              styles.statusText,

              isActive
                ? styles.statusTextActive
                : styles.statusTextSuspended,
            ]}
          >
            {isActive
              ? 'Activo'
              : 'Suspendido'}
          </Text>

        </View>

      </View>


      {/* ================================================== */}
      {/* BOTÓN GESTIONAR */}
      {/* ================================================== */}

      <TouchableOpacity
        onPress={onManage}
        activeOpacity={0.8}
        style={styles.manageButton}
      >

        <Text
          style={styles.manageButtonText}
        >
          Gestionar
        </Text>

        <Ionicons
          name="chevron-forward"
          size={18}
          color="#FFFFFF"
        />

      </TouchableOpacity>

    </View>

  );
}


// ============================================================
// OBTENER INICIALES
// ============================================================

function getInitials(
  name,
  lastname
) {

  const first =
    (name || '')
      .trim()
      .charAt(0)
      .toUpperCase();

  const last =
    (lastname || '')
      .trim()
      .charAt(0)
      .toUpperCase();

  if (!first && !last) {
    return '?';
  }

  return `${first}${last}`;
}


// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  // ==========================================================
  // ROOT
  // ==========================================================

  root: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },


  desktopRoot: {
    width: '100%',
  },


  scroll: {
    flex: 1,
  },


  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 45,
  },


  desktopContent: {
    width: '100%',
    maxWidth: 1250,
    alignSelf: 'center',
    paddingHorizontal: 40,
    paddingTop: 32,
  },


  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    justifyContent:
      'space-between',

    gap: 15,
  },


  desktopHeader: {
    alignItems: 'center',
  },


  headerText: {
    flex: 1,
  },


  title: {
    color: '#4A3B53',

    fontSize: 28,

    fontFamily:
      'Poppins_700Bold',

    marginBottom: 4,
  },


  subtitle: {
    color: '#7D6A88',

    fontSize: 13,

    lineHeight: 20,

    fontFamily:
      'Poppins_400Regular',
  },


  // ==========================================================
  // ROOT BADGE
  // ==========================================================

  rootBadge: {
    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 13,

    paddingVertical: 8,

    borderRadius: 20,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E3D5EC',

    gap: 6,
  },


  rootBadgeText: {
    color: '#764DC6',

    fontSize: 13,

    fontFamily:
      'Poppins_600SemiBold',
  },


  // ==========================================================
  // SEARCH
  // ==========================================================

  searchContainer: {
    width: '100%',

    minHeight: 52,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E5DCE8',

    borderRadius: 15,

    paddingHorizontal: 15,

    marginTop: 25,
  },


  searchInput: {
    flex: 1,

    color: '#4A3B53',

    fontSize: 13,

    fontFamily:
      'Poppins_400Regular',

    marginLeft: 10,

    paddingVertical: 8,
  },


  clearButton: {
    padding: 4,
  },


  // ==========================================================
  // SUMMARY
  // ==========================================================

  summaryRow: {
    width: '100%',

    flexDirection: 'row',

    backgroundColor: '#FFFFFF',

    borderRadius: 16,

    borderWidth: 1,

    borderColor: '#E9DFED',

    marginTop: 16,

    paddingVertical: 13,
  },


  desktopSummaryRow: {
    maxWidth: 650,
  },


  summaryItem: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    borderRightWidth: 1,

    borderRightColor: '#EEE6F0',
  },


  summaryValue: {
    color: '#764DC6',

    fontSize: 21,

    fontFamily:
      'Poppins_700Bold',
  },


  summaryLabel: {
    color: '#7D6A88',

    fontSize: 11,

    fontFamily:
      'Poppins_400Regular',

    marginTop: 1,
  },


  // ==========================================================
  // FILTERS
  // ==========================================================

  filtersContainer: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 9,

    marginTop: 20,
  },


  filterButton: {
    paddingHorizontal: 16,

    paddingVertical: 9,

    borderRadius: 20,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E2D7E6',
  },


  filterButtonActive: {
    backgroundColor: '#764DC6',

    borderColor: '#764DC6',
  },


  filterText: {
    color: '#7D6A88',

    fontSize: 11,

    fontFamily:
      'Poppins_600SemiBold',
  },


  filterTextActive: {
    color: '#FFFFFF',
  },


  // ==========================================================
  // RESULTS HEADER
  // ==========================================================

  resultsHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 25,

    marginBottom: 12,
  },


  resultsTitle: {
    flex: 1,

    color: '#4A3B53',

    fontSize: 17,

    fontFamily:
      'Poppins_600SemiBold',
  },


  resultsCount: {
    color: '#8A7893',

    fontSize: 12,

    fontFamily:
      'Poppins_500Medium',
  },


  // ==========================================================
  // USERS GRID
  // ==========================================================

  usersGrid: {
    width: '100%',

    gap: 12,
  },


  desktopUsersGrid: {
    flexDirection: 'row',

    flexWrap: 'wrap',

    alignItems: 'stretch',

    gap: 16,
  },


  // ==========================================================
  // USER CARD
  // ==========================================================

  userCard: {
    width: '100%',

    minHeight: 100,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E9DFED',

    borderRadius: 17,

    padding: 14,
  },


  desktopUserCard: {
    width: '48.8%',

    minWidth: 430,

    flexGrow: 1,

    maxWidth: 610,
  },


  // ==========================================================
  // AVATAR
  // ==========================================================

  avatar: {
    width: 52,

    height: 52,

    borderRadius: 26,

    backgroundColor: '#F1E6F8',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 13,
  },


  rootAvatar: {
    backgroundColor: '#EDE2F7',
  },


  avatarText: {
    color: '#764DC6',

    fontSize: 16,

    fontFamily:
      'Poppins_700Bold',
  },


  rootAvatarText: {
    color: '#764DC6',
  },


  // ==========================================================
  // USER INFO
  // ==========================================================

  userInfo: {
    flex: 1,

    minWidth: 0,

    marginRight: 10,
  },


  nameRow: {
    flexDirection: 'row',

    alignItems: 'center',

    minWidth: 0,

    gap: 7,
  },


  userName: {
    flexShrink: 1,

    color: '#4A3B53',

    fontSize: 14,

    fontFamily:
      'Poppins_600SemiBold',
  },


  userEmail: {
    color: '#8A7893',

    fontSize: 11,

    fontFamily:
      'Poppins_400Regular',

    marginTop: 2,
  },


  // ==========================================================
  // ROOT SMALL BADGE
  // ==========================================================

  rootSmallBadge: {
    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 6,

    paddingVertical: 2,

    borderRadius: 8,

    backgroundColor: '#F1E6F8',

    gap: 3,
  },


  rootSmallBadgeText: {
    color: '#764DC6',

    fontSize: 8,

    fontFamily:
      'Poppins_700Bold',
  },


  // ==========================================================
  // STATUS
  // ==========================================================

  statusRow: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 6,

    gap: 5,
  },


  statusDot: {
    width: 7,

    height: 7,

    borderRadius: 4,
  },


  statusDotActive: {
    backgroundColor: '#5FAF72',
  },


  statusDotSuspended: {
    backgroundColor: '#C77777',
  },


  statusText: {
    fontSize: 10,

    fontFamily:
      'Poppins_500Medium',
  },


  statusTextActive: {
    color: '#4F9560',
  },


  statusTextSuspended: {
    color: '#A85C5C',
  },


  // ==========================================================
  // MANAGE BUTTON
  // ==========================================================

  manageButton: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    minHeight: 38,

    paddingHorizontal: 12,

    borderRadius: 11,

    backgroundColor: '#764DC6',

    gap: 3,
  },


  manageButtonText: {
    color: '#FFFFFF',

    fontSize: 10,

    fontFamily:
      'Poppins_600SemiBold',
  },


  // ==========================================================
  // LOADING
  // ==========================================================

  loadingContainer: {
    minHeight: 220,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#FFFFFF',

    borderRadius: 17,

    borderWidth: 1,

    borderColor: '#E9DFED',
  },


  loadingText: {
    color: '#7D6A88',

    fontSize: 12,

    fontFamily:
      'Poppins_400Regular',

    marginTop: 12,
  },


  // ==========================================================
  // EMPTY
  // ==========================================================

  emptyContainer: {
    minHeight: 250,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#FFFFFF',

    borderRadius: 17,

    borderWidth: 1,

    borderColor: '#E9DFED',

    paddingHorizontal: 25,
  },


  emptyIcon: {
    width: 70,

    height: 70,

    borderRadius: 35,

    backgroundColor: '#F1E6F8',

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: 14,
  },


  emptyTitle: {
    color: '#4A3B53',

    fontSize: 15,

    fontFamily:
      'Poppins_600SemiBold',

    textAlign: 'center',
  },


  emptyText: {
    color: '#8A7893',

    fontSize: 11,

    lineHeight: 17,

    fontFamily:
      'Poppins_400Regular',

    textAlign: 'center',

    marginTop: 5,

    maxWidth: 300,
  },

});