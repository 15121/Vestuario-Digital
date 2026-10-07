import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../theme/colours';
import { getUserById } from '../services/database';
import { OutfitScreenLayout } from '../navigation/MainTabNavigator';
import { confirmLogout } from '../services/session';


// ============================================================
// FORMATEAR FECHA
// ============================================================

const formatMemberSince = (dateValue) => {
  if (!dateValue) {
    return '—';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};


// ============================================================
// RECUPERAR FECHA DESDE ID WEB ANTIGUO
// ============================================================

const getLegacyCreatedAtFromId = (id) => {
  if (typeof id !== 'number' || id < 100000000000) {
    return null;
  }

  const date = new Date(id);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};


// ============================================================
// PANTALLA (TODO EN UNA SOLA VISTA, SIN SCROLL)
// ============================================================

export default function ViewProfileScreen({ navigation, route }) {

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const routeUser = route?.params?.user || {};

  const [user, setUser] = useState(routeUser);


  // ==========================================================
  // CARGAR USUARIO ACTUAL
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      if (!routeUser?.id) {
        return;
      }

      try {
        const result = await getUserById(routeUser.id);

        if (mounted && result) {
          setUser({ ...routeUser, ...result });
        }
      } catch (error) {
        console.log('Error al cargar usuario en perfil:', error);
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, [routeUser?.id]);


  // ==========================================================
  // DATOS
  // ==========================================================

  const fullName = [user?.name, user?.lastname]
    .filter(Boolean)
    .join(' ');

  const createdAt =
    user?.createdAt || getLegacyCreatedAtFromId(user?.id);

  const memberSince = formatMemberSince(createdAt);


  // ==========================================================
  // ACCIONES
  // ==========================================================

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { user });
  };

  const handleLogout = () => {
    confirmLogout(navigation);
  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <OutfitScreenLayout
      title="Perfil"
      navigation={navigation}
      user={user}
      activeTab=""
    >
      <View
        style={[
          styles.screen,
          isDesktop && styles.screenDesktop,
        ]}
      >
        <View style={styles.profileContainer}>

          {/* AVATAR */}
          <View style={styles.avatarLarge}>
            <Ionicons name="person" size={40} color={COLORS.primary} />
          </View>

          {/* NOMBRE */}
          <Text style={styles.profileName} numberOfLines={1}>
            {fullName || 'Usuario'}
          </Text>

          {/* EMAIL */}
          <Text style={styles.profileEmail} numberOfLines={1}>
            {user?.email || '—'}
          </Text>

          {/* INFORMACIÓN PERSONAL */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Información personal</Text>

            <ProfileRow icon="person-outline" label="Nombre" value={user?.name || '—'} />
            <ProfileRow icon="person-outline" label="Apellido" value={user?.lastname || '—'} />
            <ProfileRow icon="mail-outline" label="Correo electrónico" value={user?.email || '—'} />
            <ProfileRow icon="calendar-outline" label="Miembro desde" value={memberSince} last />
          </View>

          {/* BOTONES */}
          <View style={[styles.actions, isDesktop && styles.actionsDesktop]}>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={handleEditProfile}
            >
              <Ionicons name="create-outline" size={19} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Editar perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.85}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={19} color={COLORS.buttonDark} />
              <Text style={styles.secondaryButtonText}>Cerrar sesión</Text>
            </TouchableOpacity>

          </View>

        </View>
      </View>
    </OutfitScreenLayout>
  );
}


// ============================================================
// FILA DE INFORMACIÓN
// ============================================================

function ProfileRow({ icon, label, value, last }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>

      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}


// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  // Pantalla fija: el contenido se centra y NO se desplaza
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },

  screenDesktop: {
    paddingHorizontal: 40,
  },

  profileContainer: {
    width: '100%',
    maxWidth: 850,
    alignItems: 'center',
  },

  avatarLarge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  profileName: {
    fontSize: 20,
    color: COLORS.textDark,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    maxWidth: '100%',
  },

  profileEmail: {
    fontSize: 13,
    color: COLORS.textLight,
    fontFamily: 'Poppins_400Regular',
    marginTop: 1,
    marginBottom: 12,
    maxWidth: '100%',
  },

  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 15,
    color: COLORS.textDark,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 2,
  },

  infoRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEE6F2',
  },

  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  infoTextContainer: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 1,
  },

  infoValue: {
    fontSize: 13,
    color: COLORS.textDark,
    fontFamily: 'Poppins_500Medium',
  },

  actions: {
    width: '100%',
    marginTop: 14,
    gap: 10,
  },

  actionsDesktop: {
    flexDirection: 'row',
  },

  primaryButton: {
    minHeight: 46,
    flex: 1,
    borderRadius: 14,
    backgroundColor: COLORS.buttonDark,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },

  secondaryButton: {
    minHeight: 46,
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.buttonDark,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  secondaryButtonText: {
    color: COLORS.buttonDark,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },

});