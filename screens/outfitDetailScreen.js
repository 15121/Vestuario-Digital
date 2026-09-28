import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import {
  getOutfitById,
  getClothingItemById,
  addHistoryEntry,
} from '../services/database';
import { COLORS } from '../theme/colours';
import { MESSAGES } from '../theme/messages';
import {
  OutfitScreenLayout,
} from '../navigation/MainTabNavigator';

// ============================================================
// CONFIGURACIÓN DE CATEGORÍAS
// ============================================================

const CATEGORY_CONFIG = {
  superior: {
    label: 'Superior',
    icon: 'shirt-outline',
  },
  inferior: {
    label: 'Inferior',
    icon: 'human-male',
  },
  calzado: {
    label: 'Calzado',
    icon: 'shoe-sneaker',
  },
  accesorio: {
    label: 'Accesorio',
    icon: 'bag-personal-outline',
  },
};

// ============================================================
// HELPERS
// ============================================================

const normalizeId = (value) => {
  if (value === null || value === undefined) return null;

  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? value : numberValue;
};

const formatDate = (dateValue) => {
  if (!dateValue) return 'Fecha no disponible';

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getColorLabel = (color) => {
  if (!color) return 'Sin color especificado';

  return color;
};

const getCategoryKey = (category) => {
  if (!category) return 'accesorio';

  const normalized = String(category)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (
    normalized.includes('superior') ||
    normalized.includes('camisa') ||
    normalized.includes('remera') ||
    normalized.includes('blusa') ||
    normalized.includes('campera') ||
    normalized.includes('buzo')
  ) {
    return 'superior';
  }

  if (
    normalized.includes('inferior') ||
    normalized.includes('pantalon') ||
    normalized.includes('falda') ||
    normalized.includes('short') ||
    normalized.includes('jean')
  ) {
    return 'inferior';
  }

  if (
    normalized.includes('calzado') ||
    normalized.includes('zapato') ||
    normalized.includes('zapatilla') ||
    normalized.includes('bota') ||
    normalized.includes('sandalia')
  ) {
    return 'calzado';
  }

  return 'accesorio';
};

// ============================================================
// COMPONENTE: TARJETA DE PRENDA
// ============================================================

function ClothingRow({ item, onPress }) {
  const categoryKey = getCategoryKey(item?.category);
  const config = CATEGORY_CONFIG[categoryKey];

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={styles.clothingRow}
      onPress={onPress}
    >
      {/* Imagen */}
      <View style={styles.clothingImageContainer}>
        {item?.imageUri ? (
          <Image
            source={{ uri: item.imageUri }}
            style={styles.clothingImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name="image-outline"
              size={28}
              color={COLORS.textLight}
            />
          </View>
        )}
      </View>

      {/* Información */}
      <View style={styles.clothingInfo}>
        <View style={styles.categoryLine}>
          <View style={styles.categoryIcon}>
            <MaterialCommunityIcons
              name={config.icon}
              size={18}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.categoryText}>
            {config.label}
          </Text>
        </View>

        <Text
          style={styles.clothingTitle}
          numberOfLines={1}
        >
          {item?.title || 'Prenda sin nombre'}
        </Text>

        <View style={styles.colorLine}>
          <View
            style={[
              styles.colorDot,
              {
                backgroundColor:
                  item?.color || '#FFFFFF',
              },
            ]}
          />

          <Text
            style={styles.colorText}
            numberOfLines={1}
          >
            Color: {getColorLabel(item?.color)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ============================================================
// COMPONENTE: IMAGEN PRINCIPAL DEL OUTFIT
// ============================================================

function OutfitPreview({ items, isDesktop }) {
  const previewItems = [
    items?.superior,
    items?.inferior,
    items?.calzado,
    ...(items?.accesorios || []),
  ].filter(Boolean);

  if (!previewItems.length) {
    return (
      <View
        style={[
          styles.previewEmpty,
          isDesktop && styles.previewEmptyDesktop,
        ]}
      >
        <MaterialCommunityIcons
          name="hanger"
          size={70}
          color={COLORS.primary}
        />

        <Text style={styles.previewEmptyText}>
          Este outfit todavía no tiene prendas.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.outfitPreview,
        isDesktop && styles.outfitPreviewDesktop,
      ]}
    >
      {previewItems.map((item, index) => (
        <View
          key={`${item.id}-${index}`}
          style={[
            styles.previewItem,
            previewItems.length <= 2 && styles.previewItemLarge,
          ]}
        >
          {item.imageUri ? (
            <Image
              source={{ uri: item.imageUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.previewImagePlaceholder}>
              <Ionicons
                name="image-outline"
                size={35}
                color={COLORS.textLight}
              />
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function OutfitDetailScreen({ navigation, route }) {
  const { width } = useWindowDimensions();

  const isDesktop = width > 768;

  const outfitId =
    route?.params?.outfitId ??
    route?.params?.id ??
    route?.params?.outfit?.id;

  const user = route?.params?.user;

  const [outfit, setOutfit] = useState(
    route?.params?.outfit || null
  );

  const [clothingItems, setClothingItems] = useState({
    superior: null,
    inferior: null,
    calzado: null,
    accesorios: [],
  });

  const [loading, setLoading] = useState(true);
const [showSuccessMessage, setShowSuccessMessage] = useState(false);
const successMessageTimeout = useRef(null);

  // ==========================================================
  // CARGAR OUTFIT
  // ==========================================================

  useEffect(() => {
    loadOutfit();
  }, [outfitId]);
useEffect(() => {
  return () => {
    if (successMessageTimeout.current) {
      clearTimeout(successMessageTimeout.current);
    }
  };
}, []);
  const loadOutfit = async () => {
    try {
      setLoading(true);

      let currentOutfit = route?.params?.outfit || null;

      // Si recibimos ID, siempre consultamos la base.
      if (outfitId !== undefined && outfitId !== null) {
        const databaseOutfit = await getOutfitById(
          normalizeId(outfitId)
        );

        if (databaseOutfit) {
          currentOutfit = databaseOutfit;
        }
      }

      if (!currentOutfit) {
        setOutfit(null);

        setClothingItems({
          superior: null,
          inferior: null,
          calzado: null,
          accesorios: [],
        });

        return;
      }

      setOutfit(currentOutfit);

      await loadClothingForOutfit(currentOutfit);
    } catch (error) {
      console.log(
        'Error cargando detalle del outfit:',
        error
      );

      Alert.alert(
        'Error',
        MESSAGES.OUTFIT_ERROR
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // CARGAR PRENDAS RELACIONADAS
  // ==========================================================

  const loadClothingForOutfit = async (currentOutfit) => {
    const outfitItems = currentOutfit?.items || {};

    const superiorId = outfitItems.superior;
    const inferiorId = outfitItems.inferior;
    const calzadoId = outfitItems.calzado;

    const accessoryIds = Array.isArray(
      outfitItems.accesorios
    )
      ? outfitItems.accesorios
      : [];

    const [
      superior,
      inferior,
      calzado,
      accesorios,
    ] = await Promise.all([
      superiorId
        ? getClothingItemById(
            normalizeId(superiorId)
          )
        : null,

      inferiorId
        ? getClothingItemById(
            normalizeId(inferiorId)
          )
        : null,

      calzadoId
        ? getClothingItemById(
            normalizeId(calzadoId)
          )
        : null,

      Promise.all(
        accessoryIds.map((id) =>
          getClothingItemById(
            normalizeId(id)
          )
        )
      ),
    ]);

    setClothingItems({
      superior,
      inferior,
      calzado,
      accesorios: accesorios.filter(Boolean),
    });
  };

  // ==========================================================
  // LISTA FINAL DE PRENDAS
  // ==========================================================

  const allClothingItems = useMemo(() => {
    return [
      clothingItems.superior,
      clothingItems.inferior,
      clothingItems.calzado,
      ...clothingItems.accesorios,
    ].filter(Boolean);
  }, [clothingItems]);

  // ==========================================================
  // ABRIR DETALLE DE PRENDA
  // ==========================================================

const handleClothingPress = (item) => {
  if (!item?.id) return;

  navigation.navigate(
    'ClothingDetail',
    {
      prenda: item,
      clothingId: item.id,
      user,
    }
  );
};



  // ==========================================================
  // VOLVER
  // ==========================================================

  const handleBack = () => {
    navigation.goBack();
  };
const handleMarkAsUsed = async () => {
  if (!user?.id || !outfit?.id) {
    Alert.alert(
      'Error',
      'No se pudo identificar el outfit o el usuario.'
    );
    return;
  }

  try {
    const result = await addHistoryEntry({
      userId: user.id,
      outfitId: outfit.id,
      outfitName: outfit.name || 'Outfit sin nombre',
      imageUri: '',
      note: '',
    });

    if (!result?.success) {
      throw new Error(
        result?.message || 'HISTORY_ERROR'
      );
    }

    // Limpiamos un mensaje anterior si todavía estaba visible.
    if (successMessageTimeout.current) {
      clearTimeout(successMessageTimeout.current);
    }

    // Mostramos mensaje de éxito.
    setShowSuccessMessage(true);

    // Lo ocultamos después de unos segundos.
    successMessageTimeout.current = setTimeout(() => {
      setShowSuccessMessage(false);
    }, 2500);

  } catch (error) {
    console.log(
      'Error registrando uso del outfit:',
      error
    );

    Alert.alert(
      'Error',
      'No se pudo registrar el outfit en el historial.'
    );
  }
};
  // ==========================================================
  // LOADING
  // ==========================================================

if (loading) {
  return (
    <OutfitScreenLayout
      title="Detalle de Outfit"
      navigation={navigation}
      user={user}
    >
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text style={styles.loadingText}>
          Cargando outfit...
        </Text>
      </View>
    </OutfitScreenLayout>
  );
}
  // ==========================================================
  // OUTFIT NO ENCONTRADO
  // ==========================================================

  if (!outfit) {
  return (
    <OutfitScreenLayout
      title="Detalle de Outfit"
      navigation={navigation}
      user={user}
    >
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="hanger"
          size={70}
          color={COLORS.primary}
        />

        <Text style={styles.emptyTitle}>
          Outfit no encontrado
        </Text>

        <Text style={styles.emptyDescription}>
          No pudimos encontrar este outfit en tu armario.
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Text style={styles.backButtonText}>
            Volver
          </Text>
        </TouchableOpacity>
      </View>
    </OutfitScreenLayout>
  );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
  <OutfitScreenLayout
    title="Detalle de Outfit"
    navigation={navigation}
    user={user}
  >
    <View style={styles.root}>
      {showSuccessMessage && (
  <View style={styles.successMessage}>
    <Ionicons
      name="checkmark-circle"
      size={22}
      color="#2F6B4F"
    />

    <Text style={styles.successMessageText}>
      ¡Outfit marcado exitosamente!
    </Text>
  </View>
)}

      {/* ======================================================
          CONTENIDO
      ====================================================== */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* ====================================================
            TÍTULO
        ==================================================== */}

{/* Título gestionado por el header global */}
        {/* ====================================================
            DOS COLUMNAS EN DESKTOP
        ==================================================== */}

        <View
          style={[
            styles.columns,
            isDesktop
              ? styles.columnsDesktop
              : styles.columnsMobile,
          ]}
        >

          {/* ==================================================
              TARJETA IZQUIERDA
          ================================================== */}

          <View
            style={[
              styles.mainCard,
              isDesktop
                ? styles.mainCardDesktop
                : styles.mainCardMobile,
            ]}
          >

            {/* Preview */}

            <OutfitPreview
              items={clothingItems}
              isDesktop={isDesktop}
            />

            {/* Nombre */}

            <View style={styles.outfitInfo}>

              <Text style={styles.outfitName}>
                {outfit.name || 'Outfit sin nombre'}
              </Text>

              {!!outfit.description && (
                <Text style={styles.outfitDescription}>
                  {outfit.description}
                </Text>
              )}

              <View style={styles.dateRow}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={COLORS.textLight}
                />

                <Text style={styles.dateText}>
                  Creado el {formatDate(outfit.createdAt)}
                </Text>
              </View>

            </View>

          </View>

          {/* ==================================================
              TARJETA DERECHA / PRENDAS
          ================================================== */}

          <View
            style={[
              styles.itemsCard,
              isDesktop
                ? styles.itemsCardDesktop
                : styles.itemsCardMobile,
            ]}
          >

            {/* Header de prendas */}

            <View style={styles.itemsHeader}>

              <MaterialCommunityIcons
                name="hanger"
                size={25}
                color={COLORS.primary}
              />

              <Text style={styles.itemsHeaderText}>
                Prendas incluidas
              </Text>

              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {allClothingItems.length}
                </Text>
              </View>

            </View>

            {/* Lista */}

            {allClothingItems.length > 0 ? (
              <View style={styles.itemsList}>

                {allClothingItems.map((item, index) => (
                  <ClothingRow
                    key={`${item.id}-${index}`}
                    item={item}
                    onPress={() =>
                      handleClothingPress(item)
                    }
                  />
                ))}

              </View>
            ) : (
              <View style={styles.noItemsContainer}>
                <Ionicons
                  name="shirt-outline"
                  size={40}
                  color={COLORS.textLight}
                />

                <Text style={styles.noItemsText}>
                  No hay prendas asociadas a este outfit.
                </Text>
              </View>
            )}

            {/* =================================================
                AVISO
            ================================================= */}

            <View style={styles.infoBanner}>

              <Ionicons
                name="information-circle-outline"
                size={21}
                color={COLORS.buttonDark}
              />

              <Text style={styles.infoBannerText}>
                Tocá cualquier prenda para ver más detalles.
              </Text>

            </View>

            {/* =================================================
                BOTONES
            ================================================= */}

    

            {/* =================================================
                VOLVER
            ================================================= */}
<TouchableOpacity
  style={styles.useButton}
  onPress={handleMarkAsUsed}
  activeOpacity={0.85}
>
  <Ionicons
    name="checkmark-circle-outline"
    size={22}
    color="#FFFFFF"
  />

  <Text style={styles.useButtonText}>
    Marcar como usado
  </Text>
</TouchableOpacity>
            <TouchableOpacity
              style={styles.returnButton}
              onPress={handleBack}
            >
              <Text style={styles.returnButtonText}>
                Volver
              </Text>
            </TouchableOpacity>

          </View>

        </View>

       </ScrollView>
  </View>
</OutfitScreenLayout>
);}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  root: {
    flex: 1,
    backgroundColor: '#FAF8FC',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 35,
  },

  scrollContentDesktop: {
    paddingHorizontal: 38,
    paddingVertical: 32,
  },

  // ==========================================================
  // TÍTULO
  // ==========================================================

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  backIconButton: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginRight: 10,
  },

  pageTitle: {
    color: '#20203A',
    fontSize: 27,
    fontFamily: 'Poppins_600SemiBold',
  },

  // ==========================================================
  // COLUMNAS
  // ==========================================================

  columns: {
    width: '100%',
  },

  columnsDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 18,
  },

  columnsMobile: {
    flexDirection: 'column',
  },

  // ==========================================================
  // TARJETA PRINCIPAL
  // ==========================================================

  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECE7F1',
    overflow: 'hidden',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,

    elevation: 2,
  },

  mainCardDesktop: {
    flex: 1,
    minHeight: 620,
  },

  mainCardMobile: {
    width: '100%',
    marginBottom: 14,
  },

  // ==========================================================
  // PREVIEW
  // ==========================================================

  outfitPreview: {
    minHeight: 300,
    backgroundColor: '#F8F5FA',
    padding: 12,

    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },

  outfitPreviewDesktop: {
    minHeight: 380,
    margin: 25,
    borderRadius: 10,
  },

  previewItem: {
    width: '46%',
    height: 135,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
  },

  previewItemLarge: {
    width: '44%',
    height: 180,
  },

  previewImage: {
    width: '100%',
    height: '100%',
  },

  previewImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  previewEmpty: {
    minHeight: 280,
    backgroundColor: '#F8F5FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },

  previewEmptyDesktop: {
    margin: 25,
    borderRadius: 10,
    minHeight: 380,
  },

  previewEmptyText: {
    marginTop: 14,
    color: COLORS.textLight,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },

  // ==========================================================
  // INFO OUTFIT
  // ==========================================================

  outfitInfo: {
    paddingHorizontal: 30,
    paddingVertical: 24,
  },

  outfitName: {
    color: '#20203A',
    fontSize: 25,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 8,
  },

  outfitDescription: {
    color: COLORS.textDark,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 20,
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dateText: {
    marginLeft: 9,
    color: COLORS.textLight,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },

  // ==========================================================
  // TARJETA DE PRENDAS
  // ==========================================================

  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECE7F1',
    padding: 22,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,

    elevation: 2,
  },

  itemsCardDesktop: {
    flex: 1,
    minHeight: 620,
  },

  itemsCardMobile: {
    width: '100%',
  },

  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  itemsHeaderText: {
    marginLeft: 10,
    color: COLORS.buttonDark,
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
  },

  countBadge: {
    marginLeft: 8,
    minWidth: 27,
    height: 27,
    paddingHorizontal: 7,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  countText: {
    color: COLORS.buttonDark,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },

  // ==========================================================
  // FILAS DE PRENDAS
  // ==========================================================

  itemsList: {
    width: '100%',
  },

  clothingRow: {
    minHeight: 95,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ECE7F1',
    paddingVertical: 9,
  },

  clothingImageContainer: {
    width: 82,
    height: 78,
    borderRadius: 10,
    backgroundColor: '#F8F5FA',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 14,
  },

  clothingImage: {
    width: '90%',
    height: '90%',
  },

  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  clothingInfo: {
    flex: 1,
    paddingRight: 8,
  },

  categoryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },

  categoryIcon: {
    width: 23,
    alignItems: 'flex-start',
  },

  categoryText: {
    color: COLORS.buttonDark,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },

  clothingTitle: {
    color: '#20203A',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },

  colorLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#D6D0DA',
    marginRight: 5,
  },

  colorText: {
    color: COLORS.textLight,
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    flexShrink: 1,
  },

  // ==========================================================
  // SIN PRENDAS
  // ==========================================================

  noItemsContainer: {
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },

  noItemsText: {
    color: COLORS.textLight,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginTop: 10,
  },

  // ==========================================================
  // BANNER
  // ==========================================================

  infoBanner: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: '#F1E8FB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 16,
  },

  infoBannerText: {
    flex: 1,
    marginLeft: 8,
    color: COLORS.textLight,
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },

  // ==========================================================
  // BOTONES
  // ==========================================================

  returnButton: {
    height: 52,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#DDD6E4',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },

  returnButtonText: {
    color: COLORS.buttonDark,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },

  // ==========================================================
  // LOADING
  // ==========================================================

  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF8FC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.textLight,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },

  // ==========================================================
  // EMPTY
  // ==========================================================

  emptyContainer: {
    flex: 1,
    backgroundColor: '#FAF8FC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },

  emptyTitle: {
    color: '#20203A',
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 15,
  },

  emptyDescription: {
    color: COLORS.textLight,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 25,
  },

  backButton: {
    backgroundColor: COLORS.buttonDark,
    borderRadius: 9,
    paddingHorizontal: 35,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  useButton: {
  minHeight: 50,
  borderRadius: 10,
  backgroundColor: COLORS.primary,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 20,
  marginBottom: 12,
},

useButtonText: {
  marginLeft: 8,
  color: '#FFFFFF',
  fontSize: 15,
  fontFamily: 'Poppins_600SemiBold',
},

successMessage: {
  position: 'absolute',
  top: 16,
  left: 20,
  right: 20,
  zIndex: 1000,

  minHeight: 52,
  borderRadius: 12,

  backgroundColor: '#BFE8D0',

  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',

  paddingHorizontal: 18,

  shadowColor: '#000000',
  shadowOffset: {
    width: 0,
    height: 3,
  },
  shadowOpacity: 0.18,
  shadowRadius: 6,
  elevation: 6,
},

successMessageText: {
  marginLeft: 8,
  color: '#2F6B4F',
  fontSize: 14,
  fontFamily: 'Poppins_600SemiBold',
  textAlign: 'center',
},
});