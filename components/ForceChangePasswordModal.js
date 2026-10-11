import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colours';
import AlertMessage from './AlertMessage';
import { resetUserPassword } from '../services/database';

// Formato que genera ForgotPasswordScreen: Vestuario-1234
export const isTemporaryPassword = (password) =>
  /^Vestuario-\d{4,}$/.test(String(password || ''));

export default function ForceChangePasswordModal({ visible, user, onDone }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const clearAlert = () => setAlert({ type: '', message: '' });

  const handleSave = async () => {
    if (loading) return;

    if (!newPassword || !confirm) {
      setAlert({ type: 'error', message: 'Completá ambos campos.' });
      return;
    }

    if (newPassword.length < 6) {
      setAlert({
        type: 'error',
        message: 'La contraseña debe tener al menos 6 caracteres.',
      });
      return;
    }

    if (isTemporaryPassword(newPassword)) {
      setAlert({
        type: 'error',
        message: 'Elegí una contraseña distinta a la temporal.',
      });
      return;
    }

    if (newPassword !== confirm) {
      setAlert({ type: 'error', message: 'Las contraseñas no coinciden.' });
      return;
    }

    try {
      setLoading(true);

      const result = await resetUserPassword(user?.email, newPassword);

      if (!result?.success) {
        setAlert({
          type: 'error',
          message: 'No se pudo actualizar la contraseña. Intentá nuevamente.',
        });
        return;
      }

      setNewPassword('');
      setConfirm('');
      clearAlert();
      onDone?.();
    } catch (error) {
      console.log('Error al cambiar la clave temporal:', error);
      setAlert({
        type: 'error',
        message: 'No se pudo actualizar la contraseña.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}} // bloquea el botón "atrás" de Android
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons
              name="lock-closed-outline"
              size={32}
              color={COLORS.buttonDark}
            />
          </View>

          <Text style={styles.title}>Cambiá tu contraseña</Text>

          <Text style={styles.subtitle}>
            Ingresaste con una clave temporal. Para continuar tenés que elegir
            una contraseña propia.
          </Text>

          <AlertMessage type={alert.type} message={alert.message} />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nueva contraseña"
              placeholderTextColor="#A0A0A0"
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                clearAlert();
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#A0A0A0"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirmar contraseña"
              placeholderTextColor="#A0A0A0"
              secureTextEntry={!showPassword}
              value={confirm}
              onChangeText={(text) => {
                setConfirm(text);
                clearAlert();
              }}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleSave}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Guardar contraseña</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(55, 35, 75, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4D8E9',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#333333',
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.buttonDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
});
