import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  Image,
  ScrollView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colours';
import ResponsiveContainer from '../components/ResponsiveContainer';
import AlertMessage from '../components/AlertMessage';
import { MESSAGES } from '../theme/messages';
import { registerUser } from '../services/database';
import { setAuthToken } from '../services/api';


// ============================================================
// COLORES
// ============================================================

// Color principal de Vestuario Digital.
const PURPLE_PRIMARY = COLORS.primary;


// ============================================================
// PANTALLA DE REGISTRO
// ============================================================

export default function RegisterScreen({ navigation }) {

  // ----------------------------------------------------------
  // DATOS DEL FORMULARIO
  // ----------------------------------------------------------

  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');


  // ----------------------------------------------------------
  // ESTADO DE ALERTAS PERSONALIZADAS
  // ----------------------------------------------------------

  const [alert, setAlert] = useState({ type: '', message: '' });


  // ----------------------------------------------------------
  // VISIBILIDAD DE LAS CONTRASEÑAS
  // ----------------------------------------------------------

  // false = contraseña oculta
  // true  = contraseña visible
  const [showPassword, setShowPassword] = useState(false);

  // false = confirmación oculta
  // true  = confirmación visible
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  // ----------------------------------------------------------
  // DETECCIÓN DE DISPOSITIVO
  // ----------------------------------------------------------

  const { width } = useWindowDimensions();

  // Si el ancho es mayor a 768 px consideramos que es PC.
  const isDesktop = width > 768;


  // ----------------------------------------------------------
  // HELPER PARA RESETEAR LA ALERTA AL ESCRIBIR
  // ----------------------------------------------------------

  const handleInputChange = (setter) => (value) => {
    setter(value);

    if (alert.message) {
      setAlert({ type: '', message: '' });
    }
  };


  // ==========================================================
  // FUNCIÓN DE REGISTRO
  // ==========================================================

  const handleRegister = async () => {

    // --------------------------------------------------------
    // VALIDACIÓN DE CAMPOS OBLIGATORIOS
    // --------------------------------------------------------

    if (
      !name ||
      !lastname ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      setAlert({
        type: 'error',
        message:
          MESSAGES.REQUIRED_FIELDS ||
          'Por favor completá todos los campos.',
      });

      return;
    }


    // --------------------------------------------------------
    // VALIDACIÓN DE CONTRASEÑAS
    // --------------------------------------------------------

    if (password !== confirmPassword) {
      setAlert({
        type: 'error',
        message: 'Las contraseñas no coinciden.',
      });

      return;
    }


    // --------------------------------------------------------
    // VALIDACIÓN DEL CORREO
    // --------------------------------------------------------

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      setAlert({
        type: 'error',
        message: 'Ingresá un correo electrónico válido.',
      });

      return;
    }


    // --------------------------------------------------------
    // VALIDACIÓN DE LONGITUD DE CONTRASEÑA
    // --------------------------------------------------------

    if (password.length < 6) {
      setAlert({
        type: 'error',
        message: 'La contraseña debe tener al menos 6 caracteres.',
      });

      return;
    }


    // --------------------------------------------------------
    // GUARDAR USUARIO Y REDIRIGIR A HOME
    // --------------------------------------------------------

    try {

      // Se crea la cuenta. NO se inicia sesión automáticamente:
      // todos los usuarios deben pasar por el Login.
      await registerUser(
        name,
        lastname,
        email,
        password
      );

      // En web registerUser guarda el token de sesión: se descarta
      // para que el usuario tenga que iniciar sesión.
      setAuthToken(null);

      setAlert({
        type: 'success',
        message: '¡Cuenta creada correctamente! Iniciá sesión para continuar.',
      });

      setTimeout(() => {
        // Pila limpia: Welcome -> Login
        navigation.reset({
          index: 1,
          routes: [
            { name: 'Welcome' },
            { name: 'Login' },
          ],
        });
      }, 1500);

    } catch (error) {

      console.log('Error al registrar:', error);

      const errStr = String(error?.message || error);

      let errorMessage =
        'No se pudo crear la cuenta. Intentá nuevamente.';


      if (
        errStr.includes('EMAIL_EXISTS') ||
        errStr.toLowerCase().includes('duplicate')
      ) {
        errorMessage = MESSAGES.EMAIL_EXISTS;

      } else if (
        errStr.includes('ROOT_EMAIL_RESERVED')
      ) {
        errorMessage = 'Ese correo está reservado.';

      } else if (
        errStr.includes('Failed to fetch') ||
        errStr.includes('Network request failed')
      ) {
        errorMessage = 'No se pudo conectar con el servidor.';
      }

      setAlert({
        type: 'error',
        message: errorMessage,
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
            BARRA SUPERIOR
            Contiene el botón para volver a la pantalla anterior.
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
            CONTENIDO DESPLAZABLE
            ================================================== */}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* =================================================
              CONTENIDO PRINCIPAL
              ================================================= */}

          <View
            style={[
              styles.mainContent,
              isDesktop && styles.desktopContent,
            ]}
          >

            {/* ===============================================
                COLUMNA DEL FORMULARIO
                =============================================== */}

            <View
              style={[
                styles.leftColumn,
                isDesktop && styles.desktopLeftColumn,
              ]}
            >

              {/* =============================================
                  TÍTULO DEL REGISTRO
                  ============================================= */}

              <Text style={styles.title}>
                ¡Crea tu cuenta!
              </Text>


              {/* =============================================
                  SUBTÍTULO DEL REGISTRO
                  ============================================= */}

              <Text style={styles.subtitle}>
                Completá tus datos para empezar
              </Text>


              {/* =============================================
                  CARTEL DE ALERTA DISEÑADO
                  ============================================= */}

              <AlertMessage
                type={alert.type}
                message={alert.message}
              />


              {/* =============================================
                  INPUT NOMBRE
                  ============================================= */}

              <View style={styles.inputContainer}>

                <Ionicons
                  name="person-outline"
                  size={20}
                  color={PURPLE_PRIMARY}
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Nombre"
                  placeholderTextColor="#A0A0A0"
                  value={name}
                  onChangeText={handleInputChange(setName)}
                />

              </View>


              {/* =============================================
                  INPUT APELLIDO
                  ============================================= */}

              <View style={styles.inputContainer}>

                <Ionicons
                  name="person-outline"
                  size={20}
                  color={PURPLE_PRIMARY}
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Apellido"
                  placeholderTextColor="#A0A0A0"
                  value={lastname}
                  onChangeText={handleInputChange(setLastname)}
                />

              </View>


              {/* =============================================
                  INPUT CORREO ELECTRÓNICO
                  ============================================= */}

              <View style={styles.inputContainer}>

                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={PURPLE_PRIMARY}
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  placeholderTextColor="#A0A0A0"
                  value={email}
                  onChangeText={handleInputChange(setEmail)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

              </View>


              {/* =============================================
                  INPUT CONTRASEÑA
                  ============================================= */}

              <View style={styles.inputContainer}>

                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={PURPLE_PRIMARY}
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#A0A0A0"
                  value={password}
                  onChangeText={handleInputChange(setPassword)}
                  secureTextEntry={!showPassword}
                />


                {/* BOTÓN MOSTRAR / OCULTAR CONTRASEÑA */}

                <TouchableOpacity
                  onPress={() =>
                    setShowPassword(!showPassword)
                  }
                >

                  <Ionicons
                    name={
                      showPassword
                        ? 'eye-outline'
                        : 'eye-off-outline'
                    }
                    size={20}
                    color="#A0A0A0"
                  />

                </TouchableOpacity>

              </View>


              {/* =============================================
                  INPUT CONFIRMAR CONTRASEÑA
                  ============================================= */}

              <View style={styles.inputContainer}>

                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={PURPLE_PRIMARY}
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#A0A0A0"
                  value={confirmPassword}
                  onChangeText={handleInputChange(setConfirmPassword)}
                  secureTextEntry={!showConfirmPassword}
                />


                {/* BOTÓN MOSTRAR / OCULTAR CONFIRMACIÓN */}

                <TouchableOpacity
                  onPress={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >

                  <Ionicons
                    name={
                      showConfirmPassword
                        ? 'eye-outline'
                        : 'eye-off-outline'
                    }
                    size={20}
                    color="#A0A0A0"
                  />

                </TouchableOpacity>

              </View>


              {/* =============================================
                  BOTÓN CREAR CUENTA
                  ============================================= */}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleRegister}
              >

                <Text style={styles.submitButtonText}>
                  Crear cuenta
                </Text>

              </TouchableOpacity>

            </View>


            {/* =================================================
                ILUSTRACIÓN DEL ARMARIO (SOLO EN PC)
                ================================================= */}

            {isDesktop && (

              <View style={styles.desktopRightColumn}>

                <Image
                  source={require('../assets/ilustracion.png')}
                  style={styles.illustrationImage}
                  resizeMode="contain"
                />

              </View>

            )}

          </View>

        </ScrollView>

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


  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },


  mainContent: {
    width: '100%',
    paddingHorizontal: 24,
    justifyContent: 'center',
    flexDirection: 'column',
    marginTop: -25,
  },


  desktopContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '8%',
    gap: 60,
    marginTop: 0,
  },


  leftColumn: {
    width: '100%',
  },


  desktopLeftColumn: {
    width: '45%',
  },


  title: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 4,
  },


  subtitle: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },


  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },


  inputIcon: {
    marginRight: 10,
  },


  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#333333',
  },


  submitButton: {
    backgroundColor: '#764dc6',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },


  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },


  desktopRightColumn: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },


  illustrationImage: {
    width: '100%',
    height: 420,
  },

});