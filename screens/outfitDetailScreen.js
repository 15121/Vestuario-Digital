import React, {
  useCallback,
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
  Platform,
  useWindowDimensions,
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import {
  getOutfitById,
  getClothingItemById,
  addHistoryEntry,
  getUserHistory,
  deleteOutfit,
} from '../services/database';
import { COLORS } from '../theme/colours';
import { MESSAGES } from '../theme/messages';
import { getColorHex } from '../utils/colorutils';
import { OutfitScreenLayout } from '../navigation/MainTabNavigator';

const CATEGORY_CONFIG = {
  superior: {
    label: 'Superior',
    icon: 'tshirt-crew-outline',
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
  completa: {
    label: 'Prenda completa',
    icon: 'hanger',
  },
  interior: {
    label: 'Ropa interior',
    icon: 'tshirt-crew-outline',
  },
};

const normalizeId = (value) => {
  if (value === null || value === undefined) return null;

  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? value : numberValue;
};

const normalizeText = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
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

  return String(color);
};

const getColorValue = (color) => getColorHex(color, '#E8E4EC');

const getCategoryKey = (category) => {
  if (!category) return 'accesorio';

  const normalized = String(category)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // SUPERIORES Y PRENDAS DE UNA PIEZA
  if (
    normalized.includes('superior') ||
    normalized.includes('camiseta') ||
    normalized.includes('top') ||
    normalized.includes('camisa') ||
    normalized.includes('remera') ||
    normalized.includes('blusa') ||
    normalized.includes('campera') ||
    normalized.includes('abrigo') ||
    normalized.includes('buzo') ||
    normalized.includes('sweater') ||
    normalized.includes('chaqueta') ||
    normalized.includes('vestido') ||
    normalized.includes('traje') ||
    normalized.includes('conjunto') ||
    normalized.includes('mono')
  ) {
    return 'superior';
  }

  // INFERIORES
  if (
    normalized.includes('inferior') ||
    normalized.includes('pantalon') ||
    normalized.includes('falda') ||
    normalized.includes('pollera') ||
    normalized.includes('short') ||
    normalized.includes('bermuda') ||
    normalized.includes('jean')
  ) {
    return 'inferior';
  }

  // CALZADO
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

function ClothingRow({
  item,
  onPress,
  isCompact,
}) {
  const categoryKey = getCategoryKey(item?.category);

  const config =
    CATEGORY_CONFIG[categoryKey] ||
    CATEGORY_CONFIG.accesorio;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={[
        styles.clothingRow,
        isCompact && styles.clothingRowCompact,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.clothingImageContainer,
          isCompact &&
            styles.clothingImageContainerCompact,
        ]}
      >
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

      <View style={styles.clothingInfo}>
        <View style={styles.categoryLine}>
          <View style={styles.categoryIcon}>
            <MaterialCommunityIcons
              name={config.icon}
              size={18}
              color={COLORS.primary}
            />
          </View>

          <Text
            style={styles.categoryText}
            numberOfLines={1}
          >
            {config.label}
          </Text>
        </View>

        <Text
          style={styles.clothingTitle}
          numberOfLines={2}
        >
          {item?.title || 'Prenda sin nombre'}
        </Text>

        <View style={styles.colorLine}>
          <View
            style={[
              styles.colorDot,
              {
                backgroundColor:
                  getColorValue(item?.color),
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

function OutfitPreview({
  items,
  isDesktop,
  isCompact,
}) {
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
          isDesktop &&
            styles.previewEmptyDesktop,
          isCompact &&
            styles.previewEmptyCompact,
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
        isDesktop &&
          styles.outfitPreviewDesktop,
        isCompact &&
          styles.outfitPreviewCompact,
      ]}
    >
      {previewItems.map((item, index) => (
        <View
          key={`${item.id ?? 'item'}-${index}`}
          style={[
            styles.previewItem,
            previewItems.length <= 2 &&
              styles.previewItemLarge,
            isCompact &&
              styles.previewItemCompact,
          ]}
        >
          {item.imageUri ? (
            <Image
              source={{ uri: item.imageUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : (
            <View
              style={
                styles.previewImagePlaceholder
              }
            >
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

export default function OutfitDetailScreen({
  navigation,
  route,
}) {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 900;
  const isCompact = width < 390;

  const outfitId =
    route?.params?.outfitId ??
    route?.params?.id ??
    route?.params?.outfit?.id;

  const user = route?.params?.user;

  const [outfit, setOutfit] = useState(
    route?.params?.outfit || null
  );

  const [clothingItems, setClothingItems] =
    useState({
      superior: null,
      inferior: null,
      calzado: null,
      accesorios: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [
    showSuccessMessage,
    setShowSuccessMessage,
  ] = useState(false);

  const successMessageTimeout =
    useRef(null);

  const [deleting, setDeleting] =
    useState(false);

  const loadClothingForOutfit =
    useCallback(async (currentOutfit) => {
      const outfitItems =
        currentOutfit?.items || {};

      const superiorId =
        outfitItems.superior;

      const inferiorId =
        outfitItems.inferior;

      const calzadoId =
        outfitItems.calzado;

      const accessoryIds =
        Array.isArray(
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
        superiorId !== null &&
        superiorId !== undefined
          ? getClothingItemById(
              normalizeId(superiorId)
            )
          : null,

        inferiorId !== null &&
        inferiorId !== undefined
          ? getClothingItemById(
              normalizeId(inferiorId)
            )
          : null,

        calzadoId !== null &&
        calzadoId !== undefined
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
        accesorios:
          accesorios.filter(Boolean),
      });
    }, []);

  const loadOutfit = useCallback(
    async () => {
      try {
        setLoading(true);

        let currentOutfit =
          route?.params?.outfit ||
          null;

        if (
          outfitId !== undefined &&
          outfitId !== null
        ) {
          const databaseOutfit =
            await getOutfitById(
              normalizeId(outfitId)
            );

          if (databaseOutfit) {
            currentOutfit =
              databaseOutfit;
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

        await loadClothingForOutfit(
          currentOutfit
        );
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
    },
    [
      loadClothingForOutfit,
      outfitId,
      route?.params?.outfit,
    ]
  );

  useEffect(() => {
    loadOutfit();
  }, [loadOutfit]);

  useEffect(() => {
    return () => {
      if (
        successMessageTimeout.current
      ) {
        clearTimeout(
          successMessageTimeout.current
        );
      }
    };
  }, []);

  const allClothingItems = useMemo(() => {
    return [
      clothingItems.superior,
      clothingItems.inferior,
      clothingItems.calzado,
      ...clothingItems.accesorios,
    ].filter(Boolean);
  }, [clothingItems]);

  const handleClothingPress =
    useCallback(
      (item) => {
        if (!item?.id) return;

        navigation.navigate(
          'ClothingDetail',
          {
            prenda: item,
            clothingId: item.id,
            user,
          }
        );
      },
      [navigation, user]
    );

  const handleBack =
    useCallback(() => {
      navigation.goBack();
    }, [navigation]);

  const handleMarkAsUsed =
    useCallback(async () => {
      if (!user?.id || !outfit?.id) {
        Alert.alert(
          'Error',
          'No se pudo identificar el outfit o el usuario.'
        );

        return;
      }

      try {
        // Un mismo outfit solo se puede marcar una vez por día
        const history = await getUserHistory(user.id);
        const today = new Date().toDateString();

        const alreadyUsedToday = (
          Array.isArray(history) ? history : []
        ).some(
          (entry) =>
            String(entry.outfitId) === String(outfit.id) &&
            new Date(entry.date).toDateString() === today
        );

        if (alreadyUsedToday) {
          Alert.alert(
            'Ya registrado',
            'Este outfit ya fue marcado como usado hoy.'
          );

          return;
        }

        const result =
          await addHistoryEntry({
            userId: user.id,
            outfitId: outfit.id,
            outfitName:
              outfit.name ||
              'Outfit sin nombre',
            imageUri: '',
            note: '',
          });

        if (!result?.success) {
          throw new Error(
            result?.message ||
              'HISTORY_ERROR'
          );
        }

        if (
          successMessageTimeout.current
        ) {
          clearTimeout(
            successMessageTimeout.current
          );
        }

        setShowSuccessMessage(true);

        successMessageTimeout.current =
          setTimeout(() => {
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
    }, [outfit, user]);

  const handleDelete = useCallback(() => {
    if (!outfit?.id || deleting) return;

    const runDelete = async () => {
      try {
        setDeleting(true);

        const result = await deleteOutfit(outfit.id);

        if (!result?.success) {
          throw new Error(result?.message || 'DELETE_ERROR');
        }

        navigation.goBack();
      } catch (error) {
        console.log('Error eliminando outfit:', error);

        setDeleting(false);

        Alert.alert('Error', 'No se pudo eliminar el outfit.');
      }
    };

    const message = `¿Seguro que querés eliminar "${
      outfit.name || 'este outfit'
    }"? Esta acción no se puede deshacer.`;

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        runDelete();
      }
      return;
    }

    Alert.alert('Eliminar outfit', message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: runDelete,
      },
    ]);
  }, [outfit, deleting, navigation]);

  if (loading) {
    return (
      <OutfitScreenLayout
        title="Detalle de Outfit"
        navigation={navigation}
        user={user}
      >
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
            Cargando outfit...
          </Text>
        </View>
      </OutfitScreenLayout>
    );
  }

  if (!outfit) {
    return (
      <OutfitScreenLayout
        title="Detalle de Outfit"
        navigation={navigation}
        user={user}
      >
        <View
          style={styles.emptyContainer}
        >
          <MaterialCommunityIcons
            name="hanger"
            size={70}
            color={COLORS.primary}
          />

          <Text
            style={styles.emptyTitle}
          >
            Outfit no encontrado
          </Text>

          <Text
            style={styles.emptyDescription}
          >
            No pudimos encontrar este outfit en tu armario.
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text
              style={
                styles.backButtonText
              }
            >
              Volver
            </Text>
          </TouchableOpacity>
        </View>
      </OutfitScreenLayout>
    );
  }

  return (
    <OutfitScreenLayout
      title="Detalle de Outfit"
      navigation={navigation}
      user={user}
    >
      <View style={styles.root}>
        {showSuccessMessage && (
          <View
            style={[
              styles.successMessage,
              isDesktop &&
                styles.successMessageDesktop,
              isCompact &&
                styles.successMessageCompact,
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={22}
              color="#2F6B4F"
            />

            <Text
              style={
                styles.successMessageText
              }
            >
              ¡Outfit marcado exitosamente!
            </Text>
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop &&
              styles.scrollContentDesktop,
            isCompact &&
              styles.scrollContentCompact,
          ]}
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={[
              styles.contentWrapper,
              isDesktop &&
                styles.contentWrapperDesktop,
            ]}
          >
            <View
              style={[
                styles.columns,
                isDesktop
                  ? styles.columnsDesktop
                  : styles.columnsMobile,
              ]}
            >
              <View
                style={[
                  styles.mainCard,
                  isDesktop
                    ? styles.mainCardDesktop
                    : styles.mainCardMobile,
                ]}
              >
                <OutfitPreview
                  items={clothingItems}
                  isDesktop={isDesktop}
                  isCompact={isCompact}
                />

                <View
                  style={[
                    styles.outfitInfo,
                    isCompact &&
                      styles.outfitInfoCompact,
                  ]}
                >
                  <Text
                    style={[
                      styles.outfitName,
                      isCompact &&
                        styles.outfitNameCompact,
                    ]}
                  >
                    {outfit.name ||
                      'Outfit sin nombre'}
                  </Text>

                  {!!outfit.description && (
                    <Text
                      style={
                        styles.outfitDescription
                      }
                    >
                      {outfit.description}
                    </Text>
                  )}

                  <View
                    style={styles.dateRow}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={
                        COLORS.textLight
                      }
                    />

                    <Text
                      style={styles.dateText}
                    >
                      Creado el{' '}
                      {formatDate(
                        outfit.createdAt
                      )}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.itemsCard,
                  isDesktop
                    ? styles.itemsCardDesktop
                    : styles.itemsCardMobile,
                ]}
              >
                <View
                  style={styles.itemsHeader}
                >
                  <MaterialCommunityIcons
                    name="hanger"
                    size={25}
                    color={COLORS.primary}
                  />

                  <Text
                    style={
                      styles.itemsHeaderText
                    }
                    numberOfLines={1}
                  >
                    Prendas incluidas
                  </Text>

                  <View
                    style={styles.countBadge}
                  >
                    <Text
                      style={styles.countText}
                    >
                      {
                        allClothingItems.length
                      }
                    </Text>
                  </View>
                </View>

                {allClothingItems.length >
                0 ? (
                  <View
                    style={styles.itemsList}
                  >
                    {allClothingItems.map(
                      (item, index) => (
                        <ClothingRow
                          key={`${item.id ?? 'item'}-${index}`}
                          item={item}
                          isCompact={
                            isCompact
                          }
                          onPress={() =>
                            handleClothingPress(
                              item
                            )
                          }
                        />
                      )
                    )}
                  </View>
                ) : (
                  <View
                    style={
                      styles.noItemsContainer
                    }
                  >
                    <Ionicons
                      name="shirt-outline"
                      size={40}
                      color={
                        COLORS.textLight
                      }
                    />

                    <Text
                      style={
                        styles.noItemsText
                      }
                    >
                      No hay prendas asociadas a este outfit.
                    </Text>
                  </View>
                )}

                <View
                  style={styles.infoBanner}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={21}
                    color={COLORS.buttonDark}
                  />

                  <Text
                    style={
                      styles.infoBannerText
                    }
                  >
                    Tocá cualquier prenda para ver más detalles.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.useButton}
                  onPress={
                    handleMarkAsUsed
                  }
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={22}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.useButtonText
                    }
                  >
                    Marcar como usado
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    deleting && styles.deleteButtonDisabled,
                  ]}
                  onPress={handleDelete}
                  disabled={deleting}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color="#C94C6D"
                  />

                  <Text style={styles.deleteButtonText}>
                    {deleting ? 'Eliminando...' : 'Eliminar outfit'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.returnButton}
                  onPress={handleBack}
                  activeOpacity={0.85}
                >
                  <Text
                    style={
                      styles.returnButtonText
                    }
                  >
                    Volver
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </OutfitScreenLayout>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    minHeight: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C94C6D',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },

  deleteButtonDisabled: {
    opacity: 0.6,
  },

  deleteButtonText: {
    color: '#C94C6D',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },

  root: {
    flex: 1,
    backgroundColor: '#FAF8FC',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    width: '100%',
    padding: 16,
    paddingBottom: 35,
  },

  scrollContentCompact: {
    paddingHorizontal: 10,
    paddingBottom: 24,
  },

  scrollContentDesktop: {
    paddingHorizontal: 28,
    paddingVertical: 28,
  },

  contentWrapper: {
    width: '100%',
    alignSelf: 'center',
  },

  contentWrapperDesktop: {
    maxWidth: 1440,
  },

  columns: {
    width: '100%',
  },

  columnsDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 24,
  },

  columnsMobile: {
    flexDirection: 'column',
  },

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
    minWidth: 0,
    minHeight: 620,
  },

  mainCardMobile: {
    width: '100%',
    marginBottom: 14,
  },

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
    minHeight: 390,
    margin: 25,
    borderRadius: 10,
  },

  outfitPreviewCompact: {
    minHeight: 250,
    padding: 8,
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

  previewItemCompact: {
    width: '45%',
    height: 110,
    margin: 3,
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
    minHeight: 390,
  },

  previewEmptyCompact: {
    minHeight: 250,
    padding: 20,
  },

  previewEmptyText: {
    marginTop: 14,
    color: COLORS.textLight,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },

  outfitInfo: {
    paddingHorizontal: 30,
    paddingVertical: 24,
  },

  outfitInfoCompact: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },

  outfitName: {
    color: '#20203A',
    fontSize: 25,
    lineHeight: 32,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 8,
  },

  outfitNameCompact: {
    fontSize: 21,
    lineHeight: 28,
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
    flex: 1,
    marginLeft: 9,
    color: COLORS.textLight,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },

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
    minWidth: 0,
    minHeight: 620,
  },

  itemsCardMobile: {
    width: '100%',
  },

  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    minWidth: 0,
  },

  itemsHeaderText: {
    flexShrink: 1,
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

  clothingRowCompact: {
    minHeight: 84,
    paddingVertical: 7,
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

  clothingImageContainerCompact: {
    width: 68,
    height: 66,
    marginRight: 10,
  },

  clothingImage: {
    width: '90%',
    height: '90%',
  },

  imagePlaceholder: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  clothingInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  categoryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    minWidth: 0,
  },

  categoryIcon: {
    width: 23,
    alignItems: 'flex-start',
  },

  categoryText: {
    flexShrink: 1,
    color: COLORS.buttonDark,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },

  clothingTitle: {
    color: '#20203A',
    fontSize: 14,
    lineHeight: 19,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },

  colorLine: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
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
    flex: 1,
    color: COLORS.textLight,
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },

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
    lineHeight: 16,
    fontFamily: 'Poppins_400Regular',
  },

  useButton: {
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },

  useButtonText: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },

  returnButton: {
    minHeight: 52,
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

  successMessageDesktop: {
    left: '50%',
    right: undefined,
    width: 420,
    marginLeft: -210,
  },

  successMessageCompact: {
    left: 10,
    right: 10,
    paddingHorizontal: 12,
  },

  successMessageText: {
    flexShrink: 1,
    marginLeft: 8,
    color: '#2F6B4F',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },

  loadingContainer: {
    flex: 1,
    minHeight: 300,
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

  emptyContainer: {
    flex: 1,
    minHeight: 400,
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
    maxWidth: 500,
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
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
});