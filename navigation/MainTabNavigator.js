import React, {
  useCallback,
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
  BackHandler,
} from 'react-native';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import {
  useFocusEffect,
} from '@react-navigation/native';

import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import HomeScreen from '../screens/homeScreen';
import ClothingScreen from '../screens/clothingScreen';
import MyOutfitsScreen from '../screens/myoufitsScreen';
import SuitcasesScreen from '../screens/suitcasesScreen';

import PackingModeScreen from '../screens/packingModeScreen';

import AddMenuModal from '../components/AddMenuModal';
import SideMenu from '../components/sideMenu';
import ForceChangePasswordModal from '../components/ForceChangePasswordModal';
import { confirmLogout, logout } from '../services/session';
import { setUnauthorizedHandler } from '../services/api';
import { getUserById } from '../services/database';

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

    navigation.navigate('Main', {
      user,
      initialTab: tabName,
      navTs: Date.now(),
    });
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
    confirmLogout(navigation);
  };

  // ==========================================================
  // MOBILE
  // ==========================================================

  const renderMobileMenu = () => {
    // La pestaña activa viene de la prop activeTab (antes "Outfits"
    // estaba fijo y se marcaba siempre, también en Perfil, Agregar prenda, etc.)
    const tabColor = (tabName) =>
      activeTab === tabName ? COLORS.primary : COLORS.textDark;

    const tabLabelStyle = (tabName) => [
      styles.secondaryMobileLabel,
      activeTab === tabName && styles.secondaryMobileLabelActive,
    ];

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
            color={tabColor('Inicio')}
          />

          <Text style={tabLabelStyle('Inicio')}>
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
            color={tabColor('Prendas')}
          />

          <Text style={tabLabelStyle('Prendas')}>
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
            color={tabColor('Outfits')}
          />

          <Text style={tabLabelStyle('Outfits')}>
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
            color={tabColor('Maleta')}
          />

          <Text style={tabLabelStyle('Maleta')}>
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

// ============================================================
// USUARIO ACTUAL (se mantiene fresco)
//
// Los params de la ruta "Main" quedan con el usuario del login.
// Al editar el perfil, Main seguía mostrando el nombre/email viejos
// (Home: "¡Hola, NombreViejo!", menú lateral, etc.).
//
// Solución: Main guarda su propia copia del usuario y la actualiza
// cada vez que la pantalla vuelve a tener foco (por ejemplo al volver
// de Perfil / Editar perfil), consultando getUserById.
//
// mergeUser devuelve el MISMO objeto si no cambió nada, para no
// disparar efectos que dependen de `user` (ej. clima en Home).
// ============================================================

const USER_COMPARE_FIELDS = [
  'id',
  'name',
  'lastname',
  'email',
  'role',
  'status',
];

const mergeUser = (previous, next) => {
  if (!next) {
    return previous;
  }

  if (!previous || previous.id !== next.id) {
    return next;
  }

  const merged = { ...previous, ...next };

  const unchanged = USER_COMPARE_FIELDS.every(
    (field) => previous[field] === merged[field]
  );

  return unchanged ? previous : merged;
};


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

  const baseUser =
    userProp ||
    route?.params?.user ||
    null;

  const [
    user,
    setCurrentUser,
  ] = useState(baseUser);

  // Si llegan params nuevos (otro login, setParams, etc.)
  useEffect(() => {
    if (baseUser) {
      setCurrentUser((previous) =>
        mergeUser(previous, baseUser)
      );
    }
  }, [
    baseUser?.id,
    baseUser?.name,
    baseUser?.lastname,
    baseUser?.email,
  ]);

  // Al volver a esta pantalla (ej. después de editar el perfil),
  // se vuelve a leer el usuario.
  useFocusEffect(
    useCallback(() => {
      const userId = user?.id;

      if (!userId) {
        return undefined;
      }

      let active = true;

      (async () => {
        try {
          const fresh = await getUserById(userId);

          if (active && fresh) {
            setCurrentUser((previous) =>
              mergeUser(previous, fresh)
            );
          }
        } catch (error) {
          // Si falló (red, sesión vencida) se conserva el usuario actual.
          // La sesión vencida la maneja el handler global de abajo.
        }
      })();

      return () => {
        active = false;
      };
    }, [user?.id])
  );

  // Sesión vencida (401 del servidor estando logueado):
  // volver al login y avisar, en vez de mostrar "no tenés prendas".
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout(navigation);

      Alert.alert(
        'Sesión vencida',
        'Tu sesión expiró. Iniciá sesión nuevamente.'
      );
    });

    return () => setUnauthorizedHandler(null);
  }, [navigation]);


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

  const [
    mustChangePassword,
    setMustChangePassword,
  ] = useState(!!route?.params?.isTempPassword);

  const [
    tabNavKey,
    setTabNavKey,
  ] = useState(0);


  // Cambio de pestaña pedido desde otra pantalla (Perfil, Ayuda, Clima, etc.)
  useEffect(() => {
    const tab = route?.params?.initialTab;

    if (!tab) return;

    setActiveDesktopTab(tab);
    setMobileInitialTab(tab);
    setShowSuitcases(false);
    setTabNavKey((k) => k + 1);
  }, [
    route?.params?.initialTab,
    route?.params?.navTs,
  ]);


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


  const handleEditSuitcase = (
    suitcaseId
  ) => {
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
    confirmLogout(navigation);
  };


  // ==========================================================
  // BOTÓN ATRÁS DE ANDROID EN "MIS MALETAS"
  // ==========================================================

  useEffect(() => {
    if (
      !showSuitcases ||
      Platform.OS !== 'android'
    ) {
      return undefined;
    }

    const subscription =
      BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          setMobileInitialTab('Inicio');
          setShowSuitcases(false);
          return true;
        }
      );

    return () =>
      subscription.remove();
  }, [showSuitcases]);


  // ==========================================================
  // PANTALLA MIS MALETAS
  // ==========================================================

  if (showSuitcases) {
    if (isDesktop) {
      return (
        <View style={styles.desktopRoot}>

          <AppHeader
            title="Mis maletas"
            onBack={() => {
              setMobileInitialTab('Inicio');
              setShowSuitcases(false);
            }}
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
          onBack={() => {
            setMobileInitialTab('Inicio');
            setShowSuitcases(false);
          }}
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
              setMobileInitialTab('Inicio');
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
              setMobileInitialTab('Prendas');
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
              setMobileInitialTab('Outfits');
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
            onPress={() => {
              setEditingSuitcaseId(null);
              setMobileInitialTab('Maleta');
              setShowSuitcases(false);
            }}
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

        <ForceChangePasswordModal
          visible={mustChangePassword}
          user={user}
          onDone={() =>
            setMustChangePassword(false)
          }
        />


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
          style={
            styles.desktopMain
          }
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
              onExitEdit={() => {
                setEditingSuitcaseId(null);
                setMobileInitialTab('Inicio');
              }}
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
      <ForceChangePasswordModal
        visible={mustChangePassword}
        user={user}
        onDone={() =>
          setMustChangePassword(false)
        }
      />


      <Tab.Navigator
        key={tabNavKey}
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
              onExitEdit={() => {
                setEditingSuitcaseId(null);
                setMobileInitialTab('Inicio');
              }}
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