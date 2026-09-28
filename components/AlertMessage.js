import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


export default function AlertMessage({ type = 'success', message }) {
  if (!message) return null;

  const isSuccess = type === 'success';
  const isWarning = type === 'warning';

  const containerStyle = isSuccess
    ? styles.successBg
    : isWarning
    ? styles.warningBg
    : styles.errorBg;

  const iconBgStyle = isSuccess
    ? styles.successIconBg
    : isWarning
    ? styles.warningIconBg
    : styles.errorIconBg;

  const iconName = isSuccess
    ? 'checkmark'
    : isWarning
    ? 'alert-circle-outline'
    : 'warning-outline';

  const iconColor = isSuccess
    ? '#2E7D32'
    : isWarning
    ? '#B26A00'
    : '#D32F2F';

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.iconCircle, iconBgStyle]}>
        <Ionicons 
          name={iconName} 
          size={16} 
          color={iconColor} 
        />
      </View>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginBottom: 16,
    width: '100%',
  },
  successBg: {
    backgroundColor: '#E8F5E9', // Verde claro
  },
  errorBg: {
    backgroundColor: '#FFEBEE', // Rojo claro
  },
  warningBg: {
    backgroundColor: '#FFF3E0', // Naranja claro
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  successIconBg: {
    backgroundColor: '#C8E6C9',
  },
  errorIconBg: {
    backgroundColor: '#FFCDD2',
  },
  warningIconBg: {
    backgroundColor: '#FFE0B2',
  },
  text: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    flex: 1,
  },
});