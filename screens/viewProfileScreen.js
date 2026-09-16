import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../theme/colours';

export default function ViewProfileScreen({ navigation, route }) {
  const { width } = useWindowDimensions();

  // Usuario recibido desde Login / MainTabNavigator
  const user = route?.params?.user;

  const isDesktop = width > 768;

  // ---------------------------------------------------------
  // DATOS DEL USUARIO
  // ---------------------------------------------------------

  const name = user?.name || '';
  const lastname = user?.lastname || '';
  const email = user?.email || '';

  const fullName = `${name} ${lastname}`.trim() || 'Usuario';

  // ---------------------------------------------------------
  // FECHA DE REGISTRO
  // ---------------------------------------------------------
  // database.js actualmente no guarda createdAt en users.
  // Si en el futuro existe, la mostramos.
  const formatMemberDate = (date) => {
    if (!date) {
      return '—';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '—';
    }

    return parsedDate.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const memberSince = formatMemberDate(user?.createdAt);

  // ---------------------------------------------------------
  // EDITAR PERFIL
  // ---------------------------------------------------------

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', {
      user,
    });
  };

  // ---------------------------------------------------------
  // CERRAR SESIÓN
  // ---------------------------------------------------------

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Querés cerrar la sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: 'Welcome',
                },
              ],
            });
          },
        },
      ]
    );
  };

  // ---------------------------------------------------------
  // FILA DE INFORMACIÓN
  // ---------------------------------------------------------

  const ProfileRow = ({
    icon,
    label,
    value,
    last = false,
  }) => {
    return (
      <View
        style={[
          styles.infoRow,
          last && styles.infoRowLast,
        ]}
      >
        <View style={styles.infoIconBox}>
          <Ionicons
            name={icon}
            size={22}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text
          style={styles.infoValue}
          numberOfLines={1}
        >
          {value || '—'}
        </Text>
      </View>
    );
  };

  // ---------------------------------------------------------
  // PANTALLA
  // ---------------------------------------------------------

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* ==================================================
            CABECERA DEL PERFIL
        ================================================== */}

        <View style={styles.profileHeader}>

          {/* Avatar */}
          <View style={styles.avatar}>
            <Ionicons
              name="person"
              size={78}
              color="#FFFFFF"
            />
          </View>

          {/* Nombre */}
          <Text style={styles.profileName}>
            {fullName}
          </Text>

          {/* Email */}
          <Text style={styles.profileEmail}>
            {email}
          </Text>

        </View>

        {/* ==================================================
            TARJETA INFORMACIÓN PERSONAL
        ================================================== */}

        <View style={styles.infoCard}>

          {/* Título */}
          <View style={styles.infoHeader}>
            <View style={styles.infoHeaderIcon}>
              <Ionicons
                name="person-outline"
                size={23}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.infoHeaderTitle}>
              Información personal
            </Text>
          </View>

          {/* Nombre */}
          <ProfileRow
            icon="person-outline"
            label="Nombre"
            value={name}
          />

          {/* Apellido */}
          <ProfileRow
            icon="people-outline"
            label="Apellido"
            value={lastname}
          />

          {/* Email */}
          <ProfileRow
            icon="mail-outline"
            label="Correo electrónico"
            value={email}
          />

          {/* Fecha */}
          <ProfileRow
            icon="calendar-outline"
            label="Miembro desde"
            value={memberSince}
            last
          />

        </View>

        {/* ==================================================
            BOTÓN EDITAR
        ================================================== */}

        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.8}
          onPress={handleEditProfile}
        >
          <Ionicons
            name="create-outline"
            size={23}
            color="#FFFFFF"
          />

          <Text style={styles.editButtonText}>
            Editar perfil
          </Text>
        </TouchableOpacity>

        {/* ==================================================
            BOTÓN CERRAR SESIÓN
        ================================================== */}

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={24}
            color={COLORS.primary}
          />

          <Text style={styles.logoutButtonText}>
            Cerrar sesión
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  // ----------------------------------------------------------
  // CONTENEDOR
  // ----------------------------------------------------------

  container: {
    flex: 1,
    backgroundColor: '#FAF8FC',
  },

  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 28,
    paddingBottom: 35,
  },

  scrollContentDesktop: {
    paddingHorizontal: 24,
    paddingTop: 45,
    paddingBottom: 50,
    alignItems: 'center',
  },

  // ----------------------------------------------------------
  // HEADER PERFIL
  // ----------------------------------------------------------

  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },

  avatar: {
    width: 116,
    height: 116,
    borderRadius: 58,

    backgroundColor: '#BDBDBD',

    borderWidth: 3,
    borderColor: COLORS.primary,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 14,
  },

  profileName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: '#17131C',
    textAlign: 'center',
  },

  profileEmail: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: COLORS.textLight,
    marginTop: 3,
    textAlign: 'center',
  },

  // ----------------------------------------------------------
  // TARJETA
  // ----------------------------------------------------------

  infoCard: {
    width: '100%',
    maxWidth: 1020,

    backgroundColor: '#FFFFFF',

    borderRadius: 14,

    overflow: 'hidden',

    borderWidth: 1,
    borderColor: '#F0ECF5',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,

    marginBottom: 20,
  },

  // ----------------------------------------------------------
  // ENCABEZADO DE LA TARJETA
  // ----------------------------------------------------------

  infoHeader: {
    height: 72,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 34,

    borderBottomWidth: 1,
    borderBottomColor: '#EAE7EF',
  },

  infoHeaderIcon: {
    width: 40,
    height: 40,

    borderRadius: 8,

    backgroundColor: '#F3EDFF',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 16,
  },

  infoHeaderTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: '#211B28',
  },

  // ----------------------------------------------------------
  // FILAS
  // ----------------------------------------------------------

  infoRow: {
    minHeight: 59,

    flexDirection: 'row',
    alignItems: 'center',

    marginHorizontal: 20,

    borderBottomWidth: 1,
    borderBottomColor: '#EAE7EF',
  },

  infoRowLast: {
    borderBottomWidth: 0,
  },

  infoIconBox: {
    width: 40,
    height: 40,

    borderRadius: 8,

    backgroundColor: '#F3EDFF',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 17,
  },

  infoLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.textLight,

    flex: 1,
  },

  infoValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#29222F',

    maxWidth: '55%',
    textAlign: 'right',
  },

  // ----------------------------------------------------------
  // BOTÓN EDITAR
  // ----------------------------------------------------------

  editButton: {
    width: '100%',
    maxWidth: 1020,
    minHeight: 54,

    backgroundColor: COLORS.buttonDark,

    borderRadius: 9,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 15,
  },

  editButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: '#FFFFFF',

    marginLeft: 12,
  },

  // ----------------------------------------------------------
  // BOTÓN LOGOUT
  // ----------------------------------------------------------

  logoutButton: {
    width: '100%',
    maxWidth: 1020,
    minHeight: 54,

    backgroundColor: '#FFFFFF',

    borderRadius: 9,

    borderWidth: 1.5,
    borderColor: '#B78AE8',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 10,
  },

  logoutButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: COLORS.primary,

    marginLeft: 12,
  },
});