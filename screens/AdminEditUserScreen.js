import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  getUserById,
  updateUserProfile,
  updateUserRole,
} from '../services/database';

const COLORS = {
  background: '#F8E9FE',
  primary: '#B87EEE',
  buttonDark: '#764DC6',
  inputBg: 'rgba(255, 255, 255, 0.85)',
  textDark: '#4A3B53',
  textLight: '#7D6A88',
  white: '#FFFFFF',
  border: '#E4D8E9',
  danger: '#C94C6D',
  success: '#4E9B70',
};

// =========================================================
// HELPERS MULTIPLATAFORMA
// Alert.alert con botones NO funciona en web (react-native-web)
// =========================================================

const showMessage = (title, message, onOk) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    if (onOk) onOk();
    return;
  }

  Alert.alert(
    title,
    message,
    onOk ? [{ text: 'Aceptar', onPress: onOk }] : undefined
  );
};

const confirmAction = (title, message, onConfirm) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Guardar', onPress: onConfirm },
  ]);
};

// =========================================================
// MENSAJES DE ERROR
// =========================================================

const getErrorMessage = (code) => {
  switch (code) {
    case 'EMAIL_EXISTS':
      return 'Ese email ya está registrado por otro usuario.';
    case 'ROOT_PROTECTED':
      return 'La cuenta Root está protegida y no puede modificarse de esta manera.';
    case 'ONLY_ONE_ROOT':
      return 'No se puede asignar el rol Root a este usuario.';
    case 'ROOT_EMAIL_RESERVED':
      return 'Ese email está reservado para la cuenta Root.';
    case 'USER_NOT_FOUND':
      return 'No se encontró el usuario.';
    default:
      return 'No se pudieron guardar los cambios. Intentá nuevamente.';
  }
};

export default function AdminEditUserScreen({ route, navigation }) {
  const userId = route?.params?.userId;
  const initialUser = route?.params?.user;

  const [user, setUser] = useState(initialUser || null);

  const [name, setName] = useState(initialUser?.name || '');
  const [lastname, setLastname] = useState(initialUser?.lastname || '');
  const [email, setEmail] = useState(initialUser?.email || '');
  const [role, setRole] = useState(initialUser?.role || 'user');

  // Solo mostramos pantalla de carga si NO tenemos usuario inicial
  const [loading, setLoading] = useState(!initialUser);
  const [saving, setSaving] = useState(false);

  const isRootAccount = user?.role === 'root';

  // ---------------------------------------------------------
  // Cargar usuario actualizado
  // ---------------------------------------------------------

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    const targetId = userId ?? initialUser?.id;

    if (!targetId) {
      setLoading(false);
      return;
    }

    try {
      const result = await getUserById(targetId);

      if (!result) {
        showMessage(
          'Usuario no encontrado',
          'No se pudo encontrar el usuario seleccionado.',
          () => navigation.goBack()
        );
        return;
      }

      setUser(result);

      setName(result.name || '');
      setLastname(result.lastname || '');
      setEmail(result.email || '');
      setRole(result.role || 'user');
    } catch (error) {
      console.error('Error cargando usuario:', error);

      showMessage(
        'Error',
        'No se pudieron cargar los datos del usuario.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Validaciones
  // ---------------------------------------------------------

  const validateForm = () => {
    const cleanName = name.trim();
    const cleanLastname = lastname.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      showMessage('Campo requerido', 'Ingresá el nombre del usuario.');
      return false;
    }

    if (!cleanLastname) {
      showMessage('Campo requerido', 'Ingresá el apellido del usuario.');
      return false;
    }

    if (!cleanEmail) {
      showMessage('Campo requerido', 'Ingresá el email del usuario.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      showMessage(
        'Email inválido',
        'Ingresá una dirección de email válida.'
      );
      return false;
    }

    return true;
  };

  // ---------------------------------------------------------
  // Guardar cambios
  // ---------------------------------------------------------

  const hasChanges = () => {
    if (!user) return false;

    return (
      name.trim() !== (user.name || '') ||
      lastname.trim() !== (user.lastname || '') ||
      email.trim().toLowerCase() !== (user.email || '').toLowerCase() ||
      role !== user.role
    );
  };

  const handleSave = () => {
    if (saving) return;

    if (!validateForm()) return;

    if (!hasChanges()) {
      showMessage(
        'Sin cambios',
        'No modificaste ningún dato del usuario.',
        () => navigation.goBack()
      );
      return;
    }

    confirmAction(
      'Guardar cambios',
      '¿Querés guardar los cambios realizados en este usuario?',
      saveChanges
    );
  };

  const saveChanges = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);

      const cleanName = name.trim();
      const cleanLastname = lastname.trim();
      const cleanEmail = email.trim().toLowerCase();

      // -----------------------------------------------------
      // Actualizar rol (lanza error si no está permitido)
      // -----------------------------------------------------

      if (role !== user.role) {
        await updateUserRole(user.id, role);
      }

      // -----------------------------------------------------
      // Actualizar datos personales
      // updateUserProfile DEVUELVE { success, message }
      // -----------------------------------------------------

      const result = await updateUserProfile(user.id, {
        name: cleanName,
        lastname: cleanLastname,
        email: cleanEmail,
      });

      if (!result || !result.success) {
        throw new Error(result?.message || 'UPDATE_FAILED');
      }

      // -----------------------------------------------------
      // Volver a obtener usuario actualizado
      // -----------------------------------------------------

      const updatedUser = await getUserById(user.id);

      if (updatedUser) {
        setUser(updatedUser);

        setName(updatedUser.name || '');
        setLastname(updatedUser.lastname || '');
        setEmail(updatedUser.email || '');
        setRole(updatedUser.role || 'user');
      }

      showMessage(
        'Cambios guardados',
        'Los datos del usuario fueron actualizados correctamente.',
        () => navigation.goBack()
      );
    } catch (error) {
      console.error('Error guardando cambios:', error);

      showMessage(
        'No se pudieron guardar los cambios',
        getErrorMessage(error?.message)
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------
  // Cambio de rol
  // ---------------------------------------------------------

  const handleRoleChange = (newRole) => {
    // La cuenta Root no debe poder ser convertida en usuario.
    if (isRootAccount && newRole !== 'root') {
      showMessage(
        'Cuenta protegida',
        'La cuenta Root no puede ser degradada a usuario.'
      );
      return;
    }

    setRole(newRole);
  };

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.buttonDark}
        />

        <Text style={styles.loadingText}>
          Cargando datos del usuario...
        </Text>
      </View>
    );
  }

  // ---------------------------------------------------------
  // Usuario inexistente
  // ---------------------------------------------------------

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons
          name="person-circle-outline"
          size={70}
          color={COLORS.primary}
        />

        <Text style={styles.emptyTitle}>
          Usuario no encontrado
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>
            Volver
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={COLORS.textDark}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            Editar Usuario
          </Text>

          <Text style={styles.headerSubtitle}>
            Modificar información administrativa
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* INFORMACIÓN DEL USUARIO */}
        <View style={styles.card}>

          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons
                name="person-outline"
                size={22}
                color={COLORS.buttonDark}
              />
            </View>

            <View>
              <Text style={styles.cardTitle}>
                Información del usuario
              </Text>

              <Text style={styles.cardSubtitle}>
                Datos personales y de acceso
              </Text>
            </View>
          </View>

          {/* NOMBRE */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Nombre
            </Text>

            <TextInput
  style={[
    styles.input,
    isRootAccount && styles.inputDisabled,
  ]}
  value={name}
  onChangeText={setName}
  placeholder="Nombre"
  placeholderTextColor={COLORS.textLight}
  editable={!saving && !isRootAccount}
  autoCapitalize="words"
/>
          </View>

          {/* APELLIDO */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Apellido
            </Text>

            <TextInput
  style={[
    styles.input,
    isRootAccount && styles.inputDisabled,
  ]}
  value={lastname}
  onChangeText={setLastname}
  placeholder="Apellido"
  placeholderTextColor={COLORS.textLight}
  editable={!saving && !isRootAccount}
  autoCapitalize="words"
/>
          </View>

          {/* EMAIL */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Email
            </Text>

            <TextInput
              style={[
                styles.input,
                isRootAccount && styles.inputReadOnly,
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={COLORS.textLight}
              editable={!saving && !isRootAccount}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            {isRootAccount && (
              <Text style={styles.fieldHelp}>
                El email de la cuenta Root está reservado y no
                puede modificarse.
              </Text>
            )}
          </View>

        </View>

        {/* ROL */}
        <View style={styles.card}>

          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={COLORS.buttonDark}
              />
            </View>

            <View>
              <Text style={styles.cardTitle}>
                Rol de usuario
              </Text>

              <Text style={styles.cardSubtitle}>
                Permisos dentro de Vestuario Digital
              </Text>
            </View>
          </View>

          <View style={styles.roleOptions}>

            {/* USUARIO */}
            <TouchableOpacity
              style={[
                styles.roleOption,
                role === 'user' && styles.roleOptionSelected,
                isRootAccount && styles.roleOptionDisabled,
              ]}
              onPress={() => handleRoleChange('user')}
              disabled={saving || isRootAccount}
            >
              <View
                style={[
                  styles.radio,
                  role === 'user' && styles.radioSelected,
                ]}
              >
                {role === 'user' && (
                  <View style={styles.radioInner} />
                )}
              </View>

              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>
                  Usuario
                </Text>

                <Text style={styles.roleDescription}>
                  Acceso normal a la aplicación
                </Text>
              </View>
            </TouchableOpacity>

            {/* ROOT (solo visible para la cuenta Root) */}
            {isRootAccount && (
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  role === 'root' && styles.roleOptionSelected,
                ]}
                onPress={() => handleRoleChange('root')}
                disabled={saving}
              >
                <View
                  style={[
                    styles.radio,
                    role === 'root' && styles.radioSelected,
                  ]}
                >
                  {role === 'root' && (
                    <View style={styles.radioInner} />
                  )}
                </View>

                <View style={styles.roleTextContainer}>
                  <View style={styles.rootTitleRow}>
                    <Text style={styles.roleTitle}>
                      Root
                    </Text>

                    <View style={styles.rootBadge}>
                      <Text style={styles.rootBadgeText}>
                        ADMIN
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.roleDescription}>
                    Acceso administrativo
                  </Text>
                </View>
              </TouchableOpacity>
            )}

          </View>

          {isRootAccount ? (
            <View style={styles.warningBox}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={COLORS.buttonDark}
              />

              <Text style={styles.warningText}>
                La cuenta Root está protegida y no puede
                ser degradada a usuario.
              </Text>
            </View>
          ) : (
            <View style={styles.warningBox}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={COLORS.buttonDark}
              />

              <Text style={styles.warningText}>
                El rol Root está reservado a una única cuenta
                y no puede asignarse a otros usuarios.
              </Text>
            </View>
          )}

        </View>

        {/* ESTADO ACTUAL */}
        <View style={styles.card}>

          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={COLORS.buttonDark}
              />
            </View>

            <View>
              <Text style={styles.cardTitle}>
                Estado de la cuenta
              </Text>

              <Text style={styles.cardSubtitle}>
                Estado actual del usuario
              </Text>
            </View>
          </View>

          <View style={styles.statusRow}>

            <View
              style={[
                styles.statusDot,
                user.status === 'active'
                  ? styles.statusDotActive
                  : styles.statusDotSuspended,
              ]}
            />

            <Text style={styles.statusText}>
              {user.status === 'active'
                ? 'Cuenta activa'
                : 'Cuenta suspendida'}
            </Text>

          </View>

          <Text style={styles.statusHelp}>
            El estado de la cuenta se modifica desde
            "Gestión de Usuario".
          </Text>

        </View>

        {/* BOTONES */}
        <View style={styles.actions}>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>
              Cancelar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              saving && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator
                size="small"
                color={COLORS.white}
              />
            ) : (
              <>
                <Ionicons
                  name="save-outline"
                  size={20}
                  color={COLORS.white}
                />

                <Text style={styles.saveButtonText}>
                  Guardar cambios
                </Text>
              </>
            )}
          </TouchableOpacity>

        </View>

      </ScrollView>
    </View>
  );
}

// =========================================================
// ESTILOS
// =========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },

  loadingText: {
    marginTop: 14,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: COLORS.textLight,
  },

  emptyTitle: {
    marginTop: 16,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: COLORS.textDark,
  },

  header: {
    minHeight: 92,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
  },

  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3EAF7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  headerTitleContainer: {
    flex: 1,
  },

  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: COLORS.textDark,
  },

  headerSubtitle: {
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: COLORS.textLight,
  },

  content: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 50,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 22,
    marginBottom: 18,

    ...Platform.select({
      web: {
        boxShadow: '0px 2px 10px rgba(74, 59, 83, 0.08)',
      },
      default: {
        elevation: 3,
      },
    }),
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#F3EAF7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  cardTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: COLORS.textDark,
  },

  cardSubtitle: {
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.textLight,
  },

  field: {
    marginBottom: 17,
  },

  label: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.textDark,
    marginBottom: 7,
  },

  input: {
    height: 48,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.textDark,
  },

  inputReadOnly: {
    backgroundColor: '#F3EEF6',
    color: COLORS.textLight,
  },

  fieldHelp: {
    marginTop: 6,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textLight,
  },

  roleOptions: {
    gap: 12,
  },

  roleOption: {
    minHeight: 76,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  roleOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FBF6FD',
  },

  roleOptionDisabled: {
    opacity: 0.55,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#B9AFC0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  radioSelected: {
    borderColor: COLORS.buttonDark,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.buttonDark,
  },

  roleTextContainer: {
    flex: 1,
  },

  roleTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.textDark,
  },

  roleDescription: {
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.textLight,
  },

  rootTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  rootBadge: {
    backgroundColor: '#EEE2F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },

  rootBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    color: COLORS.buttonDark,
  },

  warningBox: {
    marginTop: 16,
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#F6EEFA',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  warningText: {
    flex: 1,
    marginLeft: 9,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textLight,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },

  statusDotActive: {
    backgroundColor: COLORS.success,
  },

  statusDotSuspended: {
    backgroundColor: COLORS.danger,
  },

  statusText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.textDark,
  },

  statusHelp: {
    marginTop: 8,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.textLight,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },

  cancelButton: {
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cancelButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.textDark,
  },

  saveButton: {
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: COLORS.buttonDark,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.white,
  },

  backButton: {
    marginTop: 20,
    backgroundColor: COLORS.buttonDark,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
  },

  backButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.white,
    fontSize: 14,
  },
});