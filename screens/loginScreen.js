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
import ResponsiveContainer from '../components/ResponsiveContainer';
import AlertMessage from '../components/AlertMessage';
import { MESSAGES } from '../theme/messages';
import { loginUser } from '../services/database';



export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const handleInputChange = (setter) => (value) => {
    setter(value);
    if (alert.message) setAlert({ type: '', message: '' });
  };

const handleLogin = () => {
    // 1. Validación de campos obligatorios
    if (!email || !password) {
      setAlert({
        type: 'error',
        message: MESSAGES.REQUIRED_FIELDS || 'Completá todos los campos obligatorios.',
      });
      return;
    }

    // 2. Intento de inicio de sesión
    try {
      loginUser(email, password);
      
      setAlert({
        type: 'success',
        message: '¡Inicio de sesión exitoso!',
      });

      setTimeout(() => {
        navigation?.navigate('Home');
      }, 1200);

    } catch (error) {
      // Muestra "Esta cuenta no existe." enviándole la clave creada
      setAlert({
        type: 'error',
        message: MESSAGES.USER_NOT_FOUND || 'Esta cuenta no existe.',
      });
    }
  };

  // Función flexible para evitar fallos de ruta entre 'ForgotPassword' y 'ForgotPasswordScreen'
  const goToForgotPassword = () => {
    try {
      navigation.navigate('ForgotPassword');
    } catch (e) {
      navigation.navigate('ForgotPasswordScreen');
    }
  };

  return (
    <ResponsiveContainer>
      <View style={styles.container}>

        {/* HEADER APLICADO IGUAL EN CELULAR Y EN PC */}
        <View style={[styles.topBar, isDesktop && styles.desktopTopBar]}>
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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[styles.mainContent, isDesktop && styles.desktopContent]}>

            <View style={[styles.leftColumn, isDesktop && styles.desktopLeftColumn]}>

              <Text style={styles.title}>¡Bienvenido/a de nuevo!</Text>
              <Text style={styles.subtitle}>Iniciá sesión para acceder a tu armario virtual.</Text>

              <AlertMessage type={alert.type} message={alert.message} />

              {/* INPUT CORREO */}
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#B87EEE" style={styles.inputIcon} />
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

              {/* INPUT CONTRASEÑA */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#B87EEE" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#A0A0A0"
                  value={password}
                  onChangeText={handleInputChange(setPassword)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#A0A0A0"
                  />
                </TouchableOpacity>
              </View>

              {/* RECUPERAR CONTRASEÑA */}
              <TouchableOpacity
                style={styles.forgotPasswordContainer}
                onPress={goToForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              {/* BOTÓN VIOLETA OSCURO (#764DC6) */}
              <TouchableOpacity style={styles.submitButton} onPress={handleLogin}>
                <Text style={styles.submitButtonText}>Iniciar sesión</Text>
              </TouchableOpacity>

              {/* PIE Y ENLACE ELEVADOS EN CELULAR */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>¿No tenés cuenta? </Text>
                <TouchableOpacity onPress={() => navigation?.navigate('Register')}>
                  <Text style={styles.registerLink}>Crear cuenta</Text>
                </TouchableOpacity>
              </View>

            </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8E9FE',
  },

  // HEADER IGUAL A REGISTERSCREEN (ALTO EN CELULAR 85, PC 60)
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

// CONTENEDOR DEL SCROLL
// Permite que el contenido ocupe toda la altura disponible
// y así podamos centrarlo verticalmente en celular.
scrollContent: {
  flexGrow: 1,
  paddingBottom: 20,
},
// CONTENIDO PRINCIPAL DEL LOGIN
// En celular, flex: 1 permite ocupar el espacio disponible
// y justifyContent: 'center' centra todo el formulario
// verticalmente en la pantalla.
mainContent: {
  width: '100%',
  flexGrow: 1,
  paddingHorizontal: 24,
  paddingTop: 10,
  justifyContent: 'center',
},
  desktopContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '8%',
    gap: 60,
    paddingTop: 30,
  },

  leftColumn: {
    width: '100%',
  },
  desktopLeftColumn: {
    width: '45%',
  },

  title: {
    fontSize: 30,
    fontFamily: 'Poppins_700Bold',
    color: '#B87EEE',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7A6889',
    textAlign: 'center',
    marginBottom: 16,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 10,
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

  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 14,
    marginTop: 2,
  },
  forgotPasswordText: {
    color: '#B87EEE',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },

  // BOTÓN CON EL VIOLETA EXACTO #764DC6
  submitButton: {
    backgroundColor: '#764DC6',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 13,
    color: '#8A8A8A',
    fontFamily: 'Poppins_400Regular',
  },

  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#8A8A8A',
  },
  registerLink: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#B87EEE',
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