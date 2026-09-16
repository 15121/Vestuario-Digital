import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  updateUserProfile,
  resetUserPassword,
} from '../services/database';

import { COLORS } from '../theme/colours';
import { MESSAGES } from '../theme/messages';


// ============================================================
// PANTALLA EDITAR PERFIL
// ============================================================

export default function EditProfileScreen({ navigation, route }) {

  const { width } = useWindowDimensions();

  const isDesktop = width > 768;

  // ----------------------------------------------------------
  // USUARIO RECIBIDO
  // ----------------------------------------------------------

  const user = route?.params?.user;

  // ----------------------------------------------------------
  // ESTADOS DEL FORMULARIO
  // ----------------------------------------------------------

  const [name, setName] = useState(user?.name || '');

  const [lastname, setLastname] = useState(
    user?.lastname || ''
  );

  const [email, setEmail] = useState(
    user?.email || ''
  );

  /*
   * database.js guarda actualmente la contraseña.
   *
   * Si viene en el objeto user, la cargamos.
   * Si no viene, dejamos el campo vacío.
   *
   * Si el usuario no modifica la contraseña,
   * no se actualiza.
   */
  const [password, setPassword] = useState(
    user?.password || ''
  );

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);


  // ==========================================================
  // CAMBIO DE FOTO
  // ==========================================================
  /*
   * El mockup tiene botón de cámara.
   *
   * Actualmente users en database.js no tiene imageUri/avatar.
   * Por eso NO guardamos una foto solamente en localStorage,
   * porque romperíamos la equivalencia Web / SQLite.
   *
   * Dejamos el botón visual preparado para implementar
   * esta funcionalidad cuando agreguemos el campo a users.
   */

  const handleChangePhoto = () => {
    Alert.alert(
      'Foto de perfil',
      'La foto de perfil todavía no está conectada a la base de datos.'
    );
  };


  // ==========================================================
  // CANCELAR
  // ==========================================================

  const handleCancel = () => {
    navigation.goBack();
  };


  // ==========================================================
  // VALIDACIÓN
  // ==========================================================

  const validateForm = () => {

    const cleanName = name.trim();
    const cleanLastname = lastname.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanLastname || !cleanEmail) {
      Alert.alert(
        'Datos incompletos',
        MESSAGES.REQUIRED_FIELDS
      );

      return false;
    }

    // Validación sencilla del correo
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      Alert.alert(
        'Correo inválido',
        'Ingresá un correo electrónico válido.'
      );

      return false;
    }

    return true;
  };


  // ==========================================================
  // GUARDAR CAMBIOS
  // ==========================================================

  const handleSave = async () => {

    if (!user?.id) {
      Alert.alert(
        'Error',
        'No se encontró el usuario actual.'
      );

      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {

      const cleanName = name.trim();
      const cleanLastname = lastname.trim();
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      // ------------------------------------------------------
      // 1. ACTUALIZAR NOMBRE, APELLIDO Y EMAIL
      // ------------------------------------------------------

      const profileResult = await updateUserProfile(
        user.id,
        {
          name: cleanName,
          lastname: cleanLastname,
          email: cleanEmail,
        }
      );

      // ------------------------------------------------------
      // ERROR AL ACTUALIZAR PERFIL
      // ------------------------------------------------------

      if (!profileResult?.success) {

        if (profileResult?.message === 'EMAIL_EXISTS') {

          Alert.alert(
            'Correo ya utilizado',
            'Ya existe otra cuenta registrada con ese correo electrónico.'
          );

        } else if (
          profileResult?.message === 'USER_NOT_FOUND'
        ) {

          Alert.alert(
            'Usuario no encontrado',
            'No se encontró la cuenta que estás intentando modificar.'
          );

        } else {

          Alert.alert(
            'Error',
            MESSAGES.PROFILE_ERROR
          );
        }

        return;
      }


      // ------------------------------------------------------
      // 2. ACTUALIZAR CONTRASEÑA SI CAMBIÓ
      // ------------------------------------------------------

      /*
       * La contraseña está separada en database.js.
       *
       * Solamente llamamos resetUserPassword si:
       *
       * - el usuario escribió una contraseña
       * - y es diferente de la contraseña anterior
       */

      const oldPassword = user?.password || '';

      const passwordChanged =
        cleanPassword.length > 0 &&
        cleanPassword !== oldPassword;


      if (passwordChanged) {

        const passwordResult =
          await resetUserPassword(
            cleanEmail,
            cleanPassword
          );

        if (!passwordResult?.success) {

          if (
            passwordResult?.message === 'USER_NOT_FOUND'
          ) {

            Alert.alert(
              'Error',
              'No se pudo actualizar la contraseña porque no se encontró la cuenta.'
            );

          } else {

            Alert.alert(
              'Error',
              'Los datos del perfil se guardaron, pero no se pudo actualizar la contraseña.'
            );
          }

          return;
        }
      }


      // ------------------------------------------------------
      // 3. ARMAR USUARIO ACTUALIZADO
      // ------------------------------------------------------

      const updatedUser = {
        ...user,
        ...profileResult.user,

        /*
         * En Web profileResult.user conserva password.
         * En SQLite también existe en la tabla users.
         *
         * Si cambiamos la contraseña, actualizamos el objeto
         * local para que las próximas pantallas reciban
         * el dato correcto.
         */
        password: passwordChanged
          ? cleanPassword
          : (
              profileResult?.user?.password ||
              user?.password ||
              ''
            ),
      };


      // ------------------------------------------------------
      // 4. MENSAJE DE ÉXITO
      // ------------------------------------------------------

      Alert.alert(
        'Perfil actualizado',
        MESSAGES.PROFILE_UPDATED,
        [
          {
            text: 'Aceptar',
            onPress: () => {

              /*
               * Volvemos al perfil enviando el usuario
               * actualizado.
               */
              navigation.navigate(
                'Profile',
                {
                  user: updatedUser,
                }
              );
            },
          },
        ]
      );

    } catch (error) {

      console.log(
        'Error al actualizar perfil:',
        error
      );

      let message =
        MESSAGES.PROFILE_ERROR;

      if (error?.message === 'EMAIL_EXISTS') {
        message =
          'Ya existe otra cuenta con ese correo electrónico.';
      }

      if (error?.message === 'USER_NOT_FOUND') {
        message =
          'No se encontró el usuario.';
      }

      Alert.alert(
        'Error',
        message
      );

    } finally {

      setLoading(false);
    }
  };


  // ==========================================================
  // CAMPO REUTILIZABLE
  // ==========================================================

  const ProfileInput = ({
    label,
    icon,
    value,
    onChangeText,
    keyboardType = 'default',
    secureTextEntry = false,
    rightIcon,
    onRightPress,
  }) => {

    return (
      <View style={styles.inputGroup}>

        {/* LABEL */}

        <Text style={styles.inputLabel}>
          {label}
        </Text>

        {/* INPUT */}

        <View style={styles.inputContainer}>

          {/* ICONO */}

          <View style={styles.inputIconBox}>
            <Ionicons
              name={icon}
              size={21}
              color={COLORS.primary}
            />
          </View>

          {/* TEXTO */}

          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            autoCapitalize={
              keyboardType === 'email-address'
                ? 'none'
                : 'sentences'
            }
            autoCorrect={false}
            placeholderTextColor="#A79CAF"
          />

          {/* ICONO DERECHO */}

          {rightIcon && (
            <TouchableOpacity
              style={styles.rightIconButton}
              onPress={onRightPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={rightIcon}
                size={21}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          )}

        </View>

      </View>
    );
  };


  // ==========================================================
  // PANTALLA
  // ==========================================================

  return (
    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,

          isDesktop &&
            styles.scrollContentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ==================================================
            CONTENIDO
        ================================================== */}

        <View
          style={[
            styles.content,

            isDesktop &&
              styles.contentDesktop,
          ]}
        >

          {/* ==================================================
              COLUMNA IZQUIERDA
          ================================================== */}

          <View
            style={[
              styles.formColumn,

              isDesktop &&
                styles.formColumnDesktop,
            ]}
          >

            {/* NOMBRE */}

            <ProfileInput
              label="Nombre"
              icon="person-outline"
              value={name}
              onChangeText={setName}
            />


            {/* APELLIDO */}

            <ProfileInput
              label="Apellido"
              icon="person-outline"
              value={lastname}
              onChangeText={setLastname}
            />


            {/* EMAIL */}

            <ProfileInput
              label="Correo electrónico"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />


            {/* CONTRASEÑA */}

            <ProfileInput
              label="Contraseña"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightIcon={
                showPassword
                  ? 'eye-off-outline'
                  : 'eye-outline'
              }
              onRightPress={() =>
                setShowPassword(
                  !showPassword
                )
              }
            />

          </View>


          {/* =================================================
              COLUMNA DERECHA
          ================================================= */}

          <View
            style={[
              styles.photoColumn,

              isDesktop &&
                styles.photoColumnDesktop,
            ]}
          >

            {/* AVATAR */}

            <View style={styles.avatarWrapper}>

              <View style={styles.avatar}>

                <Ionicons
                  name="person"
                  size={
                    isDesktop
                      ? 100
                      : 68
                  }
                  color="#FFFFFF"
                />

              </View>


              {/* BOTÓN CÁMARA */}

              <TouchableOpacity
                style={[
                  styles.cameraButton,

                  isDesktop &&
                    styles.cameraButtonDesktop,
                ]}
                activeOpacity={0.8}
                onPress={handleChangePhoto}
              >

                <Ionicons
                  name="camera-outline"
                  size={
                    isDesktop
                      ? 25
                      : 17
                  }
                  color="#FFFFFF"
                />

              </TouchableOpacity>

            </View>


            {/* BOTONES DESKTOP */}

            {isDesktop && (

              <View style={styles.desktopActions}>

                {/* CANCELAR */}

                <TouchableOpacity
                  style={styles.cancelButton}
                  activeOpacity={0.8}
                  onPress={handleCancel}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>
                    Cancelar
                  </Text>
                </TouchableOpacity>


                {/* GUARDAR */}

                <TouchableOpacity
                  style={[
                    styles.saveButton,

                    loading &&
                      styles.disabledButton,
                  ]}
                  activeOpacity={0.8}
                  onPress={handleSave}
                  disabled={loading}
                >

                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      Guardar cambios
                    </Text>
                  )}

                </TouchableOpacity>

              </View>
            )}

          </View>


          {/* =================================================
              BOTONES MOBILE
          ================================================= */}

          {!isDesktop && (

            <View style={styles.mobileActions}>

              {/* CANCELAR */}

              <TouchableOpacity
                style={styles.cancelButton}
                activeOpacity={0.8}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>
                  Cancelar
                </Text>
              </TouchableOpacity>


              {/* GUARDAR */}

              <TouchableOpacity
                style={[
                  styles.saveButton,

                  loading &&
                    styles.disabledButton,
                ]}
                activeOpacity={0.8}
                onPress={handleSave}
                disabled={loading}
              >

                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Text style={styles.saveButtonText}>
                    Guardar cambios
                  </Text>
                )}

              </TouchableOpacity>

            </View>
          )}

        </View>

      </ScrollView>

    </View>
  );
}


// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  // ==========================================================
  // GENERAL
  // ==========================================================

  container: {
    flex: 1,
    backgroundColor: '#FAF8FC',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 25,
  },

  scrollContentDesktop: {
    paddingHorizontal: 50,
    paddingTop: 80,
    paddingBottom: 80,
  },


  // ==========================================================
  // CONTENIDO
  // ==========================================================

  content: {
    width: '100%',
  },

  contentDesktop: {
    maxWidth: 1200,
    alignSelf: 'center',

    flexDirection: 'row',

    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },


  // ==========================================================
  // FORMULARIO
  // ==========================================================

  formColumn: {
    width: '100%',
  },

  formColumnDesktop: {
    width: '52%',
    paddingRight: 45,
  },


  // ==========================================================
  // INPUT GROUP
  // ==========================================================

  inputGroup: {
    marginBottom: 14,
  },

  inputLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#625A6D',
    marginBottom: 5,
  },

  inputContainer: {
    height: 48,

    backgroundColor: '#FFFFFF',

    borderRadius: 9,

    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#EEEAF3',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  inputIconBox: {
    width: 42,
    height: 40,

    alignItems: 'center',
    justifyContent: 'center',

    marginLeft: 2,
  },

  textInput: {
    flex: 1,

    height: '100%',

    fontFamily: 'Poppins_400Regular',
    fontSize: 13,

    color: '#4A3B53',

    paddingVertical: 0,
    paddingHorizontal: 3,
  },

  rightIconButton: {
    width: 42,
    height: 42,

    alignItems: 'center',
    justifyContent: 'center',
  },


  // ==========================================================
  // FOTO
  // ==========================================================

  photoColumn: {
    width: '100%',

    alignItems: 'center',

    marginTop: 8,
    marginBottom: 8,
  },

  photoColumnDesktop: {
    width: '45%',

    alignItems: 'center',

    marginTop: 5,
    paddingTop: 10,
  },

  avatarWrapper: {
    position: 'relative',

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 20,
  },

  avatar: {
    width: 116,
    height: 116,

    borderRadius: 58,

    backgroundColor: '#BDBDBD',

    borderWidth: 3,
    borderColor: '#FFFFFF',

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },

  cameraButton: {
    position: 'absolute',

    right: -4,
    bottom: 0,

    width: 30,
    height: 30,

    borderRadius: 15,

    backgroundColor: COLORS.primary,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  cameraButtonDesktop: {
    width: 50,
    height: 50,

    borderRadius: 25,

    right: -10,
    bottom: -2,

    borderWidth: 3,
  },


  // ==========================================================
  // BOTONES DESKTOP
  // ==========================================================

  desktopActions: {
    width: '100%',
    maxWidth: 500,

    flexDirection: 'row',

    justifyContent: 'center',

    gap: 16,

    marginTop: 48,
  },


  // ==========================================================
  // BOTONES MOBILE
  // ==========================================================

  mobileActions: {
    width: '100%',

    flexDirection: 'row',

    gap: 10,

    marginTop: 6,
  },


  // ==========================================================
  // CANCELAR
  // ==========================================================

  cancelButton: {
    flex: 1,

    height: 46,

    borderRadius: 8,

    borderWidth: 1.3,
    borderColor: COLORS.primary,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,

    color: COLORS.primary,
  },


  // ==========================================================
  // GUARDAR
  // ==========================================================

  saveButton: {
    flex: 1,

    height: 46,

    borderRadius: 8,

    backgroundColor: COLORS.buttonDark,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 12,
  },

  saveButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,

    color: '#FFFFFF',
  },

  disabledButton: {
    opacity: 0.65,
  },

});