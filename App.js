import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import CreateOutfitScreen from './screens/CreateOutfitScreen';

export default function App() {
  const dummyNavigation = {
    goBack: () => console.log('Volver atrás'),
    navigate: (screen) => console.log('Navegar a:', screen),
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CreateOutfitScreen navigation={dummyNavigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5FA',
  },
});