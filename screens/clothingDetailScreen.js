import React, { useEffect, useState } from 'react';
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

import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colours';
import ResponsiveContainer from '../components/ResponsiveContainer';
import {
  deleteClothingItem,
  getClothingItemById,
} from '../services/database';
import { OutfitScreenLayout } from '../navigation/MainTabNavigator';

// ============================================================
// PANTALLA DETALLE DE PRENDA
// ============================================================

export default function ClothingDetailScreen({ navigation, route }) {

  const user = route?.params?.user || {};
  const clothingId = route?.params?.clothingId;

  const [prenda, setPrenda] = useState(route?.params?.prenda || null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryWidth, setGalleryWidth] = useState(0);

  // ----------------------------------------------------------
  // CARGAR PRENDA SI SOLO LLEGÓ EL ID (evita crash)
  // ----------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    const loadItem = async () => {
      if (prenda || !clothingId) return;

      try {
        const result = await getClothingItemById(clothingId);
        if (mounted && result) {
          setPrenda(result);
        }
      } catch (error) {
        console.log('Error al cargar la prenda:', error);
      }
    };

    loadItem();

    return () => {
      mounted = false;
    };
  }, [clothingId, prenda]);

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

  const images = Array.isArray(prenda.images) && prenda.images.length > 0
    ? prenda.images
    : prenda.imageUri
      ? [prenda.imageUri]
      : [null];

  // ----------------------------------------------------------
  // CARRUSEL DE IMÁGENES
  // ----------------------------------------------------------

  const handleScrollEnd = (event) => {
    if (galleryWidth === 0) return;
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / galleryWidth);
    setCurrentImageIndex(index);
  };

  // ----------------------------------------------------------
  // NAVEGACIÓN
  // ----------------------------------------------------------

  const handleEdit = () => {
    navigation.navigate('EditarPrenda', { prenda });
  };

  // ----------------------------------------------------------
  // ELIMINAR PRENDA
  // ----------------------------------------------------------

  const handleDelete = () => {
    const deleteItem = async () => {
      try {
        if (prenda?.id === null || prenda?.id === undefined) {
          if (Platform.OS === 'web') {
            window.alert('No se encontró el ID de la prenda.');
          } else {
            Alert.alert('Error', 'No se encontró el ID de la prenda.');
          }
          return;
        }

        const result = await deleteClothingItem(prenda.id);

        if (result?.success) {
          navigation?.goBack();
          return;
        }

        if (Platform.OS === 'web') {
          window.alert('No fue posible eliminar la prenda.');
        } else {
          Alert.alert('Error', 'No fue posible eliminar la prenda.');
        }
      } catch (error) {
        console.error('Error eliminando prenda:', error);

        if (Platform.OS === 'web') {
          window.alert('No fue posible eliminar la prenda.');
        } else {
          Alert.alert('Error', 'No fue posible eliminar la prenda.');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `¿Seguro que querés eliminar "${prenda.title}"? Esta acción no se puede deshacer.`
      );
      if (confirmed) deleteItem();
      return;
    }

    Alert.alert(
      'Eliminar prenda',
      `¿Seguro que querés eliminar "${prenda.title}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: deleteItem },
      ]
    );
  };

  // ----------------------------------------------------------
  // FILAS DE INFORMACIÓN
  // ----------------------------------------------------------

  const infoRows = [
    { icon: 'shirt-outline', label: 'Categoría', value: prenda.category },
    { icon: 'color-palette-outline', label: 'Color', value: prenda.color },
    { icon: 'sunny-outline', label: 'Temporada', value: prenda.season },
    { icon: 'sparkles-outline', label: 'Ocasión', value: prenda.ocasion },
    { icon: 'document-text-outline', label: 'Descripción', value: prenda.description },
    { icon: 'calendar-outline', label: 'Fecha de creación', value: prenda.createdAt },
  ];

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

            {/* GALERÍA + TÍTULO */}
            <View style={styles.leftColumn}>

              <View
                style={styles.galleryContainer}
                onLayout={(e) => setGalleryWidth(e.nativeEvent.layout.width)}
              >
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={handleScrollEnd}
                >
                  {images.map((imgUri, index) => (
                    <View key={index} style={[styles.imageSlide, { width: galleryWidth || '100%' }]}>
                      {imgUri ? (
                        <Image source={{ uri: imgUri }} style={styles.image} resizeMode="contain" />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Ionicons name="shirt-outline" size={64} color={COLORS.icon} />
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>

                {images.length > 1 && (
                  <View style={styles.imageCounter}>
                    <Text style={styles.imageCounterText}>
                      {currentImageIndex + 1}/{images.length}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.title}>{prenda.title}</Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                  <Ionicons name="pencil-outline" size={18} color={COLORS.buttonDark} />
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* TARJETA DE DATOS */}
            <View style={styles.rightColumn}>
              <View style={styles.infoCard}>
                {infoRows.map((row, index) => (
                  <View
                    key={row.label}
                    style={[
                      styles.infoRow,
                      index === infoRows.length - 1 && styles.infoRowLast,
                    ]}
                  >
                    <View style={styles.infoLabelContainer}>
                      <View style={styles.infoIconCircle}>
                        <Ionicons name={row.icon} size={16} color={COLORS.icon} />
                      </View>
                      <Text style={styles.infoLabel}>{row.label}</Text>
                    </View>
                    <Text style={styles.infoValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </View>

          </View>

          <TouchableOpacity style={styles.backLinkButton} onPress={handleGoBack}>
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
  galleryContainer: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F1EDF7',
  },
  imageSlide: {
    height: '100%',
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
  imageCounter: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
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
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAF8',
  },
  infoRowLast: {
    borderBottomWidth: 0,
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
  infoValue: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
    textAlign: 'right',
    flexShrink: 1,
    maxWidth: '55%',
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