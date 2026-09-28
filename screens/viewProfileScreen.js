import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../theme/colours';
import { getUserById } from '../services/database';
import { OutfitScreenLayout } from '../navigation/MainTabNavigator';


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
// PANTALLA
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
  // EDITAR PERFIL
  // ==========================================================

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { user });
  };


  // ==========================================================
  // LOGOUT (arreglado para que también funcione en web)
  // ==========================================================

  const handleLogout = () => {
    const doLogout = () => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Querés cerrar tu sesión?')) {
        doLogout();
      }
      return;
    }

    Alert.alert(
      'Cerrar sesión',
      '¿Querés cerrar tu sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: doLogout },
      ]
    );
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileContainer}>

          {/* AVATAR */}
          <View style={styles.avatarLarge}>
            <Ionicons name="person" size={58} color={COLORS.primary} />
          </View>

          {/* NOMBRE */}
          <Text style={styles.profileName}>
            {fullName || 'Usuario'}
          </Text>

          {/* EMAIL */}
          <Text style={styles.profileEmail}>
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
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Editar perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.85}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color={COLORS.buttonDark} />
              <Text style={styles.secondaryButtonText}>Cerrar sesión</Text>
            </TouchableOpacity>

          </View>

        </View>
      </ScrollView>
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
        <Ionicons name={icon} size={21} color={COLORS.primary} />
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

  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 45,
  },

  scrollContentDesktop: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 45,
  },

  profileContainer: {
    width: '100%',
    maxWidth: 850,
    alignItems: 'center',
  },

  avatarLarge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  profileName: {
    fontSize: 25,
    color: COLORS.textDark,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },

  profileEmail: {
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: 'Poppins_400Regular',
    marginTop: 3,
    marginBottom: 28,
  },

  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 18,
    color: COLORS.textDark,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 5,
  },

  infoRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEE6F2',
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  infoTextContainer: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 14,
    color: COLORS.textDark,
    fontFamily: 'Poppins_500Medium',
  },

  actions: {
    width: '100%',
    marginTop: 25,
    gap: 12,
  },

  actionsDesktop: {
    flexDirection: 'row',
  },

  primaryButton: {
    minHeight: 52,
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
    minHeight: 52,
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