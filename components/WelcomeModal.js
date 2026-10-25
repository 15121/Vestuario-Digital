// ============================================================
// BIENVENIDA PARA USUARIOS NUEVOS
// ============================================================
//
// Ubicación: components/WelcomeModal.js
//
// Tres pantallas que se muestran la PRIMERA vez que un usuario
// entra a la app. Que ya la vio se recuerda en el dispositivo
// con AsyncStorage (igual que la ciudad del clima en
// services/weatherStorage.js), sin usar la base de datos.
// ============================================================

import React, { useEffect, useRef, useState } from 'react';

import {
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS } from '../theme/colours';

import ilustracionImg from '../assets/ilustracion.png';

// En el navegador no existe el "driver nativo" de animaciones
// (daba un aviso en la terminal): se usa solo en el celular.
const USE_NATIVE_DRIVER = Platform.OS !== 'web';



const STEPS = [
  {
    icon: 'hanger',
    family: 'mci',
    title: 'Tu armario digital',
    text:
      'Cargá tus prendas con foto, color y categoría, y encontralas rápido con el buscador y los filtros.',
  },
  {
    icon: 'partly-sunny-outline',
    family: 'ion',
    title: 'Outfits según el clima',
    text:
      'Te recomendamos qué ponerte hoy o mañana según el clima de tu ciudad. ¿Sin ideas? Probá "Sorprendeme" al crear un outfit.',
  },
  {
    icon: 'briefcase-outline',
    family: 'ion',
    title: 'Preparar la maleta',
    text:
      'Armá tu maleta para un viaje: te decimos cuántas prendas llevar según los días y seguís el progreso con una barra.',
  },
];

const getKey = (user) =>
  `welcomeSeen_${user?.id ?? user?.id_usuario ?? 'guest'}`;


// ¿Ya vio la bienvenida? (si falla la lectura, no la mostramos
// para no molestar en cada inicio de sesión)
export const hasSeenWelcome = async (user) => {
  try {
    return (await AsyncStorage.getItem(getKey(user))) === '1';
  } catch (error) {
    return true;
  }
};

const markWelcomeSeen = async (user) => {
  try {
    await AsyncStorage.setItem(getKey(user), '1');
  } catch (error) {
    console.log('No se pudo guardar que se vio la bienvenida:', error);
  }
};


export default function WelcomeModal({ user, blocked = false }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const userId = user?.id ?? user?.id_usuario;

  useEffect(() => {
    let active = true;

    if (userId === null || userId === undefined) {
      return undefined;
    }

    hasSeenWelcome(user).then((seen) => {
      if (active && !seen) {
        setStep(0);
        setVisible(true);
      }
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const close = () => {
    setVisible(false);
    markWelcomeSeen(user);
  };

  const goTo = (next) => {
    Animated.timing(fade, {
      toValue: 0,
      duration: 120,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start(() => {
      setStep(next);
      Animated.timing(fade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
    });
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const firstName = String(user?.name || '').trim().split(' ')[0];

  return (
    <Modal
      visible={visible && !blocked}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Pressable style={styles.skip} onPress={close} hitSlop={10}>
            <Text style={styles.skipText}>Saltar</Text>
          </Pressable>

          {step === 0 ? (
            <Image source={ilustracionImg} style={styles.illustration} resizeMode="contain" />
          ) : null}

          <Animated.View style={[styles.content, { opacity: fade }]}>
            {step === 0 ? (
              <Text style={styles.hello}>
                {firstName ? `¡Hola, ${firstName}!` : '¡Hola!'}
              </Text>
            ) : null}

            <View style={styles.iconCircle}>
              {current.family === 'mci' ? (
                <MaterialCommunityIcons name={current.icon} size={30} color={COLORS.buttonDark} />
              ) : (
                <Ionicons name={current.icon} size={30} color={COLORS.buttonDark} />
              )}
            </View>

            <Text style={styles.title}>{current.title}</Text>
            <Text style={styles.text}>{current.text}</Text>
          </Animated.View>

          <View style={styles.dots}>
            {STEPS.map((item, index) => (
              <View
                key={item.title}
                style={[styles.dot, index === step && styles.dotActive]}
              />
            ))}
          </View>

          <View style={styles.buttons}>
            {step > 0 ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => goTo(step - 1)}
                activeOpacity={0.85}
              >
                <Text style={styles.backText}>Atrás</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => (isLast ? close() : goTo(step + 1))}
              activeOpacity={0.85}
            >
              <Text style={styles.nextText}>{isLast ? '¡Empezar!' : 'Siguiente'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(48, 43, 59, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 22,
    alignItems: 'center',
  },

  skip: {
    alignSelf: 'flex-end',
  },

  skipText: {
    fontFamily: 'Poppins_500Medium',
    color: COLORS.textLight,
    fontSize: 13,
  },

  illustration: {
    width: 150,
    height: 110,
    marginTop: 4,
  },

  content: {
    alignItems: 'center',
    minHeight: 190,
    justifyContent: 'center',
  },

  hello: {
    fontFamily: 'Poppins_700Bold',
    color: COLORS.textDark,
    fontSize: 22,
    marginBottom: 10,
    textAlign: 'center',
  },

  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#F3EEFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  title: {
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 6,
  },

  text: {
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },

  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
    marginBottom: 18,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E4D9F5',
  },

  dotActive: {
    width: 22,
    backgroundColor: COLORS.buttonDark,
  },

  buttons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },

  backButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4D9F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    fontFamily: 'Poppins_500Medium',
    color: COLORS.textLight,
    fontSize: 14,
  },

  nextButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: COLORS.buttonDark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nextText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    fontSize: 14,
  },
});
