import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
  Alert,
    Platform, 
} from 'react-native';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import WeatherRecScreen from '../screens/weatherRecScreen';
import HomeScreen from '../screens/homeScreen';
import ClothingScreen from '../screens/clothingScreen';
import MyOutfitsScreen from '../screens/myoufitsScreen';
import SuitcasesScreen from '../screens/suitcasesScreen';

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
// HEADER PRINCIPAL
// ============================================================

export function AppHeader({
  title,
  onOpenMenu,
  onOpenProfile,
  onBack,
}) {
  return (
    <SafeAreaView
      style={styles.safeHeader}
    >
      <View
        style={styles.header}
      >

        {/* MENÚ / VOLVER */}
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onBack || onOpenMenu}
          activeOpacity={0.75}
        >
          <Ionicons
            name={
              onBack
                ? 'arrow-back'
                : 'menu-outline'
            }
            size={onBack ? 26 : 30}
            color="#FFFFFF"
          />
        </TouchableOpacity>


        {/* TÍTULO */}
        <Text
          style={styles.headerTitle}
          numberOfLines={1}
        >
          {title}
        </Text>


      {onOpenProfile ? (
  <TouchableOpacity
    style={styles.profileButton}
    onPress={onOpenProfile}
    activeOpacity={0.8}
  >
    <View style={styles.profileCircle}>
      <Ionicons
        name="person-outline"
        size={21}
        color={COLORS.buttonDark}
      />
    </View>
  </TouchableOpacity>
) : (
  <View style={styles.profileButton} />
)}

      </View>
    </SafeAreaView>
  );
}


// ============================================================
// SIDEBAR DESKTOP
// ============================================================

export function DesktopSidebar({
  activeTab,
  onChangeTab,
  onOpenAddMenu,
}) {
  return (
    <View
      style={styles.desktopSidebar}
    >

      {/* INICIO */}
      <TouchableOpacity
        style={[
          styles.desktopSidebarItem,
          activeTab === 'Inicio' &&
            styles.desktopSidebarItemActive,
        ]}
        onPress={() =>
          onChangeTab('Inicio')
        }
        activeOpacity={0.75}
      >
        <Ionicons
          name="home-outline"
          size={28}
          color={
            activeTab === 'Inicio'
              ? COLORS.primary
              : COLORS.textDark
          }
        />

        <Text
          style={[
            styles.desktopSidebarText,
            activeTab === 'Inicio' &&
              styles.desktopSidebarTextActive,
          ]}
        >
          Inicio
        </Text>
      </TouchableOpacity>


      {/* PRENDAS */}
      <TouchableOpacity
        style={[
          styles.desktopSidebarItem,
          activeTab === 'Prendas' &&
            styles.desktopSidebarItemActive,
        ]}
        onPress={() =>
          onChangeTab('Prendas')
        }
        activeOpacity={0.75}
      >
        <Ionicons
          name="shirt-outline"
          size={28}
          color={
            activeTab === 'Prendas'
              ? COLORS.primary
              : COLORS.textDark
          }
        />

        <Text
          style={[
            styles.desktopSidebarText,
            activeTab === 'Prendas' &&
              styles.desktopSidebarTextActive,
          ]}
        >
          Prendas
        </Text>
      </TouchableOpacity>


      {/* OUTFITS */}
      <TouchableOpacity
        style={[
          styles.desktopSidebarItem,
          activeTab === 'Outfits' &&
            styles.desktopSidebarItemActive,
        ]}
        onPress={() =>
          onChangeTab('Outfits')
        }
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons
          name="hanger"
          size={29}
          color={
            activeTab === 'Outfits'
              ? COLORS.primary
              : COLORS.textDark
          }
        />

        <Text
          style={[
            styles.desktopSidebarText,
            activeTab === 'Outfits' &&
              styles.desktopSidebarTextActive,
          ]}
        >
          Outfits
        </Text>
      </TouchableOpacity>


      {/* MALETA */}
      <TouchableOpacity
        style={[
          styles.desktopSidebarItem,
          activeTab === 'Maleta' &&
            styles.desktopSidebarItemActive,
        ]}
        onPress={() =>
          onChangeTab('Maleta')
        }
        activeOpacity={0.75}
      >
        <Ionicons
          name="briefcase-outline"
          size={28}
          color={
            activeTab === 'Maleta'
              ? COLORS.primary
              : COLORS.textDark
          }
        />

        <Text
          style={[
            styles.desktopSidebarText,
            activeTab === 'Maleta' &&
              styles.desktopSidebarTextActive,
          ]}
        >
          Maleta
        </Text>
      </TouchableOpacity>


      {/* ESPACIADOR */}
      <View
        style={styles.sidebarSpacer}
      />


      {/* BOTÓN + */}
      <TouchableOpacity
        style={styles.desktopAddButton}
        onPress={onOpenAddMenu}
        activeOpacity={0.8}
      >
        <Ionicons
          name="add"
          size={34}
          color="#FFFFFF"
        />
      </TouchableOpacity>

    </View>
  );
}


// ============================================================
// BOTÓN CENTRAL MOBILE
// ============================================================

export function MobileAddButton({
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.mobileAddButtonContainer}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View
        style={styles.mobileAddButton}
      >
        <Ionicons
          name="add"
          size={32}
          color="#FFFFFF"
        />
      </View>
    </TouchableOpacity>
  );
}

// ============================================================
// LAYOUT PARA PANTALLAS SECUNDARIAS
// Crear Outfit / Detalle de Outfit
// ============================================================

export function OutfitScreenLayout({
  title,
  navigation,
  user,
  activeTab = 'Outfits',
  children,
}) {
  const { width } = useWindowDimensions();

  const isDesktop = width > 768;

  const [
    addMenuVisible,
    setAddMenuVisible,
  ] = useState(false);

  const [
    sideMenuVisible,
    setSideMenuVisible,
  ] = useState(false);

  // ==========================================================
  // NAVEGACIÓN PRINCIPAL
  // ==========================================================

  const goToMainTab = (tabName) => {
  setSideMenuVisible(false);

  navigation.navigate(
    'Main',
    {
      user,
      initialTab: tabName,
    }
  );
};

  // ==========================================================
  // MENÚ AGREGAR
  // ==========================================================

  const handleOpenAddMenu = () => {
    setAddMenuVisible(true);
  };

  const handleCloseAddMenu = () => {
    setAddMenuVisible(false);
  };

  const handleAddClothing = () => {
    setAddMenuVisible(false);

    navigation.navigate(
      'AddClothing',
      {
        user,
      }
    );
  };

  const handleCreateOutfit = () => {
    setAddMenuVisible(false);

    navigation.navigate(
      'CreateOutfit',
      {
        user,
      }
    );
  };

  // ==========================================================
  // MENÚ LATERAL
  // ==========================================================

  const handleOpenSideMenu = () => {
    setSideMenuVisible(true);
  };

  const handleCloseSideMenu = () => {
    setSideMenuVisible(false);
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
  // ACERCA DE
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

    const doLogout = () => {
      navigation.replace('Login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Querés cerrar sesión?')) {
        doLogout();
      }
      return;
    }

    Alert.alert(
      'Cerrar sesión',
      '¿Querés cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: doLogout },
      ]
    );
  };

  // ==========================================================
  // MOBILE
  // ==========================================================

  const renderMobileMenu = () => {
    return (
      <View style={styles.secondaryMobileBar}>

        {/* INICIO */}
        <TouchableOpacity
          style={styles.secondaryMobileItem}
          onPress={() => goToMainTab('Inicio')}
          activeOpacity={0.75}
        >
          <Ionicons
            name="home-outline"
            size={23}
            color={COLORS.textDark}
          />

          <Text style={styles.secondaryMobileLabel}>
            Inicio
          </Text>
        </TouchableOpacity>


        {/* PRENDAS */}
        <TouchableOpacity
          style={styles.secondaryMobileItem}
          onPress={() => goToMainTab('Prendas')}
          activeOpacity={0.75}
        >
          <Ionicons
            name="shirt-outline"
            size={23}
            color={COLORS.textDark}
          />

          <Text style={styles.secondaryMobileLabel}>
            Prendas
          </Text>
        </TouchableOpacity>


        {/* AGREGAR */}
        <TouchableOpacity
          style={styles.secondaryMobileAddContainer}
          onPress={handleOpenAddMenu}
          activeOpacity={0.85}
        >
          <View style={styles.secondaryMobileAddButton}>
            <Ionicons
              name="add"
              size={31}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>


        {/* OUTFITS */}
        <TouchableOpacity
          style={styles.secondaryMobileItem}
          onPress={() => goToMainTab('Outfits')}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons
            name="hanger"
            size={24}
            color={COLORS.primary}
          />

          <Text
            style={[
              styles.secondaryMobileLabel,
              styles.secondaryMobileLabelActive,
            ]}
          >
            Outfits
          </Text>
        </TouchableOpacity>


{/* MALETA */}
<TouchableOpacity
  style={styles.secondaryMobileItem}
  onPress={() => goToMainTab('Maleta')}
  activeOpacity={0.75}
>
          <Ionicons
            name="briefcase-outline"
            size={23}
            color={COLORS.textDark}
          />

          <Text style={styles.secondaryMobileLabel}>
            Maleta
          </Text>
        </TouchableOpacity>

      </View>
    );
  };
    
  // ==========================================================
  // DESKTOP
  // ==========================================================

  if (isDesktop) {
    return (
      <View style={styles.secondaryScreenRoot}>

        {/* HEADER */}
        <AppHeader
          title={title}
          onBack={() => navigation.goBack()}
          onOpenProfile={handleProfile}
        />


        {/* CUERPO */}
        <View style={styles.desktopMain}>

          {/* MENÚ LATERAL */}
          <DesktopSidebar
            activeTab={activeTab}
            onChangeTab={goToMainTab}
            onOpenAddMenu={handleOpenAddMenu}
          />


          {/* CONTENIDO */}
          <View style={styles.desktopContent}>
            {children}
          </View>

        </View>


        {/* MENÚ AGREGAR */}
        <AddMenuModal
          visible={addMenuVisible}
          onClose={handleCloseAddMenu}
          onAddPrenda={handleAddClothing}
          onAddOutfit={handleCreateOutfit}
        />


        {/* SIDE MENU */}
        <SideMenu
          visible={sideMenuVisible}
          onClose={handleCloseSideMenu}
          onProfile={handleProfile}
          onAbout={handleAbout}
          onHelp={handleHelp}
          onLogout={handleLogout}
          user={user}
        />

      </View>
    );
  }


  // ==========================================================
  // MOBILE
  // ==========================================================

  return (
    <View style={styles.secondaryScreenRoot}>

      {/* HEADER */}
      <AppHeader
        title={title}
        onBack={() => navigation.goBack()}
        onOpenProfile={handleProfile}
      />


      {/* CONTENIDO */}
      <View style={styles.secondaryMobileContent}>
        {children}
      </View>


      {/* MENÚ INFERIOR */}
      {renderMobileMenu()}


      {/* MENÚ AGREGAR */}
      <AddMenuModal
        visible={addMenuVisible}
        onClose={handleCloseAddMenu}
        onAddPrenda={handleAddClothing}
        onAddOutfit={handleCreateOutfit}
      />


      {/* SIDE MENU */}
      <SideMenu
        visible={sideMenuVisible}
        onClose={handleCloseSideMenu}
        onProfile={handleProfile}
        onAbout={handleAbout}
        onHelp={handleHelp}
        onLogout={handleLogout}
        user={user}
      />

    </View>
  );
}
// ============================================================
// MAIN TAB NAVIGATOR
// ============================================================

export default function MainTabNavigator({
  user: userProp,
  navigation,
  route,
}) {

  // ==========================================================
  // USUARIO ACTUAL
  // ==========================================================
  //
  // El usuario puede llegar:
  //
  // 1. Como prop directa:
  //    <MainTabNavigator user={user} />
  //
  // 2. Como parámetro de navegación:
  //    navigation.navigate('MainTabs', {
  //      user,
  //    })
  //
  // Usamos ambas posibilidades para evitar perder
  // la sesión cuando cambia la forma en que se monta
  // este navegador.
  //
  const user =
    userProp ||
    route?.params?.user ||
    null;


  const {
    width,
  } = useWindowDimensions();

  const isDesktop =
    width > 768;


  // ==========================================================
  // ESTADO DESKTOP
  // ==========================================================

const [
  activeDesktopTab,
  setActiveDesktopTab,
] = useState(
  route?.params?.initialTab || 'Inicio'
);
useEffect(() => {
  if (route?.params?.initialTab) {
    setActiveDesktopTab(
      route.params.initialTab
    );
  }
}, [
  route?.params?.initialTab,
]);

const [
  showSuitcases,
  setShowSuitcases,
] = useState(false);
const [
  editingSuitcaseId,
  setEditingSuitcaseId,
] = useState(null);
const [
  mobileInitialTab,
  setMobileInitialTab,
] = useState('Inicio');
  // ==========================================================
  // ESTADO MENÚ AGREGAR
  // ==========================================================

  const [
    addMenuVisible,
    setAddMenuVisible,
  ] = useState(false);


  // ==========================================================
  // ESTADO SIDE MENU
  // ==========================================================

  const [
    sideMenuVisible,
    setSideMenuVisible,
  ] = useState(false);


  // ==========================================================
  // CAMBIAR TAB DESKTOP
  // ==========================================================

  const handleDesktopTabChange = (
  tabName
) => {
  if (tabName === 'Maleta') {
    setEditingSuitcaseId(null);
  }

  setActiveDesktopTab(
    tabName
  );
};
const handleEditSuitcase = (suitcaseId) => {
  if (!suitcaseId) {
    return;
  }

  setEditingSuitcaseId(suitcaseId);
  setShowSuitcases(false);
  setActiveDesktopTab('Maleta');
  setMobileInitialTab('Maleta');
};


  // ==========================================================
  // ABRIR MENÚ AGREGAR
  // ==========================================================

  const handleOpenAddMenu = () => {
    setAddMenuVisible(true);
  };


  // ==========================================================
  // CERRAR MENÚ AGREGAR
  // ==========================================================

  const handleCloseAddMenu = () => {
    setAddMenuVisible(false);
  };


  // ==========================================================
  // ABRIR SIDE MENU
  // ==========================================================

  const handleOpenSideMenu = () => {
    setSideMenuVisible(true);
  };


  // ==========================================================
  // CERRAR SIDE MENU
  // ==========================================================

  const handleCloseSideMenu = () => {
    setSideMenuVisible(false);
  };


  // ==========================================================
  // AGREGAR PRENDA
  // ==========================================================

  const handleAddClothing = () => {
    setAddMenuVisible(false);

    if (
      navigation?.navigate
    ) {
      navigation.navigate(
        'AddClothing',
        {
          user,
        }
      );
    }
  };


  // ==========================================================
  // CREAR OUTFIT
  // ==========================================================

  const handleCreateOutfit = () => {
    setAddMenuVisible(false);

    if (
      navigation?.navigate
    ) {
      navigation.navigate(
        'CreateOutfit',
        {
          user,
        }
      );
    }
  };


  // ==========================================================
  // PERFIL
  // ==========================================================

  const handleProfile = () => {
    setSideMenuVisible(false);

    if (
      navigation?.navigate
    ) {
      navigation.navigate(
        'Profile',
        {
          user,
        }
      );
    }
  };


  // ==========================================================
// ACERCA DE
// ==========================================================

const handleAbout = () => {
  setSideMenuVisible(false);

  if (
    navigation?.navigate
  ) {
    navigation.navigate(
      'AboutApp',
      {
        user,
      }
    );
  }
};


// ==========================================================
// AYUDA
// ==========================================================

const handleHelp = () => {
  setSideMenuVisible(false);

  if (
    navigation?.navigate
  ) {
    navigation.navigate(
      'Help',
      {
        user,
      }
    );
  }
};
  // ==========================================================
  // CERRAR SESIÓN
  // ==========================================================
  const handleLogout = () => {
    setSideMenuVisible(false);

    const doLogout = () => {
      if (navigation?.replace) {
        navigation.replace('Login');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Querés cerrar sesión?')) {
        doLogout();
      }
      return;
    }

    Alert.alert(
      'Cerrar sesión',
      '¿Querés cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: doLogout },
      ]
    );
  };

// ==========================================================
// PANTALLA MIS MALETAS
// ==========================================================

if (showSuitcases) {
  if (isDesktop) {
    return (
      <View style={styles.desktopRoot}>

        <AppHeader
          title="Mis maletas"
          onBack={() => setShowSuitcases(false)}
        />

        <View style={styles.desktopMain}>

          <DesktopSidebar
            activeTab="Inicio"
            onChangeTab={(tabName) => {
              setShowSuitcases(false);
              handleDesktopTabChange(tabName);
            }}
            onOpenAddMenu={handleOpenAddMenu}
          />

          <View style={styles.desktopContent}>

            <SuitcasesScreen
              navigation={navigation}
              route={{
                params: {
                  user,
                },
              }}
              user={user}
              embedded
                onEditSuitcase={handleEditSuitcase}
            />

          </View>

        </View>

        <AddMenuModal
          visible={addMenuVisible}
          onClose={handleCloseAddMenu}
          onAddPrenda={handleAddClothing}
          onAddOutfit={handleCreateOutfit}
        />

        <SideMenu
          visible={sideMenuVisible}
          onClose={handleCloseSideMenu}
          onProfile={handleProfile}
          onAbout={handleAbout}
          onHelp={handleHelp}
          onLogout={handleLogout}
          user={user}
        />

      </View>
    );
  }

  return (
    <View style={styles.secondaryScreenRoot}>

      <AppHeader
        title="Mis maletas"
        onBack={() => setShowSuitcases(false)}
      />

      <View style={styles.secondaryMobileContent}>

        <SuitcasesScreen
          navigation={navigation}
          route={{
            params: {
              user,
            },
          }}
          user={user}
          embedded
            onEditSuitcase={handleEditSuitcase}
        />

      </View>

      <View style={styles.secondaryMobileBar}>

        <TouchableOpacity
          style={styles.secondaryMobileItem}
          onPress={() => {
            setShowSuitcases(false);
          }}
          activeOpacity={0.75}
        >
          <Ionicons
            name="home-outline"
            size={23}
            color={COLORS.textDark}
          />

          <Text style={styles.secondaryMobileLabel}>
            Inicio
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryMobileItem}
          onPress={() => {
            setShowSuitcases(false);
          }}
          activeOpacity={0.75}
        >
          <Ionicons
            name="shirt-outline"
            size={23}
            color={COLORS.textDark}
          />

          <Text style={styles.secondaryMobileLabel}>
            Prendas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryMobileAddContainer}
          onPress={handleOpenAddMenu}
          activeOpacity={0.85}
        >
          <View style={styles.secondaryMobileAddButton}>
            <Ionicons
              name="add"
              size={31}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryMobileItem}
          onPress={() => {
            setShowSuitcases(false);
          }}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons
            name="hanger"
            size={24}
            color={COLORS.textDark}
          />

          <Text style={styles.secondaryMobileLabel}>
            Outfits
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryMobileItem}
          activeOpacity={0.75}
        >
          <Ionicons
            name="briefcase-outline"
            size={23}
            color={COLORS.primary}
          />

          <Text
            style={[
              styles.secondaryMobileLabel,
              styles.secondaryMobileLabelActive,
            ]}
          >
            Maleta
          </Text>
        </TouchableOpacity>

      </View>

      <AddMenuModal
        visible={addMenuVisible}
        onClose={handleCloseAddMenu}
        onAddPrenda={handleAddClothing}
        onAddOutfit={handleCreateOutfit}
      />

      <SideMenu
        visible={sideMenuVisible}
        onClose={handleCloseSideMenu}
        onProfile={handleProfile}
        onAbout={handleAbout}
        onHelp={handleHelp}
        onLogout={handleLogout}
        user={user}
      />

    </View>
  );
}
  // ==========================================================
  // SCREEN DESKTOP ACTIVA
  // ==========================================================

  let ActiveScreen =
    HomeScreen;

  let activeTitle =
    TAB_HEADER_TITLES.Inicio;


  if (
    activeDesktopTab ===
    'Prendas'
  ) {
    ActiveScreen =
      ClothingScreen;

    activeTitle =
      TAB_HEADER_TITLES.Prendas;
  }


  if (
    activeDesktopTab ===
    'Outfits'
  ) {
    ActiveScreen =
      MyOutfitsScreen;

    activeTitle =
      TAB_HEADER_TITLES.Outfits;
  }


  if (
    activeDesktopTab ===
    'Maleta'
  ) {
    ActiveScreen =
      PackingModeScreen;

    activeTitle =
      TAB_HEADER_TITLES.Maleta;
  }


  // ==========================================================
  // DESKTOP
  // ==========================================================

  if (isDesktop) {
    return (
      <View
        style={styles.desktopRoot}
      >

        {/* HEADER */}
        <AppHeader
          title={activeTitle}
          onOpenMenu={
            handleOpenSideMenu
          }
          onOpenProfile={
            handleProfile
          }
        />


        {/* CUERPO */}
        <View
          style={styles.desktopMain}
        >

          {/* SIDEBAR */}
          <DesktopSidebar
  activeTab={activeDesktopTab}
  onChangeTab={(tabName) => {
    if (tabName === 'Maleta') {
      setEditingSuitcaseId(null);
    }
    handleDesktopTabChange(tabName);
  }}
  onOpenAddMenu={handleOpenAddMenu}
/>


          {/* CONTENIDO */}
          <View
            style={
              styles.desktopContent
            }
          >
   <ActiveScreen
  navigation={
    navigation
  }
route={{
  params: {
    user,
    suitcaseId: editingSuitcaseId,
  },
}}
  user={user}
  onNavigateToClothing={() =>
    handleDesktopTabChange('Prendas')
  }
  onNavigateToOutfits={() =>
    handleDesktopTabChange('Outfits')
  }
  onNavigateToSuitcases={() =>
  setShowSuitcases(true)
}
/>
          </View>

        </View>


        {/* MENÚ AGREGAR */}
      <AddMenuModal
  visible={addMenuVisible}
  onClose={handleCloseAddMenu}
  onAddPrenda={handleAddClothing}
  onAddOutfit={handleCreateOutfit}
/>

        {/* SIDE MENU */}
        <SideMenu
          visible={
            sideMenuVisible
          }
          onClose={
            handleCloseSideMenu
          }
          onProfile={
            handleProfile
          }
          onAbout={
            handleAbout
          }
          onHelp={
            handleHelp
          }
          onLogout={
            handleLogout
          }
          user={user}
        />

      </View>
    );
  }


  // ==========================================================
  // MOBILE
  // ==========================================================

  return (
    <>
      <Tab.Navigator
       initialRouteName={mobileInitialTab}
        screenOptions={{
          headerShown: true,

         header: ({ route }) => (
  <AppHeader
    title={
      TAB_HEADER_TITLES[route?.name] ||
      route?.name ||
      'Inicio'
    }
    onOpenMenu={
      handleOpenSideMenu
    }
    onOpenProfile={
      handleProfile
    }
  />
),

          tabBarShowLabel: true,

          tabBarActiveTintColor:
            COLORS.primary,

          tabBarInactiveTintColor:
            COLORS.textLight,

          tabBarStyle:
            styles.mobileTabBar,

          tabBarLabelStyle:
            styles.mobileTabLabel,
        }}
      >

        {/* ====================================================
            INICIO
            ==================================================== */}

<Tab.Screen
  name="Inicio"
  options={{
    tabBarIcon: ({
      color,
      size,
    }) => (
      <Ionicons
        name="home-outline"
        size={size}
        color={color}
      />
    ),
  }}
>
  {({ navigation: tabNavigation }) => (
    <HomeScreen
      navigation={navigation}
      route={{
        params: {
          user,
        },
      }}
      user={user}
      onNavigateToClothing={() =>
        tabNavigation.navigate('Prendas')
      }
      onNavigateToOutfits={() =>
        tabNavigation.navigate('Outfits')
      }
      onNavigateToSuitcases={() =>
        setShowSuitcases(true)
      }
    />
  )}
</Tab.Screen>


        {/* ====================================================
            PRENDAS
            ==================================================== */}

        <Tab.Screen
          name="Prendas"
          options={{
            tabBarIcon: ({
              color,
              size,
            }) => (
              <Ionicons
                name="shirt-outline"
                size={size}
                color={color}
              />
            ),
          }}
        >
          {() => (
            <ClothingScreen
              navigation={
                navigation
              }
              route={{
                params: {
                  user,
                },
              }}
              user={user}
            />
          )}
        </Tab.Screen>


        {/* ====================================================
            BOTÓN +
            ==================================================== */}

        <Tab.Screen
          name="Agregar"
          options={{
            tabBarButton: () => (
              <MobileAddButton
                onPress={
                  handleOpenAddMenu
                }
              />
            ),
            tabBarLabel: '',
          }}
        >
          {() => null}
        </Tab.Screen>


        {/* ====================================================
            OUTFITS
            ==================================================== */}

        <Tab.Screen
          name="Outfits"
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
        >
          {() => (
            <MyOutfitsScreen
              navigation={
                navigation
              }
              route={{
                params: {
                  user,
                },
              }}
              user={user}
            />
          )}
        </Tab.Screen>


        {/* ====================================================
            MALETA
            ==================================================== */}

        <Tab.Screen
          name="Maleta"
          listeners={{
  tabPress: () => {
    setEditingSuitcaseId(null);
  },
}}
          options={{
            tabBarIcon: ({
              color,
              size,
            }) => (
              <Ionicons
                name="briefcase-outline"
                size={size}
                color={color}
              />
            ),
          }}
        >
          {() => (
         <PackingModeScreen
  navigation={navigation}
  route={{
    params: {
      user,
      suitcaseId: editingSuitcaseId,
    },
  }}
  user={user}
/>
          )}
        </Tab.Screen>

      </Tab.Navigator>


      {/* ======================================================
          MENÚ AGREGAR
          ====================================================== */}

      
 <AddMenuModal
  visible={addMenuVisible}
  onClose={handleCloseAddMenu}
  onAddPrenda={handleAddClothing}
  onAddOutfit={handleCreateOutfit}
/>


      {/* ======================================================
          SIDE MENU
          ====================================================== */}

      <SideMenu
        visible={
          sideMenuVisible
        }
        onClose={
          handleCloseSideMenu
        }
        onProfile={
          handleProfile
        }
        onAbout={
          handleAbout
        }
        onHelp={
          handleHelp
        }
        onLogout={
          handleLogout
        }
        user={user}
      />

    </>
  );
}


// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  // ==========================================================
  // PANTALLAS SECUNDARIAS
  // ==========================================================

  secondaryScreenRoot: {
    flex: 1,
    backgroundColor: '#FAF8FC',
  },

  secondaryMobileContent: {
    flex: 1,
    backgroundColor: '#FAF8FC',
  },

  secondaryMobileBar: {
    height: 78,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE7F2',
    paddingHorizontal: 4,
  },

  secondaryMobileItem: {
    flex: 1,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryMobileLabel: {
    marginTop: 3,
    color: COLORS.textDark,
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
  },

  secondaryMobileLabelActive: {
    color: COLORS.primary,
    fontFamily: 'Poppins_600SemiBold',
  },

  secondaryMobileAddContainer: {
    width: 74,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryMobileAddButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    elevation: 5,
  },
  // ==========================================================
  // HEADER
  // ==========================================================

  safeHeader: {
    backgroundColor:
      COLORS.primary,
  },

  header: {
    height: 82,
    backgroundColor:
      COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },

  headerButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily:
      'Poppins_400Regular',
  },

  profileButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:
      '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },


  // ==========================================================
  // DESKTOP
  // ==========================================================

  desktopRoot: {
    flex: 1,
    backgroundColor:
      '#FAF8FC',
  },

  desktopMain: {
    flex: 1,
    flexDirection: 'row',
  },

  desktopSidebar: {
    width: 140,
    backgroundColor:
      '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor:
      '#EEE7F2',
    paddingTop: 24,
    paddingBottom: 25,
    alignItems: 'center',
  },

  desktopSidebarItem: {
    width: '100%',
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  desktopSidebarItemActive: {
    backgroundColor:
      '#F7F0FB',
  },

  desktopSidebarText: {
    color:
      COLORS.textDark,
    fontSize: 12,
    fontFamily:
      'Poppins_400Regular',
  },

  desktopSidebarTextActive: {
    color:
      COLORS.primary,
    fontFamily:
      'Poppins_600SemiBold',
  },

  sidebarSpacer: {
    flex: 1,
  },

  desktopAddButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor:
      COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  desktopContent: {
    flex: 1,
    overflow: 'hidden',
  },


  // ==========================================================
  // MOBILE
  // ==========================================================

  mobileTabBar: {
    height: 78,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor:
      '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor:
      '#EEE7F2',
  },

  mobileTabLabel: {
    fontSize: 11,
    fontFamily:
      'Poppins_400Regular',
  },

  mobileAddButtonContainer: {
    width: 74,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mobileAddButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor:
      COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    elevation: 5,
  },

});


// ============================================================
// ESTILOS COMPARTIDOS
//
// Se exportan para que otras pantallas que no forman parte
// del Tab.Navigator (por ejemplo WeatherRecScreen) puedan
// reconstruir una barra inferior o un sidebar visualmente
// idénticos, sin duplicar valores a mano.
// ============================================================

export { styles as mainNavStyles };