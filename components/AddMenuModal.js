import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colours';

export default function AddMenuModal({ visible, onClose, onAddPrenda, onAddOutfit }) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <View style={styles.handleBar} />

              <Text style={styles.modalTitle}>¿Qué querés agregar?</Text>

              {/* Botón Agregar prenda */}
              <TouchableOpacity 
                style={styles.optionButton} 
                onPress={() => { onClose(); onAddPrenda && onAddPrenda(); }}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name="shirt-outline" size={22} color={COLORS.primary || '#9C4EDD'} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.optionTitle}>Agregar prenda</Text>
                  <Text style={styles.optionSubtitle}>Registrá una nueva prenda en tu armario digital.</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.primary || '#9C4EDD'} />
              </TouchableOpacity>

              {/* Botón Crear outfit (Con el ícono de PERCHA corregido) */}
              <TouchableOpacity 
                style={styles.optionButton} 
                onPress={() => { onClose(); onAddOutfit && onAddOutfit(); }}
              >
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name="hanger" size={22} color={COLORS.primary || '#9C4EDD'} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.optionTitle}>Crear outfit</Text>
                  <Text style={styles.optionSubtitle}>Combiná tus prendas para crear un nuevo outfit.</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.primary || '#9C4EDD'} />
              </TouchableOpacity>

              {/* Botón Cancelar */}
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    elevation: 20,
    zIndex: 9999,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4A4A4A',
    textAlign: 'center',
    marginBottom: 18,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F0E6F7',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
  },
  optionSubtitle: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#777777',
    marginTop: 2,
  },
  cancelButton: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary || '#9C4EDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  cancelButtonText: {
    color: COLORS.primary || '#9C4EDD',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
});