import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';

import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
 import { Ionicons } from '@expo/vector-icons';

const PURPLE = '#764DC6';
const LIGHT_PURPLE = '#A66BE3';
const BACKGROUND = '#F8F9FE';

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>

      {/* BARRA SUPERIOR */}
      <View style={styles.header}>

        <Text style={styles.menuIcon}>
          ☰
        </Text>

        <Text style={styles.headerTitle}>
          Detalle de prenda
        </Text>

        <View style={styles.profile}>
          <Text style={styles.profileIcon}>
            👤
          </Text>
        </View>

      </View>


      <View style={styles.body}>

        {/* MENÚ LATERAL - COMPUTADORA */}
        {!isMobile && (
          <View style={styles.sidebar}>

            <TouchableOpacity style={styles.sideItem}>
              <Text style={styles.sideIcon}>⌂</Text>
              <Text style={styles.sideText}>Inicio</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideItem}>
              <Text style={styles.sideIcon}>♧</Text>
              <Text style={styles.sideText}>Prendas</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideItem}>
              <Text style={styles.sideIcon}>♧</Text>
              <Text style={styles.sideText}>Outfits</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideItem}>
              <Text style={styles.sideIcon}>▣</Text>
              <Text style={styles.sideText}>Maleta</Text>
            </TouchableOpacity>

          </View>
        )}


        {/* CONTENIDO */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            isMobile && styles.mobileContent,
          ]}
          showsVerticalScrollIndicator={false}
        >

          <View
            style={[
              styles.mainLayout,
              isMobile && styles.mobileLayout,
            ]}
          >

            {/* ESPACIO VACÍO PARA LA FOTO */}
            <View
              style={[
                styles.leftColumn,
                isMobile && styles.mobileColumn,
              ]}
            >

              <View
                style={[
                  styles.emptyImage,
                  isMobile && styles.mobileEmptyImage,
                ]}
              >
              </View>

            </View>


            {/* INFORMACIÓN VACÍA */}
            <View
              style={[
                styles.infoCard,
                isMobile && styles.mobileInfoCard,
              ]}
            >

            <InfoRow title="Categoría" icon="shirt-outline" />
            <InfoRow title="Color" icon="color-palette-outline" />
            <InfoRow title="Temporada" icon="sunny-outline" />
            <InfoRow title="Ocasión" icon="sparkles-outline" />
            <InfoRow title="Descripción" icon="document-text-outline" />
            <InfoRow title="Fecha de creación" icon="calendar-outline" />


              {/* BOTONES */}
              <View
                style={[
                  styles.buttons,
                  isMobile && styles.mobileButtons,
                ]}
              >

                <TouchableOpacity style={styles.editButton}>
                  <Text style={styles.editText}>
                    Editar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteButton}>
                  <Text style={styles.deleteText}>
                    Eliminar
                  </Text>
                </TouchableOpacity>

              </View>

            </View>

          </View>


          {/* VOLVER */}
          <TouchableOpacity
            style={[
              styles.backButton,
              isMobile && styles.mobileBackButton,
            ]}
          >
            <Text style={styles.backText}>
              ← Volver
            </Text>
          </TouchableOpacity>

        </ScrollView>

      </View>


      {/* BOTÓN + */}
      <TouchableOpacity
        style={[
          styles.addButton,
          isMobile && styles.mobileAddButton,
        ]}
      >
        <Text style={styles.addText}>
          +
        </Text>
      </TouchableOpacity>

    </View>
  );
}


/* FILA DE INFORMACIÓN */

function InfoRow({ title, icon }) {
  return (
    <View style={styles.infoRow}>

      <View style={styles.infoLeft}>

        <View style={styles.iconCircle}>
          <Ionicons
            name={icon}
            size={16}
            color={PURPLE}
          />
        </View>

        <Text style={styles.infoTitle}>
          {title}
        </Text>

      </View>

      <View style={styles.infoValue} />

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },


  /* BARRA SUPERIOR */

  header: {
    height: 60,
    backgroundColor: LIGHT_PURPLE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  menuIcon: {
    width: 50,
    color: '#FFFFFF',
    fontSize: 23,
    fontFamily: 'Poppins_400Regular',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },

  profile: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileIcon: {
    fontSize: 17,
  },


  /* CUERPO */

  body: {
    flex: 1,
    flexDirection: 'row',
  },


  /* MENÚ LATERAL */

  sidebar: {
    width: 85,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingTop: 28,
    borderRightWidth: 1,
    borderRightColor: '#EEEEEE',
  },

  sideItem: {
    alignItems: 'center',
    marginBottom: 28,
  },

  sideIcon: {
    fontSize: 21,
    color: '#777777',
    marginBottom: 5,
  },

  sideText: {
    color: '#777777',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },


  /* CONTENIDO */

  scroll: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    padding: 25,
  },

  mobileContent: {
    padding: 16,
    paddingBottom: 90,
  },


  /* COMPUTADORA */

  mainLayout: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 20,
  },

  leftColumn: {
    flex: 1,
  },

  emptyImage: {
    height: 330,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },


  /* INFORMACIÓN */

  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: 16,
  },

  infoRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  infoLeft: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F2EAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },

  infoIcon: {
    color: PURPLE,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },

  infoTitle: {
    color: '#777777',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },

  infoValue: {
    flex: 1,
  },


  /* BOTONES */

  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },

  editButton: {
    flex: 1,
    height: 40,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#B58BE7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  editText: {
    color: PURPLE,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },

  deleteButton: {
    flex: 1,
    height: 40,
    borderRadius: 7,
    backgroundColor: PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
  },

  deleteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },


  /* VOLVER */

  backButton: {
    width: '100%',
    maxWidth: 1000,
    height: 46,
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4D9F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backText: {
    color: PURPLE,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },


  /* CELULAR */

  mobileLayout: {
    flexDirection: 'column',
    gap: 16,
  },

  mobileColumn: {
    width: '100%',
  },

  mobileEmptyImage: {
    height: 220,
    width: '100%',
  },

  mobileInfoCard: {
    width: '100%',
    padding: 14,
  },

  mobileButtons: {
    flexDirection: 'column',
    gap: 10,
  },

  mobileBackButton: {
    marginTop: 16,
  },


  /* BOTÓN + */

  addButton: {
    position: 'absolute',
    left: 23,
    bottom: 23,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
  },

  mobileAddButton: {
    left: 18,
    bottom: 18,
  },

  addText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Poppins_400Regular',
  },

});