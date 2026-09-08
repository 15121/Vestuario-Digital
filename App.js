import React from 'react';
import { View, StyleSheet } from 'react-native';
import RegisterClothesScreen from './screens/registerClothesScreen';

export default function App() {
  return (
    <View style={styles.container}>
      <RegisterClothesScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});