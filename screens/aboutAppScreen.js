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

import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { COLORS } from '../theme/colours';

export default function AboutAppScreen({
  navigation,
  route,
}) {
  const { width } = useWindowDimensions();

  const isDesktop = width > 768;

  const user =
    route?.params?.user || null;

  // ==========================================================
  // VOLVER
  // ==========================================================

  const handleGoBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  };

  // ==========================================================
  // IR A UNA SECCIÓN PRINCIPAL
  // ==========================================================

  const navigateTo = (tabName) => {
    navigation.navigate('Main', {
      user,
      initialTab: tabName,
    });
  };

  // ==========================================================
  // AGREGAR PRENDA
  // ==========================================================

  const handleAddClothing = () => {
    navigation.navigate('AddClothing', {
      user,
    });
  };

  // ==========================================================
  // SIDEBAR DESKTOP
  // ==========================================================

  const DesktopSidebar = () => (
    <View style={styles.sidebar}>

      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => navigateTo('Inicio')}
        activeOpacity={0.75}
      >
        <Ionicons
          name="home-outline"
          size={28}
          color={COLORS.textDark}
        />

        <Text style={styles.sidebarLabel}>
          Inicio
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => navigateTo('Prendas')}
        activeOpacity={0.75}
      >
        <Ionicons
          name="shirt-outline"
          size={28}
          color={COLORS.textDark}
        />

        <Text style={styles.sidebarLabel}>
          Prendas
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => navigateTo('Outfits')}
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons
          name="hanger"
          size={29}
          color={COLORS.textDark}
        />

        <Text style={styles.sidebarLabel}>
          Outfits
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => navigateTo('Maleta')}
        activeOpacity={0.75}
      >
        <Ionicons
          name="briefcase-outline"
          size={28}
          color={COLORS.textDark}
        />

        <Text style={styles.sidebarLabel}>
          Maleta
        </Text>
      </TouchableOpacity>

      <View style={styles.sidebarSpacer} />

      <TouchableOpacity
        style={styles.addButtonDesktop}
        onPress={handleAddClothing}
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

  // ==========================================================
  // HEADER
  // ==========================================================

  const Header = () => (
    <SafeAreaView style={styles.headerSafeArea}>
      <View style={styles.header}>

        {/* VOLVER */}
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleGoBack}
          activeOpacity={0.75}
        >
          <Ionicons
            name="arrow-back"
            size={30}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* TÍTULO */}
        <Text
          style={styles.headerTitle}
          numberOfLines={1}
        >
          Acerca la aplicación
        </Text>

        {/* PERFIL */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() =>
            navigation.navigate('Profile', {
              user,
            })
          }
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

      </View>
    </SafeAreaView>
  );

  // ==========================================================
  // CONTENIDO
  // ==========================================================

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

      {/* LOGO */}
      <Image
        source={require('../assets/logo.png')}
        style={[
          styles.logo,
          isDesktop
            ? styles.logoDesktop
            : styles.logoMobile,
        ]}
        resizeMode="contain"
      />

      {/* NOMBRE */}
      <Text
        style={[
          styles.appName,
          isDesktop
            ? styles.appNameDesktop
            : styles.appNameMobile,
        ]}
      >
        Vestuario Digital
      </Text>

      {/* VERSIÓN */}
      <Text style={styles.version}>
        Versión 1.0 (MVP)
      </Text>

      {/* INFORMACIÓN */}
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

      {/* PROYECTO */}
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

      {/* COPYRIGHT */}
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
  // MENÚ INFERIOR MOBILE
  // ==========================================================

  const MobileBottomMenu = () => (
    <View style={styles.mobileBottomBar}>

      <TouchableOpacity
        style={styles.mobileNavItem}
        onPress={() => navigateTo('Inicio')}
      >
        <Ionicons
          name="home-outline"
          size={24}
          color={COLORS.textDark}
        />

        <Text style={styles.mobileNavLabel}>
          Inicio
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.mobileNavItem}
        onPress={() => navigateTo('Prendas')}
      >
        <Ionicons
          name="shirt-outline"
          size={24}
          color={COLORS.textDark}
        />

        <Text style={styles.mobileNavLabel}>
          Prendas
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.mobileAddButtonContainer}
        onPress={handleAddClothing}
      >
        <View style={styles.mobileAddButton}>
          <Ionicons
            name="add"
            size={32}
            color="#FFFFFF"
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.mobileNavItem}
        onPress={() => navigateTo('Outfits')}
      >
        <MaterialCommunityIcons
          name="hanger"
          size={25}
          color={COLORS.textDark}
        />

        <Text style={styles.mobileNavLabel}>
          Outfits
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.mobileNavItem}
        onPress={() => navigateTo('Maleta')}
      >
        <Ionicons
          name="briefcase-outline"
          size={24}
          color={COLORS.textDark}
        />

        <Text style={styles.mobileNavLabel}>
          Maleta
        </Text>
      </TouchableOpacity>

    </View>
  );

  // ==========================================================
  // DESKTOP
  // ==========================================================

  if (isDesktop) {
  return (
    <View style={styles.desktopRoot}>

      {/* HEADER COMPLETO */}
      <Header />

      {/* CUERPO */}
      <View style={styles.desktopMain}>

        {/* SIDEBAR */}
        <DesktopSidebar />

        {/* CONTENIDO */}
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

      <Header />

      <View style={styles.mobileContent}>
        <AboutContent />
      </View>

      <MobileBottomMenu />

    </SafeAreaView>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  // ==========================================================
  // GENERAL
  // ==========================================================

  scrollView: {
    flex: 1,
    backgroundColor: '#FAF8FC',
  },

  contentContainer: {
    alignItems: 'center',
    paddingBottom: 45,
  },

  // ==========================================================
  // DESKTOP
  // ==========================================================

  desktopRoot: {
    flex: 1,
    backgroundColor: '#FAF8FC',
  },

  desktopMain: {
    flex: 1,
      flexDirection: 'row',
  },

  desktopBody: {
    flex: 1,
  },

  sidebar: {
    width: 110,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#F0EAF8',
    paddingTop: 30,
    paddingHorizontal: 0,
    alignItems: 'center',
  },

  sidebarItem: {
    width: '100%',
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sidebarLabel: {
    color: COLORS.textDark,
    fontSize: 12,
    marginTop: 6,
    fontFamily: 'Poppins_400Regular',
  },

  sidebarSpacer: {
    flex: 1,
  },

  addButtonDesktop: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  headerSafeArea: {
    backgroundColor: COLORS.primary,
  },

 header: {
  height: 82,
  backgroundColor: COLORS.primary,
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
  fontFamily: 'Poppins_400Regular',
},

  profileButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ==========================================================
  // CONTENIDO DESKTOP
  // ==========================================================

  desktopContentContainer: {
    paddingTop: 25,
    paddingBottom: 50,
    paddingHorizontal: 40,
  },

  // ==========================================================
  // CONTENIDO MOBILE
  // ==========================================================

  mobileRoot: {
    flex: 1,
    backgroundColor: '#FAF8FC',
  },

  mobileContent: {
    flex: 1,
  },

  mobileContentContainer: {
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 35,
  },

  // ==========================================================
  // LOGO
  // ==========================================================

  logo: {
    marginBottom: 8,
  },

  logoDesktop: {
    width: 145,
    height: 145,
  },

  logoMobile: {
    width: 120,
    height: 120,
  },

  // ==========================================================
  // NOMBRE
  // ==========================================================

  appName: {
    color: COLORS.buttonDark,
    fontFamily: 'Poppins_700Bold',
  },

  appNameDesktop: {
    fontSize: 26,
  },

  appNameMobile: {
    fontSize: 23,
  },

  version: {
    color: COLORS.textLight,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
    marginBottom: 25,
  },

  // ==========================================================
  // TARJETAS
  // ==========================================================

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

  iconContainer: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#F4E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

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

  // ==========================================================
  // MENÚ INFERIOR MOBILE
  // ==========================================================

  mobileBottomBar: {
    height: 78,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },

  mobileNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mobileNavLabel: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.textDark,
    fontFamily: 'Poppins_400Regular',
  },

  mobileAddButtonContainer: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mobileAddButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -25,
  },

});