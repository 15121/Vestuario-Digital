import React, {
  useCallback,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  useFocusEffect,
} from '@react-navigation/native';

import {
  getUserSuitcases,
} from '../services/database';

import {
  COLORS,
} from '../theme/colours';


// ============================================================
// MIS MALETAS
// ============================================================

export default function SuitcasesScreen({
  navigation,
  route,
  user: userProp,
  embedded = false,
  onEditSuitcase,
}) {

  // ==========================================================
  // USUARIO ACTUAL
  // ==========================================================

  const user =
    userProp ||
    route?.params?.user ||
    null;


  // ==========================================================
  // RESPONSIVE
  // ==========================================================

  const {
    width,
  } = useWindowDimensions();

  const isDesktop =
    width > 768;


  // ==========================================================
  // ESTADO
  // ==========================================================

  const [
    suitcases,
    setSuitcases,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);


  // ==========================================================
  // CARGAR MALETAS
  // ==========================================================

  const loadSuitcases =
    useCallback(
      async () => {

        if (!user?.id) {
          setSuitcases([]);
          setLoading(false);
          return;
        }

        try {

          setLoading(true);

          const result =
            await getUserSuitcases(
              user.id
            );

          setSuitcases(
            Array.isArray(result)
              ? result
              : []
          );

        } catch (error) {

          console.log(
            'Error al cargar las maletas:',
            error
          );

          setSuitcases([]);

        } finally {

          setLoading(false);

        }

      },
      [user?.id]
    );


  // ==========================================================
  // RECARGAR AL ENTRAR / VOLVER A LA PANTALLA
  // ==========================================================

  useFocusEffect(
    useCallback(() => {

      loadSuitcases();

    }, [loadSuitcases])
  );


  // ==========================================================
  // VOLVER
  // ==========================================================

const handleBack = () => {
  if (navigation?.goBack) {
    navigation.goBack();
  }
};

  // ==========================================================
  // FORMATEAR FECHA
  // ==========================================================

  const formatDate =
    (dateValue) => {

      if (!dateValue) {
        return null;
      }

      const date =
        new Date(dateValue);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return null;
      }

      return date.toLocaleDateString(
        'es-AR',
        {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }
      );

    };


  // ==========================================================
  // OBTENER ITEMS
  // ==========================================================

  const getSuitcaseItems =
    (suitcase) => {

      if (
        Array.isArray(
          suitcase?.items
        )
      ) {
        return suitcase.items;
      }

      if (
        typeof suitcase?.items ===
        'string'
      ) {

        try {

          const parsed =
            JSON.parse(
              suitcase.items
            );

          return Array.isArray(parsed)
            ? parsed
            : [];

        } catch {
          return [];
        }

      }

      return [];

    };


  // ==========================================================
  // CANTIDAD DE PRENDAS
  // ==========================================================

  const getItemCount =
    (suitcase) => {

      return getSuitcaseItems(
        suitcase
      ).length;

    };


  // ==========================================================
  // ESTADO DE MALETA
  // ==========================================================

  const getStatusLabel =
    (suitcase) => {

      if (
        suitcase?.estado
      ) {
        return suitcase.estado;
      }

      return 'Planificada';

    };

    const getStatusColors =
  (status) => {

    const normalizedStatus =
      String(status || '')
        .trim()
        .toLowerCase();

    if (
      normalizedStatus === 'finalizada'
    ) {
      return {
        backgroundColor: '#FDECEC',
        color: '#D64545',
      };
    }

    if (
      normalizedStatus === 'en curso'
    ) {
      return {
        backgroundColor: '#FFF1E6',
        color: '#E67E22',
      };
    }

    return {
      backgroundColor: '#EAF7EE',
      color: '#2E9D57',
    };
  };

  // ==========================================================
  // ESTADO DE CARGA
  // ==========================================================

  if (loading) {

    return (
      <SafeAreaView
        style={styles.root}
      >


        {/* LOADING */}

        <View
          style={styles.loadingContainer}
        >

          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />

          <Text
            style={styles.loadingText}
          >
            Cargando tus maletas...
          </Text>

        </View>

      </SafeAreaView>
    );

  }


  // ==========================================================
  // PANTALLA PRINCIPAL
  // ==========================================================

  return (
    <SafeAreaView
      style={styles.root}
    >

      {/* ======================================================
          HEADER
          ====================================================== */}

   {!embedded && (
  <View style={styles.header}>

    <TouchableOpacity
      style={styles.headerBackButton}
      onPress={handleBack}
      activeOpacity={0.75}
    >
      <Ionicons
        name="arrow-back"
        size={25}
        color="#FFFFFF"
      />
    </TouchableOpacity>

    <Text
      style={styles.headerTitle}
      numberOfLines={1}
    >
      Mis maletas
    </Text>

    <View style={styles.headerRightSpace} />

  </View>
)}

      {/* ======================================================
          CONTENIDO
          ====================================================== */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          isDesktop &&
            styles.contentContainerDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* ====================================================
            TÍTULO DE SECCIÓN
            ==================================================== */}

        <View
          style={styles.introSection}
        >

          <Text
            style={styles.sectionTitle}
          >
            Tus maletas
          </Text>

          <Text
            style={styles.sectionSubtitle}
          >
            Aquí podés ver todas las maletas que tenés guardadas.
          </Text>

        </View>


        {/* ====================================================
            SIN MALETAS
            ==================================================== */}

        {suitcases.length === 0 ? (

          <View
            style={styles.emptyState}
          >

            <View
              style={styles.emptyIconCircle}
            >

              <Ionicons
                name="briefcase-outline"
                size={38}
                color={COLORS.primary}
              />

            </View>


            <Text
              style={styles.emptyTitle}
            >
              Todavía no tenés maletas
            </Text>


            <Text
              style={styles.emptyText}
            >
              Cuando crees una maleta,
              aparecerá acá.
            </Text>

          </View>

        ) : (

          /* ==================================================
             LISTA DE MALETAS
             ================================================== */

          <View
            style={[
              styles.suitcasesGrid,
              isDesktop &&
                styles.suitcasesGridDesktop,
            ]}
          >

            {suitcases.map(
              (suitcase, index) => {

                const startDate =
                  formatDate(
                    suitcase?.fechaInicio
                  );

                const endDate =
                  formatDate(
                    suitcase?.fechaFin
                  );

                const itemCount =
                  getItemCount(
                    suitcase
                  );

                const status =
                  getStatusLabel(
                    suitcase
                  );
                  const statusColors =
  getStatusColors(status);

                return (

                  <TouchableOpacity
  key={suitcase?.id ?? `suitcase-${index}`}
  style={[
    styles.suitcaseCard,
    isDesktop && styles.suitcaseCardDesktop,
  ]}
  activeOpacity={0.82}
  onPress={() => {
    if (!suitcase?.id) {
      return;
    }

    if (onEditSuitcase) {
      onEditSuitcase(suitcase.id);
    }
  }}
>

                    {/* ========================================
                        ICONO
                        ======================================== */}

                    <View
                      style={styles.suitcaseIconCircle}
                    >

                      <Ionicons
                        name="briefcase-outline"
                        size={27}
                        color={
                          COLORS.primary
                        }
                      />

                    </View>


                    {/* ========================================
                        INFORMACIÓN
                        ======================================== */}

                    <View
                      style={styles.suitcaseMainInfo}
                    >

                      <Text
                        style={styles.suitcaseDestination}
                        numberOfLines={2}
                      >
                        {suitcase?.destino ||
                          'Sin destino'}
                      </Text>


                      {/* FECHAS */}

                      {(startDate ||
                        endDate) && (

                        <View
                          style={styles.infoRow}
                        >

                          <Ionicons
                            name="calendar-outline"
                            size={16}
                            color={
                              COLORS.icon
                            }
                          />

                          <Text
                            style={styles.infoText}
                          >

                            {startDate &&
                              endDate
                              ? `${startDate} - ${endDate}`
                              : startDate ||
                                endDate}

                          </Text>

                        </View>

                      )}


                      {/* PRENDAS */}

                      <View
                        style={styles.infoRow}
                      >

                        <Ionicons
                          name="shirt-outline"
                          size={16}
                          color={
                            COLORS.icon
                          }
                        />

                        <Text
                          style={styles.infoText}
                        >
                          {itemCount}{' '}
                          {itemCount === 1
                            ? 'prenda'
                            : 'prendas'}
                        </Text>

                      </View>

                    </View>


                    {/* ========================================
                        ESTADO
                        ======================================== */}

         <View
  style={[
    styles.statusContainer,
    {
      backgroundColor:
        statusColors.backgroundColor,
    },
  ]}
>

  <View
    style={[
      styles.statusDot,
      {
        backgroundColor:
          statusColors.color,
      },
    ]}
  />

  <Text
    style={[
      styles.statusText,
      {
        color:
          statusColors.color,
      },
    ]}
  >
    {status}
  </Text>

</View>

                  </TouchableOpacity>

                );

              }
            )}

          </View>

        )}

      </ScrollView>

    </SafeAreaView>
  );
}


// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  // ==========================================================
  // RAÍZ
  // ==========================================================

  root: {
    flex: 1,
    backgroundColor: '#FAF8FC',
  },


  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    height: 82,

    backgroundColor:
      COLORS.primary,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 18,

    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(118, 77, 198, 0.12)',
  },


  headerBackButton: {
    width: 46,
    height: 46,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 23,
  },


  headerTitle: {
    flex: 1,

    textAlign: 'center',

    color: '#FFFFFF',

    fontSize: 21,

    fontFamily:
      'Poppins_500Medium',
  },


  headerRightSpace: {
    width: 46,
    height: 46,
  },


  // ==========================================================
  // SCROLL
  // ==========================================================

  scrollView: {
    flex: 1,
  },


  contentContainer: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 35,
  },


  contentContainerDesktop: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',

    paddingHorizontal: 32,
    paddingTop: 30,
    paddingBottom: 45,
  },


  // ==========================================================
  // INTRO
  // ==========================================================

  introSection: {
    marginBottom: 22,
  },


  sectionTitle: {
    color:
      COLORS.textDark,

    fontSize: 22,

    fontFamily:
      'Poppins_600SemiBold',

    marginBottom: 4,
  },


  sectionSubtitle: {
    color:
      COLORS.textLight,

    fontSize: 13,

    lineHeight: 20,

    fontFamily:
      'Poppins_400Regular',
  },


  // ==========================================================
  // GRID
  // ==========================================================

  suitcasesGrid: {
    width: '100%',
  },


  suitcasesGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: 18,
  },


  // ==========================================================
  // TARJETA DE MALETA
  // ==========================================================

  suitcaseCard: {
    width: '100%',

    backgroundColor: '#FFFFFF',

    borderRadius: 16,

    borderWidth: 1,

    borderColor:
      'rgba(184, 126, 238, 0.18)',

    padding: 18,

    marginBottom: 15,

    flexDirection: 'row',

    alignItems: 'center',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,

    elevation: 1,
  },


  suitcaseCardDesktop: {
    width: '31.8%',

    minWidth: 300,

    marginBottom: 0,
  },


  // ==========================================================
  // ICONO MALETA
  // ==========================================================

  suitcaseIconCircle: {
    width: 52,
    height: 52,

    borderRadius: 26,

    backgroundColor:
      '#F2E7FC',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 14,
  },


  // ==========================================================
  // INFORMACIÓN PRINCIPAL
  // ==========================================================

  suitcaseMainInfo: {
    flex: 1,

    minWidth: 0,
  },


  suitcaseDestination: {
    color:
      COLORS.textDark,

    fontSize: 15,

    lineHeight: 21,

    fontFamily:
      'Poppins_600SemiBold',

    marginBottom: 6,
  },


  // ==========================================================
  // FILAS DE INFORMACIÓN
  // ==========================================================

  infoRow: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 3,
  },


  infoText: {
    flex: 1,

    color:
      COLORS.textLight,

    fontSize: 11.5,

    marginLeft: 7,

    fontFamily:
      'Poppins_400Regular',
  },


  // ==========================================================
  // ESTADO
  // ==========================================================

  statusContainer: {
    position: 'absolute',

    top: 14,
    right: 15,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor:
      '#F5EDFC',

    borderRadius: 12,

    paddingHorizontal: 8,
    paddingVertical: 4,
  },


  statusDot: {
    width: 6,
    height: 6,

    borderRadius: 3,

    backgroundColor:
      COLORS.primary,

    marginRight: 5,
  },


  statusText: {
    color:
      COLORS.primary,

    fontSize: 9.5,

    fontFamily:
      'Poppins_500Medium',
  },


  // ==========================================================
  // ESTADO VACÍO
  // ==========================================================

  emptyState: {
    backgroundColor: '#FFFFFF',

    borderRadius: 18,

    borderWidth: 1,

    borderColor:
      'rgba(184, 126, 238, 0.18)',

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 30,
    paddingVertical: 55,

    marginTop: 5,
  },


  emptyIconCircle: {
    width: 76,
    height: 76,

    borderRadius: 38,

    backgroundColor:
      '#F2E7FC',

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 17,
  },


  emptyTitle: {
    color:
      COLORS.textDark,

    fontSize: 17,

    textAlign: 'center',

    fontFamily:
      'Poppins_600SemiBold',

    marginBottom: 6,
  },


  emptyText: {
    maxWidth: 350,

    color:
      COLORS.textLight,

    fontSize: 12,

    lineHeight: 19,

    textAlign: 'center',

    fontFamily:
      'Poppins_400Regular',
  },


  // ==========================================================
  // LOADING
  // ==========================================================

  loadingContainer: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 30,
  },


  loadingText: {
    color:
      COLORS.textLight,

    fontSize: 12,

    marginTop: 12,

    fontFamily:
      'Poppins_400Regular',
  },

});