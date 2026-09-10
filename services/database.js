import { Platform } from 'react-native';
 
let db = null;
 
// ============================================================
// Inicializa la base de datos según la plataforma (Web o Móvil)
// ============================================================
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
    if (!localStorage.getItem('history')) {
      localStorage.setItem('history', JSON.stringify([]));
    }
    if (!localStorage.getItem('suitcases')) {
      localStorage.setItem('suitcases', JSON.stringify([]));
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
          imageUri TEXT,
          color TEXT,
          season TEXT,
          ocasion TEXT,
          description TEXT,
          createdAt TEXT
        );
        CREATE TABLE IF NOT EXISTS outfits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER,
          name TEXT,
          description TEXT,
          items TEXT,
          createdAt TEXT
        );
        CREATE TABLE IF NOT EXISTS history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER,
          outfitId INTEGER,
          outfitName TEXT,
          imageUri TEXT,
          note TEXT,
          date TEXT
        );
        CREATE TABLE IF NOT EXISTS suitcases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER,
          destino TEXT,
          fechaInicio TEXT,
          fechaFin TEXT,
          estado TEXT,
          items TEXT,
          active INTEGER,
          createdAt TEXT
        );
      `);
 
      // Migración segura para bases ya creadas antes de agregar estas columnas.
      // Si la columna ya existe, SQLite tira error "duplicate column name" y lo ignoramos.
      const clothesNewColumns = ['color', 'season', 'ocasion', 'description', 'createdAt'];
      clothesNewColumns.forEach((column) => {
        try {
          db.execSync(`ALTER TABLE clothes ADD COLUMN ${column} TEXT;`);
        } catch (e) {
          // La columna ya existía, no hacemos nada.
        }
      });
 
      const outfitsNewColumns = ['description', 'createdAt'];
      outfitsNewColumns.forEach((column) => {
        try {
          db.execSync(`ALTER TABLE outfits ADD COLUMN ${column} TEXT;`);
        } catch (e) {
          // La columna ya existía, no hacemos nada.
        }
      });
 
      console.log('Base de datos SQLite inicializada en Móvil.');
    } catch (e) {
      console.log('Error al inicializar SQLite:', e);
    }
  }
};
 
// ============================================================
// Función para registrar usuarios (funciona en Celular y Web)
// ============================================================
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
 
// ============================================================
// Función para iniciar sesión (funciona en Web y Celular)
// ============================================================
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
 
// ============================================================
// Actualizar datos del perfil (Nombre, Apellido, Email)
// Usado en editProfileScreen. El cambio de contraseña se sigue
// manejando aparte con resetUserPassword para no mezclar flujos.
// ============================================================
export const updateUserProfile = async (userId, profileData) => {
  const { name, lastname, email } = profileData;
  const cleanEmail = email ? email.trim().toLowerCase() : undefined;
 
  if (Platform.OS === 'web') {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex((u) => u.id === userId);
 
      if (userIndex === -1) {
        return { success: false, message: 'USER_NOT_FOUND' };
      }
 
      // Si cambia el email, verificamos que no colisione con otro usuario existente.
      if (cleanEmail && cleanEmail !== users[userIndex].email.toLowerCase()) {
        const collision = users.some(
          (u) => u.id !== userId && u.email.toLowerCase() === cleanEmail
        );
        if (collision) {
          return { success: false, message: 'EMAIL_EXISTS' };
        }
      }
 
      users[userIndex] = {
        ...users[userIndex],
        name: name ?? users[userIndex].name,
        lastname: lastname ?? users[userIndex].lastname,
        email: cleanEmail ?? users[userIndex].email,
      };
 
      localStorage.setItem('users', JSON.stringify(users));
      return { success: true, user: users[userIndex] };
    } catch (error) {
      return { success: false, message: error.message };
    }
  } else {
    try {
      if (!db) {
        initDatabase();
      }
 
      if (cleanEmail) {
        const collisionStmt = db.prepareSync(
          'SELECT id FROM users WHERE LOWER(email) = ? AND id != ?'
        );
        const collision = collisionStmt.executeSync([cleanEmail, userId]).getFirstSync();
        if (collision) {
          return { success: false, message: 'EMAIL_EXISTS' };
        }
      }
 
      const statement = db.prepareSync(
        'UPDATE users SET name = ?, lastname = ?, email = ? WHERE id = ?'
      );
      statement.executeSync([
        name ?? null,
        lastname ?? null,
        cleanEmail ?? null,
        userId,
      ]);
 
      const selectStmt = db.prepareSync('SELECT * FROM users WHERE id = ?');
      const updatedUser = selectStmt.executeSync([userId]).getFirstSync();
 
      return { success: true, user: updatedUser };
    } catch (error) {
      console.log('Error al actualizar perfil en SQLite:', error);
      return { success: false, message: error.message };
    }
  }
};
 
// ============================================================
// Obtener resumen del armario (Prendas, Outfits, Usados, Maletas)
// ============================================================
export const getArmarioSummary = (userId) => {
  if (Platform.OS === 'web') {
    const clothes = JSON.parse(localStorage.getItem('clothes') || '[]');
    const outfits = JSON.parse(localStorage.getItem('outfits') || '[]');
    const history = JSON.parse(localStorage.getItem('history') || '[]');
    const suitcases = JSON.parse(localStorage.getItem('suitcases') || '[]');
 
    const userClothes = clothes.filter((item) => item.userId === userId);
    const userOutfits = outfits.filter((item) => item.userId === userId);
 
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const userUsed = history.filter(
      (item) => item.userId === userId && new Date(item.date).getTime() >= sevenDaysAgo
    );
 
    const userSuitcases = suitcases.filter(
      (item) => item.userId === userId && item.active !== false
    );
 
    return {
      clothesCount: userClothes.length,
      outfitsCount: userOutfits.length,
      usedThisWeekCount: userUsed.length,
      activeSuitcasesCount: userSuitcases.length,
    };
  } else {
    try {
      if (!db) {
        initDatabase();
      }
 
      const clothesStmt = db.prepareSync('SELECT COUNT(*) AS total FROM clothes WHERE userId = ?');
      const clothesRes = clothesStmt.executeSync([userId]).getFirstSync();
 
      const outfitsStmt = db.prepareSync('SELECT COUNT(*) AS total FROM outfits WHERE userId = ?');
      const outfitsRes = outfitsStmt.executeSync([userId]).getFirstSync();
 
      let usedCount = 0;
      let suitcasesCount = 0;
 
      try {
        const usedStmt = db.prepareSync(
          "SELECT COUNT(*) AS total FROM history WHERE userId = ? AND date >= date('now', '-7 days')"
        );
        usedCount = usedStmt.executeSync([userId]).getFirstSync()?.total || 0;
      } catch (e) {}
 
      try {
        const suitcasesStmt = db.prepareSync(
          "SELECT COUNT(*) AS total FROM suitcases WHERE userId = ? AND active = 1"
        );
        suitcasesCount = suitcasesStmt.executeSync([userId]).getFirstSync()?.total || 0;
      } catch (e) {}
 
      return {
        clothesCount: clothesRes?.total || 0,
        outfitsCount: outfitsRes?.total || 0,
        usedThisWeekCount: usedCount,
        activeSuitcasesCount: suitcasesCount,
      };
    } catch (error) {
      console.log('Error al obtener resumen del armario:', error);
      return { clothesCount: 0, outfitsCount: 0, usedThisWeekCount: 0, activeSuitcasesCount: 0 };
    }
  }
};
 
// ============================================================
// AGREGAR PRENDA
// ============================================================
export const addClothingItem = async (clothingData) => {
  const { userId, title, category, color, season, ocasion, description, imageUri } = clothingData;
 
  if (Platform.OS === 'web') {
    try {
      const clothes = JSON.parse(localStorage.getItem('clothes') || '[]');
      const newItem = {
        id: Date.now(),
        userId,
        title,
        category,
        color: color || '',
        season: season || '',
        ocasion: ocasion || '',
        description: description || '',
        imageUri,
        createdAt: new Date().toISOString(),
      };
 
      clothes.push(newItem);
      localStorage.setItem('clothes', JSON.stringify(clothes));
      return { success: true, item: newItem };
    } catch (error) {
      return { success: false, message: error.message };
    }
  } else {
    try {
      if (!db) {
        initDatabase();
      }
 
      const statement = db.prepareSync(
        `INSERT INTO clothes (userId, title, category, color, season, ocasion, description, imageUri, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
 
      const createdAt = new Date().toISOString();
      const result = statement.executeSync([
        userId,
        title,
        category,
        color || '',
        season || '',
        ocasion || '',
        description || '',
        imageUri,
        createdAt,
      ]);
 
      return {
        success: true,
        item: {
          id: result.lastInsertRowId,
          userId,
          title,
          category,
          color,
          season,
          ocasion,
          description,
          imageUri,
          createdAt,
        },
      };
    } catch (error) {
      console.log('Error al guardar prenda en SQLite:', error);
      return { success: false, message: error.message };
    }
  }
};
 
// ============================================================
// EDITAR PRENDA
// Usado en clothingDetailScreen / addClothingScreen (modo edición).
// clothingData puede traer solo los campos que cambiaron; el resto
// se conserva tal cual estaba.
// ============================================================
export const updateClothingItem = async (clothingId, clothingData) => {
  const { title, category, color, season, ocasion, description, imageUri } = clothingData;
 
  if (Platform.OS === 'web') {
    try {
      const clothes = JSON.parse(localStorage.getItem('clothes') || '[]');
      const index = clothes.findIndex((item) => item.id === clothingId);
 
      if (index === -1) {
        return { success: false, message: 'ITEM_NOT_FOUND' };
      }
 
      clothes[index] = {
        ...clothes[index],
        title: title ?? clothes[index].title,
        category: category ?? clothes[index].category,
        color: color ?? clothes[index].color,
        season: season ?? clothes[index].season,
        ocasion: ocasion ?? clothes[index].ocasion,
        description: description ?? clothes[index].description,
        imageUri: imageUri ?? clothes[index].imageUri,
      };
 
      localStorage.setItem('clothes', JSON.stringify(clothes));
      return { success: true, item: clothes[index] };
    } catch (error) {
      return { success: false, message: error.message };
    }
  } else {
    try {
      if (!db) {
        initDatabase();
      }
 
      const selectStmt = db.prepareSync('SELECT * FROM clothes WHERE id = ?');
      const current = selectStmt.executeSync([clothingId]).getFirstSync();
 
      if (!current) {
        return { success: false, message: 'ITEM_NOT_FOUND' };
      }
 
      const statement = db.prepareSync(
        `UPDATE clothes
         SET title = ?, category = ?, color = ?, season = ?, ocasion = ?, description = ?, imageUri = ?
         WHERE id = ?`
      );
 
      statement.executeSync([
        title ?? current.title,
        category ?? current.category,
        color ?? current.color,
        season ?? current.season,
        ocasion ?? current.ocasion,
        description ?? current.description,
        imageUri ?? current.imageUri,
        clothingId,
      ]);
 
      const updated = selectStmt.executeSync([clothingId]).getFirstSync();
      return { success: true, item: updated };
    } catch (error) {
      console.log('Error al editar prenda en SQLite:', error);
      return { success: false, message: error.message };
    }
  }
};
 
// ============================================================
// Eliminar una prenda del armario (Web y Celular)
// ============================================================
export const deleteClothingItem = async (clothingId) => {
  if (Platform.OS === 'web') {
    try {
      const clothes = JSON.parse(localStorage.getItem('clothes') || '[]');
      const exists = clothes.some((item) => item.id === clothingId);
 
      if (!exists) {
        return { success: false, message: 'ITEM_NOT_FOUND' };
      }
 
      const updatedClothes = clothes.filter((item) => item.id !== clothingId);
      localStorage.setItem('clothes', JSON.stringify(updatedClothes));
 
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  } else {
    try {
      if (!db) {
        initDatabase();
      }
 
      const statement = db.prepareSync('DELETE FROM clothes WHERE id = ?');
      statement.executeSync([clothingId]);
 
      return { success: true };
    } catch (error) {
      console.log('Error al eliminar prenda:', error);
      return { success: false, message: error.message };
    }
  }
};
 
// ============================================================
// Obtener el listado de prendas registradas por el usuario
// ============================================================
export const getUserClothes = async (userId) => {
  if (Platform.OS === 'web') {
    try {
      const clothes = JSON.parse(localStorage.getItem('clothes') || '[]');
      const userClothes = clothes.filter((item) => item.userId === userId);
      userClothes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return userClothes;
    } catch (error) {
      console.log('Error al obtener prendas (Web):', error);
      return [];
    }
  } else {
    try {
      if (!db) {
        initDatabase();
      }
 
      const statement = db.prepareSync(
        'SELECT * FROM clothes WHERE userId = ? ORDER BY createdAt DESC'
      );
      const result = statement.executeSync([userId]);
      return result.getAllSync();
    } catch (error) {
      console.log('Error al obtener prendas (Móvil):', error);
      return [];
    }
  }
};
 
// Obtener una única prenda por id (usado en clothingDetailScreen)
export const getClothingItemById = async (clothingId) => {
  if (Platform.OS === 'web') {
    try {
      const clothes = JSON.parse(localStorage.getItem('clothes') || '[]');
      return clothes.find((item) => item.id === clothingId) || null;
    } catch (error) {
      console.log('Error al obtener prenda (Web):', error);
      return null;
    }
  } else {
    try {
      if (!db) {
        initDatabase();
      }
 
      const statement = db.prepareSync('SELECT * FROM clothes WHERE id = ?');
      const result = statement.executeSync([clothingId]);
      return result.getFirstSync() || null;
    } catch (error) {
      console.log('Error al obtener prenda (Móvil):', error);
      return null;
    }
  }
};
 
// ============================================================
// OUTFITS
// "items" se guarda con la estructura:
// { superior: clothingId, inferior: clothingId, calzado: clothingId, accesorios: [clothingId, ...] }
// En Web se guarda tal cual como objeto (localStorage ya maneja JSON).
// En Móvil se guarda como string JSON en la columna "items" y se
// parsea automáticamente al leer, para que ambas plataformas
// devuelvan siempre el mismo formato a las pantallas.
// ============================================================
export const addOutfit = async (outfitData) => {
  const { userId, name, description, items } = outfitData;
 
  if (Platform.OS === 'web') {
    try {
      const outfits = JSON.parse(localStorage.getItem('outfits') || '[]');
      const newOutfit = {
        id: Date.now(),
        userId,
        name,
        description: description || '',
        items: items || {},
        createdAt: new Date().toISOString(),
      };
 
      outfits.push(newOutfit);
      localStorage.setItem('outfits', JSON.stringify(outfits));
      return { success: true, outfit: newOutfit };
    } catch (error) {
      return { success: false, message: error.message };
    }
  } else {
    try {
      if (!db) {
        initDatabase();
      }
 
      const statement = db.prepareSync(
        'INSERT INTO outfits (userId, name, description, items, createdAt) VALUES (?, ?, ?, ?, ?)'
      );
 
      const createdAt = new Date().toISOString();
      const result = statement.executeSync([
        userId,
        name,
        description || '',
        JSON.stringify(items || {}),
        createdAt,
      ]);
 
      return {
        success: true,
        outfit: {
          id: result.lastInsertRowId,
          userId,
          name,
          description,
          items,
          createdAt,
        },
      };
    } catch (error) {
      console.log('Error al guardar outfit en SQLite:', error);
      return { success: false, message: error.message };
    }
  }
};
 
export const getUserOutfits = async (userId) => {
  if (Platform.OS === 'web') {
    try {
      const outfits = JSON.parse(localStorage.getItem('outfits') || '[]');
      const userOutfits = outfits.filter((item) => item.userId === userId);
      userOutfits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return userOutfits;
    } catch (error) {
      console.log('Error al obtener outfits (Web):', error);
      return [];
    }
  } else {
    try {
      if (!db) {
        initDatabase();
      }
 
      const statement = db.prepareSync(
        'SELECT * FROM outfits WHERE userId = ? ORDER BY createdAt DESC'
      );
      const result = statement.executeSync([userId]);
      const rows = result.getAllSync();
 
      return rows.map((row) => ({
        ...row,
        items: row.items ? JSON.parse(row.items) : {},
      }));
    } catch (error) {
      console.log('Error al obtener outfits (Móvil):', error);
      return [];
    }
  }
};
 
export const getOutfitById = async (outfitId) => {
  if (Platform.OS === 'web') {
    try {
      const outfits = JSON.parse(localStorage.getItem('outfits') || '[]');
      return outfits.find((item) => item.id === outfitId) || null;
    } catch (error) {
      console.log('Error al obtener outfit (Web):', error);
      return null;
    }
  } else {
    try {
      if (!db) {
        initDatabase();
      }
 
      const statement = db.prepareSync('SELECT * FROM outfits WHERE id = ?');
      const row = statement.executeSync([outfitId]).getFirstSync();
 
      if (!row) return null;
 
      return { ...row, items: row.items ? JSON.parse(row.items) : {} };
    } catch (error) {
      console.log('Error al obtener outfit (Móvil):', error);
      return null;
    }
  }
};
 
export const updateOutfit = async (outfitId, outfitData) => {
  const { name, description, items } = outfitData;
 
  if (Platform.OS === 'web') {
    try {
      const outfits = JSON.parse(localStorage.getItem('outfits') || '[]');
      const index = outfits.findIndex((item) => item.id === outfitId);
 
      if (index === -1) {
        return { success: false, message: 'OUTFIT_NOT_FOUND' };
      }
 
      outfits[index] = {
        ...outfits[index],
        name: name ?? outfits[index].name,
        description: description ?? outfits[index].description,
        items: items ?? outfits[index].items,
      };
 
      localStorage.setItem('outfits', JSON.stringify(outfits));
      return { success: true, outfit: outfits[index] };
    } catch (error) {
      return { success: false, message: error.message };
    }
  } else {
    try {
      if (!db) {
        initDatabase();
      }
 
      const selectStmt = db.prepareSync('SELECT * FROM outfits WHERE id = ?');
      const current = selectStmt.executeSync([outfitId]).getFirstSync();
 
      if (!current) {
        return { success: false, message: 'OUTFIT_NOT_FOUND' };
      }
 
      const currentItems = current.items ? JSON.parse(current.items) : {};
 
      const statement = db.prepareSync(
        'UPDATE outfits SET name = ?, description = ?, items = ? WHERE id = ?'
      );
      statement.executeSync([
        name ?? current.name,
        description ?? current.description,
        JSON.stringify(items ?? currentItems),
        outfitId,
      ]);
 
      const updated = selectStmt.executeSync([outfitId]).getFirstSync();
      return { success: true, outfit: { ...updated, items: JSON.parse(updated.items || '{}') } };
    } catch (error) {
      console.log('Error al editar outfit en SQLite:', error);
      return { success: false, message: error.message };
    }
  }
};
 
export const deleteOutfit = async (outfitId) => {
  if (Platform.OS === 'web') {
    try {
      const outfits = JSON.parse(localStorage.getItem('outfits') || '[]');
      const exists = outfits.some((item) => item.id === outfitId);
 
      if (!exists) {
        return { success: false, message: 'OUTFIT_NOT_FOUND' };
      }
 
      const updatedOutfits = outfits.filter((item) => item.id !== outfitId);
      localStorage.setItem('outfits', JSON.stringify(updatedOutfits));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  } else {
    try {
      if (!db) {
        initDatabase();
      }
 
      const statement = db.prepareSync('DELETE FROM outfits WHERE id = ?');
      statement.executeSync([outfitId]);
      return { success: true };
    } catch (error) {
      console.log('Error al eliminar outfit:', error);
      return { success: false, message: error.message };
    }
  }
};
 
// ============================================================
// HISTORIAL
// Se registra cada vez que el usuario marca un outfit como "usado"
// desde outfitDetailScreen. outfitId puede ser null si el outfit
// original fue eliminado después.
// ============================================================
export const addHistoryEntry = async (historyData) => {
  const { userId, outfitId, outfitName, imageUri, note } = historyData;
 
  if (Platform.OS === 'web') {
    try {
      const history = JSON.parse(localStorage.getItem('history') || '[]');
      const newEntry = {
        id: Date.now(),
        userId,
        outfitId: outfitId ?? null,
        outfitName: outfitName || '',
        imageUri: imageUri || '',
        note: note || '',
        date: new Date().toISOString(),
      };
 
      history.push(newEntry);
      localStorage.setItem('history', JSON.stringify(history));
      return { success: true, entry: newEntry };
    } catch (error) {
      return { success: false, message: error.message };
    }
  } else {
    try {
      if (!db) {
        initDatabase();
      }
 
      const statement = db.prepareSync(
        `INSERT INTO history (userId, outfitId, outfitName, imageUri, note, date)
         VALUES (?, ?, ?, ?, ?, ?)`
      );
 
      const date = new Date().toISOString();
      const result = statement.executeSync([
        userId,
        outfitId ?? null,
        outfitName || '',
        imageUri || '',
        note || '',
        date,
      ]);
 
      return {
        success: true,
        entry: {
          id: result.lastInsertRowId,
          userId,
          outfitId,
          outfitName,
          imageUri,
          note,
          date,
        },
      };
    } catch (error) {
      console.log('Error al guardar historial en SQLite:', error);
      return { success: false, message: error.message };
    }
  }
};
 
export const getUserHistory = async (userId) => {
  if (Platform.OS === 'web') {
    try {
      const history = JSON.parse(localStorage.getItem('history') || '[]');
      const userHistory = history.filter((item) => item.userId === userId);
      userHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
      return userHistory;
    } catch (error) {
      console.log('Error al obtener historial (Web):', error);
      return [];
    }
  } else {
    try {
      if (!db) {
        initDatabase();
      }
 
      const statement = db.prepareSync(
        'SELECT * FROM history WHERE userId = ? ORDER BY date DESC'
      );
      const result = statement.executeSync([userId]);
      return result.getAllSync();
    } catch (error) {
      console.log('Error al obtener historial (Móvil):', error);
      return [];
    }
  }
};
 
// ============================================================
// MODO MALETA (Suitcases)
// "items" se guarda con la estructura:
// [{ clothingId, note, packed }, ...]
// "estado" sigue el flujo: 'Planificada' -> 'En viaje' -> 'Finalizada'
// "active" indica si la maleta cuenta en "Maletas activas" del resumen.
// ============================================================
export const addSuitcase = async (suitcaseData) => {
  const { userId, destino, fechaInicio, fechaFin, estado, items } = suitcaseData;
 
  if (Platform.OS === 'web') {
    try {
      const suitcases = JSON.parse(localStorage.getItem('suitcases') || '[]');
      const newSuitcase = {
        id: Date.now(),
        userId,
        destino,
        fechaInicio,
        fechaFin,
        estado: estado || 'Planificada',
        items: items || [],
        active: true,
        createdAt: new Date().toISOString(),
      };
 
      suitcases.push(newSuitcase);
      localStorage.setItem('suitcases', JSON.stringify(suitcases));
      return { success: true, suitcase: newSuitcase };
    } catch (error) {
      return { success: false, message: error.message };
    }
  } else {
    try {
      if (!db) {
        initDatabase();
      }
 
      const statement = db.prepareSync(
        `INSERT INTO suitcases (userId, destino, fechaInicio, fechaFin, estado, items, active, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );
 
      const createdAt = new Date().toISOString();
      const result = statement.executeSync([
        userId,
        destino,
        fechaInicio,
        fechaFin,
        estado || 'Planificada',
        JSON.stringify(items || []),
        1,
        createdAt,
      ]);
 
      return {
        success: true,
        suitcase: {
          id: result.lastInsertRowId,
          userId,
          destino,
          fechaInicio,
          fechaFin,
          estado: estado || 'Planificada',
          items: items || [],
          active: true,
          createdAt,
        },
      };
    } catch (error) {
      console.log('Error al guardar maleta en SQLite:', error);
      return { success: false, message: error.message };
    }
  }
};
 
export const getUserSuitcases = async (userId) => {
  if (Platform.OS === 'web') {
    try {
      const suitcases = JSON.parse(localStorage.getItem('suitcases') || '[]');
      const userSuitcases = suitcases.filter((item) => item.userId === userId);
      userSuitcases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return userSuitcases;
    } catch (error) {
      console.log('Error al obtener maletas (Web):', error);
      return [];
    }
  } else {
    try {
      if (!db) {
        initDatabase();
      }
 
      const statement = db.prepareSync(
        'SELECT * FROM suitcases WHERE userId = ? ORDER BY createdAt DESC'
      );
      const result = statement.executeSync([userId]);
      const rows = result.getAllSync();
 
      return rows.map((row) => ({
        ...row,
        items: row.items ? JSON.parse(row.items) : [],
        active: !!row.active,
      }));
    } catch (error) {
      console.log('Error al obtener maletas (Móvil):', error);
      return [];
    }
  }
};
 
export const getSuitcaseById = async (suitcaseId) => {
  if (Platform.OS === 'web') {
    try {
      const suitcases = JSON.parse(localStorage.getItem('suitcases') || '[]');
      return suitcases.find((item) => item.id === suitcaseId) || null;
    } catch (error) {
      console.log('Error al obtener maleta (Web):', error);
      return null;
    }
  } else {
    try {
      if (!db) {
        initDatabase();
      }
 
      const statement = db.prepareSync('SELECT * FROM suitcases WHERE id = ?');
      const row = statement.executeSync([suitcaseId]).getFirstSync();
 
      if (!row) return null;
 
      return { ...row, items: row.items ? JSON.parse(row.items) : [], active: !!row.active };
    } catch (error) {
      console.log('Error al obtener maleta (Móvil):', error);
      return null;
    }
  }
};
 
// updatedData puede incluir: destino, fechaInicio, fechaFin, estado, items, active
export const updateSuitcase = async (suitcaseId, updatedData) => {
  const { destino, fechaInicio, fechaFin, estado, items, active } = updatedData;
 
  if (Platform.OS === 'web') {
    try {
      const suitcases = JSON.parse(localStorage.getItem('suitcases') || '[]');
      const index = suitcases.findIndex((item) => item.id === suitcaseId);
 
      if (index === -1) {
        return { success: false, message: 'SUITCASE_NOT_FOUND' };
      }
 
      suitcases[index] = {
        ...suitcases[index],
        destino: destino ?? suitcases[index].destino,
        fechaInicio: fechaInicio ?? suitcases[index].fechaInicio,
        fechaFin: fechaFin ?? suitcases[index].fechaFin,
        estado: estado ?? suitcases[index].estado,
        items: items ?? suitcases[index].items,
        active: active ?? suitcases[index].active,
      };
 
      localStorage.setItem('suitcases', JSON.stringify(suitcases));
      return { success: true, suitcase: suitcases[index] };
    } catch (error) {
      return { success: false, message: error.message };
    }
  } else {
    try {
      if (!db) {
        initDatabase();
      }
 
      const selectStmt = db.prepareSync('SELECT * FROM suitcases WHERE id = ?');
      const current = selectStmt.executeSync([suitcaseId]).getFirstSync();
 
      if (!current) {
        return { success: false, message: 'SUITCASE_NOT_FOUND' };
      }
 
      const currentItems = current.items ? JSON.parse(current.items) : [];
 
      const statement = db.prepareSync(
        `UPDATE suitcases
         SET destino = ?, fechaInicio = ?, fechaFin = ?, estado = ?, items = ?, active = ?
         WHERE id = ?`
      );
 
      statement.executeSync([
        destino ?? current.destino,
        fechaInicio ?? current.fechaInicio,
        fechaFin ?? current.fechaFin,
        estado ?? current.estado,
        JSON.stringify(items ?? currentItems),
        active !== undefined ? (active ? 1 : 0) : current.active,
        suitcaseId,
      ]);
 
      const updated = selectStmt.executeSync([suitcaseId]).getFirstSync();
      return {
        success: true,
        suitcase: { ...updated, items: JSON.parse(updated.items || '[]'), active: !!updated.active },
      };
    } catch (error) {
      console.log('Error al editar maleta en SQLite:', error);
      return { success: false, message: error.message };
    }
  }
};
 
export const deleteSuitcase = async (suitcaseId) => {
  if (Platform.OS === 'web') {
    try {
      const suitcases = JSON.parse(localStorage.getItem('suitcases') || '[]');
      const exists = suitcases.some((item) => item.id === suitcaseId);
 
      if (!exists) {
        return { success: false, message: 'SUITCASE_NOT_FOUND' };
      }
 
      const updatedSuitcases = suitcases.filter((item) => item.id !== suitcaseId);
      localStorage.setItem('suitcases', JSON.stringify(updatedSuitcases));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  } else {
    try {
      if (!db) {
        initDatabase();
      }
 
      const statement = db.prepareSync('DELETE FROM suitcases WHERE id = ?');
      statement.executeSync([suitcaseId]);
      return { success: true };
    } catch (error) {
      console.log('Error al eliminar maleta:', error);
      return { success: false, message: error.message };
    }
  }
};
 









