import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../theme/colours';

export default function HistoryClothingScreen({ navigation }) {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 768;

  const handleBack = () => {
    if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>

      {/* =========================
          VERSIÓN ESCRITORIO
      ========================== */}
      {isDesktop && (
        <View style={styles.desktopTopBar}>

          <Pressable style={styles.menuButton}>
            <Ionicons
              name="menu-outline"
              size={34}
              color="#FFFFFF"
            />
          </Pressable>

          <Text style={styles.desktopTitle}>
            Historial
          </Text>

          <View style={styles.profileCircle}>
            <Ionicons
              name="person"
              size={25}
              color="#FFFFFF"
            />
          </View>

        </View>
      )}

      <View style={isDesktop ? styles.desktopBody : styles.mobileBody}>

        {/* =========================
            MENÚ LATERAL PC
        ========================== */}
        {isDesktop && (
          <View style={styles.sidebar}>

            <SidebarItem
              icon="home-outline"
              text="Inicio"
            />

            <SidebarItem
              icon="shirt-outline"
              text="Prendas"
            />

            <SidebarItem
              icon="shirt"
              text="Outfits"
              active
            />

            <SidebarItem
              icon="briefcase-outline"
              text="Maleta"
            />

            <Pressable style={styles.addButton}>
              <Ionicons
                name="add"
                size={38}
                color="#FFFFFF"
              />
            </Pressable>

          </View>
        )}

        {/* =========================
            CONTENIDO
        ========================== */}
        <View style={styles.content}>

          {/* Header móvil */}
          {!isDesktop && (
            <View style={styles.mobileHeader}>

              <Pressable
                onPress={handleBack}
                style={styles.backButton}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color="#FFFFFF"
                />
              </Pressable>

              <Text style={styles.mobileTitle}>
                Historial
              </Text>

              <View style={styles.headerSpace} />

            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              isDesktop
                ? styles.desktopScrollContent
                : styles.mobileScrollContent
            }
          >

            {/* =========================
                ESTADO VACÍO
            ========================== */}
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

          </ScrollView>

        </View>
      </View>

      {/* =========================
          NAVEGACIÓN MÓVIL
      ========================== */}
      {!isDesktop && (
        <View style={styles.bottomNavigation}>

          <BottomItem
            icon="home-outline"
            text="Inicio"
          />

          <BottomItem
            icon="shirt-outline"
            text="Prendas"
          />

          <Pressable style={styles.mobileAddButton}>
            <Ionicons
              name="add"
              size={34}
              color="#FFFFFF"
            />
          </Pressable>

          <BottomItem
            icon="shirt"
            text="Outfits"
            active
          />

          <BottomItem
            icon="briefcase-outline"
            text="Maleta"
          />

        </View>
      )}

    </View>
  );
}


/* =====================================
   ITEM MENÚ LATERAL
===================================== */

function SidebarItem({ icon, text, active }) {
  return (
    <Pressable
      style={[
        styles.sidebarItem,
        active && styles.sidebarItemActive,
      ]}
    >
      <Ionicons
        name={icon}
        size={34}
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


/* =====================================
   ITEM NAVEGACIÓN MÓVIL
===================================== */

function BottomItem({ icon, text, active }) {
  return (
    <Pressable style={styles.bottomItem}>

      <Ionicons
        name={icon}
        size={22}
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


/* =====================================
   ESTILOS
===================================== */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* ---------- PC ---------- */

  desktopTopBar: {
    height: 78,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  menuButton: {
    position: 'absolute',
    left: 35,
    top: 21,
  },

  desktopTitle: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
    fontSize: 22,
  },

  profileCircle: {
    position: 'absolute',
    right: 30,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF55',
    alignItems: 'center',
    justifyContent: 'center',
  },

  desktopBody: {
    flex: 1,
    flexDirection: 'row',
  },

  mobileBody: {
    flex: 1,
  },

  sidebar: {
    width: 138,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingTop: 35,
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
    marginTop: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---------- CONTENIDO ---------- */

  content: {
    flex: 1,
  },

  desktopScrollContent: {
    flexGrow: 1,
    padding: 40,
    paddingTop: 40,
    paddingBottom: 50,
  },

  mobileScrollContent: {
    flexGrow: 1,
    padding: 14,
    paddingBottom: 90,
  },

  /* ---------- HEADER MÓVIL ---------- */

  mobileHeader: {
    height: 54,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButton: {
    position: 'absolute',
    left: 12,
    padding: 5,
  },

  mobileTitle: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },

  headerSpace: {
    width: 35,
  },

  /* ---------- ESTADO VACÍO ---------- */

  emptyHistory: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },

  clockCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F2E9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
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

  /* ---------- NAV MÓVIL ---------- */

  bottomNavigation: {
    height: 63,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEF4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },

  bottomItem: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    color: '#687084',
    marginTop: 2,
  },

  bottomTextActive: {
    color: COLORS.buttonDark,
    fontFamily: 'Poppins_600SemiBold',
  },

  mobileAddButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
});