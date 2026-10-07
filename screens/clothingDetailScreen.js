import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { formatDateOnly } from '../utils/dateUtils';
import { getColorHex } from '../utils/colorutils';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colours';
import ResponsiveContainer from '../components/ResponsiveContainer';
import {
  deleteClothingItem,
  getClothingItemById,
  getClothingUsage,
} from '../services/database';
import { OutfitScreenLayout } from '../navigation/MainTabNavigator';

// ============================================================
// HELPERS
// ============================================================

// La prenda puede llegar desde la lista (images[]) o desde la base (imageUri).
const getImageUri = (item) =>
  item?.imageUri ||
  (Array.isArray(item?.images) && item.images.length > 0
    ? item.images[0]
    : null);

// Devuelve el texto limpio o null si está vacío
const cleanText = (value) => {
  const text = String(value ?? '').trim();
  return text || null;
};

const pluralize = (count, singular, plural) =>
  `${count} ${count === 1 ? singular : plural}`;

// ============================================================
// PANTALLA DETALLE DE PRENDA
// ============================================================

export default function ClothingDetailScreen({ navigation, route }) {
  const user = route?.params?.user || {};
  const clothingId = route?.params?.clothingId;

  const [prenda, setPrenda] = useState(route?.params?.prenda || null);
  const [deleting, setDeleting] = useState(false);

  // Si llegan parámetros nuevos (por ejemplo, después de editar),
  // actualizamos la prenda que se muestra.
  useEffect(() => {
    if (route?.params?.prenda) {
      setPrenda(route.params.prenda);
    }
  }, [route?.params?.prenda]);

  // ----------------------------------------------------------
  // RECARGAR LA PRENDA CADA VEZ QUE LA PANTALLA TOMA FOCO
  // También sirve cuando solo llegó el id (evita crash).
  // ----------------------------------------------------------

  useFocusEffect(
    useCallback(() => {
      const id = prenda?.id ?? clothingId;

      if (id === null || id === undefined) {
        return undefined;
      }

      let active = true;

      (async () => {
        try {
          const fresh = await getClothingItemById(id);

          if (active && fresh) {
            setPrenda((previous) => ({ ...previous, ...fresh }));
          }
        } catch (error) {
          // Si falla (red / sesión vencida) se conserva lo que ya se ve.
          console.log('Error al recargar la prenda:', error);
        }
      })();

      return () => {
        active = false;
      };
    }, [prenda?.id, clothingId])
  );

  const handleGoBack = () => {
    navigation?.goBack();
  };

  if (!prenda) {
    return (
      <OutfitScreenLayout
        title="Detalle de prenda"
        navigation={navigation}
        user={user}
        activeTab="Prendas"
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando prenda...</Text>
        </View>
      </OutfitScreenLayout>
    );
  }

  const imageUri = getImageUri(prenda);

  // ----------------------------------------------------------
  // NAVEGACIÓN
  // ----------------------------------------------------------

  const handleEdit = () => {
    navigation.navigate('EditarPrenda', { prenda, user });
  };

  // ----------------------------------------------------------
  // ELIMINAR PRENDA
  // ----------------------------------------------------------

  const showError = (message) => {
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert('Error', message);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;

    if (prenda?.id === null || prenda?.id === undefined) {
      showError('No se encontró el ID de la prenda.');
      return;
    }

    // Aviso: en cuántos outfits / maletas se usa la prenda
    let usageText = '';

    try {
      const usage = await getClothingUsage(prenda.id);
      const parts = [];

      if (usage?.outfitCount > 0) {
        parts.push(pluralize(usage.outfitCount, 'outfit', 'outfits'));
      }

      if (usage?.suitcaseCount > 0) {
        parts.push(pluralize(usage.suitcaseCount, 'maleta', 'maletas'));
      }

      if (parts.length > 0) {
        usageText = `\n\nEsta prenda está en ${parts.join(
          ' y '
        )}. También se va a quitar de ahí.`;
      }
    } catch (error) {
      console.log('No se pudo consultar el uso de la prenda:', error);
    }

    const message = `¿Seguro que querés eliminar "${prenda.title}"? Esta acción no se puede deshacer.${usageText}`;

    const deleteItem = async () => {
      try {
        setDeleting(true);

        const result = await deleteClothingItem(prenda.id);

        if (result?.success) {
          navigation?.goBack();
          return;
        }

        showError('No fue posible eliminar la prenda.');
      } catch (error) {
        console.error('Error eliminando prenda:', error);
        showError('No fue posible eliminar la prenda.');
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        deleteItem();
      }
      return;
    }

    Alert.alert('Eliminar prenda', message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: deleteItem },
    ]);
  };

  // ----------------------------------------------------------
  // FILAS DE INFORMACIÓN
  // (la descripción va aparte, en un bloque de ancho completo)
  // ----------------------------------------------------------

  const colorName = cleanText(prenda.color);

  const infoRows = [
    {
      icon: 'shirt-outline',
      label: 'Categoría',
      value: cleanText(prenda.category),
    },
    {
      icon: 'color-palette-outline',
      label: 'Color',
      value: colorName,
      colorHex: colorName ? getColorHex(colorName) : null,
    },
    {
      icon: 'sunny-outline',
      label: 'Temporada',
      value: cleanText(prenda.season),
    },
    {
      icon: 'sparkles-outline',
      label: 'Ocasión',
      value: cleanText(prenda.ocasion),
    },
    {
      icon: 'calendar-outline',
      label: 'Fecha de creación',
      value: cleanText(formatDateOnly(prenda.createdAt)),
    },
  ];

  const description = cleanText(prenda.description);

  // ==========================================================
  // INTERFAZ
  // ==========================================================

  return (
    <OutfitScreenLayout
      title="Detalle de prenda"
      navigation={navigation}
      user={user}
      activeTab="Prendas"
    >
      <ResponsiveContainer>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainContent}>

            {/* IMAGEN + TÍTULO */}
            <View style={styles.leftColumn}>

              <View style={styles.imageContainer}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons
                      name="shirt-outline"
                      size={64}
                      color={COLORS.icon}
                    />
                  </View>
                )}
              </View>

              <Text style={styles.title}>{prenda.title}</Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEdit}
                  disabled={deleting}
                >
                  <Ionicons
                    name="pencil-outline"
                    size={18}
                    color={COLORS.buttonDark}
                  />
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    deleting && styles.buttonDisabled,
                  ]}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.deleteButtonText}>
                    {deleting ? 'Eliminando...' : 'Eliminar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* TARJETA DE DATOS */}
            <View style={styles.rightColumn}>
              <View style={styles.infoCard}>
                {infoRows.map((row) => (
                  <View key={row.label} style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <View style={styles.infoIconCircle}>
                        <Ionicons
                          name={row.icon}
                          size={16}
                          color={COLORS.icon}
                        />
                      </View>
                      <Text style={styles.infoLabel}>{row.label}</Text>
                    </View>

                    <View style={styles.infoValueWrap}>
                      {!!row.colorHex && (
                        <View
                          style={[
                            styles.colorDot,
                            { backgroundColor: row.colorHex },
                          ]}
                        />
                      )}

                      <Text
                        style={[
                          styles.infoValue,
                          !row.value && styles.infoValueEmpty,
                        ]}
                      >
                        {row.value || 'Sin especificar'}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* DESCRIPCIÓN: bloque de ancho completo */}
                <View style={styles.descriptionBlock}>
                  <View style={styles.infoLabelContainer}>
                    <View style={styles.infoIconCircle}>
                      <Ionicons
                        name="document-text-outline"
                        size={16}
                        color={COLORS.icon}
                      />
                    </View>
                    <Text style={styles.infoLabel}>Descripción</Text>
                  </View>

                  <Text
                    style={[
                      styles.descriptionText,
                      !description && styles.infoValueEmpty,
                    ]}
                  >
                    {description || 'Sin descripción'}
                  </Text>
                </View>
              </View>
            </View>

          </View>

          <TouchableOpacity
            style={styles.backLinkButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
            <Text style={styles.backLinkText}>Volver</Text>
          </TouchableOpacity>

        </ScrollView>
      </ResponsiveContainer>
    </OutfitScreenLayout>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  mainContent: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: '5%',
    paddingTop: 24,
    gap: 32,
  },
  leftColumn: {
    width: '100%',
    maxWidth: 480,
    flexGrow: 1,
  },
  imageContainer: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F1EDF7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1EDF7',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.textDark,
    marginTop: 18,
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rightColumn: {
    flexGrow: 1,
    minWidth: 280,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAF8',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 12,
  },
  infoIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0E6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
  },
  infoValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 1,
    maxWidth: '55%',
    gap: 8,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#D7D1DD',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
    textAlign: 'right',
    flexShrink: 1,
  },
  infoValueEmpty: {
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  descriptionBlock: {
    paddingVertical: 16,
  },
  descriptionText: {
    width: '100%',
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textDark,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.buttonDark,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  editButtonText: {
    color: COLORS.buttonDark,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.buttonDark,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  backLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4D9F5',
    backgroundColor: '#FFFFFF',
    marginHorizontal: '5%',
    marginTop: 20,
    gap: 8,
  },
  backLinkText: {
    color: COLORS.primary,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
});