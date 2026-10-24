import React, {
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';

import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { COLORS } from '../theme/colours';

// ============================================================
// DATOS DE AYUDA
// ============================================================

const HELP_ITEMS = [
  {
    id: 1,
    title: '¿Cómo agrego una prenda?',
    description:
      'Utilizá el botón + del menú inferior para registrar una nueva prenda en tu armario. Podés elegir entre casi 50 colores o tomarlo directamente de la foto.',
    icon: 'tshirt-crew-outline',
  },
  {
    id: 2,
    title: '¿Cómo creo un outfit?',
    description:
      'Ingresá a la sección Outfits y seleccioná Crear outfit para combinar tus prendas. Si ya tenés un outfit con las mismas prendas, la app te avisa para que no quede repetido.',
    icon: 'hanger',
  },
  {
    id: 3,
    title: '¿Qué hace el botón "Sorprendeme"?',
    description:
      'Al crear un outfit, "Sorprendeme" arma una combinación con prendas de tu armario que combinan por color. Cada vez que lo tocás sale una distinta, y podés cambiar cualquier prenda antes de guardar.',
    icon: 'shuffle-variant',
  },
  {
    id: 4,
    title: '¿Cómo edito un outfit?',
    description:
      'Abrí el outfit desde Mis outfits y tocá "Editar outfit". Podés cambiar el nombre, la descripción y las prendas.',
    icon: 'pencil-outline',
  },
  {
    id: 5,
    title: '¿Qué es "Combina con…"?',
    description:
      'En el detalle de una prenda aparecen otras prendas de tu armario que quedan bien con ella. Tocá cualquiera para ver su detalle.',
    icon: 'palette-outline',
  },
  {
    id: 6,
    title: '¿Cómo funciona la recomendación climática?',
    description:
      'La aplicación consulta el clima de tu ciudad y te propone hasta 3 outfits con prendas de tu armario. Debajo de cada prenda hay otras opciones para cambiarla, y en "Durante el día" te avisa si más tarde refresca o puede llover. También podés ver la recomendación para mañana.',
    icon: 'weather-partly-cloudy',
  },
  {
    id: 7,
    title: '¿Puedo guardar un outfit recomendado?',
    description:
      'Sí. En la recomendación climática, "Guardar outfit" lo agrega a Mis outfits, y "Me lo pongo hoy" además lo registra en tu historial de hoy.',
    icon: 'content-save-outline',
  },
  {
    id: 8,
    title: '¿Cómo uso el modo maleta?',
    description:
      'Creá una maleta con el destino y las fechas. La app te dice cuántas prendas llevar de cada tipo según los días del viaje, y con "Sugerir prendas de mi armario" las elige por vos. Marcá las que ya guardaste y seguí el progreso con la barra.',
    icon: 'briefcase-outline',
  },
  {
    id: 9,
    title: '¿Dónde veo los outfits que usé?',
    description:
      'En el Historial. Podés verlo como lista o como calendario: los días con outfits usados aparecen marcados, y al tocar uno ves qué te pusiste.',
    icon: 'calendar-month-outline',
  },
  {
    id: 10,
    title: '¿Qué muestran mis estadísticas?',
    description:
      'Desde el inicio, "Mis estadísticas" te muestra tus prendas más usadas, las que todavía no usaste, tu outfit favorito y los colores y categorías que más tenés.',
    icon: 'chart-bar',
  },
];

// ============================================================
// TARJETA DE AYUDA
// ============================================================

function HelpCard({
  item,
  expanded,
  onPress,
}) {
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
        <Text style={styles.helpTitle}>
          {item.title}
        </Text>

        {expanded && (
          <Text style={styles.helpDescription}>
            {item.description}
          </Text>
        )}
      </View>

      <View style={styles.arrowContainer}>
        <Ionicons
          name={
            expanded
              ? 'chevron-up'
              : 'chevron-down'
          }
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
        <Text style={styles.adviceTitle}>
          Consejo
        </Text>

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
// CONTENIDO DE AYUDA
// ============================================================
// IMPORTANTE:
// Este componente está fuera de HelpScreen para evitar que sea
// recreado cada vez que cambia expandedId.
// ============================================================

function HelpContent({
  expandedId,
  toggleItem,
  isDesktop,
}) {
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        isDesktop && styles.scrollContentDesktop,
      ]}
      showsVerticalScrollIndicator={false}
    >
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

        <AdviceCard />
      </View>
    </ScrollView>
  );
}

// ============================================================
// PANTALLA AYUDA
// ============================================================

export default function HelpScreen({
  navigation,
  route,
}) {
  const { width } = useWindowDimensions();

  const isDesktop = width > 768;

  const user =
    route?.params?.user || null;

  const [
    expandedId,
    setExpandedId,
  ] = useState(null);

  // ==========================================================
  // VOLVER
  // ==========================================================

  const handleGoBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  };

  // ==========================================================
  // NAVEGACIÓN PRINCIPAL
  // ==========================================================

  const navigateTo = (tabName) => {
    navigation.navigate('Main', {
      user,
      initialTab: tabName,
      navTs: Date.now(),
    });
  };

  // ==========================================================
  // AGREGAR PRENDA
  // ==========================================================

  const handleAddClothing = () => {
    navigation.navigate('AddClothing', {
      user,
    });
  };

  // ==========================================================
  // ABRIR/CERRAR AYUDA
  // ==========================================================

  const toggleItem = (id) => {
    setExpandedId(
      (current) =>
        current === id
          ? null
          : id
    );
  };

  // ==========================================================
  // HEADER
  // ==========================================================

  const Header = () => (
    <SafeAreaView
      style={styles.headerSafeArea}
    >
      <View style={styles.header}>

        {/* VOLVER */}
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleGoBack}
          activeOpacity={0.75}
        >
          <Ionicons
            name="arrow-back"
            size={30}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* TÍTULO */}
        <Text
          style={styles.headerTitle}
          numberOfLines={1}
        >
          Ayuda
        </Text>

        {/* PERFIL */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() =>
            navigation.navigate(
              'Profile',
              { user }
            )
          }
          activeOpacity={0.8}
        >
          <View
            style={styles.profileCircle}
          >
            <Ionicons
              name="person-outline"
              size={21}
              color={COLORS.buttonDark}
            />
          </View>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );

  // ==========================================================
  // SIDEBAR DESKTOP
  // ==========================================================

  const DesktopSidebar = () => (
    <View style={styles.sidebar}>

      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => navigateTo('Inicio')}
        activeOpacity={0.75}
      >
        <Ionicons
          name="home-outline"
          size={28}
          color={COLORS.textDark}
        />

        <Text style={styles.sidebarLabel}>
          Inicio
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => navigateTo('Prendas')}
        activeOpacity={0.75}
      >
        <Ionicons
          name="shirt-outline"
          size={28}
          color={COLORS.textDark}
        />

        <Text style={styles.sidebarLabel}>
          Prendas
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => navigateTo('Outfits')}
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons
          name="hanger"
          size={29}
          color={COLORS.textDark}
        />

        <Text style={styles.sidebarLabel}>
          Outfits
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => navigateTo('Maleta')}
        activeOpacity={0.75}
      >
        <Ionicons
          name="briefcase-outline"
          size={28}
          color={COLORS.textDark}
        />

        <Text style={styles.sidebarLabel}>
          Maleta
        </Text>
      </TouchableOpacity>

      <View style={styles.sidebarSpacer} />

      <TouchableOpacity
        style={styles.addButtonDesktop}
        onPress={handleAddClothing}
        activeOpacity={0.8}
      >
        <Ionicons
          name="add"
          size={34}
          color="#FFFFFF"
        />
      </TouchableOpacity>

    </View>
  );

  // ==========================================================
  // MENÚ INFERIOR MOBILE
  // ==========================================================

  const MobileBottomMenu = () => (
    <View style={styles.mobileBottomBar}>

      <TouchableOpacity
        style={styles.mobileNavItem}
        onPress={() => navigateTo('Inicio')}
      >
        <Ionicons
          name="home-outline"
          size={24}
          color={COLORS.textDark}
        />

        <Text style={styles.mobileNavLabel}>
          Inicio
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.mobileNavItem}
        onPress={() => navigateTo('Prendas')}
      >
        <Ionicons
          name="shirt-outline"
          size={24}
          color={COLORS.textDark}
        />

        <Text style={styles.mobileNavLabel}>
          Prendas
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.mobileAddButtonContainer}
        onPress={handleAddClothing}
      >
        <View style={styles.mobileAddButton}>
          <Ionicons
            name="add"
            size={32}
            color="#FFFFFF"
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.mobileNavItem}
        onPress={() => navigateTo('Outfits')}
      >
        <MaterialCommunityIcons
          name="hanger"
          size={25}
          color={COLORS.textDark}
        />

        <Text style={styles.mobileNavLabel}>
          Outfits
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.mobileNavItem}
        onPress={() => navigateTo('Maleta')}
      >
        <Ionicons
          name="briefcase-outline"
          size={24}
          color={COLORS.textDark}
        />

        <Text style={styles.mobileNavLabel}>
          Maleta
        </Text>
      </TouchableOpacity>

    </View>
  );

  // ==========================================================
  // DESKTOP
  // ==========================================================

  if (isDesktop) {
    return (
      <View style={styles.desktopRoot}>

        {/* HEADER COMPLETO */}
        <Header />

        {/* CUERPO */}
        <View style={styles.desktopMain}>

          {/* SIDEBAR */}
          <DesktopSidebar />

          {/* CONTENIDO */}
          <View style={styles.desktopBody}>
            <HelpContent
              expandedId={expandedId}
              toggleItem={toggleItem}
              isDesktop={isDesktop}
            />
          </View>

        </View>

      </View>
    );
  }

  // ==========================================================
  // MOBILE
  // ==========================================================

  return (
    <SafeAreaView style={styles.mobileRoot}>

      <Header />

      <View style={styles.mobileContent}>
        <HelpContent
          expandedId={expandedId}
          toggleItem={toggleItem}
          isDesktop={isDesktop}
        />
      </View>

      <MobileBottomMenu />

    </SafeAreaView>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  // ==========================================================
  // DESKTOP
  // ==========================================================

  desktopRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  desktopMain: {
    flex: 1,
    flexDirection: 'row',
  },

  desktopBody: {
    flex: 1,
  },

  sidebar: {
    width: 110,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#F0EAF8',
    paddingTop: 30,
    alignItems: 'center',
  },

  sidebarItem: {
    width: '100%',
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sidebarLabel: {
    color: COLORS.textDark,
    fontSize: 12,
    marginTop: 6,
    fontFamily: 'Poppins_400Regular',
  },

  sidebarSpacer: {
    flex: 1,
  },

  addButtonDesktop: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  headerSafeArea: {
    backgroundColor: COLORS.primary,
  },

  header: {
    height: 82,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },

  headerButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Poppins_400Regular',
  },

  profileButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ==========================================================
  // CONTENIDO
  // ==========================================================

  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 35,
  },

  scrollContentDesktop: {
    paddingHorizontal: 40,
    paddingTop: 30,
    paddingBottom: 50,
  },

  cardsContainer: {
    width: '100%',
  },

  cardsContainerDesktop: {
    maxWidth: 1100,
    alignSelf: 'center',
  },

  // ==========================================================
  // TARJETAS
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

  helpIconContainer: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#F8EEFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },

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

  // ==========================================================
  // MOBILE
  // ==========================================================

  mobileRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  mobileContent: {
    flex: 1,
  },

  mobileBottomBar: {
    height: 78,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },

  mobileNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mobileNavLabel: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.textDark,
    fontFamily: 'Poppins_400Regular',
  },

  mobileAddButtonContainer: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mobileAddButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -25,
  },

});