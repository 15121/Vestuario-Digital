import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  useWindowDimensions,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CreateOutfitScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Estados del formulario inicializados vacíos
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Estados de prendas vacíos
  const [superior, setSuperior] = useState(null);
  const [inferior, setInferior] = useState(null);
  const [calzado, setCalzado] = useState(null);
  const [accesorios, setAccesorios] = useState([]);

  // Cuenta de prendas obligatorias seleccionadas
  const completedCount = [superior, inferior, calzado].filter(Boolean).length;

  const handleRemoveAccesorio = (id) => {
    setAccesorios(accesorios.filter((item) => item.id !== id));
  };

  const handleSave = () => {
    if (!name.trim() || !superior || !inferior || !calzado) {
      if (Platform.OS === 'web') {
        alert('Completa el nombre y selecciona las 3 prendas obligatorias');
      } else {
        Alert.alert('Error', 'Completa el nombre y selecciona las 3 prendas obligatorias');
      }
      return;
    }

    if (Platform.OS === 'web') {
      alert('Outfit guardado exitosamente');
    } else {
      Alert.alert('Éxito', 'Outfit guardado exitosamente');
    }

    if (navigation && navigation.goBack) navigation.goBack();
  };

  // Renderizado de tarjetas vacías/con contenido
  const renderSlotCard = (titleCategory, isRequired, item, onSelect, iconName) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Ionicons name={iconName} size={18} color="#6C5CE7" />
        <Text style={styles.itemCategoryTitle}>
          {titleCategory}{' '}
          <Text style={styles.optionalText}>
            {isRequired ? '(obligatorio)' : '(opcional)'}
          </Text>
        </Text>
        {item ? (
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={styles.checkIcon} />
        ) : isRequired ? (
          <Ionicons name="ellipse-outline" size={20} color="#CCC" style={styles.checkIcon} />
        ) : null}
      </View>

      {item ? (
        <View style={styles.itemDetailRow}>
          <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemSub}>{item.color}</Text>
          </View>
          <TouchableOpacity style={styles.changeButton} onPress={onSelect}>
            <Text style={styles.changeButtonText}>Cambiar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.selectPlaceholder} onPress={onSelect}>
          <Ionicons name="add-circle-outline" size={22} color="#6C5CE7" />
          <Text style={styles.selectPlaceholderText}>
            Seleccionar {titleCategory.toLowerCase()}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFormContent = () => (
    <View style={styles.formContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation && navigation.goBack && navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.title}>Crear Outfit</Text>
        <View style={styles.badgeContainer}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#6C5CE7" />
          <Text style={styles.badgeText}>{completedCount}/3 completadas</Text>
        </View>
      </View>

      <Text style={styles.label}>Nombre del outfit</Text>
      <View style={styles.inputContainer}>
        <Ionicons name="shirt-outline" size={18} color="#888" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Ej. Look casual de oficina"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#A0A0A0"
        />
      </View>

      <Text style={styles.label}>Descripción (opcional)</Text>
      <View style={[styles.inputContainer, styles.textAreaContainer]}>
        <Ionicons name="document-text-outline" size={18} color="#888" style={styles.inputIconTop} />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Escribí una descripción..."
          value={description}
          onChangeText={(text) => text.length <= 150 && setDescription(text)}
          multiline
          placeholderTextColor="#A0A0A0"
        />
      </View>
      <Text style={styles.charCount}>{description.length}/150</Text>

      {renderSlotCard('Superior', true, superior, () => {}, 'shirt-outline')}
      {renderSlotCard('Inferior', true, inferior, () => {}, 'body-outline')}
      {renderSlotCard('Calzado', true, calzado, () => {}, 'footsteps-outline')}

      <View style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <Ionicons name="briefcase-outline" size={18} color="#6C5CE7" />
          <Text style={styles.itemCategoryTitle}>
            Accesorios <Text style={styles.optionalText}>(opcional)</Text>
          </Text>
        </View>
        <View style={styles.accesoriosList}>
          {accesorios.map((acc) => (
            <View key={acc.id} style={styles.accesorioChip}>
              <Image source={{ uri: acc.imageUri }} style={styles.chipImage} />
              <View>
                <Text style={styles.chipTitle}>{acc.title}</Text>
                <Text style={styles.chipSub}>{acc.color}</Text>
              </View>
              <TouchableOpacity onPress={() => handleRemoveAccesorio(acc.id)}>
                <Ionicons name="close-outline" size={16} color="#888" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addAccesorioButton}>
            <Ionicons name="add" size={18} color="#6C5CE7" />
            <Text style={styles.addAccesorioText}>Agregar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPreviewSection = () => {
    const hasItems = superior || inferior || calzado || accesorios.length > 0;

    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Vista previa del outfit</Text>
        <View style={styles.previewCard}>
          {hasItems ? (
            <View style={styles.previewGrid}>
              {superior && <Image source={{ uri: superior.imageUri }} style={styles.previewImg} />}
              {inferior && <Image source={{ uri: inferior.imageUri }} style={styles.previewImg} />}
              {calzado && <Image source={{ uri: calzado.imageUri }} style={styles.previewImg} />}
              {accesorios.map((acc) => (
                <Image key={acc.id} source={{ uri: acc.imageUri }} style={styles.previewImg} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyPreviewState}>
              <Ionicons name="images-outline" size={32} color="#BDBDBD" />
              <Text style={styles.emptyPreviewText}>Aún no has seleccionado prendas</Text>
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation && navigation.goBack && navigation.goBack()}
          >
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <TouchableOpacity>
          <Ionicons name="menu-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Mis outfits</Text>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }}
          style={styles.avatarImage}
        />
      </View>

      <View style={styles.mainLayout}>
        {isDesktop && (
          <View style={styles.sidebar}>
            <TouchableOpacity style={styles.sidebarItem}>
              <Ionicons name="home-outline" size={22} color="#555" />
              <Text style={styles.sidebarLabel}>Inicio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem}>
              <Ionicons name="shirt-outline" size={22} color="#555" />
              <Text style={styles.sidebarLabel}>Prendas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sidebarItem, styles.sidebarActive]}>
              <Ionicons name="shirt" size={22} color="#6C5CE7" />
              <Text style={[styles.sidebarLabel, styles.sidebarActiveLabel]}>Outfits</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem}>
              <Ionicons name="briefcase-outline" size={22} color="#555" />
              <Text style={styles.sidebarLabel}>Maleta</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {isDesktop ? (
            <View style={styles.desktopColumns}>
              <View style={styles.leftColumn}>{renderFormContent()}</View>
              <View style={styles.rightColumn}>{renderPreviewSection()}</View>
            </View>
          ) : (
            <View style={styles.mobileColumn}>
              {renderFormContent()}
              {renderPreviewSection()}
            </View>
          )}
        </ScrollView>
      </View>

      {!isDesktop && (
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home-outline" size={20} color="#777" />
            <Text style={styles.navText}>Inicio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="shirt-outline" size={20} color="#777" />
            <Text style={styles.navText}>Prendas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="shirt" size={20} color="#6C5CE7" />
            <Text style={[styles.navText, { color: '#6C5CE7' }]}>Outfits</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="briefcase-outline" size={20} color="#777" />
            <Text style={styles.navText}>Maleta</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5FA',
  },
  topHeader: {
    height: 56,
    backgroundColor: '#A573E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 80,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingTop: 20,
    borderRightWidth: 1,
    borderRightColor: '#EAEAEA',
  },
  sidebarItem: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  sidebarActive: {
    borderLeftWidth: 3,
    borderLeftColor: '#6C5CE7',
  },
  sidebarLabel: {
    fontSize: 11,
    color: '#555',
    marginTop: 4,
  },
  sidebarActiveLabel: {
    color: '#6C5CE7',
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  desktopColumns: {
    flexDirection: 'row',
    gap: 20,
  },
  leftColumn: {
    flex: 1.6,
  },
  rightColumn: {
    flex: 1,
  },
  mobileColumn: {
    flexDirection: 'column',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EBFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    color: '#6C5CE7',
    marginLeft: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginTop: 8,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  inputIcon: {
    marginRight: 6,
  },
  inputIconTop: {
    marginRight: 6,
    marginTop: 8,
  },
  input: {
    flex: 1,
    color: '#212121',
    fontSize: 13,
  },
  textAreaContainer: {
    height: 70,
    alignItems: 'flex-start',
  },
  textArea: {
    height: '100%',
    textAlignVertical: 'top',
    paddingTop: 6,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 10,
    color: '#888',
    marginTop: 2,
    marginBottom: 8,
  },
  itemCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemCategoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 6,
  },
  optionalText: {
    color: '#888',
    fontWeight: 'normal',
    fontSize: 11,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  selectPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1C4E9',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 8,
    backgroundColor: '#FAF8FF',
    gap: 6,
  },
  selectPlaceholderText: {
    fontSize: 12,
    color: '#6C5CE7',
    fontWeight: '500',
  },
  itemDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  itemTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#212121',
  },
  itemSub: {
    fontSize: 11,
    color: '#757575',
  },
  changeButton: {
    borderWidth: 1,
    borderColor: '#6C5CE7',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  changeButtonText: {
    fontSize: 11,
    color: '#6C5CE7',
  },
  accesoriosList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  accesorioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    padding: 6,
    gap: 6,
  },
  chipImage: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  chipTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#212121',
  },
  chipSub: {
    fontSize: 10,
    color: '#757575',
  },
  addAccesorioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6C5CE7',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addAccesorioText: {
    fontSize: 11,
    color: '#6C5CE7',
    marginLeft: 2,
  },
  previewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: Platform.OS === 'web' ? 0 : 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 10,
  },
  previewCard: {
    backgroundColor: '#F5F2FC',
    borderRadius: 8,
    padding: 16,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  emptyPreviewState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPreviewText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  previewImg: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#6C5CE7',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#6C5CE7',
    fontWeight: 'bold',
    fontSize: 13,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#6C5CE7',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  bottomNav: {
    height: 56,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 10,
    color: '#777',
    marginTop: 2,
  },
});