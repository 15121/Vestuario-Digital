import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colours';
import { MESSAGES } from '../theme/messages';
import ResponsiveContainer from '../components/ResponsiveContainer';
import AlertMessage from '../components/AlertMessage';
import { resetUserPassword } from '../services/database';

// ============================================================
// CONFIGURACIÓN DE EMAILJS
// ============================================================
// IMPORTANTE: Asegurate de pegar tus credenciales reales aquí
const EMAILJS_SERVICE_ID = 'service_f75fbir'; // Reemplazar con tu Service ID
const EMAILJS_TEMPLATE_ID = 'template_z3y7t8b';       // Tu Template ID de EmailJS
const EMAILJS_PUBLIC_KEY = 'D3fmwok6fbm58WR_p';   // Reemplazar con tu Public Key

// ============================================================
// PANTALLA RECUPERAR CONTRASEÑA
// ============================================================

export default function ForgotPasswordScreen({ navigation }) {

  // ----------------------------------------------------------
  // DATOS DEL FORMULARIO Y ESTADO DE ALERTA
  // ----------------------------------------------------------

  const [email, setEmail] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

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

    if (!email) {
      setAlert({
        type: 'error',
        message: MESSAGES.REQUIRED_FIELDS,
      });
      return;
    }

    try {
      // 1. Generamos la clave provisoria
      const tempPassword = generateTempPassword();

      // 2. Actualizamos la clave en la base de datos (Web o Celular)
      const dbResult = await resetUserPassword(email, tempPassword);

      if (!dbResult.success) {
        setAlert({
          type: 'error',
          message: 'El correo ingresado no pertenece a una cuenta registrada.',
        });
        return;
      }

      // 3. Parámetros para la plantilla de EmailJS
      const templateParams = {
        user_email: email,
        temp_password: tempPassword,
      };

      // 4. Envío de correo mediante API HTTP directa de EmailJS (Evita fallos en React Native/Expo)
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: templateParams,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`EmailJS Error status ${response.status}: ${errorText}`);
      }

      setAlert({
        type: 'success',
        message: '¡Correo enviado! Te enviamos una clave temporal para ingresar.',
      });

    } catch (error) {
      console.log('Error detallado al enviar correo:', error);
      setAlert({
        type: 'error',
        message: 'Ocurrió un error al enviar el correo. Intentalo de nuevo.',
      });
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
              un enlace para restablecer tu contraseña.
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
              style={styles.submitButton}
              onPress={handleResetPassword}
            >
              <Text style={styles.submitButtonText}>
                Enviar enlace de recuperación
              </Text>
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
                Si el correo está registrado, recibirás un
                enlace para restablecer tu contraseña en unos
                minutos.
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
    justify: 'space-between',
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