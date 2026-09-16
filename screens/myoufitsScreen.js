import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import {
  getUserOutfits,
  getUserHistory,
  getUserClothes,
} from '../services/database';

import { COLORS } from '../theme/colours';

// ============================================================
// MIS OUTFITS
// ============================================================
// Los outfits del mockup NO se cargan como datos fijos.
//
// El mockup solamente sirve como referencia visual.
//
// Cuando entra un usuario:
// - Si ya tiene outfits, se muestran sus outfits reales.
// - Si es un usuario nuevo, se muestra el estado vacío.
// - Las prendas de cada tarjeta se obtienen de la base de datos.
// ============================================================


// ============================================================
// OBTENER IDS DE LAS PRENDAS DE UN OUTFIT
// ============================================================
//
// En database.js los outfits tienen esta estructura:
//
// {
//   superior: clothingId,
//   inferior: clothingId,
//   calzado: clothingId,
//   accesorios: [clothingId, clothingId]
// }
//
// Esta función obtiene todos los IDs de las prendas.
// ============================================================

const getOutfitClothingIds = (items = {}) => {
  const ids = [];

  if (items?.superior !== null && items?.superior !== undefined) {
    ids.push(items.superior);
  }

  if (items?.inferior !== null && items?.inferior !== undefined) {
    ids.push(items.inferior);
  }

  if (items?.calzado !== null && items?.calzado !== undefined) {
    ids.push(items.calzado);
  }

  if (Array.isArray(items?.accesorios)) {
    items.accesorios.forEach((id) => {
      if (id !== null && id !== undefined) {
        ids.push(id);
      }
    });
  }

  // Evitamos prendas repetidas.
  return [...new Set(ids)];
};


// ============================================================
// FORMATEAR FECHA
// ============================================================

const formatDate = (dateValue) => {
  if (!dateValue) {
    return '';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};


// ============================================================
// PLACEHOLDER DE PRENDA
// ============================================================

function ClothingPlaceholder() {
  return (
    <View style={styles.clothingPlaceholder}>
      <Ionicons
        name="shirt-outline"
        size={30}
        color="#B7A9C5"
      />
    </View>
  );
}


// ============================================================
// TARJETA DE OUTFIT
// ============================================================

function OutfitCard({
  outfit,
  clothesById,
  onPress,
  onOptions,
}) {
  // Obtenemos las prendas pertenecientes al outfit.
  const clothingIds = getOutfitClothingIds(outfit.items);

  // Buscamos esas prendas dentro de las prendas del usuario.
  // Máximo 4 para mantener una tarjeta parecida al mockup.
  const clothingImages = clothingIds
    .map((id) => clothesById[id])
    .filter(Boolean)
    .slice(0, 4);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.outfitCard}
      onPress={onPress}
    >

      {/* ======================================================
          PREVISUALIZACIÓN DE LAS PRENDAS
      ======================================================= */}

      <View style={styles.outfitPreview}>

        {clothingImages.length > 0 ? (

          clothingImages.map((item, index) => (

            <View
              key={`${item.id}-${index}`}
              style={styles.previewItem}
            >

              {item.imageUri ? (

                <Image
                  source={{ uri: item.imageUri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />

              ) : (

                <ClothingPlaceholder />

              )}

            </View>

          ))

        ) : (

          <View style={styles.noPreview}>

            <MaterialCommunityIcons
              name="hanger"
              size={34}
              color="#B7A9C5"
            />

            <Text style={styles.noPreviewText}>
              Sin prendas
            </Text>

          </View>

        )}

      </View>


      {/* ======================================================
          INFORMACIÓN DEL OUTFIT
      ======================================================= */}

      <View style={styles.outfitInfo}>

        <View style={styles.outfitTitleRow}>

          <Text
            style={styles.outfitTitle}
            numberOfLines={1}
          >
            {outfit.name || 'Outfit sin nombre'}
          </Text>


          {/* Menú de opciones */}

          <TouchableOpacity
            style={styles.optionsButton}
            onPress={(event) => {
              event?.stopPropagation?.();
              onOptions?.(outfit);
            }}
            hitSlop={10}
          >

            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color="#5F5668"
            />

          </TouchableOpacity>

        </View>


        {/* Descripción */}

        <Text
          style={styles.outfitDescription}
          numberOfLines={2}
        >
          {outfit.description ||
            'Outfit guardado en tu armario digital.'}
        </Text>


        {/* Fecha */}

        <View style={styles.dateRow}>

          <Ionicons
            name="calendar-outline"
            size={14}
            color="#77707F"
          />

          <Text style={styles.dateText}>
            {formatDate(outfit.createdAt)}
          </Text>

        </View>

      </View>


      {/* ======================================================
          FLECHA
      ======================================================= */}

      <View style={styles.arrowContainer}>

        <Ionicons
          name="chevron-forward"
          size={23}
          color={COLORS.primary}
        />

      </View>

    </TouchableOpacity>
  );
}


// ============================================================
// PANTALLA PRINCIPAL
// ============================================================

export default function MyOutfitsScreen({
  navigation,
  route,
}) {

  const { width } = useWindowDimensions();

  const isDesktop =
    Platform.OS === 'web' &&
    width > 768;


  // ----------------------------------------------------------
  // USUARIO LOGUEADO
  // ----------------------------------------------------------

  const user = route?.params?.user;

  const userId = user?.id;


  // ----------------------------------------------------------
  // ESTADOS
  // ----------------------------------------------------------

  const [outfits, setOutfits] = useState([]);

  const [history, setHistory] = useState([]);

  const [clothesById, setClothesById] = useState({});

  const [search, setSearch] = useState('');

  const [activeView, setActiveView] =
    useState('outfits');

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);


  // ==========================================================
  // CARGAR INFORMACIÓN DEL USUARIO
  // ==========================================================

  const loadData = useCallback(async () => {

    // Si no existe usuario, dejamos todo vacío.
    if (!userId) {

      setOutfits([]);
      setHistory([]);
      setClothesById({});
      setLoading(false);

      return;
    }


    try {

      // Cargamos:
      // 1. Outfits
      // 2. Historial
      // 3. Prendas

      const [
        userOutfits,
        userHistory,
        userClothes,
      ] = await Promise.all([

        getUserOutfits(userId),

        getUserHistory(userId),

        getUserClothes(userId),

      ]);


      // ------------------------------------------------------
      // Creamos un objeto para encontrar rápidamente
      // una prenda por su ID.
      // ------------------------------------------------------

      const clothesMap = {};

      userClothes.forEach((item) => {

        clothesMap[item.id] = item;

      });


      // Guardamos la información.
      setOutfits(
        Array.isArray(userOutfits)
          ? userOutfits
          : []
      );

      setHistory(
        Array.isArray(userHistory)
          ? userHistory
          : []
      );

      setClothesById(clothesMap);

    } catch (error) {

      console.log(
        'Error al cargar Mis outfits:',
        error
      );

      setOutfits([]);
      setHistory([]);
      setClothesById({});

    } finally {

      setLoading(false);
      setRefreshing(false);

    }

  }, [userId]);


  // ==========================================================
  // CARGAR AL ENTRAR
  // ==========================================================

  useEffect(() => {

    loadData();

  }, [loadData]);


  // ==========================================================
  // ACTUALIZAR CUANDO VOLVEMOS A LA PANTALLA
  // ==========================================================

  useEffect(() => {

    const unsubscribe =
      navigation?.addListener?.(
        'focus',
        loadData
      );

    return unsubscribe;

  }, [navigation, loadData]);


  // ==========================================================
  // BUSCAR OUTFITS
  // ==========================================================

  const filteredOutfits = useMemo(() => {

    const term =
      search.trim().toLowerCase();


    // Si no escribió nada,
    // mostramos todos los outfits.

    if (!term) {
      return outfits;
    }


    // Buscamos por nombre o descripción.

    return outfits.filter((outfit) => {

      const name =
        String(outfit.name || '')
          .toLowerCase();

      const description =
        String(outfit.description || '')
          .toLowerCase();


      return (
        name.includes(term) ||
        description.includes(term)
      );

    });

  }, [outfits, search]);


  // ==========================================================
  // BUSCAR EN HISTORIAL
  // ==========================================================

  const filteredHistory = useMemo(() => {

    const term =
      search.trim().toLowerCase();


    if (!term) {
      return history;
    }


    return history.filter((item) => {

      const name =
        String(item.outfitName || '')
          .toLowerCase();

      const note =
        String(item.note || '')
          .toLowerCase();


      return (
        name.includes(term) ||
        note.includes(term)
      );

    });

  }, [history, search]);


  // ==========================================================
  // CREAR OUTFIT
  // ==========================================================

  const handleCreateOutfit = () => {

    try {

      navigation.navigate(
        'CrearOutfit',
        {
          user,
        }
      );

    } catch (error) {

      Alert.alert(
        'Próximamente',
        'La pantalla para crear outfits todavía no está disponible.'
      );

    }

  };


  // ==========================================================
  // ABRIR DETALLE DEL OUTFIT
  // ==========================================================

  const handleOpenOutfit = (outfit) => {

    try {

      navigation.navigate(
        'OutfitDetail',
        {
          outfitId: outfit.id,
          user,
        }
      );

    } catch (error) {

      Alert.alert(
        outfit.name || 'Outfit',
        outfit.description ||
          'Outfit guardado en tu armario digital.'
      );

    }

  };


  // ==========================================================
  // OPCIONES DEL OUTFIT
  // ==========================================================

  const handleOptions = (outfit) => {

    Alert.alert(
      outfit.name || 'Outfit',
      'Seleccioná el outfit para ver sus detalles.'
    );

  };


  // ==========================================================
  // ACTUALIZAR
  // ==========================================================

  const onRefresh = () => {

    setRefreshing(true);

    loadData();

  };


  // ==========================================================
  // SI NO HAY USUARIO
  // ==========================================================

  if (!userId) {

    return (

      <SafeAreaView style={styles.safeArea}>

        <View style={styles.emptyCentered}>

          <MaterialCommunityIcons
            name="account-alert-outline"
            size={58}
            color={COLORS.primary}
          />

          <Text style={styles.emptyTitle}>
            No se encontró la sesión
          </Text>

          <Text style={styles.emptyText}>
            Volvé a iniciar sesión para acceder a tus outfits.
          </Text>

        </View>

      </SafeAreaView>

    );

  }


  // ==========================================================
  // PANTALLA
  // ==========================================================

  return (

    <SafeAreaView style={styles.safeArea}>

      <View
        style={[
          styles.screen,
          isDesktop &&
            styles.screenDesktop,
        ]}
      >


        {/* ====================================================
            BUSCADOR + CREAR OUTFIT
        ===================================================== */}

        <View style={styles.topActions}>

          {/* Buscador */}

          <View style={styles.searchBox}>

            <Ionicons
              name="search-outline"
              size={20}
              color="#77707F"
            />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar outfits..."
              placeholderTextColor="#9A929F"
              style={styles.searchInput}
              returnKeyType="search"
            />

            {search.length > 0 && (

              <TouchableOpacity
                onPress={() => setSearch('')}
                hitSlop={8}
              >

                <Ionicons
                  name="close-circle"
                  size={18}
                  color="#AAA2B0"
                />

              </TouchableOpacity>

            )}

          </View>


          {/* Botón Crear Outfit */}

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateOutfit}
            activeOpacity={0.85}
          >

            <Ionicons
              name="add"
              size={21}
              color="#FFFFFF"
            />

            <Text style={styles.createButtonText}>
              Crear Outfit
            </Text>

          </TouchableOpacity>

        </View>


        {/* ====================================================
            BOTONES MIS OUTFITS / HISTORIAL
        ===================================================== */}

        <View style={styles.switchRow}>

          {/* Mis outfits */}

          <TouchableOpacity
            style={[
              styles.switchButton,

              activeView === 'outfits' &&
                styles.switchButtonActive,
            ]}
            onPress={() =>
              setActiveView('outfits')
            }
          >

            <MaterialCommunityIcons
              name="hanger"
              size={19}
              color={
                activeView === 'outfits'
                  ? COLORS.primary
                  : '#77707F'
              }
            />

            <Text
              style={[
                styles.switchText,

                activeView === 'outfits' &&
                  styles.switchTextActive,
              ]}
            >
              Mis outfits
            </Text>

          </TouchableOpacity>


          {/* Historial */}

          <TouchableOpacity
            style={[
              styles.switchButton,

              activeView === 'history' &&
                styles.switchButtonActive,
            ]}
            onPress={() =>
              setActiveView('history')
            }
          >

            <Ionicons
              name="time-outline"
              size={19}
              color={
                activeView === 'history'
                  ? COLORS.primary
                  : '#77707F'
              }
            />

            <Text
              style={[
                styles.switchText,

                activeView === 'history' &&
                  styles.switchTextActive,
              ]}
            >
              Ver historial
            </Text>

          </TouchableOpacity>

        </View>


        {/* ====================================================
            TÍTULO
        ===================================================== */}

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>

            {activeView === 'outfits'
              ? 'Tus outfits guardados'
              : 'Historial de outfits'}

          </Text>


          <Text style={styles.sectionSubtitle}>

            {activeView === 'outfits'
              ? 'Tocá un outfit para ver los detalles'
              : 'Consultá los outfits que usaste anteriormente'}

          </Text>

        </View>


        {/* ====================================================
            CARGANDO
        ===================================================== */}

        {loading ? (

          <View style={styles.loadingContainer}>

            <ActivityIndicator
              size="large"
              color={COLORS.primary}
            />

            <Text style={styles.loadingText}>
              Cargando tus outfits...
            </Text>

          </View>

        ) : activeView === 'outfits' ? (

          /* ==================================================
             LISTA DE OUTFITS
          =================================================== */

          <FlatList
            data={filteredOutfits}

            keyExtractor={(item) =>
              String(item.id)
            }

            renderItem={({ item }) => (

              <OutfitCard
                outfit={item}
                clothesById={clothesById}
                onPress={() =>
                  handleOpenOutfit(item)
                }
                onOptions={handleOptions}
              />

            )}

            contentContainerStyle={[
              styles.listContent,

              filteredOutfits.length === 0 &&
                styles.listEmptyContent,
            ]}

            showsVerticalScrollIndicator={false}

            refreshControl={

              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
              />

            }

            ListEmptyComponent={

              <View style={styles.emptyState}>

                <View style={styles.emptyIconCircle}>

                  <MaterialCommunityIcons
                    name="hanger"
                    size={48}
                    color={COLORS.primary}
                  />

                </View>


                <Text style={styles.emptyTitle}>

                  {search
                    ? 'No encontramos outfits'
                    : 'Todavía no tenés outfits'}

                </Text>


                <Text style={styles.emptyText}>

                  {search
                    ? 'Probá con otro nombre o descripción.'
                    : 'Creá tu primer outfit seleccionando prendas de tu armario.'}

                </Text>


                {!search && (

                  <TouchableOpacity
                    style={styles.emptyCreateButton}
                    onPress={handleCreateOutfit}
                  >

                    <Ionicons
                      name="add"
                      size={19}
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.emptyCreateButtonText
                      }
                    >
                      Crear mi primer outfit
                    </Text>

                  </TouchableOpacity>

                )}

              </View>

            }

          />

        ) : (

          /* ==================================================
             HISTORIAL
          =================================================== */

          <FlatList
            data={filteredHistory}

            keyExtractor={(item, index) =>
              String(
                item.id ??
                `history-${index}`
              )
            }

            renderItem={({ item }) => (

              <TouchableOpacity
                style={styles.historyCard}
                activeOpacity={0.9}
                onPress={() => {

                  if (item.outfitId) {

                    handleOpenOutfit({

                      id: item.outfitId,

                      name:
                        item.outfitName,

                      description:
                        item.note,

                    });

                  }

                }}
              >

                {/* Imagen */}

                {item.imageUri ? (

                  <Image
                    source={{
                      uri: item.imageUri,
                    }}
                    style={styles.historyImage}
                    resizeMode="cover"
                  />

                ) : (

                  <View
                    style={
                      styles.historyImagePlaceholder
                    }
                  >

                    <MaterialCommunityIcons
                      name="hanger"
                      size={32}
                      color="#B7A9C5"
                    />

                  </View>

                )}


                {/* Información */}

                <View style={styles.historyInfo}>

                  <Text
                    style={styles.historyTitle}
                    numberOfLines={1}
                  >
                    {item.outfitName ||
                      'Outfit'}
                  </Text>


                  {item.note && (

                    <Text
                      style={styles.historyNote}
                      numberOfLines={2}
                    >
                      {item.note}
                    </Text>

                  )}


                  <View style={styles.dateRow}>

                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#77707F"
                    />

                    <Text
                      style={styles.dateText}
                    >
                      {formatDate(item.date)}
                    </Text>

                  </View>

                </View>


                <Ionicons
                  name="chevron-forward"
                  size={23}
                  color={COLORS.primary}
                />

              </TouchableOpacity>

            )}

            contentContainerStyle={[
              styles.listContent,

              filteredHistory.length === 0 &&
                styles.listEmptyContent,
            ]}

            showsVerticalScrollIndicator={false}

            refreshControl={

              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
              />

            }

            ListEmptyComponent={

              <View style={styles.emptyState}>

                <View
                  style={styles.emptyIconCircle}
                >

                  <Ionicons
                    name="time-outline"
                    size={46}
                    color={COLORS.primary}
                  />

                </View>


                <Text style={styles.emptyTitle}>

                  {search
                    ? 'No encontramos registros'
                    : 'Todavía no hay historial'}

                </Text>


                <Text style={styles.emptyText}>

                  {search
                    ? 'Probá con otro nombre o nota.'
                    : 'Cuando marques un outfit como usado, aparecerá acá.'}

                </Text>

              </View>

            }

          />

        )}

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
    backgroundColor: '#FAF8FC',
  },


  screen: {
    flex: 1,
    paddingHorizontal: 15,
    backgroundColor: '#FAF8FC',
  },


  screenDesktop: {
    paddingHorizontal: 38,
    paddingTop: 34,
  },


  // ==========================================================
  // BUSCADOR
  // ==========================================================

  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },


  searchBox: {
    flex: 1,
    minHeight: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE8F3',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,

    shadowColor: '#8C6AA8',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,

    elevation: 1,
  },


  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.textDark,
    fontFamily: 'Poppins_400Regular',
    paddingVertical: 8,
  },


  // ==========================================================
  // BOTÓN CREAR
  // ==========================================================

  createButton: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 11,
    backgroundColor: COLORS.buttonDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },


  createButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },


  // ==========================================================
  // SELECTOR
  // ==========================================================

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },


  switchButton: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7DFF0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },


  switchButtonActive: {
    backgroundColor: '#F1E5FF',
    borderColor: '#D8BCF4',
  },


  switchText: {
    color: '#77707F',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },


  switchTextActive: {
    color: COLORS.primary,
    fontFamily: 'Poppins_600SemiBold',
  },


  // ==========================================================
  // TÍTULOS
  // ==========================================================

  sectionHeader: {
    marginBottom: 13,
  },


  sectionTitle: {
    color: '#342B3D',
    fontSize: 19,
    fontFamily: 'Poppins_600SemiBold',
  },


  sectionSubtitle: {
    color: '#77707F',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
  },


  // ==========================================================
  // LISTA
  // ==========================================================

  listContent: {
    paddingBottom: 30,
  },


  listEmptyContent: {
    flexGrow: 1,
  },


  // ==========================================================
  // TARJETA DE OUTFIT
  // ==========================================================

  outfitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE8F3',
    marginBottom: 10,
    padding: 9,
    minHeight: 126,

    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#8C6AA8',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,

    elevation: 2,
  },


  // ==========================================================
  // PREVISUALIZACIÓN
  // ==========================================================

  outfitPreview: {
    width: 118,
    minHeight: 105,
    borderRadius: 9,
    backgroundColor: '#F7F5FA',
    padding: 5,

    flexDirection: 'row',
    flexWrap: 'wrap',

    alignItems: 'center',
    justifyContent: 'center',

    gap: 3,
  },


  previewItem: {
    width: 51,
    height: 47,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',

    alignItems: 'center',
    justifyContent: 'center',

    overflow: 'hidden',
  },


  previewImage: {
    width: '100%',
    height: '100%',
  },


  clothingPlaceholder: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },


  noPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },


  noPreviewText: {
    marginTop: 3,
    fontSize: 9,
    color: '#A096A8',
    fontFamily: 'Poppins_400Regular',
  },


  // ==========================================================
  // INFORMACIÓN
  // ==========================================================

  outfitInfo: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 13,
    justifyContent: 'center',
  },


  outfitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },


  outfitTitle: {
    flex: 1,
    color: '#302738',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },


  optionsButton: {
    paddingLeft: 8,
  },


  outfitDescription: {
    color: '#77707F',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
    fontFamily: 'Poppins_400Regular',
  },


  // ==========================================================
  // FECHA
  // ==========================================================

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },


  dateText: {
    color: '#77707F',
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
  },


  arrowContainer: {
    paddingHorizontal: 5,
  },


  // ==========================================================
  // HISTORIAL
  // ==========================================================

  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE8F3',
    marginBottom: 10,
    padding: 9,
    minHeight: 92,

    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#8C6AA8',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,

    elevation: 2,
  },


  historyImage: {
    width: 84,
    height: 74,
    borderRadius: 8,
    backgroundColor: '#F7F5FA',
  },


  historyImagePlaceholder: {
    width: 84,
    height: 74,
    borderRadius: 8,
    backgroundColor: '#F7F5FA',

    alignItems: 'center',
    justifyContent: 'center',
  },


  historyInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },


  historyTitle: {
    color: '#302738',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },


  historyNote: {
    color: '#77707F',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
    fontFamily: 'Poppins_400Regular',
  },


  // ==========================================================
  // CARGANDO
  // ==========================================================

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },


  loadingText: {
    marginTop: 10,
    color: '#77707F',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },


  // ==========================================================
  // ESTADO VACÍO
  // ==========================================================

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },


  emptyIconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#F1E5FF',

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 17,
  },


  emptyCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },


  emptyTitle: {
    color: '#342B3D',
    fontSize: 17,
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
  },


  emptyText: {
    color: '#77707F',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
    fontFamily: 'Poppins_400Regular',
  },


  // ==========================================================
  // BOTÓN DEL ESTADO VACÍO
  // ==========================================================

  emptyCreateButton: {
    marginTop: 18,
    minHeight: 43,
    paddingHorizontal: 18,
    borderRadius: 11,
    backgroundColor: COLORS.buttonDark,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,
  },


  emptyCreateButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },

});