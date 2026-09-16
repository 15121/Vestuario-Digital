import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
  Alert,
} from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import HomeScreen from '../screens/homeScreen';
import ClothingScreen from '../screens/clothingScreen';
import MyOutfitsScreen from '../screens/myoufitsScreen';
import PackingModeScreen from '../screens/packingModeScreen';

import AddMenuModal from '../components/AddMenuModal';
import SideMenu from '../components/sideMenu';

import { COLORS } from '../theme/colours';


// ============================================================
// TAB NAVIGATOR
// ============================================================

const Tab = createBottomTabNavigator();


// ============================================================
// TÍTULOS DEL HEADER
// ============================================================

const TAB_HEADER_TITLES = {
  Inicio: 'Inicio',
  Prendas: 'Prendas',
  Outfits: 'Outfits',
  Maleta: 'Maleta',
};


// ============================================================
// HEADER SUPERIOR
// ============================================================

function AppHeader({
  title,
  navigation,
  onOpenMenu,
}) {

  // ----------------------------------------------------------
  // IR AL PERFIL
  // ----------------------------------------------------------

  const handleProfilePress = () => {
    try {
      navigation.navigate('Profile');
    } catch (error) {
      Alert.alert(
        'Perfil',
        'No se pudo abrir la pantalla de perfil.'
      );
    }
  };


  return (
    <SafeAreaView style={styles.headerSafeArea}>

      <View style={styles.header}>

        {/* ====================================================
            HAMBURGUESA
        ==================================================== */}

        <TouchableOpacity
          style={styles.menuButton}
          activeOpacity={0.75}
          onPress={onOpenMenu}
        >
          <Ionicons
            name="menu-outline"
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>


        {/* ====================================================
            TÍTULO
        ==================================================== */}

        <Text
          style={styles.headerTitle}
          numberOfLines={1}
        >
          {title}
        </Text>


        {/* ====================================================
            AVATAR
        ==================================================== */}

        <TouchableOpacity
          style={styles.avatarCircle}
          activeOpacity={0.75}
          onPress={handleProfilePress}
        >
          <Ionicons
            name="person"
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>

      </View>

    </SafeAreaView>
  );
}


// ============================================================
// SIDEBAR DESKTOP
// ============================================================

function DesktopSidebar({
  activeTab,
  onSelectTab,
  onAddPress,
}) {

  const sidebarItems = [
    {
      name: 'Inicio',
      icon: 'home-outline',
      activeIcon: 'home',
      type: 'ionicon',
    },
    {
      name: 'Prendas',
      icon: 'shirt-outline',
      activeIcon: 'shirt',
      type: 'ionicon',
    },
    {
      name: 'Outfits',
      icon: 'hanger',
      activeIcon: 'hanger',
      type: 'material',
    },
    {
      name: 'Maleta',
      icon: 'briefcase-outline',
      activeIcon: 'briefcase',
      type: 'ionicon',
    },
  ];


  return (
    <View style={styles.sidebar}>

      {/* ====================================================
          NAVEGACIÓN
      ==================================================== */}

      <View style={styles.sidebarNavigation}>

        {sidebarItems.map((item) => {

          const focused =
            activeTab === item.name;

          const iconColor = focused
            ? COLORS.primary
            : '#A0A0A0';


          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.sidebarItem,
                focused && styles.sidebarItemActive,
              ]}
              activeOpacity={0.75}
              onPress={() =>
                onSelectTab(item.name)
              }
            >

              {/* ÍCONO */}

              {item.type === 'material' ? (

                <MaterialCommunityIcons
                  name={item.icon}
                  size={25}
                  color={iconColor}
                />

              ) : (

                <Ionicons
                  name={
                    focused
                      ? item.activeIcon
                      : item.icon
                  }
                  size={25}
                  color={iconColor}
                />

              )}


              {/* TEXTO */}

              <Text
                style={[
                  styles.sidebarLabel,
                  {
                    color: iconColor,
                    fontFamily: focused
                      ? 'Poppins_600SemiBold'
                      : 'Poppins_400Regular',
                  },
                ]}
              >
                {item.name}
              </Text>

            </TouchableOpacity>
          );

        })}

      </View>


      {/* ====================================================
          BOTÓN +
      ==================================================== */}

      <TouchableOpacity
        style={styles.addButtonDesktop}
        activeOpacity={0.85}
        onPress={onAddPress}
      >
        <Ionicons
          name="add"
          size={30}
          color="#FFFFFF"
        />
      </TouchableOpacity>

    </View>
  );
}


// ============================================================
// NAVEGADOR PRINCIPAL
// ============================================================

export default function MainTabNavigator({
  navigation,
  route,
}) {

  const { width } = useWindowDimensions();

  // ----------------------------------------------------------
  // PC / CELULAR
  // ----------------------------------------------------------

  const isDesktop = width > 768;


  // ----------------------------------------------------------
  // USUARIO
  // ----------------------------------------------------------

  const user = route?.params?.user;


  // ----------------------------------------------------------
  // ESTADO MENÚ +
  // ----------------------------------------------------------

  const [
    addMenuVisible,
    setAddMenuVisible,
  ] = useState(false);


  // ----------------------------------------------------------
  // ESTADO SIDEMENU
  // ----------------------------------------------------------

  const [
    sideMenuVisible,
    setSideMenuVisible,
  ] = useState(false);


  // ----------------------------------------------------------
  // TAB ACTIVO DESKTOP
  // ----------------------------------------------------------

  const [
    activeDesktopTab,
    setActiveDesktopTab,
  ] = useState('Inicio');


  // ==========================================================
  // AGREGAR PRENDA
  // ==========================================================

  const handleAddClothing = () => {

    setAddMenuVisible(false);

    navigation.navigate(
      'AddClothing',
      {
        user,
      }
    );
  };


  // ==========================================================
  // CREAR OUTFIT
  // ==========================================================

  const handleCreateOutfit = () => {

    setAddMenuVisible(false);

    navigation.navigate(
      'CrearOutfit',
      {
        user,
      }
    );
  };


  // ==========================================================
  // PERFIL
  // ==========================================================

  const handleProfile = () => {

    setSideMenuVisible(false);

    navigation.navigate(
      'Profile',
      {
        user,
      }
    );
  };


  // ==========================================================
  // ACERCA DE LA APLICACIÓN
  // ==========================================================

  const handleAbout = () => {

    setSideMenuVisible(false);

    navigation.navigate(
      'AboutApp',
      {
        user,
      }
    );
  };


  // ==========================================================
  // AYUDA
  // ==========================================================

  const handleHelp = () => {

    setSideMenuVisible(false);

    navigation.navigate(
      'Help',
      {
        user,
      }
    );
  };


  // ==========================================================
  // CERRAR SESIÓN
  // ==========================================================

  const handleLogout = () => {

    setSideMenuVisible(false);

    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Login',
        },
      ],
    });
  };


  // ==========================================================
  // CAMBIAR TAB DESKTOP
  // ==========================================================

  const handleDesktopTabChange = (tabName) => {

    setActiveDesktopTab(tabName);
  };


  // ==========================================================
  // VERSIÓN PC
  // ==========================================================

  if (isDesktop) {

    let ActiveScreen = HomeScreen;


    // --------------------------------------------------------
    // INICIO
    // --------------------------------------------------------

    if (activeDesktopTab === 'Inicio') {
      ActiveScreen = HomeScreen;
    }


    // --------------------------------------------------------
    // PRENDAS
    // --------------------------------------------------------

    if (activeDesktopTab === 'Prendas') {
      ActiveScreen = ClothingScreen;
    }


    // --------------------------------------------------------
    // OUTFITS
    // --------------------------------------------------------

    if (activeDesktopTab === 'Outfits') {
      ActiveScreen = MyOutfitsScreen;
    }


    // --------------------------------------------------------
    // MALETA
    // --------------------------------------------------------

    if (activeDesktopTab === 'Maleta') {
      ActiveScreen = PackingModeScreen;
    }


    return (
      <View style={styles.desktopRoot}>

        {/* ==================================================
            SIDEBAR
        ================================================== */}

        <DesktopSidebar
          activeTab={activeDesktopTab}
          onSelectTab={handleDesktopTabChange}
          onAddPress={() =>
            setAddMenuVisible(true)
          }
        />


        {/* ==================================================
            CONTENIDO
        ================================================== */}

        <View style={styles.desktopContentArea}>

          {/* HEADER */}

          <AppHeader
            title={
              TAB_HEADER_TITLES[
                activeDesktopTab
              ] || activeDesktopTab
            }
            navigation={navigation}
            onOpenMenu={() =>
              setSideMenuVisible(true)
            }
          />


          {/* PANTALLA */}

          <View
            style={styles.desktopScreenContainer}
          >

            <ActiveScreen
              navigation={navigation}
              route={{
                params: {
                  user,
                },
              }}
            />

          </View>

        </View>


        {/* ==================================================
            ADD MENU
        ================================================== */}

        <AddMenuModal
          visible={addMenuVisible}
          onClose={() =>
            setAddMenuVisible(false)
          }
          onAddPrenda={handleAddClothing}
          onAddOutfit={handleCreateOutfit}
        />


        {/* ==================================================
            SIDE MENU
        ================================================== */}

        <SideMenu
          visible={sideMenuVisible}
          user={user}
          onClose={() =>
            setSideMenuVisible(false)
          }
          onProfile={handleProfile}
          onAbout={handleAbout}
          onHelp={handleHelp}
          onLogout={handleLogout}
        />

      </View>
    );
  }


  // ==========================================================
  // VERSIÓN CELULAR
  // ==========================================================

  return (
    <View style={styles.mobileRoot}>

      <Tab.Navigator

        screenOptions={({ route: tabRoute }) => ({

          // --------------------------------------------------
          // HEADER
          // --------------------------------------------------

          headerShown: true,

          header: () => (
            <AppHeader
              title={
                TAB_HEADER_TITLES[
                  tabRoute.name
                ] || tabRoute.name
              }
              navigation={navigation}
              onOpenMenu={() =>
                setSideMenuVisible(true)
              }
            />
          ),


          // --------------------------------------------------
          // TAB BAR
          // --------------------------------------------------

          tabBarShowLabel: true,

          tabBarActiveTintColor:
            COLORS.primary,

          tabBarInactiveTintColor:
            '#A0A0A0',

          tabBarStyle:
            styles.tabBar,

          tabBarLabelStyle:
            styles.tabBarLabel,

          tabBarHideOnKeyboard: true,

        })}
      >


        {/* ==================================================
            INICIO
        ================================================== */}

        <Tab.Screen
          name="Inicio"
          component={HomeScreen}
          initialParams={{
            user,
          }}
          options={{
            tabBarIcon: ({
              color,
              size,
              focused,
            }) => (
              <Ionicons
                name={
                  focused
                    ? 'home'
                    : 'home-outline'
                }
                size={size}
                color={color}
              />
            ),
          }}
        />


        {/* ==================================================
            PRENDAS
        ================================================== */}

        <Tab.Screen
          name="Prendas"
          component={ClothingScreen}
          initialParams={{
            user,
          }}
          options={{
            tabBarIcon: ({
              color,
              size,
              focused,
            }) => (
              <Ionicons
                name={
                  focused
                    ? 'shirt'
                    : 'shirt-outline'
                }
                size={size}
                color={color}
              />
            ),
          }}
        />


        {/* ==================================================
            BOTÓN +
        ================================================== */}

        <Tab.Screen
          name="AddButton"
          component={EmptyScreen}
          options={{

            tabBarLabel: '',

            tabBarButton: () => (
              <TouchableOpacity
                style={
                  styles.addButtonContainer
                }
                activeOpacity={0.85}
                onPress={() =>
                  setAddMenuVisible(true)
                }
              >

                <View
                  style={styles.addButton}
                >

                  <Ionicons
                    name="add"
                    size={30}
                    color="#FFFFFF"
                  />

                </View>

              </TouchableOpacity>
            ),

          }}
        />


        {/* ==================================================
            OUTFITS
        ================================================== */}

        <Tab.Screen
          name="Outfits"
          component={MyOutfitsScreen}
          initialParams={{
            user,
          }}
          options={{
            tabBarIcon: ({
              color,
              size,
            }) => (
              <MaterialCommunityIcons
                name="hanger"
                size={size}
                color={color}
              />
            ),
          }}
        />


        {/* ==================================================
            MALETA
        ================================================== */}

        <Tab.Screen
          name="Maleta"
          component={PackingModeScreen}
          initialParams={{
            user,
          }}
          options={{
            tabBarIcon: ({
              color,
              size,
              focused,
            }) => (
              <Ionicons
                name={
                  focused
                    ? 'briefcase'
                    : 'briefcase-outline'
                }
                size={size}
                color={color}
              />
            ),
          }}
        />

      </Tab.Navigator>


      {/* ====================================================
          ADD MENU
      ==================================================== */}

      <AddMenuModal
        visible={addMenuVisible}
        onClose={() =>
          setAddMenuVisible(false)
        }
        onAddPrenda={handleAddClothing}
        onAddOutfit={handleCreateOutfit}
      />


      {/* ====================================================
          SIDE MENU
      ==================================================== */}

      <SideMenu
        visible={sideMenuVisible}
        user={user}
        onClose={() =>
          setSideMenuVisible(false)
        }
        onProfile={handleProfile}
        onAbout={handleAbout}
        onHelp={handleHelp}
        onLogout={handleLogout}
      />

    </View>
  );
}


// ============================================================
// PANTALLA VACÍA
// ============================================================

function EmptyScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor:
          COLORS.background,
      }}
    />
  );
}


// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  // ==========================================================
  // MOBILE
  // ==========================================================

  mobileRoot: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },


  // ==========================================================
  // HEADER
  // ==========================================================

  headerSafeArea: {
    backgroundColor:
      COLORS.primary,
  },

  header: {
    height: 70,

    backgroundColor:
      COLORS.primary,

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 20,
  },

  menuButton: {
    width: 42,
    height: 42,

    justifyContent:
      'center',

    alignItems:
      'center',
  },

  headerTitle: {
    flex: 1,

    textAlign: 'center',

    color: '#FFFFFF',

    fontSize: 18,

    fontFamily:
      'Poppins_600SemiBold',
  },

  avatarCircle: {
    width: 38,
    height: 38,

    borderRadius: 19,

    backgroundColor:
      'rgba(255,255,255,0.25)',

    justifyContent:
      'center',

    alignItems:
      'center',
  },


  // ==========================================================
  // TAB BAR
  // ==========================================================

  tabBar: {
    height: 68,

    backgroundColor:
      '#FFFFFF',

    borderTopWidth: 1,

    borderTopColor:
      '#EDE3F3',

    paddingTop: 6,

    paddingBottom: 7,
  },

  tabBarLabel: {
    fontSize: 10,

    fontFamily:
      'Poppins_400Regular',
  },


  // ==========================================================
  // BOTÓN +
  // ==========================================================

  addButtonContainer: {
    width: 70,

    top: -17,

    justifyContent:
      'center',

    alignItems:
      'center',
  },

  addButton: {
    width: 54,
    height: 54,

    borderRadius: 27,

    backgroundColor:
      COLORS.buttonDark,

    justifyContent:
      'center',

    alignItems:
      'center',

    shadowColor:
      '#000000',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.22,

    shadowRadius: 5,

    elevation: 6,
  },


  // ==========================================================
  // DESKTOP
  // ==========================================================

  desktopRoot: {
    flex: 1,

    flexDirection:
      'row',

    backgroundColor:
      COLORS.background,
  },

  desktopContentArea: {
    flex: 1,
  },

  desktopScreenContainer: {
    flex: 1,
  },


  // ==========================================================
  // SIDEBAR
  // ==========================================================

  sidebar: {
    width: 110,

    backgroundColor:
      '#FFFFFF',

    borderRightWidth: 1,

    borderRightColor:
      '#EDE3F3',

    paddingTop: 25,

    paddingBottom: 25,

    alignItems:
      'center',

    justifyContent:
      'space-between',
  },

  sidebarNavigation: {
    width: '100%',

    alignItems:
      'center',
  },

  sidebarItem: {
    width: 94,

    minHeight: 68,

    borderRadius: 14,

    alignItems:
      'center',

    justifyContent:
      'center',

    marginBottom: 10,
  },

  sidebarItemActive: {
    backgroundColor:
      COLORS.background,
  },

  sidebarLabel: {
    fontSize: 11,

    marginTop: 6,

    textAlign: 'center',
  },


  // ==========================================================
  // BOTÓN + DESKTOP
  // ==========================================================

  addButtonDesktop: {
    width: 52,
    height: 52,

    borderRadius: 26,

    backgroundColor:
      COLORS.buttonDark,

    justifyContent:
      'center',

    alignItems:
      'center',

    shadowColor:
      '#000000',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.22,

    shadowRadius: 5,

    elevation: 6,
  },

});