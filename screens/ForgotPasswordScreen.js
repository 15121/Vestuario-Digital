import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colours';
import { MESSAGES } from '../theme/messages';
import ResponsiveContainer from '../components/ResponsiveContainer';
import AlertMessage from '../components/AlertMessage';
import { resetUserPassword, requestPasswordReset } from '../services/database';
import { sendForgotPasswordEmail } from '../services/emailService';

// ============================================================
// PANTALLA RECUPERAR CONTRASEÑA
// ============================================================
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos
const COOLDOWN_KEY = 'forgotPasswordCooldownUntil';
export default function ForgotPasswordScreen({ navigation }) {

  // ----------------------------------------------------------
  // DATOS DEL FORMULARIO Y ESTADO DE ALERTA
  // ----------------------------------------------------------

  const [email, setEmail] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });
const [loading, setLoading] = useState(false);
const [cooldownUntil, setCooldownUntil] = useState(0);
const [now, setNow] = useState(Date.now());
const sendingRef = useRef(false);

// Recuperar el cooldown guardado (si el usuario salió y volvió)
useEffect(() => {
  AsyncStorage.getItem(COOLDOWN_KEY).then((value) => {
    const until = Number(value) || 0;
    if (until > Date.now()) {
      setCooldownUntil(until);
      setNow(Date.now());
    }
  });
}, []);

// Reloj que actualiza la cuenta regresiva cada segundo
useEffect(() => {
  if (!cooldownUntil) return undefined;

  const id = setInterval(() => {
    const t = Date.now();
    setNow(t);
    if (t >= cooldownUntil) clearInterval(id);
  }, 1000);

  return () => clearInterval(id);
}, [cooldownUntil]);

const secondsLeft = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
const isCoolingDown = secondsLeft > 0;

const formatTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  // ----------------------------------------------------------
  // DETECCIÓN DE DISPOSITIVO
  // ----------------------------------------------------------

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  // ----------------------------------------------------------
  // HANDLER PARA INPUT
  // ----------------------------------------------------------

  const handleEmailChange = (value) => {
    setEmail(value);
    if (alert.message) setAlert({ type: '', message: '' });
  };

  // ----------------------------------------------------------
  // FUNCIÓN AUXILIAR: GENERAR CLAVE TEMPORAL
  // ----------------------------------------------------------

  const generateTempPassword = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `Vestuario-${randomNum}`;
  };

  // ==========================================================
  // FUNCIÓN PARA RECUPERAR CONTRASEÑA
  // ==========================================================

 const handleResetPassword = async () => {
  // Bloqueo inmediato: evita doble toque antes de que React actualice el estado
  if (sendingRef.current || isCoolingDown) return;

  const cleanEmail = email.trim();

  if (!cleanEmail) {
    setAlert({
      type: 'error',
      message: MESSAGES.REQUIRED_FIELDS,
    });
    return;
  }

  sendingRef.current = true;
  setLoading(true);

  try {
    if (Platform.OS === 'web') {
      // Web: el servidor genera la clave y envía el mail
      const result = await requestPasswordReset(cleanEmail);

      if (!result.success) {
        setAlert({
          type: 'error',
          message: 'Ocurrió un error al enviar el correo. Intentalo de nuevo.',
        });
        return;
      }
    } else {
      // Celular (SQLite local): flujo anterior
      const tempPassword = generateTempPassword();
      const dbResult = await resetUserPassword(cleanEmail, tempPassword);

      if (!dbResult.success) {
        setAlert({
          type: 'error',
          message: 'El correo ingresado no pertenece a una cuenta registrada.',
        });
        return;
      }

      await sendForgotPasswordEmail(cleanEmail, tempPassword);
    }

    // 4. Iniciamos el cooldown y lo guardamos
    const until = Date.now() + COOLDOWN_MS;
    setCooldownUntil(until);
    setNow(Date.now());
    await AsyncStorage.setItem(COOLDOWN_KEY, String(until));

    setAlert({
      type: 'success',
      message:
        Platform.OS === 'web'
          ? 'Si el correo está registrado, te enviamos una clave temporal.'
          : '¡Correo enviado! Te enviamos una clave temporal para ingresar.',
    });
  } catch (error) {
    console.log('Error detallado al enviar correo:', error);
    setAlert({
      type: 'error',
      message: 'Ocurrió un error al enviar el correo. Intentalo de nuevo.',
    });
  } finally {
    sendingRef.current = false;
    setLoading(false);
  }
};

  // ==========================================================
  // INTERFAZ
  // ==========================================================

  return (
    <ResponsiveContainer>
      <View style={styles.container}>

        {/* ==================================================
            BARRA SUPERIOR / HEADER
            ================================================== */}

        <View
          style={[
            styles.topBar,
            isDesktop && styles.desktopTopBar,
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation?.goBack()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={isDesktop ? 26 : 22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* ==================================================
            CONTENIDO PRINCIPAL
            ================================================== */}

        <View
          style={[
            styles.mainContent,
            isDesktop && styles.desktopContent,
          ]}
        >

          {/* ===============================================
              COLUMNA IZQUIERDA - FORMULARIO
              =============================================== */}

          <View
            style={[
              styles.leftColumn,
              isDesktop && styles.desktopLeftColumn,
            ]}
          >
            <Text style={styles.title}>
              Recuperar contraseña
            </Text>

            <Text style={styles.subtitle}>
              Ingresá tu correo electrónico y te enviaremos
              una clave temporal para que puedas ingresar.
            </Text>

            <AlertMessage type={alert.type} message={alert.message} />

            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
  style={[
    styles.submitButton,
    (loading || isCoolingDown) && styles.submitButtonDisabled,
  ]}
  onPress={handleResetPassword}
  disabled={loading || isCoolingDown}
>
  {loading ? (
    <ActivityIndicator color="#FFFFFF" />
  ) : (
    <Text style={styles.submitButtonText}>
      {isCoolingDown
        ? `Podés reenviar en ${formatTime(secondsLeft)}`
        : 'Enviar correo'}
    </Text>
  )}
</TouchableOpacity>
          </View>

          {/* ===============================================
              COLUMNA DERECHA - INFORMACIÓN
              =============================================== */}

          <View
            style={[
              styles.rightColumn,
              isDesktop && styles.desktopRightColumn,
            ]}
          >
            <View style={styles.infoCard}>
              <Ionicons
                name="information-circle-outline"
                size={42}
                color={COLORS.primary}
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>
                Si el correo está registrado, recibirás una
                clave temporal en unos minutos. Ingresá con ella
                y cambiala desde tu Perfil.
              </Text>
            </View>
          </View>

        </View>

        {/* ==================================================
            FOOTER
            ================================================== */}

        <View style={styles.footer}>
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <View style={styles.diamond} />
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.loginLinkContainer}>
            <Text style={styles.footerText}>
              ¿Recordaste tu contraseña?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => navigation?.navigate('Login')}
            >
              <Text style={styles.loginLinkText}>
                Iniciar sesión
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </ResponsiveContainer>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
  },
  topBar: {
    backgroundColor: '#B185DB',
    height: 85,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  desktopTopBar: {
    height: 60,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  mainContent: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    marginBottom: 0,
  },
  desktopContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '10%',
    gap: 40,
  },
  leftColumn: {
    width: '100%',
    alignItems: 'center',
  },
  desktopLeftColumn: {
    width: '50%',
    alignItems: 'stretch',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#764dc6',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  submitButtonDisabled: {
  opacity: 0.6,
},
  rightColumn: {
    width: '100%',
    marginTop: 20,
  },
  desktopRightColumn: {
    width: '50%',
    marginTop: 0,
  },
  infoCard: {
    backgroundColor: '#F0E6FF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#555',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    marginBottom: 90,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  diamond: {
    width: 8,
    height: 8,
    backgroundColor: COLORS.primary,
    transform: [
      {
        rotate: '45deg',
      },
    ],
    marginHorizontal: 12,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
  },
  loginLinkText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.primary,
  },
});