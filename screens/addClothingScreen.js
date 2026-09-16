import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../theme/colours';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { removeBackground } from '../services/bgRemoveService';
import { addClothingItem } from '../services/database';
 
const CATEGORIES = ['Camisetas / Tops', 'Pantalones', 'Abrigos', 'Calzado', 'Accesorios', 'Vestidos'];
const SEASONS = ['Verano', 'Invierno', 'Primavera', 'Otoño', 'Todas'];
const OCASIONES = ['Casual', 'Formal', 'Deporte', 'Fiesta', 'Trabajo'];
const COLORS_LIST = [
  { name: 'Negro', hex: '#000000' },
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Gris', hex: '#808080' },
  { name: 'Azul', hex: '#1E40AF' },
  { name: 'Rojo', hex: '#DC2626' },
  { name: 'Verde', hex: '#16A34A' },
  { name: 'Beige', hex: '#D4B996' },
  { name: 'Violeta', hex: '#9C4EDD' },
];
 
const DESCRIPTION_MAX_LENGTH = 150;
 
export default function AddClothingScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
 
  const user = route?.params?.user;
 
  // Estados del Formulario
  const [title, setTitle] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [category, setCategory] = useState('');
  const [season, setSeason] = useState('');
  const [ocasion, setOcasion] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [description, setDescription] = useState('');
 
  // Estados de Carga
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
 
  // Controla cuál de los "dropdowns" del layout de escritorio está abierto
  // (solo se usa en la versión Desktop; en Mobile los chips siempre están visibles)
  const [openDropdown, setOpenDropdown] = useState(null); // 'category' | 'color' | 'season' | 'ocasion' | null
 
  const toggleDropdown = (key) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };
 
  // 1. Selección de Imagen (Galería o Cámara)
  const pickImage = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'Se requiere acceso a la cámara para tomar fotos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          // 'MediaTypeOptions' está deprecado en expo-image-picker; se usa
          // el array de strings recomendado por la documentación actual.
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'Se requiere acceso a la galería.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });
      }
 
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };
 
  // 2. Procesar con Remover Fondo (ahora devuelve fondo blanco, no transparente)
  const handleRemoveBackground = async () => {
    if (!imageUri) {
      Alert.alert('Atención', 'Primero selecciona una imagen.');
      return;
    }
 
    setIsRemovingBg(true);
    try {
      const processedUri = await removeBackground(imageUri);
      if (processedUri) {
        setImageUri(processedUri);
        Alert.alert('¡Éxito!', 'Fondo reemplazado por blanco correctamente.');
      } else {
        Alert.alert('Aviso', 'No se pudo remover el fondo. Se mantendrá la imagen original.');
      }
    } catch (error) {
      console.error('Error al remover fondo:', error);
      Alert.alert('Error', 'Ocurrió un fallo al procesar la imagen.');
    } finally {
      setIsRemovingBg(false);
    }
  };
 
  // 3. Guardar Prenda en la Base de Datos
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Campo obligatorio', 'Ingresá un nombre para la prenda (ej: "Remera blanca").');
      return;
    }
    if (!imageUri) {
      Alert.alert('Campo obligatorio', 'Por favor selecciona o toma una foto de la prenda.');
      return;
    }
    if (!category) {
      Alert.alert('Campo obligatorio', 'Selecciona una categoría para la prenda.');
      return;
    }
 
    setIsSaving(true);
    try {
      const clothingData = {
        userId: user?.id || 1,
        title: title.trim(),
        imageUri,
        category,
        color: selectedColor,
        season,
        ocasion,
        description,
      };
 
      const result = await addClothingItem(clothingData);
 
      // addClothingItem devuelve { success, item } o { success: false, message },
      // no un booleano: hay que revisar "result.success", no "result".
      if (result.success) {
        Alert.alert('Guardado', 'Prenda agregada con éxito.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', result.message || 'No se pudo guardar la prenda en la base de datos.');
      }
    } catch (error) {
      console.error('Error al guardar prenda:', error);
      Alert.alert('Error', 'Surgió un error al intentar guardar.');
    } finally {
      setIsSaving(false);
    }
  };
 
  // ----------------------------------------------------------
  // BLOQUE DE IMAGEN (compartido entre Mobile y Desktop)
  // ----------------------------------------------------------
  const imageBlock = (
    <>
      <View style={styles.imagePreviewContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="camera-outline" size={60} color="#C4B5FD" />
            <Text style={styles.placeholderTitle}>Tomar o seleccionar foto</Text>
            <Text style={styles.placeholderText}>Subí una imagen de tu prenda</Text>
          </View>
        )}
 
        {isRemovingBg && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary || '#9C4EDD'} />
            <Text style={styles.loadingText}>Poniendo fondo blanco...</Text>
          </View>
        )}
      </View>
 
      {/* BOTONES SELECCIÓN DE FOTO */}
      <View style={styles.photoActionsRow}>
        <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(false)}>
          <Ionicons name="images-outline" size={18} color={COLORS.primary || '#9C4EDD'} />
          <Text style={styles.photoButtonText}>Galería</Text>
        </TouchableOpacity>
 
        {Platform.OS !== 'web' && (
          <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(true)}>
            <Ionicons name="camera-outline" size={18} color={COLORS.primary || '#9C4EDD'} />
            <Text style={styles.photoButtonText}>Cámara</Text>
          </TouchableOpacity>
        )}
      </View>
 
      {/* BOTÓN PARA PONER FONDO BLANCO */}
      {imageUri && (
        <TouchableOpacity
          style={styles.bgRemoveButton}
          onPress={handleRemoveBackground}
          disabled={isRemovingBg}
        >
          <Ionicons name="sparkles" size={18} color="#FFFFFF" />
          <Text style={styles.bgRemoveButtonText}>Poner fondo blanco con IA</Text>
        </TouchableOpacity>
      )}
    </>
  );
 
  // ----------------------------------------------------------
  // FILA DE "DROPDOWN" (solo Desktop) — imita un <select> pero
  // usando los mismos chips que ya existían para Mobile.
  // ----------------------------------------------------------
  const renderDropdownRow = (key, icon, label, value, placeholder, options, onSelect, isColorRow = false) => {
    const isOpen = openDropdown === key;
 
    return (
      <View key={key} style={styles.dropdownRowWrapper}>
        <TouchableOpacity
          style={styles.dropdownRow}
          onPress={() => toggleDropdown(key)}
          activeOpacity={0.7}
        >
          <View style={styles.dropdownRowLeft}>
            <View style={styles.dropdownIconCircle}>
              <Ionicons name={icon} size={16} color={COLORS.primary || '#9C4EDD'} />
            </View>
            <Text style={styles.dropdownLabel}>{label}</Text>
          </View>
 
          <View style={styles.dropdownRowRight}>
            {isColorRow && value ? (
              <View
                style={[
                  styles.dropdownColorPreview,
                  { backgroundColor: COLORS_LIST.find((c) => c.name === value)?.hex || '#CCC' },
                ]}
              />
            ) : null}
            <Text style={[styles.dropdownValue, !value && styles.dropdownPlaceholder]}>
              {value || placeholder}
            </Text>
            <Ionicons
              name={isOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#A0A0A0"
            />
          </View>
        </TouchableOpacity>
 
        {isOpen && (
          <View style={styles.dropdownOptionsWrap}>
            {options.map((opt) => {
              const optName = isColorRow ? opt.name : opt;
              const isSelected = value === optName;
              return (
                <TouchableOpacity
                  key={optName}
                  style={[styles.dropdownChip, isSelected && styles.dropdownChipActive]}
                  onPress={() => {
                    onSelect(optName);
                    setOpenDropdown(null);
                  }}
                >
                  {isColorRow && (
                    <View style={[styles.dropdownColorDot, { backgroundColor: opt.hex }]} />
                  )}
                  <Text style={[styles.dropdownChipText, isSelected && styles.dropdownChipTextActive]}>
                    {optName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };
 
  return (
    <ResponsiveContainer>
      <SafeAreaView style={styles.safeArea}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Agregar Prenda</Text>
          <View style={{ width: 40 }} />
        </View>
 
        {/*
          IMPORTANTE: en web, ScrollView se renderiza como un <div> con
          overflow, y necesita una altura acotada (flex: 1) para poder
          scrollear con el mouse. Sin "style={{ flex: 1 }}" el contenido
          se corta dentro del SafeAreaView y no se puede bajar.
        */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.container,
            isDesktop && styles.desktopContainer,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isDesktop ? (
            // ============================================================
            // LAYOUT DE ESCRITORIO: dos columnas, tarjeta con dropdowns
            // ============================================================
            <>
              <View style={styles.desktopBody}>
                <View style={styles.desktopLeftColumn}>
                  {imageBlock}
 
                  <Text style={styles.label}>Nombre de la prenda</Text>
                  <View style={styles.nameInputWrapper}>
                    <Ionicons
                      name="shirt-outline"
                      size={18}
                      color={COLORS.primary || '#9C4EDD'}
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      style={styles.nameInputDesktop}
                      placeholder="Ej. Remera blanca básica"
                      placeholderTextColor="#A0A0A0"
                      value={title}
                      onChangeText={setTitle}
                    />
                  </View>
                </View>
 
                <View style={styles.desktopRightColumn}>
                  <View style={styles.desktopCard}>
                    {renderDropdownRow(
                      'category',
                      'shirt-outline',
                      'Categoría',
                      category,
                      'Seleccionar categoría',
                      CATEGORIES,
                      setCategory
                    )}
                    {renderDropdownRow(
                      'color',
                      'color-palette-outline',
                      'Color',
                      selectedColor,
                      'Seleccionar color',
                      COLORS_LIST,
                      setSelectedColor,
                      true
                    )}
                    {renderDropdownRow(
                      'season',
                      'sunny-outline',
                      'Temporada',
                      season,
                      'Seleccionar temporada',
                      SEASONS,
                      setSeason
                    )}
                    {renderDropdownRow(
                      'ocasion',
                      'sparkles-outline',
                      'Ocasión',
                      ocasion,
                      'Seleccionar ocasión',
                      OCASIONES,
                      setOcasion
                    )}
 
                    {/* DESCRIPCIÓN */}
                    <View style={styles.descRowWrapper}>
                      <View style={styles.dropdownRowLeft}>
                        <View style={styles.dropdownIconCircle}>
                          <Ionicons
                            name="document-text-outline"
                            size={16}
                            color={COLORS.primary || '#9C4EDD'}
                          />
                        </View>
                        <Text style={styles.dropdownLabel}>Descripción (opcional)</Text>
                      </View>
 
                      <TextInput
                        style={styles.descTextArea}
                        placeholder="Agregá una descripción..."
                        placeholderTextColor="#A0A0A0"
                        value={description}
                        onChangeText={(text) => {
                          if (text.length <= DESCRIPTION_MAX_LENGTH) setDescription(text);
                        }}
                        multiline
                      />
                      <Text style={styles.charCount}>
                        {description.length}/{DESCRIPTION_MAX_LENGTH}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
 
              {/* BOTONES INFERIORES */}
              <View style={styles.desktopButtonsRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
 
                <TouchableOpacity
                  style={[styles.saveButtonDesktop, isSaving && { opacity: 0.7 }]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // ============================================================
            // LAYOUT DE CELULAR: una columna con chips (igual que antes)
            // ============================================================
            <>
              <View style={styles.imageSection}>{imageBlock}</View>
 
              <View style={styles.formSection}>
                <Text style={styles.label}>Nombre de la prenda *</Text>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Ej: Remera blanca básica"
                  placeholderTextColor="#A0A0A0"
                  value={title}
                  onChangeText={setTitle}
                />
 
                <Text style={styles.label}>Categoría *</Text>
                <View style={styles.chipsContainer}>
                  {CATEGORIES.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[styles.chip, category === item && styles.chipActive]}
                      onPress={() => setCategory(item)}
                    >
                      <Text style={[styles.chipText, category === item && styles.chipTextActive]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
 
                <Text style={styles.label}>Color Principal</Text>
                <View style={styles.colorsContainer}>
                  {COLORS_LIST.map((c) => (
                    <TouchableOpacity
                      key={c.name}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: c.hex },
                        selectedColor === c.name && styles.colorCircleActive,
                      ]}
                      onPress={() => setSelectedColor(c.name)}
                    />
                  ))}
                </View>
 
                <Text style={styles.label}>Temporada</Text>
                <View style={styles.chipsContainer}>
                  {SEASONS.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[styles.chip, season === item && styles.chipActive]}
                      onPress={() => setSeason(item)}
                    >
                      <Text style={[styles.chipText, season === item && styles.chipTextActive]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
 
                <Text style={styles.label}>Ocasión</Text>
                <View style={styles.chipsContainer}>
                  {OCASIONES.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[styles.chip, ocasion === item && styles.chipActive]}
                      onPress={() => setOcasion(item)}
                    >
                      <Text style={[styles.chipText, ocasion === item && styles.chipTextActive]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
 
                <Text style={styles.label}>Notas / Descripción</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej: Remera de algodón marca Zara..."
                  placeholderTextColor="#A0A0A0"
                  value={description}
                  onChangeText={(text) => {
                    if (text.length <= DESCRIPTION_MAX_LENGTH) setDescription(text);
                  }}
                  multiline
                />
 
                <TouchableOpacity
                  style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Guardar Prenda</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ResponsiveContainer>
  );
}
 
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8FC',
  },
  header: {
    height: 60,
    backgroundColor: COLORS.primary || '#9C4EDD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
  // Acota la altura del ScrollView para que "overflow" funcione en web
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
 
  // ----------------------------------------------------------
  // IMAGEN (compartido)
  // ----------------------------------------------------------
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imagePreviewContainer: {
    width: 220,
    height: 220,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F0EAF8',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  placeholderContainer: {
    alignItems: 'center',
    padding: 16,
  },
  placeholderTitle: {
    marginTop: 10,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
    textAlign: 'center',
  },
  placeholderText: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#A0A0A0',
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.primary || '#9C4EDD',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  photoButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.primary || '#9C4EDD',
  },
  bgRemoveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: COLORS.primary || '#9C4EDD',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  bgRemoveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
 
  // ----------------------------------------------------------
  // MOBILE: FORMULARIO CON CHIPS (igual que antes)
  // ----------------------------------------------------------
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0EAF8',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
    marginTop: 12,
    marginBottom: 8,
  },
  nameInput: {
    backgroundColor: '#FAF8FC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F0EAF8',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
  },
  chipActive: {
    backgroundColor: COLORS.primary || '#9C4EDD',
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.primary || '#9C4EDD',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
  colorsContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: COLORS.primary || '#9C4EDD',
  },
  textInput: {
    backgroundColor: '#FAF8FC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0EAF8',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: COLORS.primary || '#9C4EDD',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
 
  // ----------------------------------------------------------
  // DESKTOP: LAYOUT DE DOS COLUMNAS (según mockup)
  // ----------------------------------------------------------
  desktopBody: {
    flexDirection: 'row',
    gap: 28,
    alignItems: 'flex-start',
  },
  desktopLeftColumn: {
    flex: 1,
  },
  desktopRightColumn: {
    flex: 1,
  },
  nameInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  nameInputDesktop: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
 
  // TARJETA CON LOS DROPDOWNS
  desktopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#F0EAF8',
  },
  dropdownRowWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAF8',
  },
  dropdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  dropdownRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0E6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dropdownLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
  },
  dropdownRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownValue: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#555',
  },
  dropdownPlaceholder: {
    color: '#A0A0A0',
  },
  dropdownColorPreview: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  dropdownOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 16,
  },
  dropdownChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
  },
  dropdownChipActive: {
    backgroundColor: COLORS.primary || '#9C4EDD',
  },
  dropdownChipText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.primary || '#9C4EDD',
  },
  dropdownChipTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
  dropdownColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#DDD',
  },
 
  // DESCRIPCIÓN (última fila de la tarjeta, sin borde inferior)
  descRowWrapper: {
    paddingVertical: 16,
  },
  descTextArea: {
    marginTop: 10,
    backgroundColor: '#FAF8FC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0EAF8',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 6,
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#A0A0A0',
  },
 
  // BOTONES INFERIORES DESKTOP
  desktopButtonsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary || '#9C4EDD',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: COLORS.primary || '#9C4EDD',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  saveButtonDesktop: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary || '#9C4EDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
 