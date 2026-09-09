import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Octicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

export default function VisualizarArmarioScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');

  const categorias = ['Todas', 'Superiores', 'Inferiores', 'Calzado', 'Accesorios'];
  const prendas = [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuIconButton}>
          <Feather name="menu" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prendas</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.mainLayout}>
        {/* Sidebar Desktop */}
        {isDesktop && (
          <View style={styles.sidebar}>
            <TouchableOpacity style={styles.menuItem}>
          
              <Octicons name="home" size={22} color="#666666" />
              <Text style={styles.menuTextLabel}>Inicio</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.menuItemActive]}>
              <MaterialCommunityIcons name="tshirt-crew-outline" size={24} color="#A674DF" />
              <Text style={[styles.menuTextLabel, styles.menuTextActive]}>Prendas</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <MaterialCommunityIcons name="hanger" size={24} color="#666666" />
              <Text style={styles.menuTextLabel}>Outfits</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <MaterialCommunityIcons name="bag-suitcase-outline" size={24} color="#666666" />
              <Text style={styles.menuTextLabel}>Maleta</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.fabButtonDesktop}>
              <Feather name="plus" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Contenido Principal */}
        <ScrollView style={styles.content}>
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Feather name="search" size={16} color="#999999" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar prendas..."
                value={busqueda}
                onChangeText={setBusqueda}
                placeholderTextColor="#999999"
              />
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Feather name="sliders" size={14} color="#666666" style={{ marginRight: 6 }} />
              <Text style={styles.filterText}>Filtros</Text>
            </TouchableOpacity>
          </View>

          {/* Categorías */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
            {categorias.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  categoriaSeleccionada === cat && styles.categoryChipActive,
                ]}
                onPress={() => setCategoriaSeleccionada(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    categoriaSeleccionada === cat && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Estado Vacío */}
          {prendas.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="tshirt-crew-outline" size={32} color="#A674DF" />
              </View>
              <Text style={styles.emptyTitle}>Tu armario está vacío</Text>
              <Text style={styles.emptySubtitle}>
                Todavía no guardaste ninguna prenda. ¡Hacé clic en el botón + para empezar!
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Navigation Móvil */}
      {!isDesktop && (
        <View style={styles.bottomNavContainer}>
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.bottomNavItem}>
              <Octicons name="home" size={20} color="#666666" />
              <Text style={styles.bottomNavLabel}>Inicio</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bottomNavItem}>
              <MaterialCommunityIcons name="tshirt-crew-outline" size={22} color="#A674DF" />
              <Text style={[styles.bottomNavLabel, { color: '#A674DF', fontFamily: 'Poppins_600SemiBold' }]}>
                Prendas
              </Text>
            </TouchableOpacity>

            <View style={{ width: 40 }} />

            <TouchableOpacity style={styles.bottomNavItem}>
              <MaterialCommunityIcons name="hanger" size={22} color="#666666" />
              <Text style={styles.bottomNavLabel}>Outfits</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bottomNavItem}>
              <MaterialCommunityIcons name="bag-suitcase-outline" size={22} color="#666666" />
              <Text style={styles.bottomNavLabel}>Maleta</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.fabButtonMobile}>
            <Feather name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F5FF' },
  header: {
    height: 50,
    backgroundColor: '#A674DF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  menuIconButton: { padding: 4 },
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  mainLayout: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 75,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingTop: 20,
    borderRightWidth: 1,
    borderColor: '#EAEAEA',
  },
  menuItem: { alignItems: 'center', marginBottom: 22 },
  menuItemActive: { opacity: 1 },
  menuTextLabel: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#666666', marginTop: 4 },
  menuTextActive: { color: '#A674DF', fontFamily: 'Poppins_600SemiBold' },
  fabButtonDesktop: {
    marginTop: 'auto',
    marginBottom: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#A674DF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, padding: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginRight: 10,
  },
  searchInput: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#333333' },
  filterButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    alignItems: 'center',
  },
  filterText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#555555' },
  categoriesRow: { flexDirection: 'row', marginBottom: 16, maxHeight: 40 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    height: 32,
  },
  categoryChipActive: { backgroundColor: '#A674DF', borderColor: '#A674DF' },
  categoryText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#666666' },
  categoryTextActive: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3EBFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#333333', textAlign: 'center', marginBottom: 8 },
  emptySubtitle: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#777777', textAlign: 'center', lineHeight: 18 },
  bottomNavContainer: { position: 'relative', alignItems: 'center' },
  bottomBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#EAEAEA',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  bottomNavItem: { alignItems: 'center', justifyContent: 'center' },
  bottomNavLabel: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: '#666666', marginTop: 2 },
  fabButtonMobile: {
    position: 'absolute',
    top: -20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#A674DF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});