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

  // Si el ancho es mayor a 768 px consideramos que es PC.
  const isDesktop = width > 768;


  // ----------------------------------------------------------
  // HANDLER PARA INPUT
  // ----------------------------------------------------------

  const handleEmailChange = (value) => {
    setEmail(value);
    if (alert.message) setAlert({ type: '', message: '' });
  };


  // ==========================================================
  // FUNCIÓN PARA RECUPERAR CONTRASEÑA
  // ==========================================================

  const handleResetPassword = () => {

    if (!email) {
      setAlert({
        type: 'error',
        message: MESSAGES.REQUIRED_FIELDS,
      });

      return;
    }

    setAlert({
      type: 'success',
      message: MESSAGES.RECOVERY_SENT,
    });
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


            {/* =============================================
                TÍTULO
                ============================================= */}

            <Text style={styles.title}>
              Recuperar contraseña
            </Text>


            {/* =============================================
                SUBTÍTULO
                ============================================= */}

            <Text style={styles.subtitle}>
              Ingresá tu correo electrónico y te enviaremos
              un enlace para restablecer tu contraseña.
            </Text>


            {/* =============================================
                ALERTA DE ERROR / ÉXITO
                ============================================= */}

            <AlertMessage type={alert.type} message={alert.message} />


            {/* =============================================
                INPUT CORREO ELECTRÓNICO
                ============================================= */}

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


            {/* =============================================
                BOTÓN ENVIAR ENLACE (#764dc6)
                ============================================= */}

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


          {/* ===============================================
              SEPARADOR
              =============================================== */}

          <View style={styles.dividerContainer}>

            <View style={styles.dividerLine} />

            <View style={styles.diamond} />

            <View style={styles.dividerLine} />

          </View>


          {/* ===============================================
              ENLACE PARA INICIAR SESIÓN
              =============================================== */}

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


  // ==========================================================
  // CONTENEDOR GENERAL
  // ==========================================================

  container: {
    flex: 1,

    backgroundColor: COLORS.background,

    justifyContent: 'space-between',
  },


  // ==========================================================
  // HEADER - CELULAR
  // ==========================================================

  topBar: {
    backgroundColor: '#B185DB',

    height: 85,

    justifyContent: 'center',

    paddingHorizontal: 16,
  },


  // ==========================================================
  // HEADER - PC
  // ==========================================================

  desktopTopBar: {
    height: 60,
  },


  // ==========================================================
  // BOTÓN VOLVER
  // ==========================================================

  backButton: {
    width: 36,

    height: 36,

    justifyContent: 'center',

    alignItems: 'center',

    marginTop: 18,
  },


  // ==========================================================
  // CONTENIDO PRINCIPAL - CELULAR
  // ==========================================================

  mainContent: {
    flex: 1,

    width: '100%',

    paddingHorizontal: 24,

    justifyContent: 'center',

    alignItems: 'center',

    flexDirection: 'column',
  },


  // ==========================================================
  // CONTENIDO PRINCIPAL - PC
  // ==========================================================

  desktopContent: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: '10%',

    gap: 40,
  },


  // ==========================================================
  // COLUMNA DEL FORMULARIO - CELULAR
  // ==========================================================

  leftColumn: {
    width: '100%',

    alignItems: 'center',
  },


  // ==========================================================
  // COLUMNA DEL FORMULARIO - PC
  // ==========================================================

  desktopLeftColumn: {
    width: '50%',

    alignItems: 'stretch',
  },


  // ==========================================================
  // TÍTULO
  // ==========================================================

  title: {
    fontSize: 32,

    fontFamily: 'Poppins_700Bold',

    color: COLORS.primary,

    textAlign: 'center',

    marginBottom: 8,
  },


  // ==========================================================
  // SUBTÍTULO
  // ==========================================================

  subtitle: {
    fontSize: 15,

    fontFamily: 'Poppins_400Regular',

    color: COLORS.textLight,

    textAlign: 'center',

    marginBottom: 24,

    lineHeight: 22,
  },


  // ==========================================================
  // CONTENEDOR DEL INPUT
  // ==========================================================

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


  // ==========================================================
  // ÍCONO DEL INPUT
  // ==========================================================

  inputIcon: {
    marginRight: 10,
  },


  // ==========================================================
  // TEXTO DEL INPUT
  // ==========================================================

  input: {
    flex: 1,

    fontSize: 15,

    fontFamily: 'Poppins_400Regular',

    color: '#333',
  },


  // ==========================================================
  // BOTÓN ENVIAR ENLACE
  // ==========================================================

  submitButton: {
    width: '100%',

    backgroundColor: '#764dc6',

    height: 52,

    borderRadius: 12,

    alignItems: 'center',

    justifyContent: 'center',
  },


  // ==========================================================
  // TEXTO DEL BOTÓN
  // ==========================================================

  submitButtonText: {
    color: '#FFFFFF',

    fontSize: 15,

    fontFamily: 'Poppins_600SemiBold',
  },


  // ==========================================================
  // COLUMNA DERECHA - CELULAR
  // ==========================================================

  rightColumn: {
    width: '100%',

    marginTop: 20,
  },


  // ==========================================================
  // COLUMNA DERECHA - PC
  // ==========================================================

  desktopRightColumn: {
    width: '50%',

    marginTop: 0,
  },


  // ==========================================================
  // TARJETA DE INFORMACIÓN
  // ==========================================================

  infoCard: {
    backgroundColor: '#F0E6FF',

    borderRadius: 16,

    padding: 20,

    flexDirection: 'row',

    alignItems: 'center',
  },


  // ==========================================================
  // ÍCONO DE INFORMACIÓN
  // ==========================================================

  infoIcon: {
    marginRight: 16,
  },


  // ==========================================================
  // TEXTO DE INFORMACIÓN
  // ==========================================================

  infoText: {
    flex: 1,

    fontSize: 14,

    fontFamily: 'Poppins_400Regular',

    color: '#555',

    lineHeight: 20,
  },


  // ==========================================================
  // FOOTER (AFECTA LA POSICIÓN VERTICAL DEL TEXTO INFERIOR)
  // ==========================================================

  footer: {
    paddingHorizontal: 24,

    // LÍNEA CLAVE: Aumentá este número si querés subir más el texto (ej: 40 o 50),
    // o disminuilo si querés pegarlo al borde inferior.
    paddingBottom: 40,
  },


  // ==========================================================
  // SEPARADOR
  // ==========================================================

  dividerContainer: {
    flexDirection: 'row',

    alignItems: 'center',

    // LÍNEA CLAVE: Separa la línea/rombo del texto de "Iniciar sesión"
    marginBottom: 16,
  },


  // ==========================================================
  // LÍNEA DEL SEPARADOR
  // ==========================================================

  dividerLine: {
    flex: 1,

    height: 1,

    backgroundColor: '#E0E0E0',
  },


  // ==========================================================
  // ROMBO DEL SEPARADOR
  // ==========================================================

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


  // ==========================================================
  // CONTENEDOR DEL ENLACE
  // ==========================================================

  loginLinkContainer: {
    flexDirection: 'row',

    justifyContent: 'center',

    alignItems: 'center',
  },


  // ==========================================================
  // TEXTO DEL FOOTER
  // ==========================================================

  footerText: {
    fontSize: 14,

    fontFamily: 'Poppins_400Regular',

    color: COLORS.textLight,
  },


  // ==========================================================
  // ENLACE INICIAR SESIÓN
  // ==========================================================

  loginLinkText: {
    fontSize: 14,

    fontFamily: 'Poppins_600SemiBold',

    color: COLORS.primary,
  },

});