import { Platform } from 'react-native';

let db = null;

// Inicializa la base de datos según la plataforma
export const initDatabase = () => {
  if (Platform.OS === 'web') {
    // En la Web inicializamos las tablas en localStorage
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
    // En Android / iOS cargamos expo-sqlite solo en entorno nativo
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
  }
};

// Función para registrar usuarios (funciona en Celular y Web)
export const registerUser = (name, lastname, email, password) => {
  if (Platform.OS === 'web') {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const existing = users.find(u => u.email === email);
    if (existing) {
      throw new Error('El correo electrónico ya está registrado.');
    }
    const newUser = { id: Date.now(), name, lastname, email, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    return newUser;
  } else {
    const statement = db.prepareSync(
      'INSERT INTO users (name, lastname, email, password) VALUES (?, ?, ?, ?)'
    );
    const result = statement.executeSync([name, lastname, email, password]);
    return { id: result.lastInsertRowId, name, lastname, email };
  }
};