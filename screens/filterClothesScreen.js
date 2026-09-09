import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';

export default function FilterClothesScreen({ navigation }) {
  const { width } = useWindowDimensions();

  // Datos de ejemplo de la prenda
  const prenda = {
    nombre: 'Remera blanca básica',
    categoria: 'Remera',
    color: 'Blanco',
    temporada: 'Verano',
    ocasion: 'Casual',
    descripcion: 'Remera básica de algodón, ideal para uso diario.',
    fecha: '15/07/2026',

    // Cambiá esta dirección por la imagen de tu prenda si ya tenés una.
    imagen:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
  };

  const irA = (pantalla) => {
    if (navigation) {
      navigation.navigate(pantalla);
    }
  };

  return (
    <View style={styles.container}>

      {/* =========================
          BARRA SUPERIOR
      ========================= */}
      <View style={styles.topBar}>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {}}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        <Text style={styles.tituloSuperior}>
          Detalle de prenda
        </Text>

      </View>

      {/* =========================
          CONTENIDO PRINCIPAL
      ========================= */}
      <View style={styles.body}>

        {/* =========================
            MENU LATERAL
        ========================= */}
        <View style={styles.sidebar}>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => irA('Home')}
          >
            <Text style={styles.menuItemIcon}>⌂</Text>
            <Text style={styles.menuItemText}>Inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => irA('Prendas')}
          >
            <Text style={styles.menuItemIcon}>♧</Text>
            <Text style={styles.menuItemText}>Prendas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => irA('Outfits')}
          >
            <Text style={styles.menuItemIcon}>♧</Text>
            <Text style={styles.menuItemText}>Outfits</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => irA('Maleta')}
          >
            <Text style={styles.menuItemIcon}>▣</Text>
            <Text style={styles.menuItemText}>Maleta</Text>
          </TouchableOpacity>

          {/* BOTÓN + */}
          <TouchableOpacity
            style={styles.plusButton}
            onPress={() => {}}
          >
            <Text style={styles.plusText}>+</Text>
          </TouchableOpacity>

        </View>

        {/* =========================
            ZONA DE CONTENIDO
        ========================= */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >

          <View
            style={[
              styles.cardsContainer,
              width < 800 && styles.cardsContainerMobile,
            ]}
          >

            {/* =========================
                TARJETA DE IMAGEN
            ========================= */}
            <View
              style={[
                styles.imageSection,
                width < 800 && styles.imageSectionMobile,
              ]}
            >

              <View style={styles.imageCard}>

                <Image
                  source={{ uri: prenda.imagen }}
                  style={styles.prendaImage}
                  resizeMode="contain"
                />

                {/* INDICADOR DE FOTOS */}
                <View style={styles.photoCounter}>
                  <Text style={styles.photoCounterText}>
                    1/3
                  </Text>
                </View>

              </View>

              {/* NOMBRE DE LA PRENDA */}
              <Text style={styles.nombrePrenda}>
                {prenda.nombre}
              </Text>

            </View>

            {/* =========================
                TARJETA DE INFORMACIÓN
            ========================= */}
            <View
              style={[
                styles.infoCard,
                width < 800 && styles.infoCardMobile,
              ]}
            >

              {/* CATEGORÍA */}
              <InfoRow
                icon="♧"
                titulo="Categoría"
                valor={prenda.categoria}
              />

              {/* COLOR */}
              <InfoRow
                icon="◉"
                titulo="Color"
                valor={prenda.color}
              />

              {/* TEMPORADA */}
              <InfoRow
                icon="☼"
                titulo="Temporada"
                valor={prenda.temporada}
              />

              {/* OCASIÓN */}
              <InfoRow
                icon="♨"
                titulo="Ocasión"
                valor={prenda.ocasion}
              />

              {/* DESCRIPCIÓN */}
              <InfoRow
                icon="▱"
                titulo="Descripción"
                valor={prenda.descripcion}
                descripcion
              />

              {/* FECHA */}
              <InfoRow
                icon="□"
                titulo="Fecha de creación"
                valor={prenda.fecha}
              />

              {/* =========================
                  BOTONES
              ========================= */}
              <View style={styles.buttonsContainer}>

                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {}}
                >
                  <Text style={styles.editIcon}>✎</Text>
                  <Text style={styles.editText}>
                    Editar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {}}
                >
                  <Text style={styles.deleteIcon}>♜</Text>
                  <Text style={styles.deleteText}>
                    Eliminar
                  </Text>
                </TouchableOpacity>

              </View>

            </View>

          </View>

          {/* =========================
              BOTÓN VOLVER
          ========================= */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation) {
                navigation.goBack();
              }
            }}
          >
            <Text style={styles.backText}>
              ← Volver
            </Text>
          </TouchableOpacity>

        </ScrollView>

      </View>

    </View>
  );
}


/* ==========================================
   COMPONENTE PARA CADA FILA DE INFORMACIÓN
========================================== */

function InfoRow({
  icon,
  titulo,
  valor,
  descripcion = false,
}) {
  return (
    <View style={styles.infoRow}>

      {/* ÍCONO */}
      <View style={styles.infoIconCircle}>
        <Text style={styles.infoIcon}>
          {icon}
        </Text>
      </View>

      {/* TÍTULO */}
      <Text style={styles.infoTitle}>
        {titulo}
      </Text>

      {/* VALOR */}
      <Text
        style={[
          styles.infoValue,
          descripcion && styles.infoValueDescription,
        ]}
      >
        {valor}
      </Text>

    </View>
  );
}


/* ==========================================
   ESTILOS
========================================== */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F7F7FC',
  },

  /* =========================
     BARRA SUPERIOR
  ========================= */

  topBar: {
    height: 60,
    backgroundColor: '#A45BE0',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },

  menuButton: {
    width: 65,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuIcon: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '400',
  },

  tituloSuperior: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  /* =========================
     CUERPO
  ========================= */

  body: {
    flex: 1,
    flexDirection: 'row',
  },

  /* =========================
     MENU LATERAL
  ========================= */

  sidebar: {
    width: 85,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#EEEEF2',
    alignItems: 'center',
    paddingTop: 25,
  },

  menuItem: {
    width: 85,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuItemIcon: {
    fontSize: 23,
    color: '#77727D',
    marginBottom: 7,
  },

  menuItemText: {
    fontSize: 11,
    color: '#77727D',
  },

  plusButton: {
    position: 'absolute',
    bottom: 28,
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#8149CF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  plusText: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '300',
    lineHeight: 31,
  },

  /* =========================
     CONTENIDO
  ========================= */

  contentScroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 40,
    paddingTop: 25,
    paddingBottom: 35,
  },

  cardsContainer: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 20,
  },

  cardsContainerMobile: {
    flexDirection: 'column',
  },

  /* =========================
     IMAGEN
  ========================= */

  imageSection: {
    flex: 1,
  },

  imageSectionMobile: {
    width: '100%',
  },

  imageCard: {
    height: 335,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9E9EE',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  prendaImage: {
    width: '90%',
    height: '90%',
  },

  photoCounter: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#F0E4FC',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  photoCounterText: {
    color: '#7C42C9',
    fontSize: 11,
    fontWeight: '600',
  },

  nombrePrenda: {
    color: '#27252B',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },

  /* =========================
     TARJETA INFORMACIÓN
  ========================= */

  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9E9EE',
    borderRadius: 9,
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 16,
  },

  infoCardMobile: {
    width: '100%',
  },

  /* =========================
     FILAS
  ========================= */

  infoRow: {
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEF1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },

  infoIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1E5FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  infoIcon: {
    color: '#8149CF',
    fontSize: 14,
  },

  infoTitle: {
    color: '#77727D',
    fontSize: 12,
    flex: 1,
  },

  infoValue: {
    color: '#37343A',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: 180,
  },

  infoValueDescription: {
    maxWidth: 190,
    lineHeight: 15,
  },

  /* =========================
     BOTONES
  ========================= */

  buttonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },

  editButton: {
    flex: 1,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#9B52D9',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  editIcon: {
    color: '#8149CF',
    fontSize: 15,
    marginRight: 7,
  },

  editText: {
    color: '#8149CF',
    fontSize: 12,
    fontWeight: '600',
  },

  deleteButton: {
    flex: 1,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#7D49CA',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  deleteIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 7,
  },

  deleteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  /* =========================
     VOLVER
  ========================= */

  backButton: {
    width: '100%',
    maxWidth: 1000,
    height: 46,
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2CFF5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    color: '#7D49CA',
    fontSize: 12,
    fontWeight: '500',
  },

});