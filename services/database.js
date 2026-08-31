import { Platform } from 'react-native';

let db = null;

// Inicializa la base de datos según la plataforma (Web o Móvil)
export const initDatabase = () => {
  if (Platform.OS === 'web') {
    if (!localStorage.getItem('users')) {
      localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('clothes')) {
      localStorage.setItem('clothes', JSON.stringify([]));
    }
    if (!localStorage.getItem('outfits')) {
      localStorage.setItem('outfits', JSON.stringify([]));
    }
    console.log('Base de datos Web (localStorage) inicializada.');
  } else {
    try {
      const SQLite = require('expo-sqlite');
      db = SQLite.openDatabaseSync('vestuario.db');

      db.execSync(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          lastname TEXT,
          email TEXT UNIQUE,
          password TEXT
        );
        CREATE TABLE IF NOT EXISTS clothes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER,
          title TEXT,
          category TEXT,
          imageUri TEXT
        );
        CREATE TABLE IF NOT EXISTS outfits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER,
          name TEXT,
          items TEXT
        );
      `);
      console.log('Base de datos SQLite inicializada en Móvil.');
    } catch (e) {
      console.log('Error al inicializar SQLite:', e);
    }
  }
};

// Función para registrar usuarios (funciona en Celular y Web)
export const registerUser = async (name, lastname, email, password) => {
  const cleanEmail = email.trim().toLowerCase();

  if (Platform.OS === 'web') {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      throw new Error('EMAIL_EXISTS');
    }

    const newUser = { id: Date.now(), name, lastname, email: cleanEmail, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    return newUser;
  } else {
    try {
      if (!db) {
        initDatabase();
      }

      const statement = db.prepareSync(
        'INSERT INTO users (name, lastname, email, password) VALUES (?, ?, ?, ?)'
      );
      const result = statement.executeSync([name, lastname, cleanEmail, password]);
      return { id: result.lastInsertRowId, name, lastname, email: cleanEmail };
    } catch (error) {
      console.log('--- ERROR DETALLADO EN SQLITE CELULAR ---', error);

      const errStr = String(error?.message || error);
      if (errStr.includes('UNIQUE') || errStr.includes('CONSTRAINT')) {
        throw new Error('EMAIL_EXISTS');
      }

      throw error;
    }
  }
};

// Función para iniciar sesión (funciona en Web y Celular)
export const loginUser = (email, password) => {
  const cleanEmail = email.trim().toLowerCase();

  if (Platform.OS === 'web') {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return user;
  } else {
    if (!db) {
      initDatabase();
    }

    const statement = db.prepareSync(
      'SELECT * FROM users WHERE LOWER(email) = ? AND password = ?'
    );
    const result = statement.executeSync([cleanEmail, password]);
    const user = result.getFirstSync();

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return user;
  }
};

// ============================================================
// Restablecer contraseña (Web y Celular)
// ============================================================
export const resetUserPassword = async (email, newPassword) => {
  const cleanEmail = email.trim().toLowerCase();

  if (Platform.OS === 'web') {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

    if (userIndex === -1) {
      return { success: false, message: 'USER_NOT_FOUND' };
    }

    users[userIndex].password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));
    return { success: true };
  } else {
    try {
      if (!db) {
        initDatabase();
      }

      const selectStatement = db.prepareSync(
        'SELECT * FROM users WHERE LOWER(email) = ?'
      );
      const userResult = selectStatement.executeSync([cleanEmail]);
      const user = userResult.getFirstSync();

      if (!user) {
        return { success: false, message: 'USER_NOT_FOUND' };
      }

      const updateStatement = db.prepareSync(
        'UPDATE users SET password = ? WHERE LOWER(email) = ?'
      );
      updateStatement.executeSync([newPassword, cleanEmail]);

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};