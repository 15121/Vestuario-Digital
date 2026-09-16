import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  SafeAreaView,
  Modal,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import {
  getUserClothes,
  addOutfit,
} from '../services/database';

import { COLORS } from '../theme/colours';
import { MESSAGES } from '../theme/messages';

// ============================================================
// NORMALIZACIÓN DE CATEGORÍAS
// Permite trabajar aunque en la base se haya guardado:
// "Superior", "superior", "Camisa", etc.
// ============================================================

const normalizeCategory = (category = '') => {
  return category
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const isUpper = (category) => {
  const value = normalizeCategory(category);

  return [
    'superior',
    'superiores',
    'camisa',
    'camisas',
    'remera',
    'remeras',
    'camiseta',
    'camisetas',
    'blusa',
    'blusas',
    'top',
    'tops',
    'sweater',
    'buzo',
    'chaqueta',
    'campera',
    'abrigo',
  ].includes(value);
};

const isLower = (category) => {
  const value = normalizeCategory(category);

  return [
    'inferior',
    'inferiores',
    'pantalon',
    'pantalones',
    'jean',
    'jeans',
    'short',
    'shorts',
    'falda',
    'faldas',
    'pollera',
    'polleras',
    'bermuda',
    'bermudas',
  ].includes(value);
};

const isShoes = (category) => {
  const value = normalizeCategory(category);

  return [
    'calzado',
    'calzados',
    'zapato',
    'zapatos',
    'zapatilla',
    'zapatillas',
    'bota',
    'botas',
    'sandalia',
    'sandalias',
  ].includes(value);
};

const isAccessory = (category) => {
  const value = normalizeCategory(category);

  return [
    'accesorio',
    'accesorios',
    'accesory',
    'accesories',
    'cartera',
    'carteras',
    'bolso',
    'bolsos',
    'reloj',
    'relojes',
    'cinturon',
    'cinturones',
    'gorra',
    'gorras',
    'sombrero',
    'sombreros',
    'bufanda',
    'bufandas',
    'lentes',
    'anteojos',
  ].includes(value);
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function CreateOutfitScreen({ navigation, route }) {
  const { width } = useWindowDimensions();

  const isDesktop = width > 768;

  const user = route?.params?.user;

  // ----------------------------------------------------------
  // ESTADOS
  // ----------------------------------------------------------

  const [outfitName, setOutfitName] = useState('');
  const [description, setDescription] = useState('');

  const [clothes, setClothes] = useState([]);

  const [selectedUpper, setSelectedUpper] = useState(null);
  const [selectedLower, setSelectedLower] = useState(null);
  const [selectedShoes, setSelectedShoes] = useState(null);
  const [selectedAccessories, setSelectedAccessories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal para seleccionar/cambiar prendas
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectorType, setSelectorType] = useState(null);

  // ----------------------------------------------------------
  // CARGAR PRENDAS DEL USUARIO
  // ----------------------------------------------------------

  useEffect(() => {
    loadUserClothes();
  }, [user?.id]);

  const loadUserClothes = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const result = await getUserClothes(user.id);

      const userClothes = Array.isArray(result) ? result : [];

      setClothes(userClothes);

      // ------------------------------------------------------
      // PRIMER INGRESO:
      // Se selecciona automáticamente una prenda de cada
      // categoría obligatoria para que la pantalla se vea
      // completa cuando existen prendas cargadas.
      // ------------------------------------------------------

      const firstUpper = userClothes.find((item) =>
        isUpper(item.category)
      );

      const firstLower = userClothes.find((item) =>
        isLower(item.category)
      );

      const firstShoes = userClothes.find((item) =>
        isShoes(item.category)
      );

      const accessories = userClothes
        .filter((item) => isAccessory(item.category))
        .slice(0, 2);

      setSelectedUpper(firstUpper || null);
      setSelectedLower(firstLower || null);
      setSelectedShoes(firstShoes || null);
      setSelectedAccessories(accessories);
    } catch (error) {
      console.log('Error cargando prendas:', error);

      Alert.alert(
        'Error',
        'No se pudieron cargar las prendas del armario.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // PRENDAS DISPONIBLES SEGÚN CATEGORÍA
  // ==========================================================

  const upperClothes = useMemo(
    () => clothes.filter((item) => isUpper(item.category)),
    [clothes]
  );

  const lowerClothes = useMemo(
    () => clothes.filter((item) => isLower(item.category)),
    [clothes]
  );

  const shoesClothes = useMemo(
    () => clothes.filter((item) => isShoes(item.category)),
    [clothes]
  );

  const accessoryClothes = useMemo(
    () => clothes.filter((item) => isAccessory(item.category)),
    [clothes]
  );

  // ==========================================================
  // PROGRESO DE PRENDAS OBLIGATORIAS
  // ==========================================================

  const completedRequired = [
    selectedUpper,
    selectedLower,
    selectedShoes,
  ].filter(Boolean).length;

  const totalRequired = 3;

  const isComplete = completedRequired === totalRequired;

  // ==========================================================
  // SELECTOR
  // ==========================================================

  const openSelector = (type) => {
    setSelectorType(type);
    setSelectorVisible(true);
  };

  const closeSelector = () => {
    setSelectorVisible(false);
    setSelectorType(null);
  };

  const getSelectorItems = () => {
    switch (selectorType) {
      case 'upper':
        return upperClothes;

      case 'lower':
        return lowerClothes;

      case 'shoes':
        return shoesClothes;

      case 'accessory':
        return accessoryClothes;

      default:
        return [];
    }
  };

  const handleSelectClothing = (item) => {
    if (!item) return;

    if (selectorType === 'upper') {
      setSelectedUpper(item);
    }

    if (selectorType === 'lower') {
      setSelectedLower(item);
    }

    if (selectorType === 'shoes') {
      setSelectedShoes(item);
    }

    if (selectorType === 'accessory') {
      setSelectedAccessories((previous) => {
        const alreadyAdded = previous.some(
          (accessory) => accessory.id === item.id
        );

        if (alreadyAdded) {
          return previous;
        }

        return [...previous, item];
      });
    }

    closeSelector();
  };

  // ==========================================================
  // ELIMINAR ACCESORIO
  // ==========================================================

  const removeAccessory = (id) => {
    setSelectedAccessories((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  // ==========================================================
  // OBTENER NOMBRE DE COLOR
  // ==========================================================

  const getColor = (item) => {
    if (!item?.color) {
      return 'Sin color';
    }

    return item.color;
  };

  // ==========================================================
  // IMAGEN
  // ==========================================================

  const renderClothingImage = (item, style) => {
    if (!item?.imageUri) {
      return (
        <View style={[styles.imagePlaceholder, style]}>
          <Ionicons
            name="shirt-outline"
            size={36}
            color={COLORS.primary}
          />
        </View>
      );
    }

    return (
      <Image
        source={{ uri: item.imageUri }}
        style={[styles.clothingImage, style]}
        resizeMode="contain"
      />
    );
  };

  // ==========================================================
  // GUARDAR OUTFIT
  // ==========================================================

  const handleSaveOutfit = async () => {
    if (!outfitName.trim()) {
      Alert.alert(
        'Nombre requerido',
        MESSAGES.REQUIRED_FIELDS || 'Completá el nombre del outfit.'
      );
      return;
    }

    if (!isComplete) {
      Alert.alert(
        'Outfit incompleto',
        'Seleccioná una prenda superior, una inferior y un calzado.'
      );
      return;
    }

    if (!user?.id) {
      Alert.alert(
        'Error',
        'No se encontró el usuario actual.'
      );
      return;
    }

    try {
      setSaving(true);

      // ------------------------------------------------------
      // ESTRUCTURA EXACTA QUE ESPERA database.js
      //
      // {
      //   superior: clothingId,
      //   inferior: clothingId,
      //   calzado: clothingId,
      //   accesorios: [clothingId, ...]
      // }
      // ------------------------------------------------------

      const items = {
        superior: selectedUpper.id,
        inferior: selectedLower.id,
        calzado: selectedShoes.id,
        accesorios: selectedAccessories.map(
          (item) => item.id
        ),
      };

      const result = await addOutfit({
        userId: user.id,
        name: outfitName.trim(),
        description: description.trim(),
        items,
      });

      if (!result?.success) {
        throw new Error(result?.message || 'OUTFIT_ERROR');
      }

      Alert.alert(
        'Outfit creado',
        MESSAGES.OUTFIT_CREATED,
        [
          {
            text: 'Aceptar',
            onPress: () => {
              if (navigation?.goBack) {
                navigation.goBack();
              }
            },
          },
        ]
      );
    } catch (error) {
      console.log('Error creando outfit:', error);

      Alert.alert(
        'Error',
        MESSAGES.OUTFIT_ERROR ||
          'No se pudo crear el outfit.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // CANCELAR
  // ==========================================================

  const handleCancel = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  // ==========================================================
  // TARJETA DE PRENDA OBLIGATORIA
  // ==========================================================

  const renderRequiredCard = ({
    title,
    item,
    icon,
    selectorType: type,
  }) => {
    return (
      <View style={styles.clothingCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name={icon}
                size={18}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.cardTitle}>
              {title} <Text style={styles.requiredText}>(obligatorio)</Text>
            </Text>
          </View>

          <View
            style={[
              styles.statusCircle,
              !item && styles.statusCircleIncomplete,
            ]}
          >
            <Ionicons
              name={item ? 'checkmark' : 'close'}
              size={13}
              color="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.cardContent}>
          {item ? (
            <>
              {renderClothingImage(item, styles.cardImage)}

              <View style={styles.cardInfo}>
                <Text
                  style={styles.itemTitle}
                  numberOfLines={1}
                >
                  {item.title || 'Prenda'}
                </Text>

                <Text
                  style={styles.itemColor}
                  numberOfLines={1}
                >
                  {getColor(item)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => openSelector(type)}
              >
                <Text style={styles.changeButtonText}>
                  Cambiar
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.emptyClothingImage}>
                <Ionicons
                  name="shirt-outline"
                  size={32}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.emptyTitle}>
                  Sin prenda seleccionada
                </Text>

                <Text style={styles.itemColor}>
                  Agregá una prenda
                </Text>
              </View>

              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => openSelector(type)}
              >
                <Text style={styles.changeButtonText}>
                  Seleccionar
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  // ==========================================================
  // ACCESORIOS
  // ==========================================================

  const renderAccessories = () => {
    return (
      <View style={styles.accessoriesCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="bag-handle-outline"
                size={18}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.cardTitle}>
              Accesorios{' '}
              <Text style={styles.requiredText}>(opcional)</Text>
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.accessoriesContent}
        >
          {selectedAccessories.map((item) => (
            <View
              key={String(item.id)}
              style={styles.accessoryItem}
            >
              <View style={styles.accessoryImageWrapper}>
                {renderClothingImage(
                  item,
                  styles.accessoryImage
                )}

                <TouchableOpacity
                  style={styles.removeAccessory}
                  onPress={() => removeAccessory(item.id)}
                >
                  <Ionicons
                    name="close"
                    size={12}
                    color="#8B7A94"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.accessoryInfo}>
                <Text
                  style={styles.accessoryName}
                  numberOfLines={1}
                >
                  {item.title || 'Accesorio'}
                </Text>

                <Text
                  style={styles.accessoryColor}
                  numberOfLines={1}
                >
                  {getColor(item)}
                </Text>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addAccessoryButton}
            onPress={() => openSelector('accessory')}
          >
            <Ionicons
              name="add"
              size={28}
              color={COLORS.primary}
            />

            <Text style={styles.addAccessoryText}>
              Agregar
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  // ==========================================================
  // PREVIEW
  // ==========================================================

  const renderPreview = () => {
    const previewItems = [
      selectedUpper,
      selectedLower,
      selectedShoes,
      ...selectedAccessories,
    ].filter(Boolean);

    return (
      <View style={styles.previewSection}>
        <Text style={styles.sectionTitle}>
          Vista previa del outfit
        </Text>

        <View style={styles.previewCard}>
          {previewItems.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.previewContent}
            >
              {previewItems.map((item, index) => (
                <View
                  key={`${item.id}-${index}`}
                  style={styles.previewItem}
                >
                  {renderClothingImage(
                    item,
                    styles.previewImage
                  )}
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyPreview}>
              <Ionicons
                name="shirt-outline"
                size={42}
                color="#C7B8D1"
              />

              <Text style={styles.emptyPreviewText}>
                Seleccioná prendas para ver el outfit
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ==========================================================
  // SELECTOR MODAL
  // ==========================================================

  const renderSelectorModal = () => {
    const items = getSelectorItems();

    let selectorTitle = 'Seleccionar prenda';

    if (selectorType === 'upper') {
      selectorTitle = 'Seleccionar superior';
    }

    if (selectorType === 'lower') {
      selectorTitle = 'Seleccionar inferior';
    }

    if (selectorType === 'shoes') {
      selectorTitle = 'Seleccionar calzado';
    }

    if (selectorType === 'accessory') {
      selectorTitle = 'Agregar accesorio';
    }

    return (
      <Modal
        visible={selectorVisible}
        transparent
        animationType="slide"
        onRequestClose={closeSelector}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.selectorModal,
              isDesktop && styles.selectorModalDesktop,
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectorTitle}
              </Text>

              <TouchableOpacity
                style={styles.modalClose}
                onPress={closeSelector}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={COLORS.textDark}
                />
              </TouchableOpacity>
            </View>

            {items.length === 0 ? (
              <View style={styles.noItemsContainer}>
                <Ionicons
                  name="shirt-outline"
                  size={46}
                  color={COLORS.primary}
                />

                <Text style={styles.noItemsTitle}>
                  No hay prendas disponibles
                </Text>

                <Text style={styles.noItemsText}>
                  Agregá prendas a tu armario para poder
                  utilizarlas en un outfit.
                </Text>

                <TouchableOpacity
                  style={styles.modalAddButton}
                  onPress={() => {
                    closeSelector();

                    navigation?.navigate?.(
                      'AddClothing',
                      { user }
                    );
                  }}
                >
                  <Text style={styles.modalAddButtonText}>
                    Agregar prenda
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.selectorList}
              >
                {items.map((item) => {
                  const isAlreadySelected =
                    selectedAccessories.some(
                      (accessory) =>
                        accessory.id === item.id
                    );

                  return (
                    <TouchableOpacity
                      key={String(item.id)}
                      style={[
                        styles.selectorItem,
                        isAlreadySelected &&
                          styles.selectorItemSelected,
                      ]}
                      onPress={() =>
                        handleSelectClothing(item)
                      }
                    >
                      {renderClothingImage(
                        item,
                        styles.selectorImage
                      )}

                      <View style={styles.selectorInfo}>
                        <Text
                          style={styles.selectorItemTitle}
                          numberOfLines={1}
                        >
                          {item.title || 'Prenda'}
                        </Text>

                        <Text style={styles.selectorItemColor}>
                          {getColor(item)}
                        </Text>

                        <Text style={styles.selectorItemCategory}>
                          {item.category || 'Sin categoría'}
                        </Text>
                      </View>

                      {isAlreadySelected ? (
                        <View style={styles.selectedCheck}>
                          <Ionicons
                            name="checkmark"
                            size={17}
                            color="#FFFFFF"
                          />
                        </View>
                      ) : (
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#B8A9C2"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text style={styles.loadingText}>
          Cargando tu armario...
        </Text>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.mainLayout,
            isDesktop && styles.mainLayoutDesktop,
          ]}
        >
          {/* ==================================================
              COLUMNA IZQUIERDA
          ================================================== */}

          <View
            style={[
              styles.leftColumn,
              isDesktop && styles.leftColumnDesktop,
            ]}
          >
            {/* NOMBRE */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                Nombre del outfit
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="shirt-outline"
                  size={19}
                  color={COLORS.primary}
                />

                <TextInput
                  value={outfitName}
                  onChangeText={(text) => {
                    if (text.length <= 60) {
                      setOutfitName(text);
                    }
                  }}
                  placeholder="Ej. Look casual de oficina"
                  placeholderTextColor="#A99AAF"
                  style={styles.textInput}
                  maxLength={60}
                />
              </View>
            </View>

            {/* DESCRIPCIÓN */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                Descripción (opcional)
              </Text>

              <View style={styles.descriptionContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={COLORS.primary}
                  style={styles.descriptionIcon}
                />

                <TextInput
                  value={description}
                  onChangeText={(text) => {
                    if (text.length <= 150) {
                      setDescription(text);
                    }
                  }}
                  placeholder="Escribí una descripción..."
                  placeholderTextColor="#A99AAF"
                  style={styles.descriptionInput}
                  multiline
                  textAlignVertical="top"
                  maxLength={150}
                />

                <Text style={styles.counterText}>
                  {description.length}/150
                </Text>
              </View>
            </View>

            {/* SUPERIOR */}
            {renderRequiredCard({
              title: 'Superior',
              item: selectedUpper,
              icon: 'tshirt-crew-outline',
              selectorType: 'upper',
            })}

            {/* INFERIOR */}
            {renderRequiredCard({
              title: 'Inferior',
              item: selectedLower,
              icon: 'human-male',
              selectorType: 'lower',
            })}

            {/* CALZADO */}
            {renderRequiredCard({
              title: 'Calzado',
              item: selectedShoes,
              icon: 'shoe-sneaker',
              selectorType: 'shoes',
            })}

            {/* ACCESORIOS */}
            {renderAccessories()}
          </View>

          {/* ==================================================
              COLUMNA DERECHA / PREVIEW
          ================================================== */}

          <View
            style={[
              styles.rightColumn,
              isDesktop && styles.rightColumnDesktop,
            ]}
          >
            {/* PROGRESO */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBadge}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={COLORS.buttonDark}
                />

                <Text style={styles.progressText}>
                  {completedRequired} / {totalRequired}{' '}
                  completadas
                </Text>
              </View>

              <Text style={styles.progressSubtext}>
                Prendas obligatorias
              </Text>
            </View>

            {renderPreview()}

            {/* BOTONES */}
            <View
              style={[
                styles.actionButtons,
                !isDesktop && styles.actionButtonsMobile,
              ]}
            >
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!isComplete || !outfitName.trim()) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={handleSaveOutfit}
                disabled={
                  saving ||
                  !isComplete ||
                  !outfitName.trim()
                }
              >
                {saving ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Text style={styles.saveButtonText}>
                    Guardar outfit
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {renderSelectorModal()}
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

  container: {
    flex: 1,
    backgroundColor: '#FAF8FC',
  },

  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 18,
    paddingBottom: 30,
  },

  scrollContentDesktop: {
    paddingHorizontal: 44,
    paddingTop: 34,
    paddingBottom: 40,
  },

  mainLayout: {
    width: '100%',
  },

  mainLayoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 45,
  },

  leftColumn: {
    width: '100%',
  },

  leftColumnDesktop: {
    flex: 1,
    maxWidth: 710,
  },

  rightColumn: {
    width: '100%',
    marginTop: 24,
  },

  rightColumnDesktop: {
    flex: 0.9,
    marginTop: 125,
    minWidth: 440,
  },

  // ==========================================================
  // INPUTS
  // ==========================================================

  inputSection: {
    marginBottom: 17,
  },

  inputLabel: {
    fontSize: 14,
    color: COLORS.textDark,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 8,
  },

  inputContainer: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: '#E8DFF0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },

  textInput: {
    flex: 1,
    marginLeft: 11,
    fontSize: 14,
    color: COLORS.textDark,
    fontFamily: 'Poppins_400Regular',
    paddingVertical: 8,
  },

  descriptionContainer: {
    minHeight: 100,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: '#E8DFF0',
    paddingHorizontal: 15,
    paddingTop: 13,
    position: 'relative',
  },

  descriptionIcon: {
    position: 'absolute',
    left: 15,
    top: 14,
  },

  descriptionInput: {
    minHeight: 70,
    paddingLeft: 30,
    paddingRight: 5,
    paddingTop: 0,
    fontSize: 14,
    color: COLORS.textDark,
    fontFamily: 'Poppins_400Regular',
  },

  counterText: {
    position: 'absolute',
    right: 14,
    bottom: 8,
    fontSize: 11,
    color: COLORS.textLight,
    fontFamily: 'Poppins_400Regular',
  },

  // ==========================================================
  // TARJETAS
  // ==========================================================

  clothingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EEE7F2',
    padding: 14,
    marginBottom: 14,
    shadowColor: '#5E486D',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  accessoriesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EEE7F2',
    padding: 14,
    marginBottom: 14,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F6EAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  cardTitle: {
    fontSize: 14,
    color: COLORS.textDark,
    fontFamily: 'Poppins_600SemiBold',
  },

  requiredText: {
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
  },

  statusCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#67D58B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusCircleIncomplete: {
    backgroundColor: '#B8A9C2',
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
  },

  cardImage: {
    width: 82,
    height: 72,
  },

  clothingImage: {
    backgroundColor: '#F8F5FA',
    borderRadius: 9,
  },

  imagePlaceholder: {
    backgroundColor: '#F8F5FA',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyClothingImage: {
    width: 82,
    height: 72,
    borderRadius: 9,
    backgroundColor: '#F8F5FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardInfo: {
    flex: 1,
    marginHorizontal: 13,
  },

  itemTitle: {
    fontSize: 14,
    color: COLORS.textDark,
    fontFamily: 'Poppins_600SemiBold',
  },

  itemColor: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.textLight,
    fontFamily: 'Poppins_400Regular',
  },

  emptyTitle: {
    fontSize: 13,
    color: COLORS.textDark,
    fontFamily: 'Poppins_500Medium',
  },

  changeButton: {
    minWidth: 90,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },

  changeButtonText: {
    fontSize: 12,
    color: COLORS.buttonDark,
    fontFamily: 'Poppins_600SemiBold',
  },

  // ==========================================================
  // ACCESORIOS
  // ==========================================================

  accessoriesContent: {
    alignItems: 'center',
    paddingTop: 2,
    paddingBottom: 4,
  },

  accessoryItem: {
    width: 125,
    marginRight: 12,
  },

  accessoryImageWrapper: {
    position: 'relative',
    width: 80,
    height: 70,
  },

  accessoryImage: {
    width: 80,
    height: 70,
  },

  removeAccessory: {
    position: 'absolute',
    right: -8,
    top: -7,
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9CFDF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  accessoryInfo: {
    marginTop: 5,
  },

  accessoryName: {
    fontSize: 12,
    color: COLORS.textDark,
    fontFamily: 'Poppins_600SemiBold',
  },

  accessoryColor: {
    fontSize: 10,
    color: COLORS.textLight,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },

  addAccessoryButton: {
    width: 105,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addAccessoryText: {
    fontSize: 11,
    color: COLORS.buttonDark,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 1,
  },

  // ==========================================================
  // PROGRESO
  // ==========================================================

  progressContainer: {
    alignItems: 'flex-end',
    marginBottom: 105,
  },

  progressBadge: {
    backgroundColor: '#F2E8FC',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },

  progressText: {
    marginLeft: 7,
    fontSize: 14,
    color: COLORS.buttonDark,
    fontFamily: 'Poppins_600SemiBold',
  },

  progressSubtext: {
    marginTop: 7,
    marginRight: 5,
    color: '#9B8AA5',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },

  // ==========================================================
  // PREVIEW
  // ==========================================================

  previewSection: {
    width: '100%',
  },

  sectionTitle: {
    fontSize: 15,
    color: COLORS.textDark,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 12,
  },

  previewCard: {
    width: '100%',
    minHeight: 175,
    borderRadius: 16,
    backgroundColor: '#F8F5FA',
    borderWidth: 1,
    borderColor: '#EAE2EF',
    justifyContent: 'center',
  },

  previewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },

  previewItem: {
    width: 105,
    height: 135,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },

  previewImage: {
    width: 105,
    height: 135,
  },

  emptyPreview: {
    flex: 1,
    minHeight: 175,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },

  emptyPreviewText: {
    marginTop: 9,
    textAlign: 'center',
    fontSize: 12,
    color: '#9B8AA5',
    fontFamily: 'Poppins_400Regular',
  },

  // ==========================================================
  // BOTONES
  // ==========================================================

  actionButtons: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 22,
  },

  actionButtonsMobile: {
    marginBottom: 10,
  },

  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  cancelButtonText: {
    color: COLORS.buttonDark,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },

  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    backgroundColor: COLORS.buttonDark,
    justifyContent: 'center',
    alignItems: 'center',
  },

  saveButtonDisabled: {
    opacity: 0.45,
  },

  saveButtonText: {
    color: '#FFFFFF',
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
    fontSize: 13,
    color: COLORS.textLight,
    fontFamily: 'Poppins_400Regular',
  },

  // ==========================================================
  // MODAL
  // ==========================================================

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 30, 55, 0.35)',
    justifyContent: 'flex-end',
  },

  selectorModal: {
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 25,
  },

  selectorModalDesktop: {
    width: 550,
    maxHeight: '80%',
    alignSelf: 'center',
    borderRadius: 20,
    marginBottom: 40,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAF3',
  },

  modalTitle: {
    fontSize: 17,
    color: COLORS.textDark,
    fontFamily: 'Poppins_600SemiBold',
  },

  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7F2FA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  selectorList: {
    paddingTop: 12,
    paddingBottom: 15,
  },

  selectorItem: {
    minHeight: 82,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#EEE7F2',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
  },

  selectorItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FBF6FE',
  },

  selectorImage: {
    width: 70,
    height: 62,
    borderRadius: 8,
  },

  selectorInfo: {
    flex: 1,
    marginHorizontal: 12,
  },

  selectorItemTitle: {
    fontSize: 13,
    color: COLORS.textDark,
    fontFamily: 'Poppins_600SemiBold',
  },

  selectorItemColor: {
    fontSize: 11,
    color: COLORS.textLight,
    fontFamily: 'Poppins_400Regular',
    marginTop: 3,
  },

  selectorItemCategory: {
    fontSize: 10,
    color: '#A89AAF',
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },

  selectedCheck: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#67D58B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  noItemsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 45,
    paddingHorizontal: 30,
  },

  noItemsTitle: {
    marginTop: 14,
    fontSize: 16,
    color: COLORS.textDark,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },

  noItemsText: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textLight,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },

  modalAddButton: {
    marginTop: 20,
    minWidth: 150,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.buttonDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  modalAddButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
});