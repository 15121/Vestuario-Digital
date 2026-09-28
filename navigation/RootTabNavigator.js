import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
  Platform,
  BackHandler,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  useNavigationState,
} from '@react-navigation/native';

import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import AdminUserDetailScreen from '../screens/AdminUserDetailScreen';
import AdminEditUserScreen from '../screens/AdminEditUserScreen';
import AdminRequestsScreen from '../screens/AdminRequestsScreen';

import { COLORS } from '../theme/colours';


// ============================================================
// NAVEGADORES
// ============================================================

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();


// ============================================================
// TÍTULOS DEL HEADER
// ============================================================

const HEADER_TITLES = {
  Dashboard: 'Panel de administración',
  Usuarios: 'Usuarios',
  AdminUsers: 'Usuarios',
  AdminUserDetail: 'Gestión de usuario',
  AdminEditUser: 'Editar usuario',
  Registros: 'Solicitudes / Registros',
};


// ============================================================
// PANTALLAS QUE YA TIENEN SU PROPIO HEADER
// En mobile se oculta el header Root para no duplicar títulos.
// ============================================================

const SCREENS_WITH_OWN_HEADER = [
  'AdminUserDetail',
  'AdminEditUser',
];


// ============================================================
// OBTENER RUTA ACTUAL
// ============================================================

function getActiveRouteName(state) {

  if (
    !state ||
    !state.routes ||
    !state.routes.length
  ) {
    return 'Dashboard';
  }

  const route =
    state.routes[state.index ?? 0];

  if (!route) {
    return 'Dashboard';
  }

  if (route.state) {
    return getActiveRouteName(route.state);
  }

  return route.name;
}


// ============================================================
// HEADER ROOT
// ============================================================

function RootHeader({ title, onLogout }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          height: 70 + insets.top,
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={styles.headerRightSpace} />

      <Text
        style={styles.headerTitle}
        numberOfLines={1}
      >
        {title}
      </Text>

      <TouchableOpacity
        style={styles.headerBackButton}
        activeOpacity={0.75}
        onPress={onLogout}
      >
        <Ionicons
          name="log-out-outline"
          size={28}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </View>
  );
}


// ============================================================
// SIDEBAR DESKTOP
// ============================================================

function DesktopSidebar({
  activeTab,
  onSelectTab,
}) {

  const sidebarItems = [

    {
      name: 'Dashboard',
      label: 'Dashboard',
      icon: 'grid-outline',
      activeIcon: 'grid',
    },

    {
      name: 'Usuarios',
      label: 'Usuarios',
      icon: 'people-outline',
      activeIcon: 'people',
    },

    {
      name: 'Registros',
      label: 'Registros',
      icon: 'document-text-outline',
      activeIcon: 'document-text',
    },

  ];


  return (
    <View style={styles.sidebar}>

      {/* ====================================================
          NAVEGACIÓN
      ==================================================== */}

      <View
        style={styles.sidebarNavigation}
      >

        {sidebarItems.map((item) => {

          const focused =
            activeTab === item.name;

          const iconColor =
            focused
              ? COLORS.primary
              : '#9A8FA3';


          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.sidebarItem,

                focused &&
                  styles.sidebarItemActive,
              ]}
              activeOpacity={0.8}
              onPress={() =>
                onSelectTab(item.name)
              }
            >

              {/* ICONO */}

              <View
                style={[
                  styles.sidebarIconContainer,

                  focused &&
                    styles.sidebarIconContainerActive,
                ]}
              >

                <Ionicons
                  name={
                    focused
                      ? item.activeIcon
                      : item.icon
                  }
                  size={25}
                  color={iconColor}
                />

              </View>


              {/* TEXTO */}

              <Text
                style={[
                  styles.sidebarLabel,

                  {
                    color: iconColor,

                    fontFamily:
                      focused
                        ? 'Poppins_600SemiBold'
                        : 'Poppins_400Regular',
                  },
                ]}
              >
                {item.label}
              </Text>

            </TouchableOpacity>
          );

        })}

      </View>


      {/* ====================================================
          IDENTIDAD ROOT
      ==================================================== */}

      <View
        style={styles.sidebarFooter}
      >

        <Text
          style={styles.sidebarFooterTitle}
        >
          Vestuario Digital
        </Text>

        <Text
          style={styles.sidebarFooterSubtitle}
        >
          Administración
        </Text>

      </View>

    </View>
  );
}


// ============================================================
// NAVEGACIÓN DE USUARIOS
// ============================================================

function UsersStack() {
  return (
    <Stack.Navigator
      initialRouteName="AdminUsers"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
      />

      <Stack.Screen
        name="AdminUserDetail"
        component={AdminUserDetailScreen}
      />

      <Stack.Screen
        name="AdminEditUser"
        component={AdminEditUserScreen}
      />
    </Stack.Navigator>
  );
}


// ============================================================
// NAVEGADOR ROOT
// ============================================================

export default function RootTabNavigator({
  navigation,
  route,
}) {

  const {
    width,
  } = useWindowDimensions();


  const isDesktop =
    width > 768;


  // ==========================================================
  // ESTADO DE NAVEGACIÓN DESKTOP
  // ==========================================================

  const [
    desktopTab,
    setDesktopTab,
  ] = useState('Dashboard');


  const insets =
    useSafeAreaInsets();


  const user =
    route?.params?.user;


  // ==========================================================
  // ESTADO DE NAVEGACIÓN MOBILE
  // ==========================================================

  const navigationState =
    useNavigationState(
      (state) => state
    );


  const activeRouteName =
    getActiveRouteName(
      navigationState
    );


  // ==========================================================
  // TAB ACTIVO
  // ==========================================================

  let activeTab = isDesktop
    ? desktopTab
    : 'Dashboard';


  // En mobile seguimos usando la navegación original.
  if (!isDesktop) {

    if (
      activeRouteName === 'Usuarios' ||
      activeRouteName === 'AdminUsers' ||
      activeRouteName === 'AdminUserDetail' ||
      activeRouteName === 'AdminEditUser'
    ) {

      activeTab = 'Usuarios';

    }


    if (
      activeRouteName === 'Registros'
    ) {

      activeTab = 'Registros';

    }

  }


  // ==========================================================
  // TÍTULO DEL HEADER
  // ==========================================================

  const headerTitle =
    HEADER_TITLES[
      isDesktop
        ? desktopTab
        : activeRouteName
    ] || 'Panel de administración';


  // ==========================================================
  // HEADER PROPIO EN MOBILE
  // ==========================================================

  const hideRootHeader =
    !isDesktop &&
    SCREENS_WITH_OWN_HEADER.includes(
      activeRouteName
    );


  // ==========================================================
  // NAVEGACIÓN SIDEBAR DESKTOP
  // ==========================================================
  //
  // El sidebar está fuera del Tab.Navigator.
  //
  // En PC usamos estado local para decidir qué pantalla
  // administrativa mostrar.
  //
  // Esto evita intentar enviar TabActions a un navegador
  // anidado que está fuera del contexto directo del sidebar.
  //
  // ==========================================================

  const handleSidebarNavigation =
    (tabName) => {

      if (!isDesktop) {
        return;
      }

      setDesktopTab(tabName);

    };


  // ==========================================================
  // CERRAR SESIÓN
  // ==========================================================

  const handleLogout = () => {

    const doLogout = () =>
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'Welcome',
          },
        ],
      });


    if (Platform.OS === 'web') {

      if (
        window.confirm(
          '¿Querés cerrar sesión?'
        )
      ) {
        doLogout();
      }

      return;
    }


    Alert.alert(
      'Cerrar sesión',
      '¿Querés cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },

        {
          text: 'Cerrar sesión',
          onPress: doLogout,
        },
      ]
    );
  };


  // ==========================================================
  // BOTÓN ATRÁS DE ANDROID
  // ==========================================================

  useEffect(() => {

    if (
      Platform.OS !== 'android'
    ) {
      return undefined;
    }


    const subscription =
      BackHandler.addEventListener(
        'hardwareBackPress',
        () => {

          if (
            activeTab === 'Dashboard'
          ) {

            handleLogout();

            return true;
          }


          return false;

        }
      );


    return () =>
      subscription.remove();

  }, [activeTab]);


  // ==========================================================
  // DESKTOP
  // ==========================================================

  if (isDesktop) {

    return (
      <View
        style={styles.desktopRoot}
      >

        {/* ==================================================
            HEADER SUPERIOR
        ================================================== */}

        <RootHeader
          title={headerTitle}
          onLogout={handleLogout}
        />


        {/* ==================================================
            CUERPO
        ================================================== */}

        <View
          style={styles.desktopBody}
        >

          {/* ================================================
              SIDEBAR
          ================================================ */}

          <DesktopSidebar
            activeTab={activeTab}
            onSelectTab={
              handleSidebarNavigation
            }
          />


          {/* ================================================
              CONTENIDO
          ================================================ */}

          <View
            style={styles.desktopContent}
          >

            <View
              style={
                styles.desktopScreenContainer
              }
            >

              {/* ==========================================
                  CONTENIDO DESKTOP

                  El sidebar controla directamente la pantalla
                  visible mediante desktopTab.
              ========================================== */}

              {desktopTab === 'Dashboard' && (
                <AdminDashboardScreen
                  route={{
                    params: {
                      user,
                    },
                  }}
                />
              )}


              {desktopTab === 'Usuarios' && (
                <UsersStack />
              )}


              {desktopTab === 'Registros' && (
                <AdminRequestsScreen
                  route={{
                    params: {
                      user,
                    },
                  }}
                />
              )}

            </View>

          </View>

        </View>

      </View>
    );
  }


  // ==========================================================
  // MOBILE
  // ==========================================================

  return (
    <View
      style={styles.mobileRoot}
    >

      {/* ====================================================
          HEADER
          Si la pantalla trae su propio header, se deja un
          espacio blanco del alto de la barra de estado.
      ==================================================== */}

      {hideRootHeader ? (

        <View
          style={{
            height: insets.top,
            backgroundColor: '#FFFFFF',
          }}
        />

      ) : (

        <RootHeader
          title={headerTitle}
          onLogout={handleLogout}
        />

      )}


      {/* ====================================================
          CONTENIDO
      ==================================================== */}

      <View
        style={styles.mobileContent}
      >

        <Tab.Navigator

          initialRouteName="Dashboard"

          screenOptions={{
            headerShown: false,

            tabBarActiveTintColor:
              COLORS.primary,

            tabBarInactiveTintColor:
              '#9A8FA3',

            tabBarStyle:
              styles.tabBar,

            tabBarLabelStyle:
              styles.tabBarLabel,
          }}
        >

          {/* ==================================================
              DASHBOARD
          ================================================== */}

          <Tab.Screen
            name="Dashboard"
            component={
              AdminDashboardScreen
            }
            initialParams={{
              user,
            }}
            options={{
              tabBarLabel:
                'Dashboard',

              tabBarIcon:
                ({
                  focused,
                  color,
                  size,
                }) => (

                  <Ionicons
                    name={
                      focused
                        ? 'grid'
                        : 'grid-outline'
                    }
                    size={size}
                    color={color}
                  />

                ),
            }}
          />


          {/* ==================================================
              USUARIOS
          ================================================== */}

          <Tab.Screen
            name="Usuarios"
            component={
              UsersStack
            }
            initialParams={{
              user,
            }}
            options={{
              tabBarLabel:
                'Usuarios',

              tabBarIcon:
                ({
                  focused,
                  color,
                  size,
                }) => (

                  <Ionicons
                    name={
                      focused
                        ? 'people'
                        : 'people-outline'
                    }
                    size={size}
                    color={color}
                  />

                ),
            }}
          />


          {/* ==================================================
              REGISTROS
          ================================================== */}

          <Tab.Screen
            name="Registros"
            component={
              AdminRequestsScreen
            }
            initialParams={{
              user,
            }}
            options={{
              tabBarLabel:
                'Registros',

              tabBarIcon:
                ({
                  focused,
                  color,
                  size,
                }) => (

                  <Ionicons
                    name={
                      focused
                        ? 'document-text'
                        : 'document-text-outline'
                    }
                    size={size}
                    color={color}
                  />

                ),
            }}
          />

        </Tab.Navigator>

      </View>

    </View>
  );
}


// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  // ==========================================================
  // ROOT DESKTOP
  // ==========================================================

  desktopRoot: {
    flex: 1,

    width: '100%',

    backgroundColor:
      COLORS.background,
  },


  desktopBody: {
    flex: 1,

    flexDirection: 'row',

    width: '100%',
  },


  desktopContent: {
    flex: 1,

    minWidth: 0,

    backgroundColor:
      COLORS.background,
  },


  desktopScreenContainer: {
    flex: 1,

    width: '100%',

    backgroundColor:
      COLORS.background,
  },


  // ==========================================================
  // ROOT MOBILE
  // ==========================================================

  mobileRoot: {
    flex: 1,

    backgroundColor:
      COLORS.background,
  },


  mobileContent: {
    flex: 1,
  },


  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    height: 70,

    width: '100%',

    backgroundColor:
      COLORS.primary,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent:
      'space-between',

    paddingHorizontal: 24,
  },


  headerBackButton: {
    width: 42,

    height: 42,

    alignItems: 'center',

    justifyContent: 'center',
  },


  headerTitle: {
    flex: 1,

    textAlign: 'center',

    color: '#FFFFFF',

    fontSize: 19,

    fontFamily:
      'Poppins_600SemiBold',
  },


  headerRightSpace: {
    width: 42,

    height: 42,
  },


  // ==========================================================
  // SIDEBAR
  // ==========================================================

  sidebar: {
    width: 212,

    backgroundColor:
      '#FFFFFF',

    borderRightWidth: 1,

    borderRightColor:
      '#E8E1EC',

    justifyContent:
      'space-between',

    paddingTop: 25,

    paddingBottom: 22,
  },


  sidebarNavigation: {
    width: '100%',
  },


  sidebarItem: {
    alignSelf: 'stretch',

    marginHorizontal: 16,

    minHeight: 88,

    alignItems: 'center',

    justifyContent: 'center',

    paddingVertical: 10,

    marginBottom: 4,

    borderRadius: 16,
  },


  sidebarItemActive: {
    backgroundColor:
      COLORS.background,
  },


  sidebarIconContainer: {
    width: 54,

    height: 54,

    borderRadius: 15,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor:
      '#F8F4FA',
  },


  sidebarIconContainerActive: {
    backgroundColor:
      '#F4E7FD',
  },


  sidebarLabel: {
    fontSize: 12,

    marginTop: 6,

    textAlign: 'center',
  },


  // ==========================================================
  // FOOTER SIDEBAR
  // ==========================================================

  sidebarFooter: {
    alignItems: 'center',

    paddingHorizontal: 10,
  },


  sidebarFooterTitle: {
    fontSize: 12,

    fontFamily:
      'Poppins_600SemiBold',

    color:
      COLORS.textDark,

    textAlign: 'center',
  },


  sidebarFooterSubtitle: {
    fontSize: 10,

    fontFamily:
      'Poppins_400Regular',

    color:
      COLORS.textLight,

    marginTop: 2,

    textAlign: 'center',
  },


  // ==========================================================
  // TAB BAR MOBILE
  // ==========================================================

  tabBar: {
    height: 68,

    paddingBottom: 8,

    paddingTop: 6,

    backgroundColor:
      '#FFFFFF',

    borderTopWidth: 1,

    borderTopColor:
      '#E8E1EC',

    elevation: 8,
  },


  tabBarLabel: {
    fontFamily:
      'Poppins_600SemiBold',

    fontSize: 11,
  },

});