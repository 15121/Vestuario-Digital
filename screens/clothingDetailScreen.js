import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  useWindowDimensions,
} from 'react-native';
 
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colours';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { deleteClothingItem } from '../services/database';
 
// ============================================================
// PANTALLA DETALLE DE PRENDA
// ============================================================
 
export default function ClothingDetailScreen({ navigation, route }) {
 
  // ----------------------------------------------------------
  // DATOS DE LA PRENDA (recibidos por navegación)
  // ----------------------------------------------------------
  // Se espera un objeto "prenda" con esta forma:
  // {
  //   id, title, category, color, season, ocasion,
  //   description, createdAt, images: [uri1, uri2, uri3]
  // }
 
  const prenda = route?.params?.prenda || {
    id: null,
    title: 'Remera blanca básica',
    category: 'Remera',
    color: 'Blanco',
    season: 'Verano',
    ocasion: 'Casual',
    description: 'Remera básica de algodón, ideal para uso diario.',
    createdAt: '15/07/2026',
    images: [],
  };
 
  const images = prenda.images && prenda.images.length > 0
    ? prenda.images
    : [null]; // null = sin imagen real (placeholder)
 
  // ----------------------------------------------------------
  // ESTADO DEL CARRUSEL DE IMÁGENES
  // ----------------------------------------------------------
 
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryWidth, setGalleryWidth] = useState(0);
 
  const handleScrollEnd = (event) => {
    if (galleryWidth === 0) return;
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / galleryWidth);
    setCurrentImageIndex(index);
  };
 
  // ----------------------------------------------------------
  // DETECCIÓN DE DISPOSITIVO
  // ----------------------------------------------------------
 
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
 
  // ----------------------------------------------------------
  // NAVEGACIÓN
  // ----------------------------------------------------------
 
  const handleGoBack = () => {
    navigation?.goBack();
  };
 
  const handleEdit = () => {
    // La pantalla de edición todavía no existe en el proyecto.
    // Se deja preparada la navegación para cuando se desarrolle.
    try {
      navigation.navigate('EditarPrenda', { prenda });
    } catch (e) {
      Alert.alert('Próximamente', 'La edición de prendas se implementará más adelante.');
    }
  };
 
  // ----------------------------------------------------------
  // ELIMINAR PRENDA
  // ----------------------------------------------------------
 
  const handleDelete = () => {
    Alert.alert(
      'Eliminar prenda',
      `¿Seguro que querés eliminar "${prenda.title}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteClothingItem(prenda.id);
              if (result.success) {
                navigation?.goBack();
              } else {
                Alert.alert('Error', 'No fue posible eliminar la prenda.');
              }
            } catch (error) {
              Alert.alert('Error', 'No fue posible eliminar la prenda.');
            }
          },
        },
      ]
    );
  };
 
  // ----------------------------------------------------------
  // FILAS DE INFORMACIÓN (icono + etiqueta + valor)
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
    <ResponsiveContainer>
      <View style={styles.container}>
 
        {/* ==================================================
            BARRA SUPERIOR
            ================================================== */}
 
        <View style={[styles.topBar, isDesktop && styles.desktopTopBar]}>
          {!isDesktop && (
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={[styles.topBarTitle, !isDesktop && styles.topBarTitleMobile]}>
            Detalle de prenda
          </Text>
        </View>
 
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.mainContent, isDesktop && styles.desktopContent]}>
 
            {/* ===============================================
                COLUMNA IZQUIERDA: GALERÍA DE IMÁGENES + TÍTULO
                =============================================== */}
 
            <View style={[styles.leftColumn, isDesktop && styles.desktopLeftColumn]}>
 
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
                        <Image source={{ uri: imgUri }} style={styles.image} resizeMode="cover" />
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
 
              {!isDesktop && (
                <Text style={styles.titleMobile}>{prenda.title}</Text>
              )}
 
              {isDesktop && (
                <>
                  <Text style={styles.titleDesktop}>{prenda.title}</Text>
 
                  <View style={styles.desktopButtonRow}>
                    <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                      <Ionicons name="pencil-outline" size={18} color={COLORS.buttonDark} />
                      <Text style={styles.editButtonText}>Editar</Text>
                    </TouchableOpacity>
 
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                      <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.deleteButtonText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
 
            {/* ===============================================
                COLUMNA DERECHA: TARJETA DE DATOS
                =============================================== */}
 
            <View style={[styles.rightColumn, isDesktop && styles.desktopRightColumn]}>
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
 
              {!isDesktop && (
                <View style={styles.mobileButtonRow}>
                  <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                    <Ionicons name="pencil-outline" size={16} color={COLORS.buttonDark} />
                    <Text style={styles.editButtonText}>Editar</Text>
                  </TouchableOpacity>
 
                  <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
 
          </View>
 
          {/* ==================================================
              BOTÓN VOLVER
              ================================================== */}
 
          <TouchableOpacity
            style={[styles.backLinkButton, isDesktop && styles.desktopBackLinkButton]}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
            <Text style={styles.backLinkText}>Volver</Text>
          </TouchableOpacity>
 
        </ScrollView>
      </View>
    </ResponsiveContainer>
  );
}
 
// ============================================================
// ESTILOS
// ============================================================
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    backgroundColor: COLORS.primary,
    height: 85,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  desktopTopBar: {
    height: 70,
    paddingHorizontal: 32,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
  },
  topBarTitleMobile: {
    marginTop: 18,
    marginRight: 36, // compensa el ancho del botón de volver para centrar el texto
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  mainContent: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  desktopContent: {
    flexDirection: 'row',
    paddingHorizontal: '5%',
    paddingTop: 32,
    gap: 32,
  },
 
  // ----------------------------------------------------------
  // COLUMNA IZQUIERDA / GALERÍA
  // ----------------------------------------------------------
 
  leftColumn: {
    width: '100%',
  },
  desktopLeftColumn: {
    width: '48%',
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
  titleMobile: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.textDark,
    marginTop: 14,
    marginBottom: 4,
  },
  titleDesktop: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.textDark,
    marginTop: 20,
    marginBottom: 16,
  },
  desktopButtonRow: {
    flexDirection: 'row',
    gap: 16,
  },
 
  // ----------------------------------------------------------
  // COLUMNA DERECHA / TARJETA DE DATOS
  // ----------------------------------------------------------
 
  rightColumn: {
    width: '100%',
    marginTop: 12,
  },
  desktopRightColumn: {
    width: '52%',
    marginTop: 0,
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
 
  // ----------------------------------------------------------
  // BOTONES EDITAR / ELIMINAR
  // ----------------------------------------------------------
 
  mobileButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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
 
  // ----------------------------------------------------------
  // BOTÓN VOLVER
  // ----------------------------------------------------------
 
  backLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4D9F5',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    gap: 8,
  },
  desktopBackLinkButton: {
    marginHorizontal: '5%',
  },
  backLinkText: {
    color: COLORS.primary,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
});