import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../theme/colours';
import { getUserHistory } from '../services/database';

export default function HistoryClothingScreen({ navigation, route }) {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 768;

  // Usuario recibido desde MainTabNavigator / navegación principal.
  const user = route?.params?.user;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // CARGAR HISTORIAL
  // ============================================================

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        setHistory([]);
        return;
      }

      const data = await getUserHistory(user.id);

      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log('Error al cargar historial:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Se carga cada vez que la pantalla vuelve a enfocarse.
  React.useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ============================================================
  // ÚLTIMO OUTFIT
  // ============================================================

  const lastHistoryEntry = history.length > 0 ? history[0] : null;

  // ============================================================
  // VOLVER
  // ============================================================

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  };

  // ============================================================
  // NAVEGACIÓN PRINCIPAL
  // ============================================================

  const navigateToMainSection = (section) => {
    try {
      // Si la sección existe directamente en el navegador actual.
      navigation.navigate(section, {
        user,
      });
      return;
    } catch (error) {
      // Si estamos dentro del MainTabNavigator,
      // intentamos navegar hacia Main.
    }

    try {
      navigation.navigate('Main', {
        screen: section,
        params: {
          user,
        },
      });
    } catch (error) {
      console.log(`No se pudo navegar a ${section}:`, error);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <View style={styles.container}>
        {isDesktop ? (
          <DesktopTopBar
            navigation={navigation}
            navigateToMainSection={navigateToMainSection}
          />
        ) : (
          <MobileHeader onBack={handleBack} />
        )}

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={COLORS.buttonDark}
          />

          <Text style={styles.loadingText}>
            Cargando historial...
          </Text>
        </View>

        {!isDesktop && (
          <MobileBottomNavigation
            navigation={navigation}
            user={user}
            navigateToMainSection={navigateToMainSection}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ========================================================
          PC
      ======================================================== */}

      {isDesktop && (
        <DesktopTopBar
          navigation={navigation}
          navigateToMainSection={navigateToMainSection}
        />
      )}

      <View style={isDesktop ? styles.desktopBody : styles.mobileBody}>

        {/* ======================================================
            SIDEBAR PC
        ====================================================== */}

        {isDesktop && (
          <DesktopSidebar
            navigation={navigation}
            user={user}
            navigateToMainSection={navigateToMainSection}
          />
        )}

        {/* ======================================================
            CONTENIDO
        ====================================================== */}

        <View style={styles.content}>

          {/* HEADER MOBILE */}

          {!isDesktop && (
            <MobileHeader onBack={handleBack} />
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              isDesktop
                ? styles.desktopScrollContent
                : styles.mobileScrollContent
            }
          >

            {/* ==================================================
                HISTORIAL VACÍO
            ================================================== */}

            {history.length === 0 ? (
              <EmptyHistory />
            ) : (

              <>
                {/* ==============================================
                    ÚLTIMO OUTFIT UTILIZADO
                ============================================== */}

                <LastUsedCard
                  historyEntry={lastHistoryEntry}
                  isDesktop={isDesktop}
                />

                {/* ==============================================
                    TÍTULO
                ============================================== */}

                <Text
                  style={
                    isDesktop
                      ? styles.desktopSectionTitle
                      : styles.mobileSectionTitle
                  }
                >
                  Outfits utilizados
                </Text>

                {/* ==============================================
                    LISTADO
                ============================================== */}

                <View
                  style={
                    isDesktop
                      ? styles.historyGrid
                      : styles.historyList
                  }
                >
                  {history.map((item) => (
                    <HistoryCard
                      key={item.id}
                      item={item}
                      isDesktop={isDesktop}
                    />
                  ))}
                </View>
              </>
            )}

          </ScrollView>
        </View>
      </View>

      {/* ========================================================
          NAVEGACIÓN MOBILE
      ======================================================== */}

      {!isDesktop && (
        <MobileBottomNavigation
          navigation={navigation}
          user={user}
          navigateToMainSection={navigateToMainSection}
        />
      )}

    </View>
  );
}

/* =============================================================
   HEADER PC
============================================================= */

function DesktopTopBar({
  navigation,
  navigateToMainSection,
}) {
  return (
    <View style={styles.desktopTopBar}>

      <Pressable
        style={styles.menuButton}
        onPress={() => {
          // El menú queda como elemento visual del mockup.
        }}
      >
        <Ionicons
          name="menu-outline"
          size={34}
          color="#FFFFFF"
        />
      </Pressable>

      <Text style={styles.desktopTitle}>
        Historial
      </Text>

      <Pressable
        style={styles.profileCircle}
        onPress={() => {
          try {
            navigation.navigate('Profile');
          } catch (error) {
            console.log('No se pudo abrir Profile:', error);
          }
        }}
      >
        <Ionicons
          name="person"
          size={24}
          color="#FFFFFF"
        />
      </Pressable>

    </View>
  );
}

/* =============================================================
   HEADER MOBILE
============================================================= */

function MobileHeader({ onBack }) {
  return (
    <View style={styles.mobileHeader}>

      <Pressable
        onPress={onBack}
        style={styles.backButton}
        hitSlop={10}
      >
        <Ionicons
          name="arrow-back"
          size={30}
          color="#FFFFFF"
        />
      </Pressable>

      <Text style={styles.mobileTitle}>
        Historial
      </Text>

    </View>
  );
}

/* =============================================================
   SIDEBAR PC
============================================================= */

function DesktopSidebar({
  navigation,
  user,
  navigateToMainSection,
}) {
  return (
    <View style={styles.sidebar}>

      <SidebarItem
        icon="home-outline"
        text="Inicio"
        onPress={() => navigateToMainSection('Inicio')}
      />

      <SidebarItem
        icon="shirt-outline"
        text="Prendas"
        onPress={() => navigateToMainSection('Prendas')}
      />

      <SidebarItem
        icon="shirt"
        text="Outfits"
        active
        onPress={() => navigateToMainSection('Outfits')}
      />

      <SidebarItem
        icon="briefcase-outline"
        text="Maleta"
        onPress={() => navigateToMainSection('Maleta')}
      />

      <Pressable
        style={styles.addButton}
        onPress={() => {
          try {
            navigation.navigate('CrearOutfit', { user });
          } catch (error) {
            try {
              navigation.navigate('Main', {
                screen: 'Outfits',
                params: { user },
              });
            } catch (e) {
              console.log('No se pudo abrir crear outfit:', e);
            }
          }
        }}
      >
        <Ionicons
          name="add"
          size={42}
          color="#FFFFFF"
        />
      </Pressable>

    </View>
  );
}

/* =============================================================
   ITEM SIDEBAR
============================================================= */

function SidebarItem({
  icon,
  text,
  active = false,
  onPress,
}) {
  return (
    <Pressable
      style={[
        styles.sidebarItem,
        active && styles.sidebarItemActive,
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={32}
        color={
          active
            ? COLORS.buttonDark
            : '#687084'
        }
      />

      <Text
        style={[
          styles.sidebarText,
          active && styles.sidebarTextActive,
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
}

/* =============================================================
   TARJETA ÚLTIMO OUTFIT
============================================================= */

function LastUsedCard({
  historyEntry,
  isDesktop,
}) {
  return (
    <View
      style={[
        styles.lastUsedCard,
        isDesktop
          ? styles.lastUsedCardDesktop
          : styles.lastUsedCardMobile,
      ]}
    >

      <View style={styles.lastUsedIconCircle}>
        <Ionicons
          name="time-outline"
          size={42}
          color={COLORS.buttonDark}
        />
      </View>

      <View style={styles.lastUsedInfo}>

        <Text style={styles.lastUsedTitle}>
          Último outfit utilizado
        </Text>

        <Text style={styles.lastUsedDate}>
          {formatLongDate(historyEntry?.date)}
        </Text>

      </View>

    </View>
  );
}

/* =============================================================
   TARJETA DE HISTORIAL
============================================================= */

function HistoryCard({
  item,
  isDesktop,
}) {
  return (
    <View
      style={[
        styles.historyCard,
        isDesktop
          ? styles.historyCardDesktop
          : styles.historyCardMobile,
      ]}
    >

      {/* IMAGEN */}

      <View
        style={
          isDesktop
            ? styles.historyImageContainerDesktop
            : styles.historyImageContainerMobile
        }
      >
        {item?.imageUri ? (
          <Image
            source={{ uri: item.imageUri }}
            style={styles.historyImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name="shirt-outline"
              size={42}
              color={COLORS.primary}
            />
          </View>
        )}
      </View>

      {/* INFORMACIÓN */}

      <View style={styles.historyInfo}>

        <Text
          style={styles.historyName}
          numberOfLines={2}
        >
          {item?.outfitName || 'Outfit sin nombre'}
        </Text>

        {/* FECHA */}

        <View style={styles.infoRow}>

          <Ionicons
            name="calendar-outline"
            size={22}
            color={COLORS.buttonDark}
          />

          <Text style={styles.infoText}>
            Usado el {formatShortDate(item?.date)}
          </Text>

        </View>

        {/* NOTA */}

        {!!item?.note && (
          <View style={styles.infoRow}>

            <Ionicons
              name="document-text-outline"
              size={22}
              color={COLORS.buttonDark}
            />

            <Text style={styles.infoText}>
              <Text style={styles.noteLabel}>
                Nota:
              </Text>{' '}
              {item.note}
            </Text>

          </View>
        )}

      </View>

    </View>
  );
}

/* =============================================================
   ESTADO VACÍO
============================================================= */

function EmptyHistory() {
  return (
    <View style={styles.emptyHistory}>

      <View style={styles.clockCircle}>
        <Ionicons
          name="time-outline"
          size={42}
          color={COLORS.buttonDark}
        />
      </View>

      <Text style={styles.emptyTitle}>
        Aún no hay outfits utilizados
      </Text>

      <Text style={styles.emptyText}>
        Cuando utilices un outfit, aparecerá aquí.
      </Text>

    </View>
  );
}

/* =============================================================
   NAVEGACIÓN MOBILE
============================================================= */

function MobileBottomNavigation({
  navigateToMainSection,
}) {
  return (
    <View style={styles.bottomNavigation}>

      <BottomItem
        icon="home-outline"
        text="Inicio"
        onPress={() => navigateToMainSection('Inicio')}
      />

      <BottomItem
        icon="shirt-outline"
        text="Prendas"
        onPress={() => navigateToMainSection('Prendas')}
      />

      <Pressable
        style={styles.mobileAddButtonContainer}
        onPress={() => navigateToMainSection('Outfits')}
      >
        <View style={styles.mobileAddButton}>
          <Ionicons
            name="add"
            size={36}
            color="#FFFFFF"
          />
        </View>
      </Pressable>

      <BottomItem
        icon="shirt"
        text="Outfits"
        active
        onPress={() => navigateToMainSection('Outfits')}
      />

      <BottomItem
        icon="briefcase-outline"
        text="Maleta"
        onPress={() => navigateToMainSection('Maleta')}
      />

    </View>
  );
}

/* =============================================================
   ITEM NAVEGACIÓN MOBILE
============================================================= */

function BottomItem({
  icon,
  text,
  active = false,
  onPress,
}) {
  return (
    <Pressable
      style={styles.bottomItem}
      onPress={onPress}
    >

      <Ionicons
        name={icon}
        size={25}
        color={
          active
            ? COLORS.buttonDark
            : '#687084'
        }
      />

      <Text
        style={[
          styles.bottomText,
          active && styles.bottomTextActive,
        ]}
      >
        {text}
      </Text>

    </Pressable>
  );
}

/* =============================================================
   FECHAS
============================================================= */

function formatShortDate(dateValue) {
  if (!dateValue) {
    return '--/--/----';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '--/--/----';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function formatLongDate(dateValue) {
  if (!dateValue) {
    return '--';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  const months = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];

  return `${date.getDate()} de ${
    months[date.getMonth()]
  } de ${date.getFullYear()}`;
}

/* =============================================================
   ESTILOS
============================================================= */

const styles = StyleSheet.create({

  /* ==========================================================
     GENERAL
  ========================================================== */

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    flex: 1,
  },

  desktopBody: {
    flex: 1,
    flexDirection: 'row',
  },

  mobileBody: {
    flex: 1,
  },

  /* ==========================================================
     HEADER PC
  ========================================================== */

  desktopTopBar: {
    height: 78,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  menuButton: {
    position: 'absolute',
    left: 34,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  desktopTitle: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
    fontSize: 22,
  },

  profileCircle: {
    position: 'absolute',
    right: 28,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ==========================================================
     SIDEBAR PC
  ========================================================== */

  sidebar: {
    width: 138,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingTop: 30,
    borderRightWidth: 1,
    borderRightColor: '#EEEEF4',
  },

  sidebarItem: {
    width: '100%',
    height: 105,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sidebarItemActive: {
    backgroundColor: '#FAF7FF',
  },

  sidebarText: {
    marginTop: 6,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#687084',
  },

  sidebarTextActive: {
    color: COLORS.buttonDark,
  },

  addButton: {
    marginTop: 18,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ==========================================================
     HEADER MOBILE
  ========================================================== */

  mobileHeader: {
    height: 72,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  backButton: {
    position: 'absolute',
    left: 22,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mobileTitle: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
    fontSize: 22,
  },

  /* ==========================================================
     SCROLL
  ========================================================== */

  desktopScrollContent: {
    paddingHorizontal: 44,
    paddingTop: 40,
    paddingBottom: 50,
  },

  mobileScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 30,
  },

  /* ==========================================================
     ÚLTIMO OUTFIT
  ========================================================== */

  lastUsedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,

    elevation: 3,
  },

  lastUsedCardDesktop: {
    minHeight: 122,
    paddingHorizontal: 20,
    marginBottom: 38,
  },

  lastUsedCardMobile: {
    minHeight: 138,
    paddingHorizontal: 18,
    marginBottom: 42,
  },

  lastUsedIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F2E9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },

  lastUsedInfo: {
    flex: 1,
  },

  lastUsedTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: COLORS.textDark,
    marginBottom: 3,
  },

  lastUsedDate: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: COLORS.buttonDark,
  },

  /* ==========================================================
     TÍTULOS
  ========================================================== */

  desktopSectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 21,
    color: COLORS.textDark,
    marginBottom: 18,
  },

  mobileSectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 21,
    color: COLORS.textDark,
    marginBottom: 18,
    marginLeft: 8,
  },

  /* ==========================================================
     GRILLA PC
  ========================================================== */

  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  historyCardDesktop: {
    width: '23.5%',
    minWidth: 220,
    marginBottom: 24,
  },

  /* ==========================================================
     LISTA MOBILE
  ========================================================== */

  historyList: {
    width: '100%',
  },

  historyCardMobile: {
    width: '100%',
    minHeight: 180,
    marginBottom: 18,
  },

  /* ==========================================================
     TARJETA GENERAL
  ========================================================== */

  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 7,

    elevation: 2,
    overflow: 'hidden',
  },

  /* ==========================================================
     IMÁGENES PC
  ========================================================== */

  historyImageContainerDesktop: {
    width: '100%',
    aspectRatio: 1.38,
    backgroundColor: '#F3F1F5',
    padding: 14,
  },

  /* ==========================================================
     IMÁGENES MOBILE
  ========================================================== */

  historyImageContainerMobile: {
    width: 195,
    height: 155,
    margin: 14,
    backgroundColor: '#F3F1F5',
    borderRadius: 12,
    overflow: 'hidden',
  },

  historyImage: {
    width: '100%',
    height: '100%',
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F1F5',
  },

  /* ==========================================================
     INFORMACIÓN
  ========================================================== */

  historyInfo: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    flex: 1,
  },

  historyCardMobile: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  historyName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: COLORS.textDark,
    marginBottom: 12,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 9,
  },

  infoText: {
    flex: 1,
    marginLeft: 9,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: '#687084',
  },

  noteLabel: {
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.buttonDark,
  },

  /* ==========================================================
     ESTADO VACÍO
  ========================================================== */

  emptyHistory: {
    minHeight: 520,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  clockCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#F2E9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  emptyTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },

  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#687084',
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 21,
  },

  /* ==========================================================
     LOADING
  ========================================================== */

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.textLight,
  },

  /* ==========================================================
     NAV MOBILE
  ========================================================== */

  bottomNavigation: {
    height: 76,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEF4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },

  bottomItem: {
    width: 58,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: '#687084',
    marginTop: 3,
  },

  bottomTextActive: {
    color: COLORS.buttonDark,
    fontFamily: 'Poppins_600SemiBold',
  },

  mobileAddButtonContainer: {
    width: 62,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mobileAddButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 5,

    elevation: 5,
  },

});