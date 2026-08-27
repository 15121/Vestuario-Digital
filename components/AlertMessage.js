import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AlertMessage({ type = 'success', message }) {
  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <View style={[styles.container, isSuccess ? styles.successBg : styles.errorBg]}>
      <View style={[styles.iconCircle, isSuccess ? styles.successIconBg : styles.errorIconBg]}>
        <Ionicons 
          name={isSuccess ? "checkmark" : "warning-outline"} 
          size={16} 
          color={isSuccess ? "#2E7D32" : "#D32F2F"} 
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
  text: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    flex: 1,
  },
});