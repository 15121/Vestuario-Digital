import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import ResponsiveContainer from '../components/ResponsiveContainer';

const PURPLE_PRIMARY = '#764DC6';
const BACKGROUND = '#F8E9FE';

export default function WelcomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  return (
    <ResponsiveContainer>
      <View style={[styles.container, isDesktop && styles.desktopContainer]}>

        {/* =========================
            SECCIÓN PRINCIPAL IZQUIERDA
            ========================= */}
        <View
          style={[
            styles.headerSection,
            isDesktop && styles.desktopHeaderSection,
          ]}
        >
          <Image
            source={require('../assets/logo.png')}
            style={[
              styles.logo,
              isDesktop && styles.desktopLogo,
            ]}
            resizeMode="contain"
          />

          <Text
            style={[
              styles.title,
              isDesktop && styles.desktopTitle,
            ]}
          >
            Vestuario Digital
          </Text>

          <Text
            style={[
              styles.subtitle,
              isDesktop && styles.desktopSubtitle,
            ]}
          >
            Organizá tu ropa, creá tu estilo.
          </Text>

          {/* BOTONES SOLO EN PC */}
          {isDesktop && (
            <View style={styles.desktopButtonGroup}>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation?.navigate('Login')}
              >
                <Text style={styles.primaryButtonText}>
                  Iniciar sesión
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation?.navigate('Register')}
              >
                <Text style={styles.secondaryButtonText}>
                  Crear cuenta
                </Text>
              </TouchableOpacity>

            </View>
          )}
        </View>


        {/* =========================
            ILUSTRACIÓN DEL PERCHERO
            ========================= */}
        <View
          style={[
            styles.imageSection,
            isDesktop && styles.desktopImageSection,
          ]}
        >
          <Image
            source={require('../assets/ilustracion.png')}
            style={[
              styles.illustrationImage,
              isDesktop && styles.desktopIllustrationImage,
            ]}
            resizeMode="contain"
          />
        </View>


        {/* =========================
            BOTONES SOLO EN CELULAR
            ========================= */}
        {!isDesktop && (
          <View style={styles.mobileButtonGroup}>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation?.navigate('Login')}
            >
              <Text style={styles.primaryButtonText}>
                Iniciar sesión
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation?.navigate('Register')}
            >
              <Text style={styles.secondaryButtonText}>
                Crear cuenta
              </Text>
            </TouchableOpacity>

          </View>
        )}

      </View>
    </ResponsiveContainer>
  );
}


const styles = StyleSheet.create({

  // ==========================================
  // CONTENEDOR GENERAL
  // ==========================================

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    justifyContent: 'space-between',
    alignItems: 'center',

    // FONDO OFICIAL
    backgroundColor: BACKGROUND,
  },


  // ==========================================
  // VERSIÓN PC
  // ==========================================

  desktopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: '5%',
    paddingTop: 0,
    paddingBottom: 0,

    gap: 70,
  },


  // ==========================================
  // CELULAR
  // ==========================================

  headerSection: {
    alignItems: 'center',
    width: '100%',

    // BAJAMOS EL LOGO Y EL TEXTO
    marginTop: 70,
  },

  logo: {
    width: 110,
    height: 110,
    marginBottom: 10,
  },

  title: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#B87EEE',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#8A8A8A',
    textAlign: 'center',
    marginTop: 4,
  },


  // ==========================================
  // ILUSTRACIÓN
  // ==========================================

  imageSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',

    // NO MODIFICAMOS LA POSICIÓN DEL PERCHERO
    marginVertical: 10,
  },

  illustrationImage: {
    width: '100%',
    height: 260,
  },


  // ==========================================
  // BOTONES CELULAR
  // ==========================================

  mobileButtonGroup: {
    width: '100%',
    gap: 12,

    // SUBIMOS LOS BOTONES
    marginBottom: 50,
  },


  // ==========================================
  // PC
  // ==========================================

  desktopHeaderSection: {
    width: '42%',
    alignItems: 'center',
    marginTop: 0,
  },

  desktopLogo: {
    width: 175,
    height: 175,
    marginBottom: 18,
  },

  desktopTitle: {
    fontSize: 42,
  },

  desktopSubtitle: {
    fontSize: 19,
    marginTop: 5,
    marginBottom: 12,
  },

  desktopImageSection: {
    width: '55%',
    marginVertical: 0,
  },

  desktopIllustrationImage: {
    width: '100%',
    height: 560,
  },

  desktopButtonGroup: {
    width: '100%',
    maxWidth: 400,

    marginTop: 30,

    gap: 14,
  },


  // ==========================================
  // BOTÓN PRINCIPAL
  // ==========================================

  primaryButton: {
    backgroundColor: PURPLE_PRIMARY,

    height: 54,

    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',

    fontSize: 17,

    fontFamily: 'Poppins_600SemiBold',
  },


  // ==========================================
  // BOTÓN SECUNDARIO
  // ==========================================

  secondaryButton: {
    backgroundColor: '#FFFFFF',

    height: 54,

    borderRadius: 14,

    borderWidth: 1.5,
    borderColor: PURPLE_PRIMARY,

    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: PURPLE_PRIMARY,

    fontSize: 17,

    fontFamily: 'Poppins_600SemiBold',
  },

});