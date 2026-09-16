import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS } from '../theme/colours';
import { MESSAGES } from '../theme/messages';

import {
  getUserClothes,
  getSuitcaseById,
  addSuitcase,
  updateSuitcase,
} from '../services/database';


// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

// Formatea una fecha para mostrarla como DD/MM/YYYY
const formatDate = (dateValue) => {
  if (!dateValue) return '';

  // Si ya viene con formato DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
    return dateValue;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};


// Convierte DD/MM/YYYY a un valor ISO cuando corresponde
const normalizeDate = (dateValue) => {
  if (!dateValue) return '';

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
    const [day, month, year] = dateValue.split('/');
    return `${year}-${month}-${day}`;
  }

  return dateValue;
};


// Color visual de la prenda según su color guardado
const getColorDot = (color) => {
  const value = String(color || '').toLowerCase();

  if (value.includes('negro')) return '#111111';
  if (value.includes('azul')) return '#4169E1';
  if (value.includes('rojo')) return '#D94A4A';
  if (value.includes('verde')) return '#5BAE72';
  if (value.includes('amarillo')) return '#E8C547';
  if (value.includes('rosa')) return '#E58BB5';
  if (value.includes('violeta') || value.includes('morado')) return '#8B5CC7';
  if (value.includes('gris')) return '#A5A5A5';
  if (value.includes('beige')) return '#C8B89A';

  // Blanco
  return '#FFFFFF';
};


// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function PackingModeScreen({ navigation, route }) {

  const { width } = useWindowDimensions();

  // En el proyecto se utiliza > 768 para diferenciar escritorio
  // de la versión mobile.
  const isDesktop = width > 768;

  // Usuario recibido desde MainTabNavigator
  const user = route?.params?.user;

  // Si llega suitcaseId significa que estamos editando una maleta.
  const suitcaseId = route?.params?.suitcaseId;

  // ----------------------------------------------------------
  // ESTADOS
  // ----------------------------------------------------------

  const [clothes, setClothes] = useState([]);

  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('Planificada');

  const [packedItems, setPackedItems] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal para editar la nota de una prenda
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedClothing, setSelectedClothing] = useState(null);
  const [noteText, setNoteText] = useState('');


  // ==========================================================
  // CARGAR DATOS
  // ==========================================================

  useEffect(() => {
    loadPackingData();
  }, [user?.id, suitcaseId]);


  const loadPackingData = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        setClothes([]);
        return;
      }

      // ------------------------------------------------------
      // Cargar prendas del usuario
      // ------------------------------------------------------

      const userClothes = await getUserClothes(user.id);

      setClothes(userClothes || []);


      // ------------------------------------------------------
      // Si estamos editando una maleta existente
      // ------------------------------------------------------

      if (suitcaseId) {

        const suitcase = await getSuitcaseById(suitcaseId);

        if (suitcase) {

          setDestination(suitcase.destino || '');

          setStartDate(formatDate(suitcase.fechaInicio));
          setEndDate(formatDate(suitcase.fechaFin));

          setStatus(suitcase.estado || 'Planificada');


          // Convertimos:
          //
          // [
          //   {
          //      clothingId,
          //      note,
          //      packed
          //   }
          // ]
          //
          // en un objeto más cómodo para manejar desde React.

          const itemsMap = {};

          (suitcase.items || []).forEach((item) => {
            itemsMap[item.clothingId] = {
              packed: !!item.packed,
              note: item.note || '',
            };
          });

          setPackedItems(itemsMap);
        }

      } else {

        // ----------------------------------------------------
        // Maleta nueva
        // ----------------------------------------------------

        setDestination('');
        setStartDate('');
        setEndDate('');
        setStatus('Planificada');

        setPackedItems({});
      }

    } catch (error) {

      console.log('Error cargando modo maleta:', error);

      Alert.alert(
        'Error',
        'No se pudieron cargar los datos de la maleta.'
      );

    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // PRENDAS QUE SE MOSTRARÁN
  // ==========================================================

  const visibleClothes = useMemo(() => {

    // Todas las prendas del usuario forman parte de las opciones
    // para empacar.

    return clothes || [];

  }, [clothes]);


  // ==========================================================
  // ESTADÍSTICAS DE EMPAQUE
  // ==========================================================

  const totalItems = visibleClothes.length;

  const packedCount = visibleClothes.filter(
    (item) => packedItems[item.id]?.packed
  ).length;

  const progress =
    totalItems > 0
      ? Math.round((packedCount / totalItems) * 100)
      : 0;


  // ==========================================================
  // MARCAR / DESMARCAR PRENDA
  // ==========================================================

  const togglePacked = (clothingId) => {

    setPackedItems((previous) => {

      const current = previous[clothingId] || {
        packed: false,
        note: '',
      };

      return {
        ...previous,
        [clothingId]: {
          ...current,
          packed: !current.packed,
        },
      };

    });
  };


  // ==========================================================
  // EDITAR NOTA
  // ==========================================================

  const openNoteEditor = (clothing) => {

    const current = packedItems[clothing.id] || {
      packed: false,
      note: '',
    };

    setSelectedClothing(clothing);
    setNoteText(current.note || '');
    setNoteModalVisible(true);
  };


  const saveNote = () => {

    if (!selectedClothing) {
      setNoteModalVisible(false);
      return;
    }

    setPackedItems((previous) => {

      const current = previous[selectedClothing.id] || {
        packed: false,
        note: '',
      };

      return {
        ...previous,
        [selectedClothing.id]: {
          ...current,
          note: noteText.trim(),
        },
      };

    });

    setNoteModalVisible(false);
  };


  // ==========================================================
  // CONSTRUIR ITEMS DE LA MALETA
  // ==========================================================

  const buildSuitcaseItems = () => {

    return visibleClothes.map((clothing) => {

      const current = packedItems[clothing.id] || {
        packed: false,
        note: '',
      };

      return {
        clothingId: clothing.id,
        note: current.note || '',
        packed: !!current.packed,
      };

    });

  };


  // ==========================================================
  // GUARDAR MALETA
  // ==========================================================

  const handleSaveSuitcase = async () => {

    // --------------------------------------------------------
    // Validaciones
    // --------------------------------------------------------

    if (!destination.trim() || !startDate.trim() || !endDate.trim()) {

      Alert.alert(
        'Datos incompletos',
        MESSAGES.REQUIRED_FIELDS
      );

      return;
    }


    try {

      setSaving(true);

      const suitcaseItems = buildSuitcaseItems();


      // ------------------------------------------------------
      // EDITAR MALETA EXISTENTE
      // ------------------------------------------------------

      if (suitcaseId) {

        const result = await updateSuitcase(
          suitcaseId,
          {
            destino: destination.trim(),
            fechaInicio: normalizeDate(startDate.trim()),
            fechaFin: normalizeDate(endDate.trim()),
            estado: status,
            items: suitcaseItems,
          }
        );


        if (!result.success) {

          Alert.alert(
            'Error',
            'No se pudo actualizar la maleta.'
          );

          return;
        }

      } else {

        // ----------------------------------------------------
        // CREAR MALETA NUEVA
        // ----------------------------------------------------

        const result = await addSuitcase({

          userId: user.id,

          destino: destination.trim(),

          fechaInicio: normalizeDate(startDate.trim()),

          fechaFin: normalizeDate(endDate.trim()),

          estado: status,

          items: suitcaseItems,

        });


        if (!result.success) {

          Alert.alert(
            'Error',
            'No se pudo guardar la maleta.'
          );

          return;
        }
      }


      // ------------------------------------------------------
      // Mensaje definido en messages.js
      // ------------------------------------------------------

      Alert.alert(
        'Maleta',
        MESSAGES.SUITCASE_SAVED,
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

      console.log('Error guardando maleta:', error);

      Alert.alert(
        'Error',
        'No se pudo guardar la maleta. Intentá nuevamente.'
      );

    } finally {

      setSaving(false);

    }

  };


  // ==========================================================
  // RENDERIZAR IMAGEN DE PRENDA
  // ==========================================================

  const renderClothingImage = (item) => {

    if (item.imageUri) {

      return (
        <Image
          source={{ uri: item.imageUri }}
          style={styles.clothingImage}
          resizeMode="contain"
        />
      );

    }

    return (
      <View style={styles.imagePlaceholder}>
        <Ionicons
          name="shirt-outline"
          size={30}
          color={COLORS.icon}
        />
      </View>
    );
  };


  // ==========================================================
  // TARJETA DE PRENDA
  // ==========================================================

  const renderClothingCard = (item) => {

    const itemState = packedItems[item.id] || {
      packed: false,
      note: '',
    };

    const isPacked = itemState.packed;

    return (
      <View
        key={item.id}
        style={[
          styles.clothingCard,
          isDesktop && styles.clothingCardDesktop,
        ]}
      >

        {/* Imagen */}
        <View style={styles.imageContainer}>
          {renderClothingImage(item)}
        </View>


        {/* Información de la prenda */}
        <View style={styles.clothingInfo}>

          <Text
            style={styles.clothingTitle}
            numberOfLines={1}
          >
            {item.title || 'Prenda sin nombre'}
          </Text>

          <Text
            style={styles.clothingCategory}
            numberOfLines={1}
          >
            Categoría: {item.category || 'Sin categoría'}
          </Text>


          <View style={styles.colorRow}>

            <View
              style={[
                styles.colorDot,
                {
                  backgroundColor: getColorDot(item.color),
                },
              ]}
            />

            <Text style={styles.colorText}>
              {item.color || 'Sin color'}
            </Text>

          </View>


          {/* Nota */}
          {itemState.note ? (
            <View style={styles.noteRow}>

              <Ionicons
                name="information-circle-outline"
                size={14}
                color={COLORS.icon}
              />

              <Text
                style={styles.noteText}
                numberOfLines={2}
              >
                Nota: {itemState.note}
              </Text>

            </View>
          ) : null}

        </View>


        {/* Acciones */}
        <View style={styles.clothingActions}>

          {/* Editar nota */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openNoteEditor(item)}
          >
            <Ionicons
              name="pencil-outline"
              size={18}
              color={COLORS.textDark}
            />

            <Text style={styles.actionText}>
              Nota
            </Text>
          </TouchableOpacity>


          {/* Checkbox empacado */}
          <TouchableOpacity
            style={styles.packButton}
            onPress={() => togglePacked(item.id)}
          >

            <View
              style={[
                styles.checkbox,
                isPacked && styles.checkboxChecked,
              ]}
            >

              {isPacked && (
                <Ionicons
                  name="checkmark"
                  size={15}
                  color="#FFFFFF"
                />
              )}

            </View>

            <Text style={styles.actionText}>
              Empacada
            </Text>

          </TouchableOpacity>

        </View>

      </View>
    );
  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <View style={styles.loadingContainer}>

        <Ionicons
          name="briefcase-outline"
          size={38}
          color={COLORS.primary}
        />

        <Text style={styles.loadingText}>
          Cargando maleta...
        </Text>

      </View>
    );

  }


  // ==========================================================
  // RENDER PRINCIPAL
  // ==========================================================

  return (
    <View style={styles.screen}>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.contentContainer,
          isDesktop && styles.contentContainerDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >


        {/* ==================================================
            INFORMACIÓN DE LA MALETA
        ================================================== */}

        <View
          style={[
            styles.infoCard,
            isDesktop && styles.infoCardDesktop,
          ]}
        >

          {/* DESTINO */}
          <View style={styles.infoRow}>

            <View style={styles.infoIcon}>
              <Ionicons
                name="location-outline"
                size={18}
                color={COLORS.icon}
              />
            </View>

            <View style={styles.infoContent}>

              <Text style={styles.infoLabel}>
                Destino
              </Text>

              <TextInput
                value={destination}
                onChangeText={setDestination}
                placeholder="Ingresá el destino"
                placeholderTextColor={COLORS.textLight}
                style={styles.infoInput}
              />

            </View>

          </View>


          {/* FECHA DE INICIO */}
          <View style={styles.infoRow}>

            <View style={styles.infoIcon}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={COLORS.icon}
              />
            </View>

            <View style={styles.infoContent}>

              <Text style={styles.infoLabel}>
                Fecha de inicio
              </Text>

              <TextInput
                value={startDate}
                onChangeText={setStartDate}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={COLORS.textLight}
                style={styles.infoInput}
              />

            </View>

          </View>


          {/* FECHA DE FIN */}
          <View style={styles.infoRow}>

            <View style={styles.infoIcon}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={COLORS.icon}
              />
            </View>

            <View style={styles.infoContent}>

              <Text style={styles.infoLabel}>
                Fecha de fin
              </Text>

              <TextInput
                value={endDate}
                onChangeText={setEndDate}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={COLORS.textLight}
                style={styles.infoInput}
              />

            </View>

          </View>


          {/* ESTADO */}
          <View style={[styles.infoRow, styles.lastInfoRow]}>

            <View style={styles.infoIcon}>
              <MaterialCommunityIcons
                name="briefcase-outline"
                size={18}
                color={COLORS.icon}
              />
            </View>

            <View style={styles.infoContent}>

              <Text style={styles.infoLabel}>
                Estado
              </Text>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {status}
                </Text>
              </View>

            </View>

          </View>

        </View>


        {/* ==================================================
            TÍTULO + PROGRESO
        ================================================== */}

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            Prendas de la maleta
          </Text>

        </View>


        <View
          style={[
            styles.progressCard,
            isDesktop && styles.progressCardDesktop,
          ]}
        >

          <View style={styles.progressIcon}>

            <Ionicons
              name="briefcase-outline"
              size={20}
              color={COLORS.icon}
            />

          </View>


          <View style={styles.progressContent}>

            <View style={styles.progressTopRow}>

              <Text style={styles.progressText}>
                Prendas empacadas:{' '}
                <Text style={styles.progressStrong}>
                  {packedCount} de {totalItems}
                </Text>
              </Text>

              <Text style={styles.progressPercentage}>
                {progress}%
              </Text>

            </View>


            {/* Barra de progreso */}
            <View style={styles.progressTrack}>

              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                  },
                ]}
              />

            </View>

          </View>

        </View>


        {/* ==================================================
            LISTADO DE PRENDAS
        ================================================== */}

        <View
          style={[
            styles.clothesList,
            isDesktop && styles.clothesListDesktop,
          ]}
        >

          {visibleClothes.length === 0 ? (

            <View style={styles.emptyContainer}>

              <Ionicons
                name="shirt-outline"
                size={42}
                color={COLORS.icon}
              />

              <Text style={styles.emptyTitle}>
                No tenés prendas registradas
              </Text>

              <Text style={styles.emptyText}>
                Agregá prendas a tu armario para poder
                incluirlas en la maleta.
              </Text>

            </View>

          ) : (

            visibleClothes.map(renderClothingCard)

          )}

        </View>


        {/* ==================================================
            BOTÓN GUARDAR
        ================================================== */}

        <TouchableOpacity
          style={[
            styles.saveButton,
            saving && styles.saveButtonDisabled,
            isDesktop && styles.saveButtonDesktop,
          ]}
          onPress={handleSaveSuitcase}
          disabled={saving}
        >

          <Ionicons
            name="briefcase-outline"
            size={18}
            color="#FFFFFF"
          />

          <Text style={styles.saveButtonText}>
            {saving ? 'Guardando...' : 'Guardar maleta'}
          </Text>

        </TouchableOpacity>


      </ScrollView>


      {/* ====================================================
          MODAL PARA NOTAS
      ==================================================== */}

      <Modal
        visible={noteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNoteModalVisible(false)}
      >

        <View style={styles.modalOverlay}>

          <View style={styles.noteModal}>

            <Text style={styles.modalTitle}>
              Nota de la prenda
            </Text>

            <Text style={styles.modalSubtitle}>
              {selectedClothing?.title || ''}
            </Text>

            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Ej.: Llevar por si hace frío..."
              placeholderTextColor={COLORS.textLight}
              multiline
              style={styles.noteInput}
            />


            <View style={styles.modalActions}>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setNoteModalVisible(false)}
              >

                <Text style={styles.cancelButtonText}>
                  Cancelar
                </Text>

              </TouchableOpacity>


              <TouchableOpacity
                style={styles.confirmButton}
                onPress={saveNote}
              >

                <Text style={styles.confirmButtonText}>
                  Guardar
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

  // ==========================================================
  // PANTALLA GENERAL
  // ==========================================================

  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scroll: {
    flex: 1,
  },

  contentContainer: {
    padding: 12,
    paddingBottom: 30,
  },

  contentContainerDesktop: {
    paddingHorizontal: 35,
    paddingVertical: 25,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },


  // ==========================================================
  // LOADING
  // ==========================================================

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: COLORS.textLight,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },


  // ==========================================================
  // INFORMACIÓN DE LA MALETA
  // ==========================================================

  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 5,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },

  infoCardDesktop: {
    paddingHorizontal: 22,
    paddingVertical: 8,
  },

  infoRow: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',

    borderBottomWidth: 1,
    borderBottomColor: '#F0EAF8',
  },

  lastInfoRow: {
    borderBottomWidth: 0,
  },

  infoIcon: {
    width: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoContent: {
    flex: 1,
    marginLeft: 3,
  },

  infoLabel: {
    color: COLORS.textLight,
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
  },

  infoInput: {
    color: COLORS.textDark,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    paddingVertical: 1,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F8F1FF',
    borderWidth: 1,
    borderColor: '#E8D9FA',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 1,
  },

  statusText: {
    color: COLORS.buttonDark,
    fontSize: 9,
    fontFamily: 'Poppins_600SemiBold',
  },


  // ==========================================================
  // SECCIÓN PRENDAS
  // ==========================================================

  sectionHeader: {
    marginTop: 14,
    marginBottom: 8,
  },

  sectionTitle: {
    color: COLORS.textDark,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },


  // ==========================================================
  // PROGRESO
  // ==========================================================

  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  progressCardDesktop: {
    padding: 15,
  },

  progressIcon: {
    width: 35,
    height: 35,
    borderRadius: 8,
    backgroundColor: '#F8F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  progressContent: {
    flex: 1,
  },

  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  progressText: {
    color: COLORS.textDark,
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
  },

  progressStrong: {
    color: COLORS.buttonDark,
    fontFamily: 'Poppins_600SemiBold',
  },

  progressPercentage: {
    color: COLORS.buttonDark,
    fontSize: 9,
    fontFamily: 'Poppins_600SemiBold',
  },

  progressTrack: {
    height: 5,
    borderRadius: 5,
    backgroundColor: '#EDE7F3',
    marginTop: 7,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: COLORS.buttonDark,
    borderRadius: 5,
  },


  // ==========================================================
  // LISTADO
  // ==========================================================

  clothesList: {
    gap: 7,
  },

  clothesListDesktop: {
    gap: 10,
  },


  // ==========================================================
  // TARJETA DE PRENDA
  // ==========================================================

  clothingCard: {
    minHeight: 82,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,

    flexDirection: 'row',
    alignItems: 'center',

    padding: 7,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },

  clothingCardDesktop: {
    minHeight: 105,
    padding: 10,
  },

  imageContainer: {
    width: 65,
    height: 68,
    borderRadius: 8,
    backgroundColor: '#F6F3F8',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  clothingImage: {
    width: '100%',
    height: '100%',
  },

  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  clothingInfo: {
    flex: 1,
    marginLeft: 9,
    minWidth: 0,
  },

  clothingTitle: {
    color: COLORS.textDark,
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },

  clothingCategory: {
    color: COLORS.textLight,
    fontSize: 8.5,
    fontFamily: 'Poppins_400Regular',
    marginTop: 1,
  },

  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D7D1DD',
    marginRight: 4,
  },

  colorText: {
    color: COLORS.textLight,
    fontSize: 8.5,
    fontFamily: 'Poppins_400Regular',
  },


  // ==========================================================
  // NOTAS
  // ==========================================================

  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    paddingRight: 4,
  },

  noteText: {
    flex: 1,
    color: COLORS.buttonDark,
    fontSize: 7.5,
    fontFamily: 'Poppins_400Regular',
    marginLeft: 3,
  },


  // ==========================================================
  // ACCIONES DE PRENDA
  // ==========================================================

  clothingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },

  editButton: {
    width: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },

  packButton: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionText: {
    color: COLORS.textLight,
    fontSize: 6.5,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
    textAlign: 'center',
  },

  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,

    borderWidth: 1,
    borderColor: '#A9A1B0',

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: '#FFFFFF',
  },

  checkboxChecked: {
    backgroundColor: COLORS.buttonDark,
    borderColor: COLORS.buttonDark,
  },


  // ==========================================================
  // ESTADO VACÍO
  // ==========================================================

  emptyContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: COLORS.textDark,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 10,
    textAlign: 'center',
  },

  emptyText: {
    color: COLORS.textLight,
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    marginTop: 5,
    textAlign: 'center',
    maxWidth: 280,
  },


  // ==========================================================
  // BOTÓN GUARDAR
  // ==========================================================

  saveButton: {
    height: 42,
    backgroundColor: COLORS.buttonDark,
    borderRadius: 8,

    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

    marginTop: 10,
  },

  saveButtonDesktop: {
    height: 48,
    borderRadius: 9,
    marginTop: 15,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 7,
  },


  // ==========================================================
  // MODAL DE NOTAS
  // ==========================================================

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  noteModal: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },

  modalTitle: {
    color: COLORS.textDark,
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
  },

  modalSubtitle: {
    color: COLORS.textLight,
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    marginTop: 3,
    marginBottom: 12,
  },

  noteInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#E4DCEC',
    borderRadius: 10,

    padding: 12,

    color: COLORS.textDark,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',

    textAlignVertical: 'top',
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    gap: 8,
  },

  cancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F3EFF6',
  },

  cancelButtonText: {
    color: COLORS.textLight,
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },

  confirmButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: COLORS.buttonDark,
  },

  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
});