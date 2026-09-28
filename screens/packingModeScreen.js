import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

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
  useWindowDimensions,
} from 'react-native';

import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { COLORS } from '../theme/colours';
import { MESSAGES } from '../theme/messages';

import {
  getUserClothes,
  getSuitcaseById,
  addSuitcase,
  updateSuitcase,
} from '../services/database';


// ============================================================
// COLORES DE APOYO
// ============================================================

const SUCCESS_BACKGROUND =
  COLORS.successBackground || '#EAF8EE';

const SUCCESS_BORDER =
  COLORS.successBorder || '#B9E4C4';

const SUCCESS_TEXT =
  COLORS.successText || '#4E9B63';

const STATUS_PLANNED_BACKGROUND =
  '#EAF7EE';

const STATUS_PLANNED_BORDER =
  '#B9E4C4';

const STATUS_PLANNED_TEXT =
  '#2E9D57';

const STATUS_ACTIVE_BACKGROUND =
  '#FFF1E6';

const STATUS_ACTIVE_BORDER =
  '#F3C9A6';

const STATUS_ACTIVE_TEXT =
  '#E67E22';

const STATUS_FINISHED_BACKGROUND =
  '#FDECEC';

const STATUS_FINISHED_BORDER =
  '#F2BABA';

const STATUS_FINISHED_TEXT =
  '#D64545';
// ============================================================
// FECHAS
// ============================================================

const parseStoredDate = (dateValue) => {
  if (!dateValue) {
    return null;
  }

  if (dateValue instanceof Date) {
    if (Number.isNaN(dateValue.getTime())) {
      return null;
    }

    return new Date(
      dateValue.getFullYear(),
      dateValue.getMonth(),
      dateValue.getDate()
    );
  }

  const value = String(dateValue).trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] =
      value.split('-').map(Number);

    return new Date(
      year,
      month - 1,
      day
    );
  }

  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] =
      value.split('/').map(Number);

    return new Date(
      year,
      month - 1,
      day
    );
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
};


const formatDate = (dateValue) => {
  const date = parseStoredDate(dateValue);

  if (!date) {
    return '';
  }

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};


const normalizeDate = (dateValue) => {
  const date = parseStoredDate(dateValue);

  if (!date) {
    return '';
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};


const createLocalDate = (
  year,
  month,
  day
) => {
  return new Date(
    year,
    month,
    day
  );
};


// ============================================================
// ESTADO DE LA MALETA
// ============================================================

const getSuitcaseStatus = (
  startDate,
  endDate
) => {
  if (!startDate || !endDate) {
    return 'Sin planificar';
  }

  const today = new Date();

  const todayOnly = createLocalDate(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  if (todayOnly < startDate) {
    return 'Planificada';
  }

  if (todayOnly > endDate) {
    return 'Finalizada';
  }

  return 'En curso';
};


// ============================================================
// COLOR DE LA PRENDA
// ============================================================

const getColorDot = (color) => {
  const value =
    String(color || '').toLowerCase();

  if (value.includes('negro')) {
    return '#111111';
  }

  if (value.includes('azul')) {
    return '#4169E1';
  }

  if (value.includes('rojo')) {
    return '#D94A4A';
  }

  if (value.includes('verde')) {
    return '#5BAE72';
  }

  if (value.includes('amarillo')) {
    return '#E8C547';
  }

  if (value.includes('rosa')) {
    return '#E58BB5';
  }

  if (
    value.includes('violeta') ||
    value.includes('morado')
  ) {
    return '#8B5CC7';
  }

  if (value.includes('gris')) {
    return '#A5A5A5';
  }

  if (value.includes('beige')) {
    return '#C8B89A';
  }

  if (value.includes('blanco')) {
    return '#FFFFFF';
  }

  return '#FFFFFF';
};


// ============================================================
// CALENDARIO
// ============================================================

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEK_DAYS = [
  'L',
  'M',
  'X',
  'J',
  'V',
  'S',
  'D',
];


function CalendarModal({
  visible,
  value,
  onSelect,
  onClose,
}) {
  const today = new Date();

  const [
    displayMonth,
    setDisplayMonth,
  ] = useState(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )
  );


  useEffect(() => {
    if (!visible) {
      return;
    }

    const date =
      value || new Date();

    setDisplayMonth(
      new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      )
    );
  }, [visible, value]);


  const year =
    displayMonth.getFullYear();

  const month =
    displayMonth.getMonth();


  const firstDay =
    new Date(
      year,
      month,
      1
    ).getDay();

  const startingOffset =
    firstDay === 0
      ? 6
      : firstDay - 1;


  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  const calendarDays = [];

  for (
    let i = 0;
    i < startingOffset;
    i += 1
  ) {
    calendarDays.push(null);
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day += 1
  ) {
    calendarDays.push(day);
  }

  while (
    calendarDays.length % 7 !== 0
  ) {
    calendarDays.push(null);
  }


  const isSameDate = (
    dateA,
    dateB
  ) => {
    if (!dateA || !dateB) {
      return false;
    }

    return (
      dateA.getFullYear() ===
        dateB.getFullYear() &&
      dateA.getMonth() ===
        dateB.getMonth() &&
      dateA.getDate() ===
        dateB.getDate()
    );
  };


  const handleDayPress = (day) => {
    if (!day) {
      return;
    }

    const selectedDate =
      createLocalDate(
        year,
        month,
        day
      );

    onSelect(selectedDate);
    onClose();
  };


  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={styles.calendarOverlay}
      >
        <View
          style={styles.calendarModal}
        >

          <View
            style={styles.calendarHeader}
          >
            <TouchableOpacity
              style={styles.calendarArrow}
              onPress={() =>
                setDisplayMonth(
                  new Date(
                    year,
                    month - 1,
                    1
                  )
                )
              }
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={COLORS.textDark}
              />
            </TouchableOpacity>

            <Text
              style={
                styles.calendarMonthTitle
              }
            >
              {MONTH_NAMES[month]} {year}
            </Text>

            <TouchableOpacity
              style={styles.calendarArrow}
              onPress={() =>
                setDisplayMonth(
                  new Date(
                    year,
                    month + 1,
                    1
                  )
                )
              }
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textDark}
              />
            </TouchableOpacity>
          </View>


          <View
            style={styles.weekDaysRow}
          >
            {WEEK_DAYS.map(
              (day) => (
                <View
                  key={day}
                  style={styles.weekDay}
                >
                  <Text
                    style={
                      styles.weekDayText
                    }
                  >
                    {day}
                  </Text>
                </View>
              )
            )}
          </View>


          <View
            style={styles.calendarGrid}
          >
            {calendarDays.map(
              (day, index) => {
                if (!day) {
                  return (
                    <View
                      key={`empty-${index}`}
                      style={
                        styles.calendarDay
                      }
                    />
                  );
                }

                const currentDate =
                  createLocalDate(
                    year,
                    month,
                    day
                  );

                const selected =
                  isSameDate(
                    currentDate,
                    value
                  );

                const isToday =
                  isSameDate(
                    currentDate,
                    today
                  );

                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    style={
                      styles.calendarDay
                    }
                    onPress={() =>
                      handleDayPress(day)
                    }
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        selected &&
                          styles.calendarDayTextSelected,
                        !selected &&
                          isToday &&
                          styles.calendarDayTextToday,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>


          <View
            style={styles.calendarActions}
          >
            <TouchableOpacity
              style={
                styles.calendarCancelButton
              }
              onPress={onClose}
            >
              <Text
                style={
                  styles.calendarCancelText
                }
              >
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}


// ============================================================
// PANTALLA MALeta
// ============================================================

export default function PackingModeScreen({
  navigation,
  route,
}) {
  const { width } =
    useWindowDimensions();

  const isDesktop =
    width > 768;

  const user =
    route?.params?.user;

const suitcaseId =
  route?.params?.suitcaseId;

const isEditing =
  !!suitcaseId;

  const [clothes, setClothes] =
    useState([]);

  const [destination, setDestination] =
    useState('');

  const [startDate, setStartDate] =
    useState(null);

  const [endDate, setEndDate] =
    useState(null);

  const [packedItems, setPackedItems] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    successMessageVisible,
    setSuccessMessageVisible,
  ] = useState(false);

  const [
    calendarVisible,
    setCalendarVisible,
  ] = useState(false);

  const [
    calendarType,
    setCalendarType,
  ] = useState(null);

  const [
    noteModalVisible,
    setNoteModalVisible,
  ] = useState(false);

  const [
    selectedClothing,
    setSelectedClothing,
  ] = useState(null);

  const [noteText, setNoteText] =
    useState('');


  // ==========================================================
  // CARGAR DATOS
  // ==========================================================

  useEffect(() => {
    loadPackingData();
  }, [
    user?.id,
    suitcaseId,
  ]);


  const loadPackingData =
    async () => {
      try {
        setLoading(true);

        if (!user?.id) {
          setClothes([]);
          return;
        }

        const userClothes =
          await getUserClothes(
            user.id
          );

        setClothes(
          userClothes || []
        );


        if (suitcaseId) {
          const suitcase =
            await getSuitcaseById(
              suitcaseId
            );

          if (suitcase) {
            setDestination(
              suitcase.destino || ''
            );

            setStartDate(
              parseStoredDate(
                suitcase.fechaInicio
              )
            );

            setEndDate(
              parseStoredDate(
                suitcase.fechaFin
              )
            );


            const itemsMap = {};

            (
              suitcase.items || []
            ).forEach(
              (item) => {
                itemsMap[
                  item.clothingId
                ] = {
                  packed:
                    !!item.packed,

                  note:
                    item.note || '',
                };
              }
            );

            setPackedItems(
              itemsMap
            );
          }
        } else {
          setDestination('');
          setStartDate(null);
          setEndDate(null);
          setPackedItems({});
        }

      } catch (error) {
        console.log(
          'Error cargando modo maleta:',
          error
        );

        Alert.alert(
          'Error',
          'No se pudieron cargar los datos de la maleta.'
        );

      } finally {
        setLoading(false);
      }
    };


  // ==========================================================
  // CALENDARIO
  // ==========================================================

  const openStartDatePicker =
    () => {
      setCalendarType('start');
      setCalendarVisible(true);
    };


  const openEndDatePicker =
    () => {
      setCalendarType('end');
      setCalendarVisible(true);
    };


  const closeCalendar =
    () => {
      setCalendarVisible(false);
      setCalendarType(null);
    };


const handleCalendarSelect =
  (date) => {
    if (!date) {
      return;
    }

    // El usuario modificó una fecha,
    // por lo tanto la confirmación anterior
    // deja de representar el estado actual.
    setSuccessMessageVisible(false);

    if (
      calendarType === 'start'
    ) {
      setStartDate(date);

      if (
        endDate &&
        date > endDate
      ) {
        setEndDate(date);
      }

    } else if (
      calendarType === 'end'
    ) {
      setEndDate(date);
    }

    closeCalendar();
  };

  const selectedCalendarDate =
    calendarType === 'start'
      ? startDate
      : endDate;


  // ==========================================================
  // PRENDAS
  // ==========================================================

  const visibleClothes =
    useMemo(
      () => clothes || [],
      [clothes]
    );


  // ESTE ES EL ÚNICO CONTADOR
  // No hay límite de prendas.
  const packedCount =
    visibleClothes.filter(
      (item) =>
        packedItems[item.id]?.packed
    ).length;


  // ==========================================================
  // ESTADO
  // ==========================================================

  const status =
    getSuitcaseStatus(
      startDate,
      endDate
    );


  // ==========================================================
  // EMPACAR / DESEMPACAR
  // ==========================================================

const togglePacked =
  (clothingId) => {
    // Cambiar el estado de una prenda
    // significa modificar la maleta.
    setSuccessMessageVisible(false);

    setPackedItems(
      (previous) => {
        const current =
          previous[
            clothingId
          ] || {
            packed: false,
            note: '',
          };

        return {
          ...previous,

          [clothingId]: {
            ...current,

            packed:
              !current.packed,
          },
        };
      }
    );
  };


  // ==========================================================
  // NOTAS
  // ==========================================================

  const openNoteEditor =
    (clothing) => {
      const current =
        packedItems[
          clothing.id
        ] || {
          packed: false,
          note: '',
        };

      setSelectedClothing(
        clothing
      );

      setNoteText(
        current.note || ''
      );

      setNoteModalVisible(true);
    };
const saveNote = () => {
  if (!selectedClothing) {
    setNoteModalVisible(false);
    return;
  }

  // Se confirmó una modificación de la nota,
  // por lo tanto la maleta ya tiene cambios
  // posteriores al último guardado.
  setSuccessMessageVisible(false);

  setPackedItems(
    (previous) => {
      const current =
        previous[
          selectedClothing.id
        ] || {
          packed: false,
          note: '',
        };

      return {
        ...previous,

        [selectedClothing.id]: {
          ...current,

          note:
            noteText.trim(),
        },
      };
    }
  );

  setNoteModalVisible(false);
};
  // ==========================================================
  // ITEMS PARA LA BASE DE DATOS
  // ==========================================================

  const buildSuitcaseItems =
    () => {
      return visibleClothes.map(
        (clothing) => {
          const current =
            packedItems[
              clothing.id
            ] || {
              packed: false,
              note: '',
            };

          return {
            clothingId:
              clothing.id,

            note:
              current.note || '',

            packed:
              !!current.packed,
          };
        }
      );
    };


  // ==========================================================
  // GUARDAR MALETA
  // ==========================================================

  const handleSaveSuitcase =
    async () => {
      if (
        !destination.trim() ||
        !startDate ||
        !endDate
      ) {
        Alert.alert(
          'Datos incompletos',
          MESSAGES.REQUIRED_FIELDS
        );

        return;
      }


      if (
        startDate > endDate
      ) {
        Alert.alert(
          'Fechas incorrectas',
          'La fecha de fin no puede ser anterior a la fecha de inicio.'
        );

        return;
      }


      try {
        setSaving(true);

        const suitcaseItems =
          buildSuitcaseItems();

        const savedStartDate =
          normalizeDate(
            startDate
          );

        const savedEndDate =
          normalizeDate(
            endDate
          );


        if (suitcaseId) {
          const result =
            await updateSuitcase(
              suitcaseId,
              {
                destino:
                  destination.trim(),

                fechaInicio:
                  savedStartDate,

                fechaFin:
                  savedEndDate,

                estado:
                  status,

                items:
                  suitcaseItems,
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
          const result =
            await addSuitcase({
              userId:
                user.id,

              destino:
                destination.trim(),

              fechaInicio:
                savedStartDate,

              fechaFin:
                savedEndDate,

              estado:
                status,

              items:
                suitcaseItems,
            });


          if (!result.success) {
            Alert.alert(
              'Error',
              'No se pudo guardar la maleta.'
            );

            return;
          }
        }

setSuccessMessageVisible(true);



      } catch (error) {
        console.log(
          'Error guardando maleta:',
          error
        );

        Alert.alert(
          'Error',
          'No se pudo guardar la maleta. Intentá nuevamente.'
        );

      } finally {
        setSaving(false);
      }
    };


  // ==========================================================
  // IMAGEN
  // ==========================================================

  const renderClothingImage =
    (item) => {
      if (item.imageUri) {
        return (
          <Image
            source={{
              uri: item.imageUri,
            }}
            style={
              styles.clothingImage
            }
            resizeMode="contain"
          />
        );
      }

      return (
        <View
          style={
            styles.imagePlaceholder
          }
        >
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

  const renderClothingCard =
    (item) => {
      const itemState =
        packedItems[
          item.id
        ] || {
          packed: false,
          note: '',
        };

      const isPacked =
        itemState.packed;


      return (
        <View
          key={item.id}
          style={[
            styles.clothingCard,

            isPacked &&
              styles.clothingCardPacked,

            isDesktop &&
              styles.clothingCardDesktop,
          ]}
        >

          <View
            style={
              styles.imageContainer
            }
          >
            {renderClothingImage(
              item
            )}
          </View>


          <View
            style={
              styles.clothingInfo
            }
          >
            <Text
              style={
                styles.clothingTitle
              }
              numberOfLines={1}
            >
              {item.title ||
                'Prenda sin nombre'}
            </Text>


            <Text
              style={
                styles.clothingCategory
              }
              numberOfLines={1}
            >
              Categoría:{' '}
              {item.category ||
                'Sin categoría'}
            </Text>


            <View
              style={
                styles.colorRow
              }
            >
              <View
                style={[
                  styles.colorDot,
                  {
                    backgroundColor:
                      getColorDot(
                        item.color
                      ),
                  },
                ]}
              />

              <Text
                style={
                  styles.colorText
                }
              >
                {item.color ||
                  'Sin color'}
              </Text>
            </View>


            {itemState.note ? (
              <View
                style={
                  styles.noteRow
                }
              >
                <Ionicons
                  name="information-circle-outline"
                  size={14}
                  color={COLORS.icon}
                />

                <Text
                  style={
                    styles.noteText
                  }
                  numberOfLines={2}
                >
                  Nota:{' '}
                  {itemState.note}
                </Text>
              </View>
            ) : null}
          </View>


          <View
            style={
              styles.clothingActions
            }
          >

            <TouchableOpacity
              style={
                styles.editButton
              }
              onPress={() =>
                openNoteEditor(
                  item
                )
              }
            >
              <Ionicons
                name="pencil-outline"
                size={18}
                color={
                  COLORS.textDark
                }
              />

              <Text
                style={
                  styles.actionText
                }
              >
                Nota
              </Text>
            </TouchableOpacity>


            <TouchableOpacity
              style={
                styles.packButton
              }
              onPress={() =>
                togglePacked(
                  item.id
                )
              }
            >
              <View
                style={[
                  styles.checkbox,

                  isPacked &&
                    styles.checkboxChecked,
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

              <Text
                style={
                  styles.actionText
                }
              >
                Empacada
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      );
    };


  // ==========================================================
  // CARGANDO
  // ==========================================================

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <Ionicons
          name="briefcase-outline"
          size={38}
          color={COLORS.primary}
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Cargando maleta...
        </Text>
      </View>
    );
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <View
      style={styles.screen}
    >

    

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.contentContainer,

          isDesktop &&
            styles.contentContainerDesktop,
        ]}
        showsVerticalScrollIndicator={
          false
        }
      >
{successMessageVisible && (
  <View style={styles.successBanner}>
    <View style={styles.successIcon}>
      <Ionicons
        name="checkmark"
        size={17}
        color={SUCCESS_TEXT}
      />
    </View>

    <Text style={styles.successText}>
      {MESSAGES.SUITCASE_SAVED ||
        'Maleta guardada exitosamente.'}
    </Text>
  </View>
)}
{isEditing && (
  <View style={styles.editingBanner}>
    <Ionicons
      name="create-outline"
      size={17}
      color="#6F4A8E"
    />

    <Text style={styles.editingBannerText}>
      Editando maleta
    </Text>
  </View>
)}
        {/* INFORMACIÓN */}

        <View
          style={[
            styles.infoCard,

            isDesktop &&
              styles.infoCardDesktop,
          ]}
        >

          {/* DESTINO */}

          <View
            style={
              styles.infoRow
            }
          >
            <View
              style={
                styles.infoIcon
              }
            >
              <Ionicons
                name="location-outline"
                size={18}
                color={COLORS.icon}
              />
            </View>

            <View
              style={
                styles.infoContent
              }
            >
              <Text
                style={
                  styles.infoLabel
                }
              >
                Destino
              </Text>

              <TextInput
                value={
                  destination
                }
               onChangeText={(text) => {
  setDestination(text);
  setSuccessMessageVisible(false);
}}
                placeholder="Ingresá el destino"
                placeholderTextColor={
                  COLORS.textLight
                }
                style={
                  styles.infoInput
                }
              />
            </View>
          </View>


          {/* FECHA INICIO */}

          <View
            style={
              styles.infoRow
            }
          >
            <View
              style={
                styles.infoIcon
              }
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={COLORS.icon}
              />
            </View>

            <View
              style={
                styles.infoContent
              }
            >
              <Text
                style={
                  styles.infoLabel
                }
              >
                Fecha de inicio
              </Text>

              <TouchableOpacity
                style={
                  styles.dateButton
                }
                onPress={
                  openStartDatePicker
                }
              >
                <Text
                  style={[
                    styles.dateButtonText,

                    !startDate &&
                      styles.datePlaceholder,
                  ]}
                >
                  {startDate
                    ? formatDate(
                        startDate
                      )
                    : 'DD/MM/YYYY'}
                </Text>

                <Ionicons
                  name="calendar-outline"
                  size={17}
                  color={
                    COLORS.icon
                  }
                />
              </TouchableOpacity>
            </View>
          </View>


          {/* FECHA FIN */}

          <View
            style={
              styles.infoRow
            }
          >
            <View
              style={
                styles.infoIcon
              }
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={COLORS.icon}
              />
            </View>

            <View
              style={
                styles.infoContent
              }
            >
              <Text
                style={
                  styles.infoLabel
                }
              >
                Fecha de fin
              </Text>

              <TouchableOpacity
                style={
                  styles.dateButton
                }
                onPress={
                  openEndDatePicker
                }
              >
                <Text
                  style={[
                    styles.dateButtonText,

                    !endDate &&
                      styles.datePlaceholder,
                  ]}
                >
                  {endDate
                    ? formatDate(
                        endDate
                      )
                    : 'DD/MM/YYYY'}
                </Text>

                <Ionicons
                  name="calendar-outline"
                  size={17}
                  color={
                    COLORS.icon
                  }
                />
              </TouchableOpacity>
            </View>
          </View>


          {/* ESTADO */}

          <View
            style={[
              styles.infoRow,
              styles.lastInfoRow,
            ]}
          >
            <View
              style={
                styles.infoIcon
              }
            >
              <MaterialCommunityIcons
                name="briefcase-outline"
                size={18}
                color={COLORS.icon}
              />
            </View>

            <View
              style={
                styles.infoContent
              }
            >
              <Text
                style={
                  styles.infoLabel
                }
              >
                Estado
              </Text>

              <View
  style={[
    styles.statusBadge,

    status === 'Planificada' &&
      styles.statusBadgePlanned,

    status === 'En curso' &&
      styles.statusBadgeActive,

    status === 'Finalizada' &&
      styles.statusBadgeFinished,
  ]}
>
                <Text
  style={[
    styles.statusText,

    status === 'Planificada' &&
      styles.statusTextPlanned,

    status === 'En curso' &&
      styles.statusTextActive,

    status === 'Finalizada' &&
      styles.statusTextFinished,
  ]}
>
                  {status}
                </Text>
              </View>
            </View>
          </View>

        </View>


        {/* PRENDAS */}

        <View
          style={
            styles.sectionHeader
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Prendas de la maleta
          </Text>
        </View>


        {/* CONTADOR */}

        <View
          style={[
            styles.packedCountCard,

            isDesktop &&
              styles.packedCountCardDesktop,
          ]}
        >
          <View
            style={
              styles.packedCountIcon
            }
          >
            <Ionicons
              name="briefcase-outline"
              size={20}
              color={COLORS.icon}
            />
          </View>

          <Text
            style={
              styles.packedCountText
            }
          >
            Prendas cargadas:{' '}
            <Text
              style={
                styles.packedCountNumber
              }
            >
              {packedCount}
            </Text>
          </Text>
        </View>


        {/* LISTADO */}

        <View
          style={[
            styles.clothesList,

            isDesktop &&
              styles.clothesListDesktop,
          ]}
        >
          {visibleClothes.length === 0 ? (
            <View
              style={
                styles.emptyContainer
              }
            >
              <Ionicons
                name="shirt-outline"
                size={42}
                color={COLORS.icon}
              />

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No tenés prendas registradas
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Agregá prendas a tu armario
                para poder incluirlas
                en la maleta.
              </Text>
            </View>
          ) : (
            visibleClothes.map(
              renderClothingCard
            )
          )}
        </View>


        {/* GUARDAR */}

        <TouchableOpacity
          style={[
            styles.saveButton,

            saving &&
              styles.saveButtonDisabled,

            isDesktop &&
              styles.saveButtonDesktop,
          ]}
          onPress={
            handleSaveSuitcase
          }
          disabled={saving}
        >
          <Ionicons
            name="briefcase-outline"
            size={18}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.saveButtonText
            }
          >
         {saving
  ? 'Guardando...'
  : isEditing
    ? 'Guardar cambios'
    : 'Guardar maleta'}
          </Text>
        </TouchableOpacity>

      </ScrollView>


      {/* CALENDARIO */}

      <CalendarModal
        visible={
          calendarVisible
        }
        value={
          selectedCalendarDate
        }
        onSelect={
          handleCalendarSelect
        }
        onClose={
          closeCalendar
        }
      />


      {/* MODAL DE NOTAS */}

      <Modal
        visible={
          noteModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setNoteModalVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.noteModal
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              Nota de la prenda
            </Text>

            <Text
              style={
                styles.modalSubtitle
              }
            >
              {selectedClothing?.title ||
                ''}
            </Text>

            <TextInput
              value={
                noteText
              }
              onChangeText={(text) => {
  setNoteText(text);
  setSuccessMessageVisible(false);
}}
placeholder="Ej.: Llevar por si hace frío..."
              placeholderTextColor={
                COLORS.textLight
              }
              multiline
              style={
                styles.noteInput
              }
            />

            <View
              style={
                styles.modalActions
              }
            >
              <TouchableOpacity
                style={
                  styles.cancelButton
                }
                onPress={() =>
                  setNoteModalVisible(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.confirmButton
                }
                onPress={
                  saveNote
                }
              >
                <Text
                  style={
                    styles.confirmButtonText
                  }
                >
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

const styles =
  StyleSheet.create({

    screen: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

    scroll: {
      flex: 1,
    },

editingBanner: {
  flexDirection: 'row',
  alignItems: 'center',

  backgroundColor: '#F8F1FF',

  borderWidth: 1,
  borderColor: '#E8D9FA',

  borderRadius: 10,

  paddingHorizontal: 14,
  paddingVertical: 10,

  marginBottom: 12,
},

editingBannerText: {
  color: '#6F4A8E',

  fontSize: 10.5,

  fontFamily:
    'Poppins_600SemiBold',

  marginLeft: 8,
},


successBanner: {
  flexDirection: 'row',
  alignItems: 'center',

  backgroundColor: SUCCESS_BACKGROUND,

  borderWidth: 1,
  borderColor: SUCCESS_BORDER,

  borderRadius: 10,

  paddingHorizontal: 14,
  paddingVertical: 10,

  marginBottom: 12,
},

    successIcon: {
  width: 27,
  height: 27,

  borderRadius: 14,

  backgroundColor: '#FFFFFF',

  alignItems: 'center',
  justifyContent: 'center',

  marginRight: 9,
},

    successText: {
  flex: 1,

  color: SUCCESS_TEXT,

  fontSize: 10.5,

  fontFamily: 'Poppins_600SemiBold',
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

    loadingContainer: {
      flex: 1,

      backgroundColor:
        COLORS.background,

      justifyContent: 'center',
      alignItems: 'center',
    },

    loadingText: {
      marginTop: 10,

      color:
        COLORS.textLight,

      fontSize: 14,

      fontFamily:
        'Poppins_400Regular',
    },

    infoCard: {
      backgroundColor:
        '#FFFFFF',

      borderRadius: 14,

      paddingHorizontal: 14,
      paddingVertical: 7,

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
      paddingVertical: 10,
    },

    infoRow: {
      minHeight: 51,

      flexDirection: 'row',
      alignItems: 'center',

      borderBottomWidth: 1,
      borderBottomColor:
        '#F0EAF8',
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
      color:
        COLORS.textLight,

      fontSize: 10,

      fontFamily:
        'Poppins_400Regular',
    },

    // IMPORTANTE:
    // Sin background, border ni borderRadius.
    // El destino vuelve a verse limpio.
    infoInput: {
      color:
        COLORS.textDark,

      fontSize: 12,

      fontFamily:
        'Poppins_600SemiBold',

      paddingVertical: 1,
      paddingHorizontal: 0,

      marginTop: 1,

      backgroundColor:
        'transparent',
    },

    dateButton: {
      minHeight: 30,

      flexDirection: 'row',
      alignItems: 'center',

      justifyContent:
        'space-between',

      paddingVertical: 2,
      paddingRight: 2,
    },

    dateButtonText: {
      flex: 1,

      color:
        COLORS.textDark,

      fontSize: 12,

      fontFamily:
        'Poppins_600SemiBold',
    },

    datePlaceholder: {
      color:
        COLORS.textLight,

      fontFamily:
        'Poppins_400Regular',
    },

   statusBadge: {
  alignSelf: 'flex-start',

  backgroundColor:
    STATUS_PLANNED_BACKGROUND,

  borderWidth: 1,

  borderColor:
    STATUS_PLANNED_BORDER,

  borderRadius: 10,

  paddingHorizontal: 10,
  paddingVertical: 3,

  marginTop: 1,
},

statusText: {
  color:
    STATUS_PLANNED_TEXT,

  fontSize: 9,

  fontFamily:
    'Poppins_600SemiBold',
},

statusBadgePlanned: {
  backgroundColor:
    STATUS_PLANNED_BACKGROUND,

  borderColor:
    STATUS_PLANNED_BORDER,
},

statusTextPlanned: {
  color:
    STATUS_PLANNED_TEXT,
},

    statusBadgeActive: {
      backgroundColor:
        STATUS_ACTIVE_BACKGROUND,

      borderColor:
        STATUS_ACTIVE_BORDER,
    },

    statusTextActive: {
      color:
        STATUS_ACTIVE_TEXT,
    },

    statusBadgeFinished: {
      backgroundColor:
        STATUS_FINISHED_BACKGROUND,

      borderColor:
        STATUS_FINISHED_BORDER,
    },

    statusTextFinished: {
      color:
        STATUS_FINISHED_TEXT,
    },

    calendarOverlay: {
      flex: 1,

      backgroundColor:
        'rgba(0,0,0,0.35)',

      justifyContent: 'center',
      alignItems: 'center',

      padding: 20,
    },

    calendarModal: {
      width: '100%',
      maxWidth: 380,

      backgroundColor:
        '#FFFFFF',

      borderRadius: 16,

      padding: 18,
    },

    calendarHeader: {
      flexDirection: 'row',
      alignItems: 'center',

      justifyContent:
        'space-between',

      marginBottom: 15,
    },

    calendarArrow: {
      width: 36,
      height: 36,

      borderRadius: 18,

      backgroundColor:
        '#F8F1FF',

      justifyContent: 'center',
      alignItems: 'center',
    },

    calendarMonthTitle: {
      color:
        COLORS.textDark,

      fontSize: 15,

      fontFamily:
        'Poppins_600SemiBold',
    },

    weekDaysRow: {
      flexDirection: 'row',
      marginBottom: 5,
    },

    weekDay: {
      width: '14.2857%',
      height: 30,

      alignItems: 'center',
      justifyContent: 'center',
    },

    weekDayText: {
      color:
        COLORS.textLight,

      fontSize: 10,

      fontFamily:
        'Poppins_600SemiBold',
    },

    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },

    calendarDay: {
      width: '14.2857%',
      height: 42,

      alignItems: 'center',
      justifyContent: 'center',
    },

    calendarDayText: {
      width: 32,
      height: 32,

      textAlign: 'center',
      textAlignVertical: 'center',

      color:
        COLORS.textDark,

      fontSize: 11,

      fontFamily:
        'Poppins_400Regular',

      borderRadius: 16,

      paddingTop: 7,
    },

    calendarDayTextSelected: {
      color:
        '#FFFFFF',

      backgroundColor:
        COLORS.buttonDark,

      fontFamily:
        'Poppins_600SemiBold',
    },

    calendarDayTextToday: {
      color:
        COLORS.buttonDark,

      fontFamily:
        'Poppins_600SemiBold',
    },

    calendarActions: {
      alignItems: 'flex-end',
      marginTop: 12,
    },

    calendarCancelButton: {
      paddingHorizontal: 15,
      paddingVertical: 8,

      borderRadius: 8,

      backgroundColor:
        '#F3EFF6',
    },

    calendarCancelText: {
      color:
        COLORS.textLight,

      fontSize: 10,

      fontFamily:
        'Poppins_600SemiBold',
    },

    sectionHeader: {
      marginTop: 14,
      marginBottom: 8,
    },

    sectionTitle: {
      color:
        COLORS.textDark,

      fontSize: 14,

      fontFamily:
        'Poppins_600SemiBold',
    },

    // ========================================================
    // CONTADOR DE PRENDAS
    // ========================================================

    packedCountCard: {
      backgroundColor:
        '#FFFFFF',

      borderRadius: 14,

      padding: 11,

      flexDirection: 'row',
      alignItems: 'center',

      marginBottom: 9,
    },

    packedCountCardDesktop: {
      padding: 15,
    },

    packedCountIcon: {
      width: 38,
      height: 38,

      borderRadius: 10,

      backgroundColor:
        '#F8F1FF',

      justifyContent: 'center',
      alignItems: 'center',

      marginRight: 10,
    },

    packedCountText: {
      color:
        COLORS.textDark,

      fontSize: 10,

      fontFamily:
        'Poppins_400Regular',
    },

    packedCountNumber: {
      color:
        COLORS.buttonDark,

      fontFamily:
        'Poppins_600SemiBold',
    },

    clothesList: {
      gap: 7,
    },

    clothesListDesktop: {
      gap: 10,
    },

    clothingCard: {
      minHeight: 82,

      backgroundColor:
        '#FFFFFF',

      borderRadius: 12,

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

    clothingCardPacked: {
      borderWidth: 1,

      borderColor:
        SUCCESS_BORDER,

      backgroundColor:
        '#FEFFFE',
    },

    imageContainer: {
      width: 65,
      height: 68,

      borderRadius: 8,

      backgroundColor:
        '#F6F3F8',

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
      color:
        COLORS.textDark,

      fontSize: 11,

      fontFamily:
        'Poppins_600SemiBold',
    },

    clothingCategory: {
      color:
        COLORS.textLight,

      fontSize: 8.5,

      fontFamily:
        'Poppins_400Regular',

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
      borderColor:
        '#D7D1DD',

      marginRight: 4,
    },

    colorText: {
      color:
        COLORS.textLight,

      fontSize: 8.5,

      fontFamily:
        'Poppins_400Regular',
    },

    noteRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',

      marginTop: 4,

      paddingRight: 4,
    },

    noteText: {
      flex: 1,

      color:
        COLORS.buttonDark,

      fontSize: 7.5,

      fontFamily:
        'Poppins_400Regular',

      marginLeft: 3,
    },

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
      color:
        COLORS.textLight,

      fontSize: 6.5,

      fontFamily:
        'Poppins_400Regular',

      marginTop: 2,

      textAlign: 'center',
    },

    checkbox: {
      width: 18,
      height: 18,

      borderRadius: 4,

      borderWidth: 1,
      borderColor:
        '#A9A1B0',

      justifyContent: 'center',
      alignItems: 'center',

      backgroundColor:
        '#FFFFFF',
    },

    checkboxChecked: {
      backgroundColor:
        COLORS.buttonDark,

      borderColor:
        COLORS.buttonDark,
    },

    emptyContainer: {
      backgroundColor:
        'rgba(255,255,255,0.9)',

      borderRadius: 12,

      padding: 30,

      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyTitle: {
      color:
        COLORS.textDark,

      fontSize: 13,

      fontFamily:
        'Poppins_600SemiBold',

      marginTop: 10,

      textAlign: 'center',
    },

    emptyText: {
      color:
        COLORS.textLight,

      fontSize: 10,

      fontFamily:
        'Poppins_400Regular',

      marginTop: 5,

      textAlign: 'center',

      maxWidth: 280,
    },

    saveButton: {
      height: 42,

      backgroundColor:
        COLORS.buttonDark,

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
      color:
        '#FFFFFF',

      fontSize: 11,

      fontFamily:
        'Poppins_600SemiBold',

      marginLeft: 7,
    },

    modalOverlay: {
      flex: 1,

      backgroundColor:
        'rgba(0,0,0,0.35)',

      justifyContent: 'center',
      alignItems: 'center',

      padding: 20,
    },

    noteModal: {
      width: '100%',
      maxWidth: 420,

      backgroundColor:
        '#FFFFFF',

      borderRadius: 16,

      padding: 20,
    },

    modalTitle: {
      color:
        COLORS.textDark,

      fontSize: 17,

      fontFamily:
        'Poppins_600SemiBold',
    },

    modalSubtitle: {
      color:
        COLORS.textLight,

      fontSize: 11,

      fontFamily:
        'Poppins_400Regular',

      marginTop: 3,
      marginBottom: 12,
    },

    noteInput: {
      minHeight: 90,

      borderWidth: 1,

      borderColor:
        '#E4DCEC',

      borderRadius: 10,

      padding: 12,

      color:
        COLORS.textDark,

      fontSize: 12,

      fontFamily:
        'Poppins_400Regular',

      textAlignVertical:
        'top',
    },

    modalActions: {
      flexDirection: 'row',

      justifyContent:
        'flex-end',

      marginTop: 15,

      gap: 8,
    },

    cancelButton: {
      paddingHorizontal: 15,
      paddingVertical: 9,

      borderRadius: 8,

      backgroundColor:
        '#F3EFF6',
    },

    cancelButtonText: {
      color:
        COLORS.textLight,

      fontSize: 10,

      fontFamily:
        'Poppins_600SemiBold',
    },

    confirmButton: {
      paddingHorizontal: 18,
      paddingVertical: 9,

      borderRadius: 8,

      backgroundColor:
        COLORS.buttonDark,
    },

    confirmButtonText: {
      color:
        '#FFFFFF',

      fontSize: 10,

      fontFamily:
        'Poppins_600SemiBold',
    },
  });