import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Platform,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import jpeg from 'jpeg-js';

import { COLORS } from '../theme/colours';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { removeBackground } from '../services/bgRemoveService';
import { addClothingItem } from '../services/database';
import AlertMessage from '../components/AlertMessage';
import { MESSAGES } from '../theme/messages';
import { OutfitScreenLayout } from '../navigation/MainTabNavigator';
/* ============================================================
   CATEGORÍAS
   ============================================================ */

const CATEGORIES = [
  'Camisetas / Tops',
  'Camisas / Blusas',
  'Pantalones',
  'Shorts',
  'Faldas',
  'Vestidos',
  'Abrigos',
  'Buzos / Sweaters',
  'Trajes / Conjuntos',
  'Ropa interior',
  'Calzado',
  'Accesorios',
  'Otra categoría',
];

/* ============================================================
   TEMPORADAS
   ============================================================ */

const SEASONS = [
  'Verano',
  'Invierno',
  'Primavera',
  'Otoño',
  'Todas',
  'Otra temporada',
];

/* ============================================================
   OCASIONES
   ============================================================ */

const OCASIONES = [
  'Casual',
  'Formal',
  'Deporte',
  'Fiesta',
  'Trabajo',
  'Playa',
  'Viaje',
  'Evento',
  'Casa',
  'Noche',
  'Diario',
  'Otra ocasión',
];

/* ============================================================
   COLORES

   IMPORTANTE:
   - En la base de datos se guarda solamente el NOMBRE.
   - Nunca se guarda HEX.
   - Nunca se guarda rgb(...).
   - RGB solamente se utiliza internamente para analizar
     el píxel y mostrar el color visualmente.
   ============================================================ */

const COLORS_LIST = [
  { name: 'Negro', rgb: [0, 0, 0] },
  { name: 'Blanco', rgb: [255, 255, 255] },
  { name: 'Gris oscuro', rgb: [75, 85, 99] },
  { name: 'Gris', rgb: [128, 128, 128] },
  { name: 'Gris claro', rgb: [209, 213, 219] },

  { name: 'Rojo', rgb: [220, 38, 38] },
  { name: 'Rojo oscuro', rgb: [153, 27, 27] },
  { name: 'Rosa', rgb: [236, 72, 153] },
  { name: 'Rosa claro', rgb: [249, 168, 212] },

  { name: 'Naranja', rgb: [249, 115, 22] },
  { name: 'Amarillo', rgb: [234, 179, 8] },
  { name: 'Crema', rgb: [255, 247, 214] },

  { name: 'Verde', rgb: [22, 163, 74] },
  { name: 'Verde oscuro', rgb: [22, 101, 52] },
  { name: 'Verde claro', rgb: [134, 239, 172] },

  { name: 'Celeste', rgb: [56, 189, 248] },
  { name: 'Azul', rgb: [30, 64, 175] },
  { name: 'Azul oscuro', rgb: [30, 58, 138] },

  { name: 'Violeta', rgb: [156, 78, 221] },
  { name: 'Lila', rgb: [196, 181, 253] },

  { name: 'Marrón', rgb: [146, 64, 14] },
  { name: 'Beige', rgb: [212, 185, 150] },
  {
  name: 'Multicolor',
  rgb: null,
},
];

const OTHER_COLOR_OPTION = 'Otro color';
const DESCRIPTION_MAX_LENGTH = 150;
const IMAGE_BOX_SIZE = 220;

/* ============================================================
   UTILIDADES DE COLOR
   ============================================================ */

const rgbToCss = ([r, g, b]) => {
  return `rgb(${r}, ${g}, ${b})`;
};

const colorDistance = (a, b) => {
  return (
    Math.pow(a[0] - b[0], 2) +
    Math.pow(a[1] - b[1], 2) +
    Math.pow(a[2] - b[2], 2)
  );
};

const findClosestColor = (r, g, b) => {
  const sample = [r, g, b];

  let closest = COLORS_LIST[0];
  let distance = Infinity;

 COLORS_LIST.forEach((color) => {
  if (!color.rgb) {
    return;
  }

  const currentDistance = colorDistance(
    sample,
    color.rgb
  );

  if (currentDistance < distance) {
    distance = currentDistance;
    closest = color;
  }
});

  return closest;
};

/* ============================================================
   BASE64 → UINT8ARRAY
   ============================================================ */

const base64ToUint8Array = (base64) => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  const clean = base64.replace(/\s/g, '');

  const outputLength =
    Math.floor((clean.length * 3) / 4);

  const bytes =
    new Uint8Array(outputLength);

  let byteIndex = 0;

  for (let i = 0; i < clean.length; i += 4) {
    const a = chars.indexOf(clean[i]);
    const b = chars.indexOf(clean[i + 1]);

    const c =
      clean[i + 2] === '='
        ? 0
        : chars.indexOf(clean[i + 2]);

    const d =
      clean[i + 3] === '='
        ? 0
        : chars.indexOf(clean[i + 3]);

    if (a < 0 || b < 0) {
      continue;
    }

    const triple =
      (a << 18) |
      (b << 12) |
      ((c < 0 ? 0 : c) << 6) |
      (d < 0 ? 0 : d);

    if (byteIndex < bytes.length) {
      bytes[byteIndex++] =
        (triple >> 16) & 255;
    }

    if (
      clean[i + 2] !== '=' &&
      byteIndex < bytes.length
    ) {
      bytes[byteIndex++] =
        (triple >> 8) & 255;
    }

    if (
      clean[i + 3] !== '=' &&
      byteIndex < bytes.length
    ) {
      bytes[byteIndex++] =
        triple & 255;
    }
  }

  return bytes;
};

/* ============================================================
   TAMAÑO DE IMAGEN
   ============================================================ */

const getImageSize = (uri) =>
  new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (imageWidth, imageHeight) => {
        resolve({
          width: imageWidth,
          height: imageHeight,
        });
      },
      reject
    );
  });

/* ============================================================
   RECTÁNGULO REAL DE LA IMAGEN

   La imagen está dentro del cuadro 220x220 utilizando
   "contain". Esto permite convertir correctamente la
   posición donde hizo clic el usuario al píxel original.
   ============================================================ */

const getDisplayedImageRect = (
  imageWidth,
  imageHeight
) => {
  const scale = Math.min(
    IMAGE_BOX_SIZE / imageWidth,
    IMAGE_BOX_SIZE / imageHeight
  );

  const displayedWidth =
    imageWidth * scale;

  const displayedHeight =
    imageHeight * scale;

  return {
    scale,
    width: displayedWidth,
    height: displayedHeight,
    offsetX:
      (IMAGE_BOX_SIZE - displayedWidth) / 2,
    offsetY:
      (IMAGE_BOX_SIZE - displayedHeight) / 2,
  };
};

/* ============================================================
   WEB
   ============================================================ */

const samplePixelOnWeb = async (
  uri,
  x,
  y,
  imageWidth,
  imageHeight
) => {
  if (
    typeof window === 'undefined' ||
    typeof window.Image === 'undefined'
  ) {
    throw new Error(
      'El navegador no permite leer la imagen.'
    );
  }

  const image =
    new window.Image();

  image.crossOrigin = 'anonymous';

  const loadedImage =
    new Promise(
      (resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      }
    );

  image.src = uri;

  await loadedImage;

  const rect =
    getDisplayedImageRect(
      imageWidth,
      imageHeight
    );

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y)
  ) {
    throw new Error(
      'Las coordenadas del puntero no son válidas.'
    );
  }

  if (
    x < rect.offsetX ||
    x > rect.offsetX + rect.width ||
    y < rect.offsetY ||
    y > rect.offsetY + rect.height
  ) {
    return null;
  }

  const relativeX =
    x - rect.offsetX;

  const relativeY =
    y - rect.offsetY;

  let imageX =
    Math.floor(
      relativeX / rect.scale
    );

  let imageY =
    Math.floor(
      relativeY / rect.scale
    );

  /*
   * Garantizamos coordenadas válidas
   * dentro de la imagen original.
   */

  if (!Number.isFinite(imageX)) {
    imageX = 0;
  }

  if (!Number.isFinite(imageY)) {
    imageY = 0;
  }

  imageX = Math.max(
    0,
    Math.min(
      imageWidth - 1,
      Math.round(imageX)
    )
  );

  imageY = Math.max(
    0,
    Math.min(
      imageHeight - 1,
      Math.round(imageY)
    )
  );

  const canvas =
    document.createElement(
      'canvas'
    );

  /*
   * Canvas siempre recibe dimensiones
   * enteras y válidas.
   */

  const canvasWidth =
    Math.max(
      1,
      Math.round(imageWidth)
    );

  const canvasHeight =
    Math.max(
      1,
      Math.round(imageHeight)
    );

  canvas.width =
    canvasWidth;

  canvas.height =
    canvasHeight;

  const context =
    canvas.getContext(
      '2d',
      {
        willReadFrequently: true,
      }
    );

  if (!context) {
    throw new Error(
      'No se pudo crear el lector de píxeles.'
    );
  }

  context.drawImage(
    image,
    0,
    0,
    canvasWidth,
    canvasHeight
  );

  /*
   * getImageData necesita enteros.
   * Además, los mantenemos dentro
   * de los límites reales del canvas.
   */

  const safeX =
    Math.max(
      0,
      Math.min(
        canvasWidth - 1,
        Math.round(imageX)
      )
    );

  const safeY =
    Math.max(
      0,
      Math.min(
        canvasHeight - 1,
        Math.round(imageY)
      )
    );

  if (
    !Number.isInteger(safeX) ||
    !Number.isInteger(safeY)
  ) {
    throw new Error(
      'Las coordenadas del píxel no son válidas.'
    );
  }

  const pixelData =
    context.getImageData(
      safeX,
      safeY,
      1,
      1
    ).data;

  return {
    r: pixelData[0],
    g: pixelData[1],
    b: pixelData[2],
  };
};

/* ============================================================
   COMPONENTE
   ============================================================ */

export default function AddClothingScreen({
  navigation,
  route,
}) {
  const { width } =
    useWindowDimensions();

  const isDesktop =
    width > 768;

  const user =
    route?.params?.user;
  /* ==========================================================
     FORMULARIO
     ========================================================== */

  const [title, setTitle] =
    useState('');

  const [imageUri, setImageUri] =
    useState(null);

  const [imageDimensions, setImageDimensions] =
    useState(null);

  const [category, setCategory] =
    useState('');

  const [season, setSeason] =
    useState('');

  const [ocasion, setOcasion] =
    useState('');

  const [selectedColor, setSelectedColor] =
    useState('');

  const [description, setDescription] =
    useState('');

  /* ==========================================================
     PERSONALIZADOS
     ========================================================== */

  const [customCategory, setCustomCategory] =
    useState('');

  const [customSeason, setCustomSeason] =
    useState('');

  const [customOcasion, setCustomOcasion] =
    useState('');

  const [isCustomCategory, setIsCustomCategory] =
    useState(false);

  const [isCustomSeason, setIsCustomSeason] =
    useState(false);

  const [isCustomOcasion, setIsCustomOcasion] =
    useState(false);

  /* ==========================================================
     COLOR POR PUNTERO
     ========================================================== */

  const [isColorPickerMode, setIsColorPickerMode] =
    useState(false);

  const [sampledColor, setSampledColor] =
    useState(null);

  const [samplePoint, setSamplePoint] =
    useState(null);

  const [isSamplingColor, setIsSamplingColor] =
    useState(false);

  /* ==========================================================
     CARGA
     ========================================================== */

  const [isRemovingBg, setIsRemovingBg] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);
const [alertMessage, setAlertMessage] = useState('');
  /* ==========================================================
     DROPDOWN DESKTOP
     ========================================================== */

  const [openDropdown, setOpenDropdown] =
    useState(null);

  /* ==========================================================
     VALORES FINALES
     ========================================================== */

  const finalCategory =
    isCustomCategory
      ? customCategory.trim()
      : category;

  const finalSeason =
    isCustomSeason
      ? customSeason.trim()
      : season;

  const finalOcasion =
    isCustomOcasion
      ? customOcasion.trim()
      : ocasion;

  /* ==========================================================
     CATEGORÍA
     ========================================================== */

  const selectCategory = (
    value
  ) => {
    if (
      value === 'Otra categoría'
    ) {
      setCategory('');
      setCustomCategory('');
      setIsCustomCategory(true);
    } else {
      setIsCustomCategory(false);
      setCustomCategory('');
      setCategory(value);
    }

    setOpenDropdown(null);
  };

  /* ==========================================================
     TEMPORADA
     ========================================================== */

  const selectSeason = (
    value
  ) => {
    if (
      value === 'Otra temporada'
    ) {
      setSeason('');
      setCustomSeason('');
      setIsCustomSeason(true);
    } else {
      setIsCustomSeason(false);
      setCustomSeason('');
      setSeason(value);
    }

    setOpenDropdown(null);
  };

  /* ==========================================================
     OCASIÓN
     ========================================================== */

  const selectOcasion = (
    value
  ) => {
    if (
      value === 'Otra ocasión'
    ) {
      setOcasion('');
      setCustomOcasion('');
      setIsCustomOcasion(true);
    } else {
      setIsCustomOcasion(false);
      setCustomOcasion('');
      setOcasion(value);
    }

    setOpenDropdown(null);
  };

  /* ==========================================================
     COLOR MANUAL
     ========================================================== */

  const selectColor = (
    colorName
  ) => {
    const color =
      COLORS_LIST.find(
        (item) =>
          item.name === colorName
      );

    if (!color) {
      return;
    }

    setSelectedColor(
      color.name
    );

    setSampledColor(
      rgbToCss(color.rgb)
    );

    setIsColorPickerMode(false);
    setSamplePoint(null);
  };

  /* ==========================================================
     ACTIVAR PUNTERO DE COLOR
     ========================================================== */

  const activateColorPicker = () => {
    if (!imageUri) {
      Alert.alert(
        'Primero seleccioná una imagen',
        'Necesitás cargar una foto de la prenda antes de utilizar el selector de color.'
      );

      return;
    }

    setIsColorPickerMode(true);
    setSamplePoint(null);

    /*
     * No borramos el color anterior inmediatamente.
     * Así el usuario puede volver a elegir otro punto
     * sin perder el estado visual.
     */
  };

  /* ==========================================================
     DIMENSIONES
     ========================================================== */

  const prepareImage = async (
    uri
  ) => {
    const dimensions =
      await getImageSize(uri);

    setImageDimensions(
      dimensions
    );
  };

  /* ==========================================================
     DETECTAR COLOR
     ========================================================== */

  const sampleColorFromImage =
    async (x, y) => {
      if (
        !imageUri ||
        !imageDimensions ||
        isSamplingColor ||
        !isColorPickerMode
      ) {
        return;
      }

      try {
        setIsSamplingColor(
          true
        );

        /*
         * Guardamos exactamente dónde hizo clic/tocó.
         */

        setSamplePoint({
          x,
          y,
        });

        let pixel = null;

        if (
          Platform.OS === 'web'
        ) {
          pixel =
            await samplePixelOnWeb(
              imageUri,
              x,
              y,
              imageDimensions.width,
              imageDimensions.height
            );
        } else {
          pixel =
            await samplePixelOnNative(
              imageUri,
              x,
              y,
              imageDimensions.width,
              imageDimensions.height
            );
        }

        if (!pixel) {
          Alert.alert(
            'Seleccioná la prenda',
            'El punto elegido está fuera de la imagen.'
          );

          return;
        }

        /*
         * Buscamos el nombre más cercano.
         */

        const closestColor =
          findClosestColor(
            pixel.r,
            pixel.g,
            pixel.b
          );

        /*
         * El RGB se utiliza solamente para mostrar
         * visualmente el color detectado.
         *
         * En la BD se guarda:
         * closestColor.name
         */

        setSampledColor(
          rgbToCss([
            pixel.r,
            pixel.g,
            pixel.b,
          ])
        );

        setSelectedColor(
          closestColor.name
        );

        /*
         * Una vez elegido el color, salimos del modo
         * puntero.
         */

        setIsColorPickerMode(
          false
        );
      } catch (error) {
        console.error(
          'Error al detectar color:',
          error
        );

        Alert.alert(
          'No se pudo detectar el color',
          'No fue posible leer el punto seleccionado. Probá tocando directamente sobre una zona de la prenda.'
        );
      } finally {
        setIsSamplingColor(
          false
        );
      }
    };

  /* ==========================================================
     SELECCIÓN DE IMAGEN
     ========================================================== */

  const pickImage = async (
    useCamera = false
  ) => {
    try {
      let result;

      if (useCamera) {
        const { status } =
          await ImagePicker.requestCameraPermissionsAsync();

        if (
          status !== 'granted'
        ) {
          Alert.alert(
            'Permiso denegado',
            'Se requiere acceso a la cámara para tomar fotos.'
          );

          return;
        }

        result =
          await ImagePicker.launchCameraAsync(
            {
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 0.8,
            }
          );
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (
          status !== 'granted'
        ) {
          Alert.alert(
            'Permiso denegado',
            'Se requiere acceso a la galería.'
          );

          return;
        }

        result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 0.8,
            }
          );
      }

      if (
        !result.canceled &&
        result.assets?.length
      ) {
        const uri =
          result.assets[0].uri;

        setImageUri(uri);

        setSampledColor(null);
        setSelectedColor('');
        setSamplePoint(null);
        setIsColorPickerMode(false);
        setImageDimensions(null);

        await prepareImage(uri);
      }
    } catch (error) {
      console.error(
        'Error al seleccionar imagen:',
        error
      );

      Alert.alert(
        'Error',
        'No se pudo seleccionar la imagen.'
      );
    }
  };

  /* ==========================================================
     REMOVER FONDO
     ========================================================== */

  const handleRemoveBackground =
    async () => {
      if (!imageUri) {
        Alert.alert(
          'Atención',
          'Primero seleccioná una imagen.'
        );

        return;
      }

      setIsRemovingBg(
        true
      );

      try {
        const processedUri =
          await removeBackground(
            imageUri
          );

        if (processedUri) {
          setImageUri(
            processedUri
          );

          setSampledColor(null);
          setSelectedColor('');
          setSamplePoint(null);
          setIsColorPickerMode(false);

          await prepareImage(
            processedUri
          );

          Alert.alert(
            '¡Éxito!',
            'Fondo reemplazado por blanco correctamente.'
          );
        } else {
          Alert.alert(
            'Aviso',
            'No se pudo remover el fondo. Se mantendrá la imagen original.'
          );
        }
      } catch (error) {
        console.error(
          'Error al remover fondo:',
          error
        );

        Alert.alert(
          'Error',
          'Ocurrió un fallo al procesar la imagen.'
        );
      } finally {
        setIsRemovingBg(
          false
        );
      }
    };

  /* ==========================================================
     GUARDAR
     ========================================================== */

  const handleSave =
    async () => {
      if (!title.trim()) {
        Alert.alert(
          'Campo obligatorio',
          'Ingresá un nombre para la prenda.'
        );

        return;
      }

      if (!imageUri) {
        Alert.alert(
          'Campo obligatorio',
          'Por favor seleccioná o tomá una foto de la prenda.'
        );

        return;
      }

      if (!finalCategory) {
        Alert.alert(
          'Campo obligatorio',
          'Seleccioná una categoría o escribí una categoría personalizada.'
        );

        return;
      }

      if (
        isCustomSeason &&
        !finalSeason
      ) {
        Alert.alert(
          'Campo obligatorio',
          'Escribí una temporada personalizada.'
        );

        return;
      }

      if (
        isCustomOcasion &&
        !finalOcasion
      ) {
        Alert.alert(
          'Campo obligatorio',
          'Escribí una ocasión personalizada.'
        );

        return;
      }

      setIsSaving(true);

      try {
        const clothingData = {
          userId:
            user?.id || 1,

          title:
            title.trim(),

          imageUri,

          category:
            finalCategory,

          /*
           * SOLAMENTE se guarda el nombre:
           *
           * "Azul"
           * "Rojo"
           * "Verde"
           *
           * Nunca HEX.
           * Nunca RGB.
           */

          color:
            selectedColor,

          season:
            finalSeason,

          ocasion:
            finalOcasion,

          description:
            description.trim(),
        };

        const result =
          await addClothingItem(
            clothingData
          );

      if (result.success) {
  setAlertMessage(MESSAGES.ITEM_ADDED);
        } else {
          Alert.alert(
            'Error',
            result.message ||
              'No se pudo guardar la prenda en la base de datos.'
          );
        }
      } catch (error) {
        console.error(
          'Error al guardar prenda:',
          error
        );

        Alert.alert(
          'Error',
          'Surgió un error al intentar guardar.'
        );
      } finally {
        setIsSaving(
          false
        );
      }
    };

  /* ==========================================================
     INPUT PERSONALIZADO
     ========================================================== */

  const renderCustomInput =
    (type) => {
      const isCategoryInput =
        type === 'category';

      const isSeasonInput =
        type === 'season';

      const value =
        isCategoryInput
          ? customCategory
          : isSeasonInput
            ? customSeason
            : customOcasion;

      const setValue =
        isCategoryInput
          ? setCustomCategory
          : isSeasonInput
            ? setCustomSeason
            : setCustomOcasion;

      const label =
        isCategoryInput
          ? 'Otra categoría'
          : isSeasonInput
            ? 'Otra temporada'
            : 'Otra ocasión';

      const placeholder =
        isCategoryInput
          ? 'Escribí una categoría...'
          : isSeasonInput
            ? 'Escribí una temporada...'
            : 'Escribí una ocasión...';

      return (
        <View
          style={
            styles.customOptionBox
          }
        >
          <Text
            style={
              styles.customOptionLabel
            }
          >
            {label}
          </Text>

          <TextInput
            value={value}
            onChangeText={
              setValue
            }
            placeholder={
              placeholder
            }
            placeholderTextColor={
              COLORS.primary
            }
            style={
              styles.customOptionInput
            }
            autoCapitalize="sentences"
            returnKeyType="done"
          />
        </View>
      );
    };

  /* ==========================================================
     DROPDOWN DESKTOP
     ========================================================== */

  const renderDropdownRow = (
    key,
    icon,
    label,
    value,
    placeholder,
    options,
    onSelect,
    isColorRow = false
  ) => {
    const isOpen =
      openDropdown === key;

    let displayValue =
      value;

    if (
      key === 'category' &&
      isCustomCategory
    ) {
      displayValue =
        customCategory;
    }

    if (
      key === 'season' &&
      isCustomSeason
    ) {
      displayValue =
        customSeason;
    }

    if (
      key === 'ocasion' &&
      isCustomOcasion
    ) {
      displayValue =
        customOcasion;
    }

    return (
      <View
        key={key}
        style={
          styles.dropdownRowWrapper
        }
      >
        <Pressable
          style={
            styles.dropdownRow
          }
          onPress={() =>
            setOpenDropdown(
              isOpen
                ? null
                : key
            )
          }
        >
          <View
            style={
              styles.dropdownRowLeft
            }
          >
            <View
              style={
                styles.dropdownIconCircle
              }
            >
              <Ionicons
                name={icon}
                size={16}
                color={
                  COLORS.primary
                }
              />
            </View>

            <Text
              style={
                styles.dropdownLabel
              }
            >
              {label}
            </Text>
          </View>

          <View
            style={
              styles.dropdownRowRight
            }
          >
           {isColorRow && displayValue && (
  COLORS_LIST.find(
    (c) =>
      c.name === displayValue
  )?.rgb ? (
    <View
      style={[
        styles.dropdownColorPreview,
        {
          backgroundColor:
            sampledColor ||
            rgbToCss(
              COLORS_LIST.find(
                (c) =>
                  c.name ===
                  displayValue
              ).rgb
            ),
        },
      ]}
    />
  ) : (
    <Ionicons
      name="color-palette-outline"
      size={16}
      color={COLORS.primary}
    />
  )
)}

            <Text
              style={[
                styles.dropdownValue,
                !displayValue &&
                  styles.dropdownPlaceholder,
              ]}
            >
              {displayValue ||
                placeholder}
            </Text>

            <Ionicons
              name={
                isOpen
                  ? 'chevron-up'
                  : 'chevron-down'
              }
              size={16}
              color={
                COLORS.textLight
              }
            />
          </View>
        </Pressable>

        {isOpen && (
          <View
            style={
              styles.dropdownOptionsWrap
            }
          >
            {isColorRow && (
              <Pressable
                style={[
                  styles.dropdownChip,
                  styles.customDropdownChip,
                  isColorPickerMode &&
                    styles.customDropdownChipActive,
                ]}
                onPress={() => {
                  setOpenDropdown(null);
                  activateColorPicker();
                }}
              >
                <Ionicons
                  name="color-wand-outline"
                  size={14}
                  color={
                    COLORS.background
                  }
                />

                <Text
                  style={
                    styles.customDropdownChipText
                  }
                >
                  {OTHER_COLOR_OPTION}
                </Text>
              </Pressable>
            )}

            {options.map(
              (option) => {
                const optionName =
                  isColorRow
                    ? option.name
                    : option;

                const isSelected =
                  isColorRow
                    ? selectedColor ===
                      optionName
                    : key ===
                        'category'
                      ? !isCustomCategory &&
                        category ===
                          optionName
                      : key ===
                          'season'
                        ? !isCustomSeason &&
                          season ===
                            optionName
                        : key ===
                            'ocasion'
                          ? !isCustomOcasion &&
                            ocasion ===
                              optionName
                          : value ===
                            optionName;

                const isCustomOption =
                  optionName ===
                    'Otra categoría' ||
                  optionName ===
                    'Otra temporada' ||
                  optionName ===
                    'Otra ocasión';

                return (
                  <Pressable
                    key={
                      optionName
                    }
                    style={[
                      styles.dropdownChip,

                      isSelected &&
                        styles.dropdownChipActive,

                      isCustomOption &&
                        styles.customDropdownChip,
                    ]}
                    onPress={() => {
                      if (
                        isColorRow
                      ) {
                        selectColor(
                          optionName
                        );
                        setOpenDropdown(
                          null
                        );
                      } else {
                        onSelect(
                          optionName
                        );
                      }
                    }}
                  >
                    {isColorRow && (
  option.rgb ? (
    <View
      style={[
        styles.dropdownColorDot,
        {
          backgroundColor:
            rgbToCss(option.rgb),
        },
      ]}
    />
  ) : (
    <Ionicons
      name="color-palette-outline"
      size={16}
      color={COLORS.primary}
    />
  )
)}

                    <Text
                      style={[
                        styles.dropdownChipText,

                        isSelected &&
                          styles.dropdownChipTextActive,

                        isCustomOption &&
                          styles.customDropdownChipText,
                      ]}
                    >
                      {
                        optionName
                      }
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>
        )}

        {key === 'category' &&
          isCustomCategory &&
          renderCustomInput(
            'category'
          )}

        {key === 'season' &&
          isCustomSeason &&
          renderCustomInput(
            'season'
          )}

        {key === 'ocasion' &&
          isCustomOcasion &&
          renderCustomInput(
            'ocasion'
          )}

        {isColorRow &&
          isColorPickerMode && (
            <View
              style={
                styles.colorPickerDesktopNotice
              }
            >
              <Ionicons
                name="color-wand-outline"
                size={16}
                color={
                  COLORS.primary
                }
              />

              <Text
                style={
                  styles.colorPickerDesktopNoticeText
                }
              >
                Tocá o hacé clic sobre la prenda para elegir el color
              </Text>
            </View>
          )}
      </View>
    );
  };

  /* ==========================================================
     BLOQUE DE IMAGEN
     ========================================================== */

  const imageBlock = (
    <>
      <View
        style={
          styles.imagePreviewContainer
        }
      >
        {imageUri ? (
          <Pressable
            style={
              styles.imageTouchArea
            }
           onPress={(event) => {
  if (
    !isColorPickerMode ||
    isSamplingColor
  ) {
    return;
  }

  const nativeEvent =
    event.nativeEvent;

  let x =
    nativeEvent.locationX;

  let y =
    nativeEvent.locationY;

  /*
   * En Web, React Native Web puede no proporcionar
   * locationX/locationY correctamente.
   *
   * En ese caso calculamos la posición directamente
   * usando clientX/clientY y el rectángulo del elemento.
   */

  if (
    Platform.OS === 'web' &&
    (
      !Number.isFinite(x) ||
      !Number.isFinite(y)
    )
  ) {
    const element =
      event.currentTarget;

    if (
      element &&
      typeof element.getBoundingClientRect ===
        'function'
    ) {
      const bounds =
        element.getBoundingClientRect();

      if (
        Number.isFinite(
          nativeEvent.clientX
        ) &&
        Number.isFinite(
          nativeEvent.clientY
        )
      ) {
        x =
          nativeEvent.clientX -
          bounds.left;

        y =
          nativeEvent.clientY -
          bounds.top;
      }
    }
  }

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y)
  ) {
    console.error(
      'No se pudieron obtener coordenadas válidas:',
      nativeEvent
    );

    return;
  }

  sampleColorFromImage(
    x,
    y
  );
}}
          >
            <Image
              source={{
                uri: imageUri,
              }}
              style={
                styles.imagePreview
              }
              resizeMode="contain"
            />

            {samplePoint &&
              sampledColor && (
                <View
                  pointerEvents="none"
                  style={[
                    styles.samplePoint,
                    {
                      left:
                        samplePoint.x -
                        9,
                      top:
                        samplePoint.y -
                        9,
                      backgroundColor:
                        sampledColor,
                    },
                  ]}
                />
              )}

            {isColorPickerMode &&
              !isSamplingColor && (
                <View
                  pointerEvents="none"
                  style={
                    styles.colorPickerActiveOverlay
                  }
                >
                  <View
                    style={
                      styles.colorPickerActiveBadge
                    }
                  >
                    <Ionicons
                      name="color-wand-outline"
                      size={15}
                      color={
                        COLORS.primary
                      }
                    />

                    <Text
                      style={
                        styles.colorPickerActiveText
                      }
                    >
                      Tocá la prenda
                    </Text>
                  </View>
                </View>
              )}

            {isSamplingColor && (
              <View
                pointerEvents="none"
                style={
                  styles.colorSamplingOverlay
                }
              >
                <ActivityIndicator
                  size="small"
                  color={
                    COLORS.primary
                  }
                />

                <Text
                  style={
                    styles.colorSamplingText
                  }
                >
                  Detectando color...
                </Text>
              </View>
            )}
          </Pressable>
        ) : (
          <View
            style={
              styles.placeholderContainer
            }
          >
            <Ionicons
              name="camera-outline"
              size={60}
              color={
                COLORS.primary
              }
            />

            <Text
              style={
                styles.placeholderTitle
              }
            >
              Tomar o seleccionar foto
            </Text>

            <Text
              style={
                styles.placeholderText
              }
            >
              Subí una imagen de tu prenda
            </Text>
          </View>
        )}

        {isRemovingBg && (
          <View
            style={[
              styles.loadingOverlay,
              {
                pointerEvents:
                  'none',
              },
            ]}
          >
            <ActivityIndicator
              size="large"
              color={
                COLORS.primary
              }
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Poniendo fondo blanco...
            </Text>
          </View>
        )}
      </View>

      {/* BOTONES DE FOTO */}

      <View
        style={
          styles.photoActionsRow
        }
      >
        <Pressable
          style={
            styles.photoButton
          }
          onPress={() =>
            pickImage(false)
          }
        >
          <Ionicons
            name="images-outline"
            size={18}
            color={
              COLORS.primary
            }
          />

          <Text
            style={
              styles.photoButtonText
            }
          >
            Galería
          </Text>
        </Pressable>

        {Platform.OS !==
          'web' && (
          <Pressable
            style={
              styles.photoButton
            }
            onPress={() =>
              pickImage(true)
            }
          >
            <Ionicons
              name="camera-outline"
              size={18}
              color={
                COLORS.primary
              }
            />

            <Text
              style={
                styles.photoButtonText
              }
            >
              Cámara
            </Text>
          </Pressable>
        )}
      </View>

      {/* REMOVER FONDO */}

      {imageUri && (
        <Pressable
          style={
            styles.bgRemoveButton
          }
          onPress={
            handleRemoveBackground
          }
          disabled={
            isRemovingBg
          }
        >
          <Ionicons
            name="sparkles"
            size={18}
            color="white"
          />

          <Text
            style={
              styles.bgRemoveButtonText
            }
          >
            Poner fondo blanco con IA
          </Text>
        </Pressable>
      )}

      {/* SELECTOR DE COLOR */}

      {imageUri && (
        <Pressable
          style={[
            styles.colorPickerButton,
            isColorPickerMode &&
              styles.colorPickerButtonActive,
          ]}
          onPress={
            activateColorPicker
          }
          disabled={
            isSamplingColor
          }
        >
          <Ionicons
            name="color-wand-outline"
            size={18}
            color={
              COLORS.background
            }
          />

          <Text
            style={
              styles.colorPickerButtonText
            }
          >
            {isColorPickerMode
              ? 'Selector activo: tocá la prenda'
              : 'Elegir color de la prenda'}
          </Text>
        </Pressable>
      )}

      {imageUri && (
        <Text
          style={
            styles.colorPickerHint
          }
        >
          También podés tocar “Otro color” y después tocar directamente sobre la prenda.
        </Text>
      )}
    </>
  );

  /* ==========================================================
     BLOQUE DE NOMBRE
     ========================================================== */

  const nameBlock = (
    <View
      style={
        isDesktop
          ? styles.desktopNameBlock
          : styles.mobileFormBlock
      }
    >
      <Text
        style={
          styles.label
        }
      >
        Nombre de la prenda
        {!isDesktop && ' *'}
      </Text>

      {isDesktop ? (
        <View
          style={
            styles.nameInputWrapper
          }
        >
          <Ionicons
            name="shirt-outline"
            size={18}
            color={
              COLORS.primary
            }
            style={{
              marginRight: 8,
            }}
          />

          <TextInput
            style={
              styles.nameInputDesktop
            }
            placeholder="Ej. Remera blanca básica"
            placeholderTextColor={
              COLORS.textLight
            }
            value={title}
            onChangeText={
              setTitle
            }
          />
        </View>
      ) : (
        <TextInput
          style={
            styles.nameInput
          }
          placeholder="Ej: Remera blanca básica"
          placeholderTextColor={
            COLORS.textLight
          }
          value={title}
          onChangeText={
            setTitle
          }
        />
      )}
    </View>
  );

  /* ==========================================================
     BLOQUE DE CATEGORÍA MOBILE
     ========================================================== */

  const categoryMobileBlock = (
    <View
      style={
        styles.mobileFormBlock
      }
    >
      <Text
        style={
          styles.label
        }
      >
        Categoría *
      </Text>

      <View
        style={
          styles.chipsContainer
        }
      >
        {CATEGORIES.map(
          (item) => {
            const custom =
              item ===
              'Otra categoría';

            const active =
              custom
                ? isCustomCategory
                : !isCustomCategory &&
                  category ===
                    item;

            return (
              <Pressable
                key={item}
                style={[
                  styles.chip,

                  active &&
                    styles.chipActive,

                  custom &&
                    styles.customChip,
                ]}
                onPress={() =>
                  selectCategory(
                    item
                  )
                }
              >
                <Text
                  style={[
                    styles.chipText,

                    active &&
                      styles.chipTextActive,

                    custom &&
                      styles.customChipText,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }
        )}
      </View>

      {isCustomCategory &&
        renderCustomInput(
          'category'
        )}
    </View>
  );

  /* ==========================================================
     BLOQUE DE COLOR MOBILE
     ========================================================== */

  const colorMobileBlock = (
    <View
      style={
        styles.mobileFormBlock
      }
    >
      <Text
        style={
          styles.label
        }
      >
        Color Principal
      </Text>
  <View
  style={
    styles.colorsContainer
  }
>
  {COLORS_LIST.map((color) => {
    const isMulticolor =
      color.name === 'Multicolor';

    const isSelected =
      selectedColor === color.name;

    if (isMulticolor) {
      return (
        <Pressable
          key={color.name}
          style={[
            styles.multicolorOption,
            isSelected &&
              styles.multicolorOptionActive,
          ]}
          onPress={() =>
            selectColor(color.name)
          }
          accessibilityLabel="Seleccionar color Multicolor"
        >
          <View
            style={styles.multicolorIcon}
          >
            <Ionicons
              name="color-palette-outline"
              size={22}
              color={COLORS.primary}
            />
          </View>

          <Text
            style={[
              styles.multicolorText,
              isSelected &&
                styles.multicolorTextActive,
            ]}
          >
            Multicolor
          </Text>
        </Pressable>
      );
    }

    return (
      <Pressable
        key={color.name}
        accessibilityLabel={`Seleccionar color ${color.name}`}
        style={[
          styles.colorCircle,
          {
            backgroundColor:
              rgbToCss(color.rgb),
          },
          isSelected &&
            styles.colorCircleActive,
        ]}
        onPress={() =>
          selectColor(color.name)
        }
      />
    );
  })}

  <Pressable
    style={[
      styles.customColorCircle,
      isColorPickerMode &&
        styles.customColorCircleActive,
    ]}
    onPress={
      activateColorPicker
    }
  >
    <Ionicons
      name="color-wand-outline"
      size={17}
      color={
        COLORS.background
      }
    />
  </Pressable>
</View>
      <Pressable
        style={[
          styles.otherOptionButton,
          isColorPickerMode &&
            styles.otherOptionButtonActive,
        ]}
        onPress={
          activateColorPicker
        }
      >
        <Ionicons
          name="color-wand-outline"
          size={15}
          color={
            COLORS.background
          }
        />

        <Text
          style={
            styles.otherOptionButtonText
          }
        >
          Otro color
        </Text>
      </Pressable>

      <Text
        style={
          styles.selectedColorText
        }
      >
        {selectedColor
          ? `Color seleccionado: ${selectedColor}`
          : 'Seleccioná un color o elegí “Otro color” para usar el puntero.'}
      </Text>
    </View>
  );

  /* ==========================================================
     BLOQUE TEMPORADA MOBILE
     ========================================================== */

  const seasonMobileBlock = (
    <View
      style={
        styles.mobileFormBlock
      }
    >
      <Text
        style={
          styles.label
        }
      >
        Temporada
      </Text>

      <View
        style={
          styles.chipsContainer
        }
      >
        {SEASONS.map(
          (item) => {
            const custom =
              item ===
              'Otra temporada';

            const active =
              custom
                ? isCustomSeason
                : !isCustomSeason &&
                  season ===
                    item;

            return (
              <Pressable
                key={item}
                style={[
                  styles.chip,

                  active &&
                    styles.chipActive,

                  custom &&
                    styles.customChip,
                ]}
                onPress={() =>
                  selectSeason(
                    item
                  )
                }
              >
                <Text
                  style={[
                    styles.chipText,

                    active &&
                      styles.chipTextActive,

                    custom &&
                      styles.customChipText,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }
        )}
      </View>

      {isCustomSeason &&
        renderCustomInput(
          'season'
        )}
    </View>
  );

  /* ==========================================================
     BLOQUE OCASIÓN MOBILE
     ========================================================== */

  const ocasionMobileBlock = (
    <View
      style={
        styles.mobileFormBlock
      }
    >
      <Text
        style={
          styles.label
        }
      >
        Ocasión
      </Text>

      <View
        style={
          styles.chipsContainer
        }
      >
        {OCASIONES.map(
          (item) => {
            const custom =
              item ===
              'Otra ocasión';

            const active =
              custom
                ? isCustomOcasion
                : !isCustomOcasion &&
                  ocasion ===
                    item;

            return (
              <Pressable
                key={item}
                style={[
                  styles.chip,

                  active &&
                    styles.chipActive,

                  custom &&
                    styles.customChip,
                ]}
                onPress={() =>
                  selectOcasion(
                    item
                  )
                }
              >
                <Text
                  style={[
                    styles.chipText,

                    active &&
                      styles.chipTextActive,

                    custom &&
                      styles.customChipText,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }
        )}
      </View>

      {isCustomOcasion &&
        renderCustomInput(
          'ocasion'
        )}
    </View>
  );

  /* ==========================================================
     DESCRIPCIÓN MOBILE
     ========================================================== */

  const descriptionMobileBlock = (
    <View
      style={
        styles.mobileFormBlock
      }
    >
      <Text
        style={
          styles.label
        }
      >
        Notas / Descripción
      </Text>

      <TextInput
        style={
          styles.textInput
        }
        placeholder="Ej: Remera de algodón marca Zara..."
        placeholderTextColor={
          COLORS.textLight
        }
        value={
          description
        }
        onChangeText={(
          text
        ) => {
          if (
            text.length <=
            DESCRIPTION_MAX_LENGTH
          ) {
            setDescription(
              text
            );
          }
        }}
        multiline
      />

      <Text
        style={
          styles.charCountMobile
        }
      >
        {description.length}/
        {DESCRIPTION_MAX_LENGTH}
      </Text>
    </View>
  );

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <OutfitScreenLayout
      title="Agregar Prenda"
      navigation={navigation}
      user={user}
      activeTab="Prendas"
    >
      <ResponsiveContainer>
       <ScrollView
  style={
    styles.scrollArea
  }
  contentContainerStyle={[
    styles.container,

    isDesktop &&
      styles.desktopContainer,
  ]}
  showsVerticalScrollIndicator={
    false
  }
>
  {alertMessage ? (
    <AlertMessage
      type="success"
      message={alertMessage}
    />
  ) : null}

          {isDesktop ? (
            <>
              {/* ==================================================
                  DESKTOP
                  ================================================== */}

              <View
                style={
                  styles.desktopBody
                }
              >
                {/* COLUMNA IZQUIERDA */}

                <View
                  style={
                    styles.desktopLeftColumn
                  }
                >
                  {imageBlock}

                  {nameBlock}
                </View>

                {/* COLUMNA DERECHA */}

                <View
                  style={
                    styles.desktopRightColumn
                  }
                >
                  <View
                    style={
                      styles.desktopCard
                    }
                  >
                    {renderDropdownRow(
                      'category',
                      'shirt-outline',
                      'Categoría',
                      category,
                      'Seleccionar categoría',
                      CATEGORIES,
                      selectCategory
                    )}

                    {renderDropdownRow(
                      'color',
                      'color-palette-outline',
                      'Color',
                      selectedColor,
                      'Seleccionar color',
                      COLORS_LIST,
                      selectColor,
                      true
                    )}

                    {renderDropdownRow(
                      'season',
                      'sunny-outline',
                      'Temporada',
                      season,
                      'Seleccionar temporada',
                      SEASONS,
                      selectSeason
                    )}

                    {renderDropdownRow(
                      'ocasion',
                      'sparkles-outline',
                      'Ocasión',
                      ocasion,
                      'Seleccionar ocasión',
                      OCASIONES,
                      selectOcasion
                    )}

                    {/* DESCRIPCIÓN */}

                    <View
                      style={
                        styles.descRowWrapper
                      }
                    >
                      <View
                        style={
                          styles.dropdownRowLeft
                        }
                      >
                        <View
                          style={
                            styles.dropdownIconCircle
                          }
                        >
                          <Ionicons
                            name="document-text-outline"
                            size={16}
                            color={
                              COLORS.primary
                            }
                          />
                        </View>

                        <Text
                          style={
                            styles.dropdownLabel
                          }
                        >
                          Descripción (opcional)
                        </Text>
                      </View>

                      <TextInput
                        style={
                          styles.descTextArea
                        }
                        placeholder="Agregá una descripción..."
                        placeholderTextColor={
                          COLORS.textLight
                        }
                        value={
                          description
                        }
                        onChangeText={(
                          text
                        ) => {
                          if (
                            text.length <=
                            DESCRIPTION_MAX_LENGTH
                          ) {
                            setDescription(
                              text
                            );
                          }
                        }}
                        multiline
                      />

                      <Text
                        style={
                          styles.charCount
                        }
                      >
                        {description.length}/
                        {DESCRIPTION_MAX_LENGTH}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* BOTONES DESKTOP */}

              <View
                style={
                  styles.desktopButtonsRow
                }
              >
                <Pressable
                  style={
                    styles.cancelButton
                  }
                  onPress={() =>
                    navigation.goBack()
                  }
                >
                  <Text
                    style={
                      styles.cancelButtonText
                    }
                  >
                    Cancelar
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.saveButtonDesktop,
                    isSaving &&
                      styles.disabledButton,
                  ]}
                  onPress={
                    handleSave
                  }
                  disabled={
                    isSaving
                  }
                >
                  {isSaving ? (
                    <ActivityIndicator
                      color="white"
                    />
                  ) : (
                    <Text
                      style={
                        styles.saveButtonText
                      }
                    >
                      Guardar
                    </Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <>
              {/* ==================================================
                  MOBILE
                  ================================================== */}

              <View
                style={
                  styles.imageSection
                }
              >
                {imageBlock}
              </View>

              {nameBlock}

              {categoryMobileBlock}

              {colorMobileBlock}

              {seasonMobileBlock}

              {ocasionMobileBlock}

              {descriptionMobileBlock}

              {/* GUARDAR */}

              <Pressable
                style={[
                  styles.saveButton,
                  isSaving &&
                    styles.disabledButton,
                ]}
                onPress={
                  handleSave
                }
                disabled={
                  isSaving
                }
              >
                {isSaving ? (
                  <ActivityIndicator
                    color="white"
                  />
                ) : (
                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    Guardar Prenda
                  </Text>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </ResponsiveContainer>
    </OutfitScreenLayout>
  );
}

/* ============================================================
   ESTILOS
   ============================================================ */

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

    header: {
      height: 60,
      backgroundColor:
        COLORS.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      paddingHorizontal: 16,
    },

    backButton: {
      padding: 8,
    },

    headerTitle: {
      color: 'white',
      fontSize: 18,
      fontFamily:
        'Poppins_600SemiBold',
    },

    scrollArea: {
      flex: 1,
    },

    container: {
      padding: 20,
      paddingBottom: 40,
    },

    desktopContainer: {
      maxWidth: 1100,
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 32,
      paddingTop: 28,
    },

    /* ========================================================
       IMAGEN
       ======================================================== */

    imageSection: {
      alignItems: 'center',
      marginBottom: 14,
    },

    imagePreviewContainer: {
      width:
        IMAGE_BOX_SIZE,
      height:
        IMAGE_BOX_SIZE,
      borderRadius: 20,
      backgroundColor:
        'white',
      borderWidth: 2,
      borderColor:
        COLORS.background,
      borderStyle: 'dashed',
      justifyContent:
        'center',
      alignItems:
        'center',
      overflow: 'hidden',
      position:
        'relative',
    },

    imageTouchArea: {
      width: '100%',
      height: '100%',
      position:
        'relative',
    },

    imagePreview: {
      width: '100%',
      height: '100%',
    },

    samplePoint: {
      position:
        'absolute',
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 3,
      borderColor:
        'white',
      shadowColor:
        'black',
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },

    colorPickerActiveOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent:
        'flex-start',
      alignItems:
        'center',
      paddingTop: 8,
    },

    colorPickerActiveBadge: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 6,
      backgroundColor:
        COLORS.background,
      borderWidth: 1,
      borderColor:
        COLORS.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 18,
    },

    colorPickerActiveText: {
      fontSize: 11,
      fontFamily:
        'Poppins_600SemiBold',
      color:
        COLORS.primary,
    },

    colorSamplingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        'rgba(255,255,255,0.78)',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    colorSamplingText: {
      marginTop: 6,
      fontSize: 11,
      fontFamily:
        'Poppins_600SemiBold',
      color:
        COLORS.primary,
    },

    colorPickerHint: {
      marginTop: 8,
      maxWidth: 320,
      textAlign:
        'center',
      fontSize: 11,
      fontFamily:
        'Poppins_400Regular',
      color:
        COLORS.textLight,
    },

    placeholderContainer: {
      alignItems:
        'center',
      padding: 16,
    },

    placeholderTitle: {
      marginTop: 10,
      fontSize: 15,
      fontFamily:
        'Poppins_600SemiBold',
      color:
        COLORS.textDark,
      textAlign:
        'center',
    },

    placeholderText: {
      marginTop: 4,
      fontSize: 12,
      fontFamily:
        'Poppins_400Regular',
      color:
        COLORS.textLight,
      textAlign:
        'center',
    },

    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        'rgba(255,255,255,0.85)',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    loadingText: {
      marginTop: 8,
      fontSize: 12,
      fontFamily:
        'Poppins_600SemiBold',
      color:
        COLORS.primary,
    },

    photoActionsRow: {
      flexDirection:
        'row',
      gap: 12,
      marginTop: 14,
    },

    photoButton: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor:
        'white',
      borderWidth: 1,
      borderColor:
        COLORS.background,
    },

    photoButtonText: {
      fontSize: 13,
      fontFamily:
        'Poppins_600SemiBold',
      color:
        COLORS.primary,
    },

    bgRemoveButton: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap: 8,
      marginTop: 12,
      backgroundColor:
        COLORS.primary,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
    },

    bgRemoveButtonText: {
      color: 'white',
      fontSize: 13,
      fontFamily:
        'Poppins_600SemiBold',
    },

    /* ========================================================
       SELECTOR DE COLOR
       ======================================================== */

    colorPickerButton: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap: 7,
      marginTop: 10,
      backgroundColor:
        COLORS.primary,
      paddingVertical: 9,
      paddingHorizontal: 18,
      borderRadius: 20,
    },

    colorPickerButtonActive: {
      opacity: 0.88,
    },

    colorPickerButtonText: {
      color:
        COLORS.background,
      fontSize: 12,
      fontFamily:
        'Poppins_600SemiBold',
    },

    /* ========================================================
       BLOQUES MOBILE
       ======================================================== */

    mobileFormBlock: {
      backgroundColor:
        'white',
      borderRadius: 18,
      padding: 18,
      marginBottom: 12,
      borderWidth: 1,
      borderColor:
        COLORS.background,
    },

    /* ========================================================
       FORMULARIO
       ======================================================== */

    label: {
      fontSize: 14,
      fontFamily:
        'Poppins_600SemiBold',
      color:
        COLORS.textDark,
      marginTop: 0,
      marginBottom: 8,
    },

    nameInput: {
      backgroundColor:
        COLORS.background,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor:
        COLORS.background,
      fontSize: 14,
      fontFamily:
        'Poppins_400Regular',
      color:
        COLORS.textDark,
    },

    nameInputWrapper: {
      flexDirection:
        'row',
      alignItems:
        'center',
      backgroundColor:
        'white',
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 48,
      borderWidth: 1,
      borderColor:
        COLORS.background,
    },

    nameInputDesktop: {
      flex: 1,
      fontSize: 14,
      fontFamily:
        'Poppins_400Regular',
      color:
        COLORS.textDark,
    },

    /* ========================================================
       CHIPS
       ======================================================== */

    chipsContainer: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 8,
    },

    chip: {
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor:
        COLORS.background,
    },

    chipActive: {
      backgroundColor:
        COLORS.primary,
    },

    chipText: {
      fontSize: 12,
      fontFamily:
        'Poppins_400Regular',
      color:
        COLORS.primary,
    },

    chipTextActive: {
      color:
        COLORS.background,
      fontFamily:
        'Poppins_600SemiBold',
    },

    /* ========================================================
       OPCIONES ESPECIALES
       ======================================================== */

    customChip: {
      backgroundColor:
        COLORS.primary,
      borderWidth: 1,
      borderColor:
        COLORS.primary,
    },

    customChipText: {
      color:
        COLORS.background,
      fontFamily:
        'Poppins_600SemiBold',
    },

    otherOptionButton: {
      alignSelf:
        'flex-start',
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 6,
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 17,
      backgroundColor:
        COLORS.primary,
      borderWidth: 1,
      borderColor:
        COLORS.primary,
    },

    otherOptionButtonActive: {
      opacity: 0.85,
    },

    otherOptionButtonText: {
      color:
        COLORS.background,
      fontSize: 12,
      fontFamily:
        'Poppins_600SemiBold',
    },

    customOptionBox: {
      marginTop: 10,
      padding: 12,
      borderRadius: 14,
      backgroundColor:
        COLORS.background,
      borderWidth: 1.5,
      borderColor:
        COLORS.primary,
    },

    customOptionLabel: {
      fontSize: 12,
      fontFamily:
        'Poppins_600SemiBold',
      color:
        COLORS.primary,
      marginBottom: 6,
    },

    customOptionInput: {
      backgroundColor:
        COLORS.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        COLORS.primary,
      paddingHorizontal: 12,
      paddingVertical: 9,
      fontSize: 13,
      fontFamily:
        'Poppins_400Regular',
      color:
        COLORS.textDark,
    },

    /* ========================================================
       COLORES
       ======================================================== */

    colorsContainer: {
      flexDirection:
        'row',
      gap: 12,
      flexWrap:
        'wrap',
      alignItems:
        'center',
    },

    colorCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        COLORS.background,
    },
    multicolorOption: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  paddingVertical: 6,
  paddingHorizontal: 10,
  borderRadius: 18,
  backgroundColor: COLORS.background,
  borderWidth: 1,
  borderColor: COLORS.background,
},

multicolorOptionActive: {
  backgroundColor: COLORS.primary,
  borderColor: COLORS.primary,
},

multicolorIcon: {
  width: 28,
  height: 28,
  borderRadius: 14,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'white',
},

multicolorText: {
  fontSize: 11,
  fontFamily: 'Poppins_600SemiBold',
  color: COLORS.primary,
},

multicolorTextActive: {
  color: 'white',
},

    colorCircleActive: {
      borderWidth: 3,
      borderColor:
        COLORS.primary,
    },

    customColorCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor:
        COLORS.primary,
      justifyContent:
        'center',
      alignItems:
        'center',
      borderWidth: 2,
      borderColor:
        COLORS.primary,
    },

    customColorCircleActive: {
      borderWidth: 4,
      borderColor:
        COLORS.background,
    },

    selectedColorText: {
      marginTop: 8,
      fontSize: 11,
      fontFamily:
        'Poppins_400Regular',
      color:
        COLORS.textLight,
    },

    /* ========================================================
       DESCRIPCIÓN
       ======================================================== */

    textInput: {
      backgroundColor:
        COLORS.background,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor:
        COLORS.background,
      fontSize: 13,
      fontFamily:
        'Poppins_400Regular',
      minHeight: 80,
      textAlignVertical:
        'top',
      color:
        COLORS.textDark,
    },

    charCountMobile: {
      alignSelf:
        'flex-end',
      marginTop: 6,
      fontSize: 11,
      fontFamily:
        'Poppins_400Regular',
      color:
        COLORS.textLight,
    },

    /* ========================================================
       BOTÓN GUARDAR
       ======================================================== */

    saveButton: {
      backgroundColor:
        COLORS.primary,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems:
        'center',
      marginTop: 4,
      marginBottom: 10,
    },

    saveButtonText: {
      color: 'white',
      fontSize: 15,
      fontFamily:
        'Poppins_600SemiBold',
    },

    disabledButton: {
      opacity: 0.7,
    },

    /* ========================================================
       DESKTOP
       ======================================================== */

    desktopBody: {
      flexDirection:
        'row',
      gap: 28,
      alignItems:
        'flex-start',
    },

    desktopLeftColumn: {
      flex: 1,
    },

    desktopRightColumn: {
      flex: 1,
    },

    desktopNameBlock: {
      marginTop: 20,
    },

    desktopCard: {
      backgroundColor:
        'white',
      borderRadius: 16,
      paddingHorizontal: 18,
      borderWidth: 1,
      borderColor:
        COLORS.background,
    },

    dropdownRowWrapper: {
      borderBottomWidth: 1,
      borderBottomColor:
        COLORS.background,
    },

    dropdownRow: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
      paddingVertical: 16,
    },

    dropdownRowLeft: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    dropdownIconCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor:
        COLORS.background,
      justifyContent:
        'center',
      alignItems:
        'center',
      marginRight: 10,
    },

    dropdownLabel: {
      fontSize: 14,
      fontFamily:
        'Poppins_600SemiBold',
      color:
        COLORS.textDark,
    },

    dropdownRowRight: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 8,
      maxWidth: '60%',
    },

    dropdownValue: {
      fontSize: 13,
      fontFamily:
        'Poppins_400Regular',
      color:
        COLORS.textDark,
    },

    dropdownPlaceholder: {
      color:
        COLORS.textLight,
    },

    dropdownColorPreview: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
      borderColor:
        COLORS.background,
    },

    dropdownOptionsWrap: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 8,
      paddingBottom: 16,
    },

    dropdownChip: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor:
        COLORS.background,
    },

    dropdownChipActive: {
      backgroundColor:
        COLORS.primary,
    },

    dropdownChipText: {
      fontSize: 12,
      fontFamily:
        'Poppins_400Regular',
      color:
        COLORS.primary,
    },

    dropdownChipTextActive: {
      color:
        COLORS.background,
      fontFamily:
        'Poppins_600SemiBold',
    },

    customDropdownChip: {
      backgroundColor:
        COLORS.primary,
      borderWidth: 1,
      borderColor:
        COLORS.primary,
    },

    customDropdownChipActive: {
      opacity: 0.85,
    },

    customDropdownChipText: {
      color:
        COLORS.background,
      fontFamily:
        'Poppins_600SemiBold',
    },

    dropdownColorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 1,
      borderColor:
        COLORS.background,
    },

    colorPickerDesktopNotice: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 7,
      marginBottom: 14,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 12,
      backgroundColor:
        COLORS.background,
      borderWidth: 1,
      borderColor:
        COLORS.primary,
    },

    colorPickerDesktopNoticeText: {
      flex: 1,
      fontSize: 11,
      fontFamily:
        'Poppins_600SemiBold',
      color:
        COLORS.primary,
    },

    /* ========================================================
       DESCRIPCIÓN DESKTOP
       ======================================================== */

    descRowWrapper: {
      paddingVertical: 16,
    },

    descTextArea: {
      marginTop: 10,
      backgroundColor:
        COLORS.background,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor:
        COLORS.background,
      fontSize: 13,
      fontFamily:
        'Poppins_400Regular',
      minHeight: 90,
      textAlignVertical:
        'top',
      color:
        COLORS.textDark,
    },

    charCount: {
      alignSelf:
        'flex-end',
      marginTop: 6,
      fontSize: 11,
      fontFamily:
        'Poppins_400Regular',
      color:
        COLORS.textLight,
    },

    /* ========================================================
       BOTONES DESKTOP
       ======================================================== */

    desktopButtonsRow: {
      flexDirection:
        'row',
      gap: 16,
      marginTop: 24,
    },

    cancelButton: {
      flex: 1,
      height: 52,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor:
        COLORS.primary,
      backgroundColor:
        'white',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    cancelButtonText: {
      color:
        COLORS.primary,
      fontSize: 15,
      fontFamily:
        'Poppins_600SemiBold',
    },

    saveButtonDesktop: {
      flex: 2,
      height: 52,
      borderRadius: 14,
      backgroundColor:
        COLORS.primary,
      alignItems:
        'center',
      justifyContent:
        'center',
    },
  });