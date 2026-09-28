import React, {
  useCallback,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  useFocusEffect,
} from '@react-navigation/native';

import {
  COLORS,
} from '../theme/colours';

import {
  getAdminSummary,
} from '../services/database';


// ============================================================
// DASHBOARD ROOT
// ============================================================

export default function AdminDashboardScreen() {

  const {
    width,
  } = useWindowDimensions();

  const isDesktop = width > 768;


  // ==========================================================
  // ESTADOS
  // ==========================================================

  const [
    summary,
    setSummary,
  ] = useState({

    usersCount: 0,
    clothesCount: 0,
    outfitsCount: 0,
    usedThisWeekCount: 0,
    activeSuitcasesCount: 0,

  });


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  // ==========================================================
  // CARGAR DATOS
  // ==========================================================

  const loadDashboard = useCallback(
    async () => {

      try {

        setLoading(true);


        // ====================================================
        // RESUMEN GLOBAL ADMINISTRATIVO
        // ====================================================

        const data =
          await Promise.resolve(
            getAdminSummary()
          );


        // ====================================================
        // ACTUALIZAR ESTADO
        // ====================================================

        setSummary({

          usersCount:
            Number(
              data?.usersCount || 0
            ),

          clothesCount:
            Number(
              data?.clothesCount || 0
            ),

          outfitsCount:
            Number(
              data?.outfitsCount || 0
            ),

          usedThisWeekCount:
            Number(
              data?.usedThisWeekCount || 0
            ),

          activeSuitcasesCount:
            Number(
              data?.activeSuitcasesCount || 0
            ),

        });

      } catch (error) {

        console.log(
          'Error al cargar Dashboard Root:',
          error
        );

        /*
         * En caso de error no mostramos información
         * inventada.
         *
         * Se mantienen los últimos valores válidos
         * disponibles en pantalla.
         */

      } finally {

        setLoading(false);

      }

    },
    []
  );


  // ==========================================================
  // RECARGAR AL ENTRAR EN LA PANTALLA
  // ==========================================================

  useFocusEffect(
    useCallback(() => {

      loadDashboard();

    }, [
      loadDashboard,
    ])
  );


  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {

    setRefreshing(true);

    try {

      await loadDashboard();

    } finally {

      setRefreshing(false);

    }

  };


  // ==========================================================
  // DATOS DE LAS TARJETAS
  // ==========================================================

  const cards = [

    {
      title: 'Usuarios',
      value: summary.usersCount,
      description: 'Usuarios registrados',
      icon: 'people-outline',
    },

    {
      title: 'Prendas',
      value: summary.clothesCount,
      description: 'Prendas registradas',
      icon: 'shirt-outline',
    },

    {
      title: 'Outfits',
      value: summary.outfitsCount,
      description: 'Outfits registrados',
      icon: 'layers-outline',
    },

    {
      title: 'Usos recientes',
      value: summary.usedThisWeekCount,
      description: 'Usos durante los últimos 7 días',
      icon: 'time-outline',
    },

    {
      title: 'Maletas activas',
      value: summary.activeSuitcasesCount,
      description: 'Maletas actualmente activas',
      icon: 'briefcase-outline',
    },

  ];


  // ==========================================================
  // CONTENIDO
  // ==========================================================

  return (

    <View
      style={[
        styles.root,
        isDesktop && styles.desktopRoot,
      ]}
    >

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,

          isDesktop &&
            styles.desktopContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >

        {/* ================================================== */}
        {/* ENCABEZADO */}
        {/* ================================================== */}

        <View
          style={[
            styles.header,

            isDesktop &&
              styles.desktopHeader,
          ]}
        >

          <View
            style={styles.headerTextContainer}
          >

            <Text
              style={styles.title}
            >
              Dashboard
            </Text>

            <Text
              style={styles.subtitle}
            >
              Resumen general de Vestuario Digital
            </Text>

          </View>


          {/* INDICADOR ROOT */}

          <View
            style={styles.rootBadge}
          >

            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color="#764DC6"
            />

            <Text
              style={styles.rootBadgeText}
            >
              Root
            </Text>

          </View>

        </View>


        {/* ================================================== */}
        {/* SEPARADOR */}
        {/* ================================================== */}

        <View
          style={styles.separator}
        />


        {/* ================================================== */}
        {/* TÍTULO DE MÉTRICAS */}
        {/* ================================================== */}

        <View
          style={styles.sectionHeader}
        >

          <View>

            <Text
              style={styles.sectionTitle}
            >
              Métricas generales
            </Text>

            <Text
              style={styles.sectionDescription}
            >
              Información registrada en la aplicación
            </Text>

          </View>

        </View>


        {/* ================================================== */}
        {/* TARJETAS */}
        {/* ================================================== */}

        <View
          style={[
            styles.cardsGrid,

            isDesktop &&
              styles.desktopCardsGrid,
          ]}
        >

          {cards.map(
            (card) => (

              <MetricCard
                key={card.title}
                title={card.title}
                value={card.value}
                description={
                  card.description
                }
                icon={card.icon}
                loading={loading}
                isDesktop={isDesktop}
              />

            )
          )}

        </View>


        {/* ================================================== */}
        {/* INFORMACIÓN DEL PANEL */}
        {/* ================================================== */}

        <View
          style={[
            styles.infoCard,

            isDesktop &&
              styles.desktopInfoCard,
          ]}
        >

          <View
            style={styles.infoIcon}
          >

            <Ionicons
              name="information-circle-outline"
              size={24}
              color="#764DC6"
            />

          </View>


          <View
            style={styles.infoTextContainer}
          >

            <Text
              style={styles.infoTitle}
            >
              Panel administrativo
            </Text>

            <Text
              style={styles.infoText}
            >
              Desde este panel podés consultar las secciones
              de Usuarios y Registros utilizando la navegación
              inferior.
            </Text>

          </View>

        </View>


        {/* ================================================== */}
        {/* PIE */}
        {/* ================================================== */}

        <View
          style={styles.footer}
        >

          <Text
            style={styles.footerText}
          >
            Vestuario Digital
          </Text>

          <Text
            style={styles.footerSubtext}
          >
            Panel de administración
          </Text>

        </View>

      </ScrollView>

    </View>

  );
}


// ============================================================
// TARJETA DE MÉTRICA
// ============================================================

function MetricCard({
  title,
  value,
  description,
  icon,
  loading,
  isDesktop,
}) {

  return (

    <View
      style={[
        styles.metricCard,

        isDesktop &&
          styles.desktopMetricCard,
      ]}
    >

      {/* ICONO */}

      <View
        style={styles.metricIcon}
      >

        <Ionicons
          name={icon}
          size={25}
          color="#764DC6"
        />

      </View>


      {/* CONTENIDO */}

      <View
        style={styles.metricContent}
      >

        <Text
          style={styles.metricTitle}
        >
          {title}
        </Text>


        {loading ? (

          <View
            style={styles.loadingValue}
          >

            <Text
              style={styles.loadingText}
            >
              —
            </Text>

          </View>

        ) : (

          <Text
            style={styles.metricValue}
          >
            {value}
          </Text>

        )}


        <Text
          style={styles.metricDescription}
        >
          {description}
        </Text>

      </View>

    </View>

  );
}


// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  // ==========================================================
  // ROOT
  // ==========================================================

  root: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },


  desktopRoot: {
    width: '100%',
  },


  scroll: {
    flex: 1,
  },


  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },


  desktopContent: {
    width: '100%',
    maxWidth: 1250,
    alignSelf: 'center',
    paddingHorizontal: 40,
    paddingTop: 32,
    paddingBottom: 50,
  },


  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 15,
  },


  desktopHeader: {
    alignItems: 'center',
  },


  headerTextContainer: {
    flex: 1,
  },


  title: {
    color: '#4A3B53',
    fontSize: 28,
    fontFamily:
      'Poppins_700Bold',
    marginBottom: 5,
  },


  subtitle: {
    color: '#7D6A88',
    fontSize: 14,
    lineHeight: 21,
    fontFamily:
      'Poppins_400Regular',
  },


  // ==========================================================
  // ROOT BADGE
  // ==========================================================

  rootBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3D5EC',
    gap: 6,
  },


  rootBadgeText: {
    color: '#764DC6',
    fontSize: 13,
    fontFamily:
      'Poppins_600SemiBold',
  },


  // ==========================================================
  // SEPARADOR
  // ==========================================================

  separator: {
    width: '100%',
    height: 1,
    backgroundColor: '#E8DCEB',
    marginTop: 22,
    marginBottom: 25,
  },


  // ==========================================================
  // SECTION
  // ==========================================================

  sectionHeader: {
    marginBottom: 16,
  },


  sectionTitle: {
    color: '#4A3B53',
    fontSize: 19,
    fontFamily:
      'Poppins_600SemiBold',
  },


  sectionDescription: {
    color: '#7D6A88',
    fontSize: 13,
    fontFamily:
      'Poppins_400Regular',
    marginTop: 3,
  },


  // ==========================================================
  // GRID
  // ==========================================================

  cardsGrid: {
    width: '100%',
    flexDirection: 'column',
    gap: 14,
  },


  desktopCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },


  // ==========================================================
  // METRIC CARD
  // ==========================================================

  metricCard: {
    width: '100%',
    minHeight: 125,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E9DFED',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },


  desktopMetricCard: {
    flex: 1,
    minWidth: 220,
    maxWidth: 300,
  },


  // ==========================================================
  // METRIC ICON
  // ==========================================================

  metricIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#F1E6F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },


  // ==========================================================
  // METRIC CONTENT
  // ==========================================================

  metricContent: {
    flex: 1,
    minWidth: 0,
  },


  metricTitle: {
    color: '#4A3B53',
    fontSize: 14,
    fontFamily:
      'Poppins_600SemiBold',
    marginBottom: 3,
  },


  metricValue: {
    color: '#764DC6',
    fontSize: 28,
    lineHeight: 34,
    fontFamily:
      'Poppins_700Bold',
  },


  metricDescription: {
    color: '#8A7893',
    fontSize: 11,
    lineHeight: 16,
    fontFamily:
      'Poppins_400Regular',
    marginTop: 2,
  },


  // ==========================================================
  // LOADING
  // ==========================================================

  loadingValue: {
    height: 34,
    justifyContent: 'center',
  },


  loadingText: {
    color: '#B8A9BE',
    fontSize: 28,
    fontFamily:
      'Poppins_700Bold',
  },


  // ==========================================================
  // INFO CARD
  // ==========================================================

  infoCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E9DFED',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
  },


  desktopInfoCard: {
    maxWidth: 930,
  },


  infoIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#F1E6F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },


  infoTextContainer: {
    flex: 1,
  },


  infoTitle: {
    color: '#4A3B53',
    fontSize: 15,
    fontFamily:
      'Poppins_600SemiBold',
    marginBottom: 4,
  },


  infoText: {
    color: '#7D6A88',
    fontSize: 12,
    lineHeight: 18,
    fontFamily:
      'Poppins_400Regular',
  },


  // ==========================================================
  // FOOTER
  // ==========================================================

  footer: {
    alignItems: 'center',
    marginTop: 35,
    paddingBottom: 5,
  },


  footerText: {
    color: '#7D6A88',
    fontSize: 12,
    fontFamily:
      'Poppins_600SemiBold',
  },


  footerSubtext: {
    color: '#A393AA',
    fontSize: 10,
    fontFamily:
      'Poppins_400Regular',
    marginTop: 2,
  },

});