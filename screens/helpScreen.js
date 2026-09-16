import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colours';

// ============================================================
// DATOS DE AYUDA
// ============================================================

const HELP_ITEMS = [
  {
    id: 1,
    title: '¿Cómo agrego una prenda?',
    description:
      'Utilizá el botón + del menú inferior para registrar una nueva prenda en tu armario.',
    icon: 'tshirt-crew-outline',
  },
  {
    id: 2,
    title: '¿Cómo creo un outfit?',
    description:
      'Ingresá a la sección Outfits y seleccioná Crear outfit para combinar tus prendas.',
    icon: 'hanger',
  },
  {
    id: 3,
    title: '¿Cómo funciona la recomendación climática?',
    description:
      'La aplicación consulta el clima de la ciudad registrada por el usuario y recomienda las prendas disponibles en su armario que mejor se adapten a esas condiciones.',
    icon: 'weather-partly-cloudy',
  },
  {
    id: 4,
    title: '¿Cómo uso el modo maleta?',
    description:
      'Creá una maleta, seleccioná las prendas que llevarás y marcá cuáles ya fueron empacadas.',
    icon: 'briefcase-outline',
  },
];

// ============================================================
// TARJETA DE AYUDA
// ============================================================

function HelpCard({ item, expanded, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.helpCard,
        expanded && styles.helpCardExpanded,
      ]}
    >
      <View style={styles.helpIconContainer}>
        <MaterialCommunityIcons
          name={item.icon}
          size={42}
          color={COLORS.primary}
        />
      </View>

      <View style={styles.helpContent}>
        <Text style={styles.helpTitle}>{item.title}</Text>

        {expanded && (
          <Text style={styles.helpDescription}>
            {item.description}
          </Text>
        )}
      </View>

      <View style={styles.arrowContainer}>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={25}
          color={COLORS.buttonDark}
        />
      </View>
    </TouchableOpacity>
  );
}

// ============================================================
// CONSEJO
// ============================================================

function AdviceCard() {
  return (
    <View style={styles.adviceCard}>
      <View style={styles.adviceIconContainer}>
        <MaterialCommunityIcons
          name="lightbulb-on-outline"
          size={42}
          color={COLORS.primary}
        />
      </View>

      <View style={styles.adviceContent}>
        <Text style={styles.adviceTitle}>Consejo</Text>

        <Text style={styles.adviceText}>
          Mantener actualizado el armario permitirá obtener
          recomendaciones más precisas y organizar mejor los
          outfits y las maletas.
        </Text>
      </View>
    </View>
  );
}

// ============================================================
// PANTALLA AYUDA
// ============================================================

export default function AboutAppScreen({ navigation }) {
  const { width } = useWindowDimensions();

  const isDesktop = width > 768;

  const [expandedId, setExpandedId] = useState(null);

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  };

  const toggleItem = (id) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>

        {/* ==================================================
            CONTENIDO
        ================================================== */}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.scrollContentDesktop,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Flecha volver */}
          <TouchableOpacity
            style={[
              styles.backButton,
              isDesktop && styles.backButtonDesktop,
            ]}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={34}
              color={COLORS.buttonDark}
            />
          </TouchableOpacity>

          {/* Tarjetas de ayuda */}
          <View
            style={[
              styles.cardsContainer,
              isDesktop && styles.cardsContainerDesktop,
            ]}
          >
            {HELP_ITEMS.map((item) => (
              <HelpCard
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onPress={() => toggleItem(item.id)}
              />
            ))}

            {/* Consejo */}
            <AdviceCard />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 30,
  },

  scrollContentDesktop: {
    paddingHorizontal: 50,
    paddingTop: 14,
    paddingBottom: 45,
  },

  // ==========================================================
  // BOTÓN VOLVER
  // ==========================================================

  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 2,
  },

  backButtonDesktop: {
    marginLeft: 0,
    marginBottom: 12,
  },

  // ==========================================================
  // CONTENEDOR DE TARJETAS
  // ==========================================================

  cardsContainer: {
    width: '100%',
  },

  cardsContainerDesktop: {
    maxWidth: 1300,
    alignSelf: 'center',
  },

  // ==========================================================
  // TARJETA
  // ==========================================================

  helpCard: {
    width: '100%',
    minHeight: 150,

    backgroundColor: '#FFFFFF',

    borderRadius: 18,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 18,
    paddingVertical: 18,

    marginBottom: 14,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,

    elevation: 2,
  },

  helpCardExpanded: {
    alignItems: 'flex-start',
  },

  // ==========================================================
  // ÍCONO
  // ==========================================================

  helpIconContainer: {
    width: 78,
    height: 78,

    borderRadius: 39,

    backgroundColor: '#F8EEFF',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 18,
  },

  // ==========================================================
  // CONTENIDO
  // ==========================================================

  helpContent: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },

  helpTitle: {
    fontSize: 18,
    lineHeight: 25,

    color: COLORS.textDark,

    fontFamily: 'Poppins_600SemiBold',
  },

  helpDescription: {
    fontSize: 15,
    lineHeight: 23,

    color: COLORS.textLight,

    fontFamily: 'Poppins_400Regular',

    marginTop: 9,
  },

  // ==========================================================
  // FLECHA
  // ==========================================================

  arrowContainer: {
    width: 36,
    height: 50,

    justifyContent: 'center',
    alignItems: 'center',

    marginLeft: 4,
  },

  // ==========================================================
  // CONSEJO
  // ==========================================================

  adviceCard: {
    width: '100%',

    minHeight: 135,

    backgroundColor: '#F6EDFF',

    borderRadius: 18,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 18,
    paddingVertical: 18,

    marginTop: 2,
  },

  adviceIconContainer: {
    width: 70,
    height: 70,

    borderRadius: 35,

    backgroundColor: '#F1E3FF',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 18,
  },

  adviceContent: {
    flex: 1,
  },

  adviceTitle: {
    fontSize: 19,
    lineHeight: 25,

    color: COLORS.buttonDark,

    fontFamily: 'Poppins_600SemiBold',

    marginBottom: 7,
  },

  adviceText: {
    fontSize: 15,
    lineHeight: 23,

    color: COLORS.textDark,

    fontFamily: 'Poppins_400Regular',
  },
});