import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { updateUserProfile, resetUserPassword } from '../services/database';

import { COLORS } from '../theme/colours';
import { MESSAGES } from '../theme/messages';
import { OutfitScreenLayout } from '../navigation/MainTabNavigator';


// ============================================================
// PANTALLA
// ============================================================

export default function EditProfileScreen({ navigation, route }) {

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const user = route?.params?.user || {};

  const [name, setName] = useState(user?.name || '');
  const [lastname, setLastname] = useState(user?.lastname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState(user?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);


  // ==========================================================
  // CANCELAR
  // ==========================================================

  const handleCancel = () => {
    navigation.goBack();
  };


  // ==========================================================
  // VALIDACIÓN
  // ==========================================================

  const validateForm = () => {
    const cleanName = name.trim();
    const cleanLastname = lastname.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanLastname || !cleanEmail) {
      Alert.alert('Campos obligatorios', MESSAGES.REQUIRED_FIELDS);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      Alert.alert('Correo inválido', 'Ingresá un correo electrónico válido.');
      return false;
    }

    return true;
  };


  // ==========================================================
  // GUARDAR
  // ==========================================================

  const handleSave = async () => {
    if (loading) return;
    if (!validateForm()) return;

    if (!user?.id) {
      Alert.alert('Error', 'No se encontró el usuario actual.');
      return;
    }

    const cleanName = name.trim();
    const cleanLastname = lastname.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      setLoading(true);

      const profileResult = await updateUserProfile(user.id, {
        name: cleanName,
        lastname: cleanLastname,
        email: cleanEmail,
      });

      if (!profileResult?.success) {
        if (profileResult?.error === 'EMAIL_EXISTS') {
          Alert.alert('Correo existente', MESSAGES.EMAIL_EXISTS);
          return;
        }

        if (profileResult?.error === 'USER_NOT_FOUND') {
          Alert.alert('Usuario no encontrado', MESSAGES.USER_NOT_FOUND);
          return;
        }

        throw new Error(profileResult?.error || 'PROFILE_ERROR');
      }

      const oldPassword = user?.password || '';

      if (cleanPassword && cleanPassword !== oldPassword) {
        await resetUserPassword(cleanEmail, cleanPassword);
      }

      const updatedUser = {
        ...user,
        id: user.id,
        name: cleanName,
        lastname: cleanLastname,
        email: cleanEmail,
        ...(cleanPassword ? { password: cleanPassword } : {}),
      };

      Alert.alert(
        'Perfil actualizado',
        MESSAGES.PROFILE_UPDATED,
        [
          {
            text: 'Aceptar',
            onPress: () => {
              navigation.navigate('Profile', { user: updatedUser });
            },
          },
        ]
      );

    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      Alert.alert('Error', MESSAGES.PROFILE_ERROR);
    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <OutfitScreenLayout
      title="Editar perfil"
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
        <View style={styles.formContainer}>

          {/* DATOS PERSONALES */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Datos personales</Text>

            <ProfileInput
              label="Nombre"
              icon="person-outline"
              value={name}
              onChangeText={setName}
              placeholder="Ingresá tu nombre"
            />

            <ProfileInput
              label="Apellido"
              icon="person-outline"
              value={lastname}
              onChangeText={setLastname}
              placeholder="Ingresá tu apellido"
            />

            <ProfileInput
              label="Correo electrónico"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="Ingresá tu correo"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <ProfileInput
              label="Contraseña"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="Ingresá tu contraseña"
              secureTextEntry={!showPassword}
              rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightPress={() => setShowPassword(!showPassword)}
            />
          </View>

          {/* ACCIONES */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              disabled={loading}
              onPress={handleSave}
            >
              <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.85}
              disabled={loading}
              onPress={handleCancel}
            >
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </OutfitScreenLayout>
  );
}


// ============================================================
// INPUT REUTILIZABLE
// ============================================================

function ProfileInput({
  label, icon, value, onChangeText, placeholder,
  keyboardType, secureTextEntry, autoCapitalize, rightIcon, onRightPress,
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <View style={styles.inputContainer}>
        <Ionicons name={icon} size={20} color={COLORS.primary} style={styles.inputIcon} />

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A797AE"
          keyboardType={keyboardType || 'default'}
          secureTextEntry={secureTextEntry || false}
          autoCapitalize={autoCapitalize || 'sentences'}
        />

        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIconButton}
            activeOpacity={0.7}
            onPress={onRightPress}
          >
            <Ionicons name={rightIcon} size={21} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
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
    paddingTop: 25,
    paddingBottom: 45,
  },

  scrollContentDesktop: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 35,
  },

  formContainer: {
    width: '100%',
    maxWidth: 900,
  },

  formCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 19,
    color: COLORS.textDark,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 20,
  },

  inputGroup: {
    width: '100%',
    marginBottom: 17,
  },

  inputLabel: {
    fontSize: 12,
    color: COLORS.textDark,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 7,
  },

  inputContainer: {
    minHeight: 50,
    width: '100%',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: '#E4D8E9',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputIcon: {
    marginLeft: 14,
    marginRight: 9,
  },

  input: {
    flex: 1,
    minHeight: 48,
    color: COLORS.textDark,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    paddingVertical: 8,
  },

  rightIconButton: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },

  actions: {
    width: '100%',
    marginTop: 22,
    gap: 12,
  },

  primaryButton: {
    minHeight: 52,
    width: '100%',
    borderRadius: 14,
    backgroundColor: COLORS.buttonDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },

  secondaryButton: {
    minHeight: 52,
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.buttonDark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: COLORS.buttonDark,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },

});