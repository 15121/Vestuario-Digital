import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colours';

export default function AboutAppScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  // Usuario recibido desde la navegación, si existe.
  const user = route?.params?.user;

  // ----------------------------------------------------------
  // VOLVER
  // ----------------------------------------------------------
  const handleGoBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  };

  // ----------------------------------------------------------
  // NAVEGACIÓN DEL SIDEBAR EN ESCRITORIO
  // ----------------------------------------------------------
  const navigateTo = (screen) => {
    try {
      navigation.navigate(screen, { user });
    } catch (error) {
      // Si la pantalla pertenece a MainTabNavigator,
      // intentamos volver al navegador principal.
      try {
        navigation.navigate('Main', {
          screen,
          params: { user },
        });
      } catch (e) {
        console.log(`No se pudo navegar a ${screen}:`, e);
      }
    }
  };

  // ----------------------------------------------------------
  // SIDEBAR DESKTOP
  // ----------------------------------------------------------
  const DesktopSidebar = () => (
    <View style={styles.sidebar}>
      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => navigateTo('Inicio')}
      >
        <Ionicons
          name="home-outline"
          size={25}
          color="#A0A0A0"
        />
        <Text style={styles.sidebarLabel}>Inicio</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => navigateTo('Prendas')}
      >
        <Ionicons
          name="shirt-outline"
          size={25}
          color="#A0A0A0"
        />
        <Text style={styles.sidebarLabel}>Prendas</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => navigateTo('Outfits')}
      >
        <MaterialCommunityIcons
          name="hanger"
          size={26}
          color="#A0A0A0"
        />
        <Text style={styles.sidebarLabel}>Outfits</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => navigateTo('Maleta')}
      >
        <Ionicons
          name="briefcase-outline"
          size={25}
          color="#A0A0A0"
        />
        <Text style={styles.sidebarLabel}>Maleta</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.addButtonDesktop}
        onPress={() => {
          try {
            navigation.navigate('AddClothing', { user });
          } catch (error) {
            console.log('No se pudo abrir agregar:', error);
          }
        }}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  // ----------------------------------------------------------
  // HEADER DESKTOP
  // ----------------------------------------------------------
  const DesktopHeader = () => (
    <SafeAreaView style={styles.desktopHeaderSafeArea}>
      <View style={styles.desktopHeader}>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons
            name="menu-outline"
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <Text style={styles.desktopHeaderTitle}>
          Acerca de la aplicación
        </Text>

        <TouchableOpacity style={styles.avatarCircle}>
          <Ionicons
            name="person"
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // ----------------------------------------------------------
  // CONTENIDO PRINCIPAL
  // ----------------------------------------------------------
  const AboutContent = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.contentContainer,
        isDesktop
          ? styles.desktopContentContainer
          : styles.mobileContentContainer,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Flecha volver */}
      <View
        style={[
          styles.backContainer,
          isDesktop && styles.backContainerDesktop,
        ]}
      >
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={32}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Logo */}
      <Image
        source={require('../assets/logo.png')}
        style={[
          styles.logo,
          isDesktop ? styles.logoDesktop : styles.logoMobile,
        ]}
        resizeMode="contain"
      />

      {/* Nombre de la aplicación */}
      <Text
        style={[
          styles.appName,
          isDesktop ? styles.appNameDesktop : styles.appNameMobile,
        ]}
      >
        Vestuario Digital
      </Text>

      {/* Versión */}
      <Text style={styles.version}>
        Versión 1.0 (MVP)
      </Text>

      {/* -------------------------------------------------- */}
      {/* TARJETA: INFORMACIÓN */}
      {/* -------------------------------------------------- */}
      <View
        style={[
          styles.infoCard,
          isDesktop
            ? styles.infoCardDesktop
            : styles.infoCardMobile,
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name="information-outline"
            size={34}
            color={COLORS.primary}
          />
        </View>

        <Text
          style={[
            styles.infoText,
            isDesktop
              ? styles.infoTextDesktop
              : styles.infoTextMobile,
          ]}
        >
          Vestuario Digital es una aplicación diseñada para
          ayudar a organizar prendas, crear outfits
          personalizados, recibir recomendaciones según el
          clima y planificar la ropa para viajes mediante el
          modo maleta.
        </Text>
      </View>

      {/* -------------------------------------------------- */}
      {/* TARJETA: PROYECTO */}
      {/* -------------------------------------------------- */}
      <View
        style={[
          styles.infoCard,
          styles.projectCard,
          isDesktop
            ? styles.projectCardDesktop
            : styles.projectCardMobile,
        ]}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="school-outline"
            size={34}
            color={COLORS.primary}
          />
        </View>

        <View style={styles.projectTextContainer}>
          <Text style={styles.projectTitle}>
            Proyecto
          </Text>

          <Text
            style={[
              styles.projectDescription,
              isDesktop
                ? styles.projectDescriptionDesktop
                : styles.projectDescriptionMobile,
            ]}
          >
            Proyecto académico desarrollado durante el año
            2026.
          </Text>
        </View>
      </View>

      {/* Copyright */}
      <Text
        style={[
          styles.copyright,
          isDesktop
            ? styles.copyrightDesktop
            : styles.copyrightMobile,
        ]}
      >
        © 2026 Vestuario Digital
      </Text>
    </ScrollView>
  );

  // ==========================================================
  // DESKTOP
  // ==========================================================
  if (isDesktop) {
    return (
      <View style={styles.desktopRoot}>
        <DesktopSidebar />

        <View style={styles.desktopMain}>
          <DesktopHeader />

          <View style={styles.desktopBody}>
            <AboutContent />
          </View>
        </View>
      </View>
    );
  }

  // ==========================================================
  // MOBILE
  // ==========================================================
  return (
    <SafeAreaView style={styles.mobileRoot}>
      {/* Header */}
      <View style={styles.mobileHeader}>
        <TouchableOpacity
          style={styles.mobileBackButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={32}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <Text style={styles.mobileHeaderTitle}>
          Acerca de la aplicación
        </Text>

        {/* Espaciador para centrar correctamente el título */}
        <View style={styles.mobileHeaderSpacer} />
      </View>

      <AboutContent />
    </SafeAreaView>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  // ========================================================
  // GENERAL
  // ========================================================

  scrollView: {
    flex: 1,
    backgroundColor: '#FAF8FC',
  },

  contentContainer: {
    alignItems: 'center',
    paddingBottom: 45,
  },

  // ========================================================
  // DESKTOP ROOT
  // ========================================================

  desktopRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FAF8FC',
  },

  desktopMain: {
    flex: 1,
  },

  desktopBody: {
    flex: 1,
  },

  desktopHeaderSafeArea: {
    backgroundColor: COLORS.primary,
  },

  desktopHeader: {
    height: 70,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  desktopHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Poppins_400Regular',
  },

  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ========================================================
  // SIDEBAR DESKTOP
  // ========================================================

  sidebar: {
    width: 110,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#F0EAF8',
    paddingTop: 60,
    alignItems: 'center',
  },

  sidebarItem: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },

  sidebarLabel: {
    color: '#6F6A78',
    fontSize: 12,
    marginTop: 6,
    fontFamily: 'Poppins_400Regular',
  },

  addButtonDesktop: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,

    shadowColor: '#764DC6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },

  // ========================================================
  // DESKTOP CONTENT
  // ========================================================

  desktopContentContainer: {
    paddingTop: 15,
    paddingHorizontal: 40,
    minHeight: '100%',
  },

  backContainer: {
    width: '100%',
    alignItems: 'flex-start',
  },

  backContainerDesktop: {
    marginBottom: -5,
  },

  backButton: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoDesktop: {
    width: 175,
    height: 175,
    marginTop: -5,
  },

  appNameDesktop: {
    fontSize: 34,
    marginTop: 5,
  },

  // ========================================================
  // MOBILE
  // ========================================================

  mobileRoot: {
    flex: 1,
    backgroundColor: '#FAF8FC',
  },

  mobileHeader: {
    height: 70,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  mobileBackButton: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },

  mobileHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 19,
    fontFamily: 'Poppins_400Regular',
  },

  mobileHeaderSpacer: {
    width: 45,
  },

  mobileContentContainer: {
    paddingTop: 45,
    paddingHorizontal: 20,
  },

  logoMobile: {
    width: 220,
    height: 220,
  },

  appNameMobile: {
    fontSize: 32,
    marginTop: 8,
  },

  // ========================================================
  // TÍTULOS
  // ========================================================

  appName: {
    color: '#18213D',
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
  },

  version: {
    color: COLORS.primary,
    fontSize: 18,
    marginTop: 3,
    marginBottom: 32,
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
  },

  // ========================================================
  // TARJETAS
  // ========================================================

  infoCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#9B8AA8',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 3,
  },

  infoCardDesktop: {
    maxWidth: 810,
    minHeight: 145,
    paddingHorizontal: 25,
    paddingVertical: 22,
  },

  infoCardMobile: {
    maxWidth: 650,
    minHeight: 275,
    paddingHorizontal: 25,
    paddingVertical: 25,
    alignItems: 'flex-start',
  },

  projectCard: {
    marginTop: 28,
  },

  projectCardDesktop: {
    maxWidth: 810,
    minHeight: 125,
    paddingHorizontal: 25,
    paddingVertical: 22,
  },

  projectCardMobile: {
    maxWidth: 650,
    minHeight: 180,
    paddingHorizontal: 25,
    paddingVertical: 25,
    alignItems: 'flex-start',
  },

  // ========================================================
  // ICONOS DE LAS TARJETAS
  // ========================================================

  iconContainer: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#F4E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  // ========================================================
  // TARJETA INFORMACIÓN
  // ========================================================

  infoText: {
    flex: 1,
    color: '#4A4654',
    fontFamily: 'Poppins_400Regular',
  },

  infoTextDesktop: {
    fontSize: 16,
    lineHeight: 28,
    marginLeft: 24,
  },

  infoTextMobile: {
    fontSize: 15,
    lineHeight: 27,
    marginLeft: 20,
  },

  // ========================================================
  // PROYECTO
  // ========================================================

  projectTextContainer: {
    flex: 1,
    marginLeft: 24,
  },

  projectTitle: {
    color: '#202039',
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 7,
  },

  projectDescription: {
    color: '#625B69',
    fontFamily: 'Poppins_400Regular',
  },

  projectDescriptionDesktop: {
    fontSize: 15,
    lineHeight: 24,
  },

  projectDescriptionMobile: {
    fontSize: 15,
    lineHeight: 26,
  },

  // ========================================================
  // COPYRIGHT
  // ========================================================

  copyright: {
    color: '#7D7484',
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },

  copyrightDesktop: {
    fontSize: 14,
    marginTop: 55,
  },

  copyrightMobile: {
    fontSize: 14,
    marginTop: 75,
  },
});