import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colours';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MENU_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 400);

export default function SideMenu({
  visible,
  user,
  onClose,
  onProfile,
  onAbout,
  onHelp,
  onLogout,
}) {
  const userName = user
    ? `${user.name || ''} ${user.lastname || ''}`.trim()
    : 'Usuario';

  const userEmail = user?.email || '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>

        {/* Zona que queda fuera del menú */}
        <Pressable
          style={styles.overlayTouchable}
          onPress={onClose}
        />

        {/* MENÚ LATERAL */}
        <SafeAreaView style={styles.menuContainer}>
          <View style={styles.menu}>

            {/* =========================
                PERFIL
            ========================= */}
            <View style={styles.profileSection}>

              <View style={styles.avatar}>
                <Ionicons
                  name="person"
                  size={54}
                  color="#FFFFFF"
                />
              </View>

              <Text
                style={styles.userName}
                numberOfLines={1}
              >
                {userName}
              </Text>

              <Text
                style={styles.userEmail}
                numberOfLines={1}
              >
                {userEmail}
              </Text>

            </View>

            {/* =========================
                OPCIONES
            ========================= */}

            <View style={styles.menuOptions}>

              {/* MI PERFIL */}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  onClose?.();
                  onProfile?.();
                }}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="person-circle-outline"
                    size={27}
                    color={COLORS.primary}
                  />
                </View>

                <Text style={styles.menuText}>
                  Mi perfil
                </Text>
              </TouchableOpacity>

              <View style={styles.separator} />

              {/* ACERCA DE LA APLICACIÓN */}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  onClose?.();
                  onAbout?.();
                }}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="information-circle-outline"
                    size={27}
                    color={COLORS.primary}
                  />
                </View>

                <Text style={styles.menuText}>
                  Acerca de la aplicación
                </Text>
              </TouchableOpacity>

              {/* AYUDA */}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  onClose?.();
                  onHelp?.();
                }}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="help-outline"
                    size={29}
                    color={COLORS.primary}
                  />
                </View>

                <Text style={styles.menuText}>
                  Ayuda
                </Text>
              </TouchableOpacity>

              <View style={styles.separator} />

              {/* =========================
                  CERRAR SESIÓN
              ========================= */}
              <TouchableOpacity
                style={styles.logoutButton}
                activeOpacity={0.75}
                onPress={() => {
                  onClose?.();
                  onLogout?.();
                }}
              >
                <Ionicons
                  name="log-out-outline"
                  size={28}
                  color={COLORS.primary}
                />

                <Text style={styles.logoutText}>
                  Cerrar sesión
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({

  // =========================
  // FONDO
  // =========================

  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(55, 35, 75, 0.18)',
  },

  overlayTouchable: {
    flex: 1,
  },

  // =========================
  // CONTENEDOR
  // =========================

  menuContainer: {
    width: MENU_WIDTH,
    height: '100%',
  },

  menu: {
    flex: 1,
    backgroundColor: '#FAF9FF',
    paddingHorizontal: 28,
    paddingTop: 30,

    // Esquina superior derecha redondeada
    borderTopRightRadius: 28,

    // Esquina inferior derecha redondeada
    borderBottomRightRadius: 28,

    // Sombra
    shadowColor: '#000000',
    shadowOffset: {
      width: 4,
      height: 0,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },

  // =========================
  // PERFIL
  // =========================

  profileSection: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 38,
  },

  avatar: {
    width: 116,
    height: 116,
    borderRadius: 58,

    backgroundColor: '#BDBDBD',

    borderWidth: 4,
    borderColor: COLORS.primary,

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 16,
  },

  userName: {
    fontSize: 25,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 4,
  },

  userEmail: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
  },

  // =========================
  // OPCIONES
  // =========================

  menuOptions: {
    width: '100%',
  },

  menuItem: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  iconContainer: {
    width: 45,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  menuText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textDark,
    fontWeight: '500',
  },

  separator: {
    height: 2,
    width: '100%',
    backgroundColor: COLORS.primary,
    opacity: 0.8,
    marginVertical: 4,
  },

  // =========================
  // CERRAR SESIÓN
  // =========================

  logoutButton: {
    minHeight: 62,
    marginTop: 14,

    paddingHorizontal: 10,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    borderRadius: 12,
  },

  logoutText: {
    marginLeft: 14,
    fontSize: 16,
    color: COLORS.textDark,
    fontWeight: '500',
  },
});