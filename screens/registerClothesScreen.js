import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from "react-native";

export default function RegisterClothingScreen() {
  const { width } = useWindowDimensions();

  const isMobile = width < 700;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("");
  const [season, setSeason] = useState("");
  const [occasion, setOccasion] = useState("");

  return (
    <View style={styles.container}>

      {/* =========================
          BARRA SUPERIOR
      ========================== */}

      <View style={styles.topBar}>

        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          Agregar prenda
        </Text>

        {!isMobile && (
          <View style={styles.profile}>
            <Text style={styles.profileText}>👩🏻</Text>
          </View>
        )}

      </View>


      {/* =========================
          MENU LATERAL - COMPUTADORA
      ========================== */}

      {!isMobile && (
        <View style={styles.sideMenu}>

          <MenuItem
            icon="⌂"
            text="Inicio"
          />

          <MenuItem
            icon="♧"
            text="Prendas"
          />

          <MenuItem
            icon="♧"
            text="Outfits"
            active
          />

          <MenuItem
            icon="▣"
            text="Maleta"
          />

          <TouchableOpacity style={styles.plusButton}>
            <Text style={styles.plusText}>+</Text>
          </TouchableOpacity>

        </View>
      )}


      {/* =========================
          CONTENIDO
      ========================== */}

      <ScrollView
        style={[
          styles.scroll,
          !isMobile && styles.desktopScroll,
        ]}
        contentContainerStyle={[
          styles.content,
          isMobile && styles.mobileContent,
        ]}
        showsVerticalScrollIndicator={false}
      >

        <View
          style={[
            styles.form,
            !isMobile && styles.desktopForm,
          ]}
        >

          {/* =========================
              COLUMNA IZQUIERDA
          ========================== */}

          <View
            style={[
              styles.leftColumn,
              !isMobile && styles.desktopColumn,
            ]}
          >

            {/* SUBIR FOTO */}

            <TouchableOpacity style={styles.uploadBox}>

              <View style={styles.camera}>
                <View style={styles.cameraLens} />
              </View>

              <Text style={styles.uploadTitle}>
                Tomar o seleccionar foto
              </Text>

              <Text style={styles.uploadSubtitle}>
                Subí una imagen de tu prenda
              </Text>

            </TouchableOpacity>


            {/* NOMBRE */}

            <View style={styles.nameSection}>

              <Text style={styles.label}>
                Nombre de la prenda
              </Text>

              <View style={styles.inputBox}>

                <Text style={styles.inputIcon}>
                  ♧
                </Text>

                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Ej. Remera blanca básica"
                  placeholderTextColor="#9695A5"
                  style={styles.textInput}
                />

              </View>

            </View>

          </View>


          {/* =========================
              COLUMNA DERECHA
          ========================== */}

          <View
            style={[
              styles.rightColumn,
              !isMobile && styles.desktopColumn,
            ]}
          >

            {/* CATEGORÍA */}

            <Option
              icon="♧"
              title="Categoría"
              value={category}
              placeholder="Seleccionar categoría"
              onPress={() =>
                setCategory(
                  category === "Remera"
                    ? ""
                    : "Remera"
                )
              }
            />


            {/* COLOR */}

            <Option
              icon="●"
              title="Color"
              value={color}
              placeholder="Seleccionar color"
              onPress={() =>
                setColor(
                  color === "Violeta"
                    ? ""
                    : "Violeta"
                )
              }
            />


            {/* TEMPORADA */}

            <Option
              icon="☼"
              title="Temporada"
              value={season}
              placeholder="Seleccionar temporada"
              onPress={() =>
                setSeason(
                  season === "Primavera"
                    ? ""
                    : "Primavera"
                )
              }
            />


            {/* OCASIÓN */}

            <Option
              icon="☆"
              title="Ocasión"
              value={occasion}
              placeholder="Seleccionar ocasión"
              onPress={() =>
                setOccasion(
                  occasion === "Casual"
                    ? ""
                    : "Casual"
                )
              }
            />


            {/* DESCRIPCIÓN */}

            <View style={styles.descriptionContainer}>

              <View style={styles.descriptionHeader}>

                <View style={styles.optionIcon}>
                  <Text style={styles.iconText}>
                    ▤
                  </Text>
                </View>

                <Text style={styles.optionTitle}>
                  Descripción (opcional)
                </Text>

              </View>

              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Agregá una descripción..."
                placeholderTextColor="#9695A5"
                multiline
                maxLength={150}
                style={styles.descriptionInput}
                textAlignVertical="top"
              />

              <Text style={styles.counter}>
                {description.length}/150
              </Text>

            </View>

          </View>

        </View>


        {/* =========================
            BOTONES
        ========================== */}

        <View style={styles.buttons}>

          <TouchableOpacity style={styles.cancelButton}>
            <Text style={styles.cancelText}>
              Cancelar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveText}>
              Guardar
            </Text>
          </TouchableOpacity>

        </View>

      </ScrollView>


      {/* =========================
          MENU INFERIOR - MOVIL
      ========================== */}

      {isMobile && (
        <View style={styles.bottomMenu}>

          <BottomItem
            icon="⌂"
            text="Inicio"
          />

          <BottomItem
            icon="♧"
            text="Prendas"
          />

          <BottomItem
            icon="♧"
            text="Outfits"
            active
          />

          <BottomItem
            icon="▣"
            text="Maleta"
          />

        </View>
      )}

    </View>
  );
}


/* =====================================================
   COMPONENTE OPCIÓN
===================================================== */

function Option({
  icon,
  title,
  value,
  placeholder,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.option}
      onPress={onPress}
    >

      <View style={styles.optionIcon}>

        <Text style={styles.iconText}>
          {icon}
        </Text>

      </View>

      <Text style={styles.optionTitle}>
        {title}
      </Text>

      <Text
        style={[
          styles.optionValue,
          value && styles.selectedValue,
        ]}
      >
        {value || placeholder}
      </Text>

      <Text style={styles.arrow}>
        ⌄
      </Text>

    </TouchableOpacity>
  );
}


/* =====================================================
   MENU LATERAL
===================================================== */

function MenuItem({
  icon,
  text,
  active = false,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        active && styles.menuItemActive,
      ]}
    >

      <Text
        style={[
          styles.menuIcon,
          active && styles.menuActiveText,
        ]}
      >
        {icon}
      </Text>

      <Text
        style={[
          styles.menuText,
          active && styles.menuActiveText,
        ]}
      >
        {text}
      </Text>

    </TouchableOpacity>
  );
}


/* =====================================================
   MENU INFERIOR MOVIL
===================================================== */

function BottomItem({
  icon,
  text,
  active = false,
}) {
  return (
    <TouchableOpacity style={styles.bottomItem}>

      <Text
        style={[
          styles.bottomIcon,
          active && styles.bottomActive,
        ]}
      >
        {icon}
      </Text>

      <Text
        style={[
          styles.bottomText,
          active && styles.bottomActive,
        ]}
      >
        {text}
      </Text>

    </TouchableOpacity>
  );
}


/* =====================================================
   ESTILOS
===================================================== */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },


  /* =========================
     BARRA SUPERIOR
  ========================== */

  topBar: {
    height: 90,
    backgroundColor: "#C79CFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 10,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "400",
  },

  backButton: {
    position: "absolute",
    left: 22,
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
  },

  backIcon: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "300",
  },

  profile: {
    position: "absolute",
    right: 40,
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  profileText: {
    fontSize: 28,
  },


  /* =========================
     MENU LATERAL
  ========================== */

  sideMenu: {
    position: "absolute",
    left: 0,
    top: 90,
    bottom: 0,
    width: 155,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#EEEEF4",
    zIndex: 5,
    alignItems: "center",
  },

  menuItem: {
    width: "100%",
    height: 105,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  menuItemActive: {
    backgroundColor: "#FFFFFF",
  },

  menuIcon: {
    fontSize: 30,
    color: "#707486",
  },

  menuText: {
    fontSize: 14,
    color: "#707486",
    fontWeight: "500",
  },

  menuActiveText: {
    color: "#7B35C9",
  },

  plusButton: {
    position: "absolute",
    bottom: 25,
    width: 68,
    height: 68,
    borderRadius: 40,
    backgroundColor: "#7B35C9",
    alignItems: "center",
    justifyContent: "center",
  },

  plusText: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "300",
  },


  /* =========================
     CONTENIDO
  ========================== */

  scroll: {
    flex: 1,
  },

  desktopScroll: {
    marginLeft: 155,
  },

  content: {
    padding: 25,
    paddingBottom: 40,
  },

  mobileContent: {
    paddingTop: 14,
    paddingHorizontal: 13,
    paddingBottom: 75,
  },


  /* =========================
     FORMULARIO
  ========================== */

  form: {
    width: "100%",
  },

  desktopForm: {
    maxWidth: 1350,
    alignSelf: "center",
    flexDirection: "row",
    gap: 30,
  },

  leftColumn: {
    width: "100%",
  },

  desktopColumn: {
    flex: 1,
  },


  /* =========================
     FOTO
  ========================== */

  uploadBox: {
    height: 200,
    borderWidth: 2,
    borderColor: "#D1A9F2",
    borderStyle: "dashed",
    borderRadius: 14,
    backgroundColor: "#FBF9FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  camera: {
    width: 78,
    height: 60,
    borderWidth: 4,
    borderColor: "#7B35C9",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    position: "relative",
  },

  cameraLens: {
    width: 31,
    height: 31,
    borderWidth: 5,
    borderColor: "#7B35C9",
    borderRadius: 20,
  },

  uploadTitle: {
    fontSize: 23,
    color: "#29283D",
    fontWeight: "600",
  },

  uploadSubtitle: {
    fontSize: 16,
    color: "#77798A",
    marginTop: 7,
  },


  /* =========================
     NOMBRE
  ========================== */

  nameSection: {
    width: "100%",
  },

  label: {
    fontSize: 19,
    fontWeight: "600",
    color: "#343348",
    marginBottom: 10,
  },

  inputBox: {
    height: 60,
    borderWidth: 1,
    borderColor: "#E5E2EC",
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 17,
  },

  inputIcon: {
    color: "#7B35C9",
    fontSize: 21,
    marginRight: 12,
  },

  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#343348",
  },


  /* =========================
     PANEL DERECHO
  ========================== */

  rightColumn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    paddingHorizontal: 18,

    ...Platform.select({
      web: {
        boxShadow: "0px 3px 18px rgba(60,40,90,0.08)",
      },
      default: {
        elevation: 3,
      },
    }),
  },


  /* =========================
     OPCIONES
  ========================== */

  option: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEF3",
    gap: 15,
  },

  optionIcon: {
    width: 45,
    height: 45,
    borderRadius: 30,
    backgroundColor: "#FAF5FF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  iconText: {
    color: "#7B35C9",
    fontSize: 21,
  },

  optionTitle: {
    fontSize: 17,
    color: "#343348",
    fontWeight: "500",
  },

  optionValue: {
    marginLeft: "auto",
    color: "#77798A",
    fontSize: 15,
  },

  selectedValue: {
    color: "#7B35C9",
  },

  arrow: {
    color: "#7B35C9",
    fontSize: 22,
    marginLeft: 4,
  },


  /* =========================
     DESCRIPCIÓN
  ========================== */

  descriptionContainer: {
    paddingVertical: 24,
  },

  descriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 17,
  },

  descriptionInput: {
    width: "100%",
    height: 60,
    borderWidth: 1,
    borderColor: "#E2DFEB",
    borderRadius: 11,
    padding: 14,
    fontSize: 14,
    color: "#343348",
  },

  counter: {
    textAlign: "right",
    color: "#888B99",
    fontSize: 11,
    marginTop: -23,
    marginRight: 12,
  },


  /* =========================
     BOTONES
  ========================== */

  buttons: {
    maxWidth: 1350,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    gap: 22,
    marginTop: 15,
  },

  cancelButton: {
    flex: 1,
    height: 42,
    borderWidth: 2,
    borderColor: "#9D5DDE",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  cancelText: {
    color: "#7135C9",
    fontSize: 18,
    fontWeight: "600",
  },

  saveButton: {
    flex: 1,
    height: 65,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7B35C9",
  },

  saveText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },


  /* =========================
     MENU MOVIL
  ========================== */

  bottomMenu: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 62,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEF3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  bottomItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },

  bottomIcon: {
    fontSize: 18,
    color: "#77798A",
  },

  bottomText: {
    fontSize: 7,
    color: "#77798A",
    fontWeight: "500",
  },

  bottomActive: {
    color: "#7B35C9",
  },

});