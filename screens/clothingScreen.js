
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  useWindowDimensions,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
 
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colours';
import { getUserClothes, deleteClothingItem } from '../services/database';
 
// ============================================================
// CONFIGURACIÓN DE CATEGORÍAS Y COLORES
// ============================================================
 
const CATEGORY_FILTERS = [
  { key: 'Todas', label: 'Todas' },
  { key: 'Superior', label: 'Superiores' },
  { key: 'Inferior', label: 'Inferiores' },
  { key: 'Calzado', label: 'Calzado' },
  { key: 'Accesorio', label: 'Accesorios' },
];
 
const CATEGORY_ICONS = {
  Superior: 'shirt-outline',
  Inferior: 'body-outline',
  Calzado: 'footsteps-outline',
  Accesorio: 'watch-outline',
};
 
const SEASON_ICONS = {
  Verano: 'sunny-outline',
  Invierno: 'snow-outline',
  Otoño: 'leaf-outline',
  Primavera: 'flower-outline',
};
 
const COLOR_HEX_MAP = {
  Blanco: '#FFFFFF',
  Negro: '#000000',
  Azul: '#3B6FD6',
  Beige: '#D8C3A5',
  Rojo: '#E53935',
  Verde: '#43A047',
  Amarillo: '#FDD835',
  Gris: '#9E9E9E',
  Marrón: '#795548',
  Rosa: '#EC407A',
  Violeta: '#8E44AD',
  Naranja: '#FB8C00',
};
 
// Formatea una fecha ISO a DD/MM/AAAA
const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString; // por si ya viene formateada
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};
 
// ============================================================
// PANTALLA DE PRENDAS
// ============================================================
 
export default function ClothingScreen({ navigation, route }) {
  const user = route?.params?.user;
 
const [clothes, setClothes] = useState([]);
const [loading, setLoading] = useState(true);

const [searchText, setSearchText] = useState('');

const [activeCategory, setActiveCategory] = useState('Todas');

const [sortOrder, setSortOrder] = useState('recientes');
const [sortMenuVisible, setSortMenuVisible] = useState(false);

// ==========================================================
// FILTROS AVANZADOS
// ==========================================================

const [filtersVisible, setFiltersVisible] = useState(false);

const [selectedColor, setSelectedColor] = useState('Todos');
const [selectedSeason, setSelectedSeason] = useState('Todas');
const [selectedOccasion, setSelectedOccasion] = useState('Todas');
 
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  // ==========================================================
// OPCIONES REALES BASADAS EN LAS PRENDAS DEL USUARIO
// ==========================================================

const getUniqueValues = useCallback(
  (field) => {
    return Array.from(
      new Set(
        clothes
          .map((item) =>
            String(item?.[field] || '').trim()
          )
          .filter(Boolean)
      )
    );
  },
  [clothes]
);

const categoryFilters = useMemo(() => {
  const categories = getUniqueValues('category');

  return [
    { key: 'Todas', label: 'Todas' },
    ...categories.map((category) => ({
      key: category,
      label: category,
    })),
  ];
}, [getUniqueValues]);

const seasonOptions = useMemo(() => {
  const seasons = getUniqueValues('season')
    .filter((season) => season !== 'Todas');

  return ['Todas', ...seasons];
}, [getUniqueValues]);

const colorOptions = useMemo(() => {
  return ['Todos', ...getUniqueValues('color')];
}, [getUniqueValues]);

const occasionOptions = useMemo(() => {
  return ['Todas', ...getUniqueValues('ocasion')];
}, [getUniqueValues]);

// Si una categoría deja de existir porque se eliminó
// una prenda, volvemos automáticamente a "Todas".
useEffect(() => {
  if (
    activeCategory !== 'Todas' &&
    !categoryFilters.some(
      (item) => item.key === activeCategory
    )
  ) {
    setActiveCategory('Todas');
  }
}, [activeCategory, categoryFilters]);
 
  // ----------------------------------------------------------
  // CARGA DE PRENDAS (se repite cada vez que la pantalla toma foco,
  // por ejemplo al volver de agregar/editar una prenda)
  // ----------------------------------------------------------
 
  const loadClothes = useCallback(async () => {
    if (!user?.id) {
      setClothes([]);
      setLoading(false);
      return;
    }
 
    setLoading(true);
    try {
      const data = await getUserClothes(user.id);
      setClothes(data || []);
    } catch (error) {
      console.log('Error al cargar prendas:', error);
      setClothes([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);
 
  useFocusEffect(
    useCallback(() => {
      loadClothes();
    }, [loadClothes])
  );
 
  // ----------------------------------------------------------
  // FILTRADO Y ORDEN
  // ----------------------------------------------------------
 
// ==========================================================
// NORMALIZAR TEXTO
// Permite buscar sin importar mayúsculas/minúsculas
// ni diferencias de acentos.
// ==========================================================

const normalizeText = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};


// ==========================================================
// FILTRADO + BÚSQUEDA + ORDEN
// ==========================================================

const filteredClothes = clothes
  .filter((item) => {
    // ------------------------------------------------------
    // CATEGORÍA
    // ------------------------------------------------------

    if (
      activeCategory !== 'Todas' &&
      String(item.category || '').trim() !== activeCategory
    ) {
      return false;
    }

    // ------------------------------------------------------
    // COLOR
    // ------------------------------------------------------

    if (
      selectedColor !== 'Todos' &&
      String(item.color || '').trim() !== selectedColor
    ) {
      return false;
    }

    // ------------------------------------------------------
    // TEMPORADA
    // ------------------------------------------------------

    if (
      selectedSeason !== 'Todas' &&
      String(item.season || '').trim() !== selectedSeason
    ) {
      return false;
    }

    // ------------------------------------------------------
    // OCASIÓN
    // ------------------------------------------------------

    if (
      selectedOccasion !== 'Todas' &&
      String(item.ocasion || '').trim() !== selectedOccasion
    ) {
      return false;
    }

    // ------------------------------------------------------
    // BUSCADOR
    // Busca en TODOS los datos visibles de la prenda.
    // ------------------------------------------------------

    const search = normalizeText(searchText);

    if (!search) {
      return true;
    }

    const searchableText = [
      item.title,
      item.category,
      item.color,
      item.season,
      item.ocasion,
      item.description,
    ]
      .map(normalizeText)
      .join(' ');

    return searchableText.includes(search);
  })
  .slice()
  .sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();

    const safeDateA = Number.isNaN(dateA) ? 0 : dateA;
    const safeDateB = Number.isNaN(dateB) ? 0 : dateB;

    return sortOrder === 'recientes'
      ? safeDateB - safeDateA
      : safeDateA - safeDateB;
  });
 
  // ----------------------------------------------------------
  // ACCIONES POR PRENDA
  // ----------------------------------------------------------
 
  const goToDetail = (item) => {
    try {
      navigation.navigate('ClothingDetail', {
        prenda: {
          id: item.id,
          title: item.title,
          category: item.category,
          color: item.color,
          season: item.season,
          ocasion: item.ocasion,
          description: item.description,
          createdAt: formatDate(item.createdAt),
          images: item.imageUri ? [item.imageUri] : [],
        },
      });
    } catch (e) {
      // Si el nombre de la ruta de detalle es distinto en tu Stack,
      // avisame para ajustarlo.
    }
  };
 
 
 
  const confirmDelete = (item) => {
    Alert.alert(
      'Eliminar prenda',
      `¿Seguro que querés eliminar "${item.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteClothingItem(item.id);
            if (result.success) {
              setClothes((prev) => prev.filter((c) => c.id !== item.id));
            } else {
              Alert.alert('Error', 'No fue posible eliminar la prenda.');
            }
          },
        },
      ]
    );
  };
 
  // ----------------------------------------------------------
  // RENDER DE CADA TARJETA
  // ----------------------------------------------------------
 
  const renderCard = ({ item }) => {
    const colorHex = COLOR_HEX_MAP[item.color] || '#CCCCCC';
    const categoryIcon = CATEGORY_ICONS[item.category] || 'pricetag-outline';
    const seasonIcon = SEASON_ICONS[item.season] || 'calendar-outline';
 
    return (
      <TouchableOpacity
        style={[styles.card, isDesktop && styles.cardDesktop]}
        onPress={() => goToDetail(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardImageWrapper}>
          {item.imageUri ? (
            <Image source={{ uri: item.imageUri }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Ionicons name="shirt-outline" size={28} color={COLORS.icon} />
            </View>
          )}
        </View>
 
        <View style={styles.cardInfo}>
         <View style={styles.cardTitleRow}>
  <Text style={styles.cardTitle} numberOfLines={1}>
    {item.title}
  </Text>
</View>
 
          <View style={styles.cardTagsRow}>
            <View style={styles.cardTag}>
              <Ionicons name={categoryIcon} size={14} color="#8A8A8A" />
              <Text style={styles.cardTagText}>{item.category}</Text>
            </View>
 
            {!!item.color && (
              <View style={styles.cardTag}>
                <View style={[styles.colorDot, { backgroundColor: colorHex }]} />
                <Text style={styles.cardTagText}>{item.color}</Text>
              </View>
            )}
 
            {!!item.season && (
              <View style={styles.cardTag}>
                <Ionicons name={seasonIcon} size={14} color="#8A8A8A" />
                <Text style={styles.cardTagText}>{item.season}</Text>
              </View>
            )}
          </View>
 
          {!!item.ocasion && (
            <View style={styles.cardTagsRow}>
              <View style={styles.cardTag}>
                <Ionicons name="sparkles-outline" size={14} color="#8A8A8A" />
                <Text style={styles.cardTagText}>{item.ocasion}</Text>
              </View>
            </View>
          )}
 
          <Text style={styles.cardDate}>Agregada el {formatDate(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };
 
  // ----------------------------------------------------------
  // ESTADO VACÍO (usuario sin prendas cargadas)
  // ----------------------------------------------------------
 
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="shirt-outline" size={48} color={COLORS.icon} />
      </View>
      <Text style={styles.emptyTitle}>Todavía no tenés prendas</Text>
      <Text style={styles.emptySubtitle}>
        Tus prendas van a aparecer acá apenas las registres en tu armario.
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => {
          try {
            navigation.navigate('AddClothing', { user });
          } catch (e) {
            Alert.alert('Próximamente', 'La pantalla para agregar prendas se implementará pronto.');
          }
        }}
      >
        <Ionicons name="add" size={18} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Agregar mi primera prenda</Text>
      </TouchableOpacity>
    </View>
  );
 
  // ==========================================================
  // INTERFAZ
  // ==========================================================
 
  return (
    <View style={styles.container}>
      <View style={[styles.topSection, isDesktop && styles.topSectionDesktop]}>
 
        {/* ================================================
            BUSCADOR + FILTROS
            ================================================ */}
        <View style={[styles.searchRow, isDesktop && styles.searchRowDesktop]}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={18} color={COLORS.icon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar prendas..."
              placeholderTextColor="#A0A0A0"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
 
          <TouchableOpacity
  style={styles.filtersButton}
  onPress={() => setFiltersVisible(true)}
>
  <Ionicons
    name="filter-outline"
    size={16}
    color={COLORS.buttonDark}
  />

  <Text style={styles.filtersButtonText}>
    Filtros
  </Text>
</TouchableOpacity>
        </View>
 
        {/* ================================================
            CHIPS DE CATEGORÍA
            ================================================ */}
      <View style={styles.chipsRow}>
  {categoryFilters.map((filter) => {
    const isActive =
      activeCategory === filter.key;

    return (
      <TouchableOpacity
        key={filter.key}
        style={[
          styles.chip,
          isActive && styles.chipActive,
        ]}
        onPress={() =>
          setActiveCategory(filter.key)
        }
      >
        <Text
          style={[
            styles.chipText,
            isActive && styles.chipTextActive,
          ]}
        >
          {filter.label}
        </Text>
      </TouchableOpacity>
    );
  })}
</View>
 
        {/* ================================================
            CONTADOR + ORDEN
            ================================================ */}
        {!loading && clothes.length > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>{filteredClothes.length} prendas</Text>
 
            <View>
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => setSortMenuVisible((prev) => !prev)}
              >
                <Text style={styles.summaryText}>Ordenar por </Text>
                <Text style={styles.sortValueText}>
                  {sortOrder === 'recientes' ? 'Más recientes' : 'Más antiguas'}
                </Text>
                <Ionicons name="chevron-down" size={14} color={COLORS.primary} />
              </TouchableOpacity>
 
              {sortMenuVisible && (
                <View style={styles.sortMenu}>
                  <TouchableOpacity
                    style={styles.sortMenuItem}
                    onPress={() => {
                      setSortOrder('recientes');
                      setSortMenuVisible(false);
                    }}
                  >
                    <Text style={styles.sortMenuItemText}>Más recientes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sortMenuItem}
                    onPress={() => {
                      setSortOrder('antiguas');
                      setSortMenuVisible(false);
                    }}
                  >
                    <Text style={styles.sortMenuItemText}>Más antiguas</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
 
      {/* ==================================================
          LISTADO / GRILLA / ESTADO VACÍO
          ================================================== */}
 
      {!loading && clothes.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          key={isDesktop ? 'grid-2' : 'list-1'}
          data={filteredClothes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCard}
          numColumns={isDesktop ? 2 : 1}
          columnWrapperStyle={isDesktop ? styles.columnWrapper : undefined}
          contentContainerStyle={[
            styles.listContent,
            isDesktop && styles.listContentDesktop,
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
            {/* ==================================================
          MODAL DE FILTROS AVANZADOS
          ================================================== */}

      <Modal
        visible={filtersVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setFiltersVisible(false)
        }
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalCard}>

            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>
                Filtros
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setFiltersVisible(false)
                }
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={COLORS.textDark}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
            >

              {/* ================================
                  COLOR
                  ================================ */}

              <Text style={styles.filterSectionTitle}>
                Color
              </Text>

              <View style={styles.filterOptionsRow}>
                {colorOptions.map((option) => {
                  const active =
                    selectedColor === option;

                  return (
                    <TouchableOpacity
                      key={`color-${option}`}
                      style={[
                        styles.filterOption,
                        active &&
                          styles.filterOptionActive,
                      ]}
                      onPress={() =>
                        setSelectedColor(option)
                      }
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          active &&
                            styles.filterOptionTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>


              {/* ================================
                  TEMPORADA
                  ================================ */}

              <Text style={styles.filterSectionTitle}>
                Temporada
              </Text>

              <View style={styles.filterOptionsRow}>
                {seasonOptions.map((option) => {
                  const active =
                    selectedSeason === option;

                  return (
                    <TouchableOpacity
                      key={`season-${option}`}
                      style={[
                        styles.filterOption,
                        active &&
                          styles.filterOptionActive,
                      ]}
                      onPress={() =>
                        setSelectedSeason(option)
                      }
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          active &&
                            styles.filterOptionTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>


              {/* ================================
                  OCASIÓN
                  ================================ */}

              <Text style={styles.filterSectionTitle}>
                Ocasión
              </Text>

              <View style={styles.filterOptionsRow}>
                {occasionOptions.map((option) => {
                  const active =
                    selectedOccasion === option;

                  return (
                    <TouchableOpacity
                      key={`occasion-${option}`}
                      style={[
                        styles.filterOption,
                        active &&
                          styles.filterOptionActive,
                      ]}
                      onPress={() =>
                        setSelectedOccasion(option)
                      }
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          active &&
                            styles.filterOptionTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

            </ScrollView>


            {/* ================================
                ACCIONES
                ================================ */}

            <View style={styles.filterActionsRow}>

              <TouchableOpacity
                style={styles.filterClearButton}
                onPress={() => {
                  setSelectedColor('Todos');
                  setSelectedSeason('Todas');
                  setSelectedOccasion('Todas');
                  setActiveCategory('Todas');
                  setSearchText('');
                }}
              >
                <Text style={styles.filterClearText}>
                  Limpiar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterApplyButton}
                onPress={() =>
                  setFiltersVisible(false)
                }
              >
                <Text style={styles.filterApplyText}>
                  Aplicar
                </Text>
              </TouchableOpacity>

            </View>

          </View>
        </View>
      </Modal>
    </View>
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
  topSection: {
  paddingHorizontal: 16,
  paddingTop: 16,
  position: 'relative',
  zIndex: 20,
  elevation: 20,
},
  topSectionDesktop: {
  paddingHorizontal: 24,
  paddingTop: 20,
  position: 'relative',
  zIndex: 20,
  elevation: 20,
},
  // ----------------------------------------------------------
  // BUSCADOR + FILTROS
  // ----------------------------------------------------------
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchRowDesktop: {
    marginBottom: 18,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    height: 44,
    paddingHorizontal: 16,
    gap: 6,
  },
  filtersButtonText: {
    color: COLORS.buttonDark,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
 
  // ----------------------------------------------------------
  // CHIPS DE CATEGORÍA
  // ----------------------------------------------------------
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
 
  // ----------------------------------------------------------
  // CONTADOR + ORDEN
  // ----------------------------------------------------------
 summaryRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
  position: 'relative',
  zIndex: 30,
  elevation: 30,
},
  summaryText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortValueText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.primary,
    marginRight: 4,
  },
  sortMenu: {
    position: 'absolute',
    top: 26,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    paddingVertical: 4,
    minWidth: 140,
    zIndex: 10,
    elevation: 4,
  },
  sortMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  sortMenuItemText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textDark,
  },
 
  // ----------------------------------------------------------
  // LISTADO / GRILLA
  // ----------------------------------------------------------
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  listContentDesktop: {
    paddingHorizontal: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
 
  // ----------------------------------------------------------
  // TARJETA DE PRENDA
  // ----------------------------------------------------------
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardDesktop: {
    width: '48.5%',
  },
  cardImageWrapper: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1EDF7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
    marginRight: 8,
  },
  cardTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 2,
  },
  cardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardTagText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#8A8A8A',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cardDate: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#B0B0B0',
    marginTop: 4,
  },
 
  // ----------------------------------------------------------
  // ESTADO VACÍO
  // ----------------------------------------------------------
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0E6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.buttonDark,
    borderRadius: 12,
    paddingHorizontal: 20,
    height: 48,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
    // ==========================================================
  // MODAL DE FILTROS
  // ==========================================================

  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  filterModalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 8,
  },

  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  filterModalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
  },

  filterSectionTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
    marginTop: 10,
    marginBottom: 10,
  },

  filterOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },

  filterOption: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },

  filterOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  filterOptionText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textDark,
  },

  filterOptionTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },

  filterActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },

  filterClearButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },

  filterClearText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
  },

  filterApplyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
  },

  filterApplyText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
 














