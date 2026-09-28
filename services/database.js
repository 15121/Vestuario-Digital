// ============================================================
// services/database.js
// Base de datos de Vestuario Digital
// Web: localStorage
// Móvil: SQLite
// ============================================================

import { Platform } from 'react-native';

let db = null;

// ============================================================
// CONFIGURACIÓN ROOT
// ============================================================

const ROOT_EMAIL = 'cazoncontreras.iara@tecnica7.edu.ar';
const ROOT_INITIAL_PASSWORD = 'Milena15';
const ROOT_NAME = 'Iara';
const ROOT_LASTNAME = 'Cazón';

// ============================================================
// REGISTRO DE ACTIVIDAD ADMINISTRATIVA (helper interno)
// Guarda una entrada en adminRequests. Está envuelto en
// try/catch: si algo falla, el flujo original NO se ve afectado.
// ============================================================

const logAdminRequest = (
  userId,
  type,
  user,
  status = 'resolved'
) => {
  try {
    const fullName = `${user?.name || ''} ${user?.lastname || ''}`.trim();
    const email = user?.email || '';
    const details = email
      ? `${fullName || 'Sin nombre'} (${email})`
      : fullName;

    addAdminRequest(userId, type, status, details);
  } catch (error) {
    console.log('No se pudo registrar la actividad administrativa:', error);
  }
};

// ============================================================
// INICIALIZAR BASE DE DATOS
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

    if (!localStorage.getItem('adminRequests')) {
      localStorage.setItem('adminRequests', JSON.stringify([]));
    }

    ensureRootUser();

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
          password TEXT,
          role TEXT DEFAULT 'user',
          status TEXT DEFAULT 'active',
          createdAt TEXT,
          lastAccess TEXT
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

        CREATE TABLE IF NOT EXISTS adminRequests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER,
          type TEXT,
          date TEXT,
          status TEXT,
          details TEXT
        );
      `);

      // --------------------------------------------------------
      // MIGRACIÓN USERS
      // --------------------------------------------------------

      const usersNewColumns = [
        ['role', "TEXT DEFAULT 'user'"],
        ['status', "TEXT DEFAULT 'active'"],
        ['createdAt', 'TEXT'],
        ['lastAccess', 'TEXT'],
      ];

      usersNewColumns.forEach(([column, definition]) => {
        try {
          db.execSync(
            `ALTER TABLE users ADD COLUMN ${column} ${definition};`
          );
        } catch (e) {
          // La columna ya existe.
        }
      });

      // --------------------------------------------------------
      // MIGRACIÓN CLOTHES
      // --------------------------------------------------------

      const clothesNewColumns = [
        'color',
        'season',
        'ocasion',
        'description',
        'createdAt',
      ];

      clothesNewColumns.forEach((column) => {
        try {
          db.execSync(
            `ALTER TABLE clothes ADD COLUMN ${column} TEXT;`
          );
        } catch (e) {
          // La columna ya existe.
        }
      });

      // --------------------------------------------------------
      // MIGRACIÓN OUTFITS
      // --------------------------------------------------------

      const outfitsNewColumns = [
        'description',
        'createdAt',
      ];

      outfitsNewColumns.forEach((column) => {
        try {
          db.execSync(
            `ALTER TABLE outfits ADD COLUMN ${column} TEXT;`
          );
        } catch (e) {
          // La columna ya existe.
        }
      });

      // --------------------------------------------------------
      // MIGRACIÓN HISTORY (instalaciones viejas)
      // --------------------------------------------------------

      const historyNewColumns = [
        ['outfitId', 'INTEGER'],
        ['outfitName', 'TEXT'],
        ['imageUri', 'TEXT'],
        ['note', 'TEXT'],
        ['date', 'TEXT'],
      ];

      historyNewColumns.forEach(([column, definition]) => {
        try {
          db.execSync(
            `ALTER TABLE history ADD COLUMN ${column} ${definition};`
          );
        } catch (e) {
          // La columna ya existe.
        }
      });

      // --------------------------------------------------------
      // MIGRACIÓN SUITCASES (instalaciones viejas)
      // --------------------------------------------------------

      const suitcasesNewColumns = [
        ['destino', 'TEXT'],
        ['fechaInicio', 'TEXT'],
        ['fechaFin', 'TEXT'],
        ['estado', 'TEXT'],
        ['items', 'TEXT'],
        ['active', 'INTEGER DEFAULT 1'],
        ['createdAt', 'TEXT'],
      ];

      suitcasesNewColumns.forEach(([column, definition]) => {
        try {
          db.execSync(
            `ALTER TABLE suitcases ADD COLUMN ${column} ${definition};`
          );
        } catch (e) {
          // La columna ya existe.
        }
      });

      ensureRootUser();

      console.log('Base de datos SQLite inicializada en Móvil.');
    } catch (e) {
      console.log('Error al inicializar SQLite:', e);
    }
  }
};

// ============================================================
// ASEGURAR CUENTA ROOT
// ============================================================

export const ensureRootUser = () => {
  const now = new Date().toISOString();

  if (Platform.OS === 'web') {
    const users = JSON.parse(
      localStorage.getItem('users') || '[]'
    );

    const rootIndex = users.findIndex(
      (user) =>
        (user.email || '').toLowerCase() ===
        ROOT_EMAIL.toLowerCase()
    );

    if (rootIndex === -1) {
      users.push({
        id: Date.now(),
        name: ROOT_NAME,
        lastname: ROOT_LASTNAME,
        email: ROOT_EMAIL,
        password: ROOT_INITIAL_PASSWORD,
        role: 'root',
        status: 'active',
        createdAt: now,
        lastAccess: null,
      });
    } else {
      users[rootIndex] = {
        ...users[rootIndex],
        name: ROOT_NAME,
        lastname: ROOT_LASTNAME,
        email: ROOT_EMAIL,
        password: ROOT_INITIAL_PASSWORD,
        role: 'root',
        status: 'active',
        createdAt:
          users[rootIndex].createdAt || now,
      };
    }

    // Garantiza que no haya otro Root (igual que en SQLite).
    const finalRootIndex = users.findIndex(
      (user) =>
        (user.email || '').toLowerCase() ===
        ROOT_EMAIL.toLowerCase()
    );

    users.forEach((user, index) => {
      if (
        index !== finalRootIndex &&
        user.role === 'root'
      ) {
        user.role = 'user';
      }
    });

    localStorage.setItem(
      'users',
      JSON.stringify(users)
    );

    return;
  }

  if (!db) {
    return;
  }

  try {
    const rootStatement = db.prepareSync(
      'SELECT * FROM users WHERE LOWER(email) = ?'
    );

    const root = rootStatement
      .executeSync([ROOT_EMAIL.toLowerCase()])
      .getFirstSync();

    let rootId;

    if (!root) {
      const insertStatement = db.prepareSync(`
        INSERT INTO users
        (
          name,
          lastname,
          email,
          password,
          role,
          status,
          createdAt,
          lastAccess
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insertStatement.executeSync([
        ROOT_NAME,
        ROOT_LASTNAME,
        ROOT_EMAIL,
        ROOT_INITIAL_PASSWORD,
        'root',
        'active',
        now,
        null,
      ]);

      rootId = result.lastInsertRowId;
    } else {
      rootId = root.id;

      db.prepareSync(`
        UPDATE users
        SET
          name = ?,
          lastname = ?,
          email = ?,
          password = ?,
          role = 'root',
          status = 'active'
        WHERE id = ?
      `).executeSync([
        ROOT_NAME,
        ROOT_LASTNAME,
        ROOT_EMAIL,
        ROOT_INITIAL_PASSWORD,
        rootId,
      ]);
    }

    // Garantiza que no haya otro Root.
    db.prepareSync(`
      UPDATE users
      SET role = 'user'
      WHERE role = 'root'
      AND id != ?
    `).executeSync([rootId]);

  } catch (error) {
    console.log(
      'Error al asegurar cuenta Root:',
      error
    );
  }
};

// ============================================================
// REGISTRAR USUARIO
// ============================================================

export const registerUser = async (
  name,
  lastname,
  email,
  password
) => {
  const cleanEmail = email.trim().toLowerCase();
  const now = new Date().toISOString();

  if (
    cleanEmail === ROOT_EMAIL.toLowerCase()
  ) {
    throw new Error('ROOT_EMAIL_RESERVED');
  }

  if (Platform.OS === 'web') {
    const users = JSON.parse(
      localStorage.getItem('users') || '[]'
    );

    const existing = users.find(
      (user) =>
        (user.email || '').toLowerCase() ===
        cleanEmail
    );

    if (existing) {
      throw new Error('EMAIL_EXISTS');
    }

    const newUser = {
      id: Date.now(),
      name,
      lastname,
      email: cleanEmail,
      password,
      role: 'user',
      status: 'active',
      createdAt: now,
      lastAccess: null,
    };

    users.push(newUser);

    localStorage.setItem(
      'users',
      JSON.stringify(users)
    );

    logAdminRequest(newUser.id, 'Registro de usuario', newUser);

    return newUser;
  }

  try {
    if (!db) {
      initDatabase();
    }

    const statement = db.prepareSync(`
      INSERT INTO users
      (
        name,
        lastname,
        email,
        password,
        role,
        status,
        createdAt,
        lastAccess
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = statement.executeSync([
      name,
      lastname,
      cleanEmail,
      password,
      'user',
      'active',
      now,
      null,
    ]);

    logAdminRequest(
      result.lastInsertRowId,
      'Registro de usuario',
      { name, lastname, email: cleanEmail }
    );

    return {
      id: result.lastInsertRowId,
      name,
      lastname,
      email: cleanEmail,
      role: 'user',
      status: 'active',
      createdAt: now,
      lastAccess: null,
    };

  } catch (error) {
    console.log(
      '--- ERROR DETALLADO EN SQLITE CELULAR ---',
      error
    );

    const errStr = String(
      error?.message || error
    );

    if (
      errStr.includes('UNIQUE') ||
      errStr.includes('CONSTRAINT')
    ) {
      throw new Error('EMAIL_EXISTS');
    }

    throw error;
  }
};

// ============================================================
// INICIAR SESIÓN
// ============================================================

export const loginUser = (
  email,
  password
) => {
  const cleanEmail = email.trim().toLowerCase();
  const now = new Date().toISOString();

  if (Platform.OS === 'web') {
    const users = JSON.parse(
      localStorage.getItem('users') || '[]'
    );

    const index = users.findIndex(
      (user) =>
        (user.email || '').toLowerCase() ===
          cleanEmail &&
        user.password === password
    );

    if (index === -1) {
      throw new Error('USER_NOT_FOUND');
    }

    const user = {
      ...users[index],
      role: users[index].role || 'user',
      status:
        users[index].status || 'active',
      createdAt:
        users[index].createdAt || null,
      lastAccess: now,
    };

    if (user.status !== 'active') {
      throw new Error('USER_INACTIVE');
    }

    users[index] = user;

    localStorage.setItem(
      'users',
      JSON.stringify(users)
    );

    return user;
  }

  if (!db) {
    initDatabase();
  }

  const statement = db.prepareSync(`
    SELECT *
    FROM users
    WHERE LOWER(email) = ?
    AND password = ?
  `);

  const result = statement.executeSync([
    cleanEmail,
    password,
  ]);

  const user = result.getFirstSync();

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const normalizedUser = {
    ...user,
    role: user.role || 'user',
    status: user.status || 'active',
    createdAt: user.createdAt || null,
    lastAccess: now,
  };

  if (normalizedUser.status !== 'active') {
    throw new Error('USER_INACTIVE');
  }

  db.prepareSync(`
    UPDATE users
    SET
      role = ?,
      status = ?,
      lastAccess = ?
    WHERE id = ?
  `).executeSync([
    normalizedUser.role,
    normalizedUser.status,
    normalizedUser.lastAccess,
    normalizedUser.id,
  ]);

  return normalizedUser;
};

// ============================================================
// RESTABLECER CONTRASEÑA
// ============================================================

export const resetUserPassword = async (
  email,
  newPassword
) => {
  const cleanEmail = email.trim().toLowerCase();

  if (Platform.OS === 'web') {
    const users = JSON.parse(
      localStorage.getItem('users') || '[]'
    );

    const userIndex = users.findIndex(
      (user) =>
        (user.email || '').toLowerCase() ===
        cleanEmail
    );

    if (userIndex === -1) {
      return {
        success: false,
        message: 'USER_NOT_FOUND',
      };
    }

    // Root no puede restablecer su contraseña
    if (
      users[userIndex].role === 'root' ||
      (users[userIndex].email || '').toLowerCase() ===
        ROOT_EMAIL.toLowerCase()
    ) {
      return {
        success: false,
        message: 'ROOT_PROTECTED',
      };
    }

    users[userIndex].password =
      newPassword;

    logAdminRequest(
      users[userIndex].id,
      'Restablecer contraseña',
      users[userIndex]
    );

    localStorage.setItem(
      'users',
      JSON.stringify(users)
    );

    return {
      success: true,
    };
  }

  try {
    if (!db) {
      initDatabase();
    }

    const selectStatement = db.prepareSync(`
      SELECT *
      FROM users
      WHERE LOWER(email) = ?
    `);

    const userResult =
      selectStatement.executeSync([
        cleanEmail,
      ]);

    const user =
      userResult.getFirstSync();

    if (!user) {
      return {
        success: false,
        message: 'USER_NOT_FOUND',
      };
    }

    // Root no puede restablecer su contraseña
    if (
      user.role === 'root' ||
      (user.email || '').toLowerCase() ===
        ROOT_EMAIL.toLowerCase()
    ) {
      return {
        success: false,
        message: 'ROOT_PROTECTED',
      };
    }

    const updateStatement =
      db.prepareSync(`
        UPDATE users
        SET password = ?
        WHERE LOWER(email) = ?
      `);

    updateStatement.executeSync([
      newPassword,
      cleanEmail,
    ]);

    logAdminRequest(
      user.id,
      'Restablecer contraseña',
      user
    );

    return {
      success: true,
    };

  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

// ============================================================
// ACTUALIZAR PERFIL
// ============================================================
//
// Protección Root:
// - Si el email cambia y el usuario es Root, se rechaza.
// - Si el email nuevo es el reservado de Root, se rechaza.
// Si el email NO cambia, todo funciona igual que antes.
// ============================================================

export const updateUserProfile = async (
  userId,
  profileData
) => {
  const {
    name,
    lastname,
    email,
  } = profileData;

  const cleanEmail = email
    ? email.trim().toLowerCase()
    : undefined;

  if (Platform.OS === 'web') {
    try {
      const users = JSON.parse(
        localStorage.getItem('users') || '[]'
      );

      const userIndex =
        users.findIndex(
          (user) =>
            String(user.id) === String(userId)
        );

      if (userIndex === -1) {
        return {
          success: false,
          message: 'USER_NOT_FOUND',
        };
      }

      const target = users[userIndex];

      // Root no puede modificar ningún dato personal
      if (
        target.role === 'root' ||
        (target.email || '').toLowerCase() ===
          ROOT_EMAIL.toLowerCase()
      ) {
        return {
          success: false,
          message: 'ROOT_PROTECTED',
        };
      }

      const emailChanged =
        cleanEmail &&
        cleanEmail !==
          (target.email || '').toLowerCase();

      if (emailChanged) {
        // Nadie más puede tomar el email reservado de Root
        if (cleanEmail === ROOT_EMAIL.toLowerCase()) {
          return {
            success: false,
            message: 'ROOT_EMAIL_RESERVED',
          };
        }

        const collision =
          users.some(
            (user) =>
              String(user.id) !== String(userId) &&
              (user.email || '')
                .toLowerCase() ===
                cleanEmail
          );

        if (collision) {
          return {
            success: false,
            message: 'EMAIL_EXISTS',
          };
        }
      }

      users[userIndex] = {
        ...users[userIndex],
        name:
          name ??
          users[userIndex].name,
        lastname:
          lastname ??
          users[userIndex].lastname,
        email:
          cleanEmail ??
          users[userIndex].email,
      };

      localStorage.setItem(
        'users',
        JSON.stringify(users)
      );

      logAdminRequest(
        users[userIndex].id,
        emailChanged
          ? 'Cambio de email'
          : 'Edición de datos',
        users[userIndex]
      );

      return {
  success: true,
  user: getUserById(userId),
};

    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  try {
    if (!db) {
      initDatabase();
    }

    const current =
      db.prepareSync(
        'SELECT * FROM users WHERE id = ?'
      )
        .executeSync([userId])
        .getFirstSync();

    if (!current) {
      return {
        success: false,
        message: 'USER_NOT_FOUND',
      };
    }

    // Root no puede modificar ningún dato personal
    if (
      current.role === 'root' ||
      (current.email || '').toLowerCase() ===
        ROOT_EMAIL.toLowerCase()
    ) {
      return {
        success: false,
        message: 'ROOT_PROTECTED',
      };
    }

    const emailChanged =
      cleanEmail &&
      cleanEmail !==
        (current.email || '').toLowerCase();

    if (emailChanged) {
      // Nadie más puede tomar el email reservado de Root
      if (cleanEmail === ROOT_EMAIL.toLowerCase()) {
        return {
          success: false,
          message: 'ROOT_EMAIL_RESERVED',
        };
      }
    }

    if (cleanEmail) {
      const collisionStmt =
        db.prepareSync(`
          SELECT id
          FROM users
          WHERE LOWER(email) = ?
          AND id != ?
        `);

      const collision =
        collisionStmt
          .executeSync([
            cleanEmail,
            userId,
          ])
          .getFirstSync();

      if (collision) {
        return {
          success: false,
          message: 'EMAIL_EXISTS',
        };
      }
    }

    const statement =
      db.prepareSync(`
        UPDATE users
        SET
          name = ?,
          lastname = ?,
          email = ?
        WHERE id = ?
      `);

    statement.executeSync([
      name ?? current.name,
      lastname ?? current.lastname,
      cleanEmail ?? current.email,
      userId,
    ]);

    const selectStmt =
      db.prepareSync(
        'SELECT * FROM users WHERE id = ?'
      );

    const updatedUser =
      selectStmt
        .executeSync([userId])
        .getFirstSync();

    logAdminRequest(
      updatedUser?.id ?? userId,
      emailChanged
        ? 'Cambio de email'
        : 'Edición de datos',
      updatedUser
    );

    return {
      success: true,
      user: updatedUser,
    };

  } catch (error) {
    console.log(
      'Error al actualizar perfil en SQLite:',
      error
    );

    return {
      success: false,
      message: error.message,
    };
  }
};

// ============================================================
// FUNCIONES PARA ROOT / ADMIN
// ============================================================

export const getAllUsers = () => {
  if (Platform.OS === 'web') {
    const users = JSON.parse(
      localStorage.getItem('users') || '[]'
    );

    return users
      .map((user) => {
        const {
          password,
          ...safeUser
        } = user;

        return {
          ...safeUser,
          role: safeUser.role || 'user',
          status:
            safeUser.status || 'active',
        };
      })
      // Mismo orden que SQLite (más nuevos primero)
      .sort(
        (a, b) =>
          Number(b.id) - Number(a.id)
      );
  }

  if (!db) {
    initDatabase();
  }

  const statement = db.prepareSync(`
    SELECT
      id,
      name,
      lastname,
      email,
      role,
      status,
      createdAt,
      lastAccess
    FROM users
    ORDER BY id DESC
  `);

  const result =
    statement.executeSync([]);

  return result.getAllSync().map(
    (user) => ({
      ...user,
      role: user.role || 'user',
      status:
        user.status || 'active',
    })
  );
};

export const getUserById = (
  userId
) => {
  if (Platform.OS === 'web') {
    const users = JSON.parse(
      localStorage.getItem('users') || '[]'
    );

    const user =
      users.find(
        (item) =>
          String(item.id) ===
          String(userId)
      );

    if (!user) {
      return null;
    }

    const {
      password,
      ...safeUser
    } = user;

    return {
      ...safeUser,
      role:
        safeUser.role || 'user',
      status:
        safeUser.status || 'active',
    };
  }

  if (!db) {
    initDatabase();
  }

  const statement = db.prepareSync(`
    SELECT
      id,
      name,
      lastname,
      email,
      role,
      status,
      createdAt,
      lastAccess
    FROM users
    WHERE id = ?
  `);

  const user =
    statement
      .executeSync([userId])
      .getFirstSync();

  if (!user) {
    return null;
  }

  return {
    ...user,
    role: user.role || 'user',
    status:
      user.status || 'active',
  };
};

export const updateUserStatus = (
  userId,
  status
) => {
  if (
    status !== 'active' &&
    status !== 'suspended'
  ) {
    throw new Error(
      'INVALID_STATUS'
    );
  }

  if (Platform.OS === 'web') {
    const users = JSON.parse(
      localStorage.getItem('users') || '[]'
    );

    const index =
      users.findIndex(
        (user) =>
          String(user.id) ===
          String(userId)
      );

    if (index === -1) {
      throw new Error(
        'USER_NOT_FOUND'
      );
    }

    if (
      users[index].role ===
      'root'
    ) {
      throw new Error(
        'ROOT_PROTECTED'
      );
    }

    users[index].status =
      status;

    localStorage.setItem(
      'users',
      JSON.stringify(users)
    );

    logAdminRequest(
      users[index].id,
      status === 'suspended'
        ? 'Cuenta suspendida'
        : 'Cuenta reactivada',
      users[index]
    );

    return getUserById(userId);
  }

  if (!db) {
    initDatabase();
  }

  const user =
    db.prepareSync(
      'SELECT * FROM users WHERE id = ?'
    )
      .executeSync([userId])
      .getFirstSync();

  if (!user) {
    throw new Error(
      'USER_NOT_FOUND'
    );
  }

  if (user.role === 'root') {
    throw new Error(
      'ROOT_PROTECTED'
    );
  }

  db.prepareSync(`
    UPDATE users
    SET status = ?
    WHERE id = ?
  `).executeSync([
    status,
    userId,
  ]);

  logAdminRequest(
    user.id,
    status === 'suspended'
      ? 'Cuenta suspendida'
      : 'Cuenta reactivada',
    user
  );

  return getUserById(userId);
};

export const updateUserRole = (
  userId,
  role
) => {
  if (
    role !== 'user' &&
    role !== 'root'
  ) {
    throw new Error(
      'INVALID_ROLE'
    );
  }

  if (Platform.OS === 'web') {
    const users = JSON.parse(
      localStorage.getItem('users') || '[]'
    );

    const index =
      users.findIndex(
        (user) =>
          String(user.id) ===
          String(userId)
      );

    if (index === -1) {
      throw new Error(
        'USER_NOT_FOUND'
      );
    }

    const user = users[index];

    if (
      user.role === 'root' &&
      role === 'user'
    ) {
      throw new Error(
        'ROOT_PROTECTED'
      );
    }

    if (role === 'root') {
      if (
        (user.email || '')
          .toLowerCase() !==
        ROOT_EMAIL.toLowerCase()
      ) {
        throw new Error(
          'ONLY_ONE_ROOT'
        );
      }

      users.forEach(
        (item, itemIndex) => {
          if (
            itemIndex !== index &&
            item.role === 'root'
          ) {
            item.role = 'user';
          }
        }
      );
    }

    users[index].role =
      role;

    localStorage.setItem(
      'users',
      JSON.stringify(users)
    );

    return getUserById(userId);
  }

  if (!db) {
    initDatabase();
  }

  const user =
    db.prepareSync(
      'SELECT * FROM users WHERE id = ?'
    )
      .executeSync([userId])
      .getFirstSync();

  if (!user) {
    throw new Error(
      'USER_NOT_FOUND'
    );
  }

  if (
    user.role === 'root' &&
    role === 'user'
  ) {
    throw new Error(
      'ROOT_PROTECTED'
    );
  }

  if (
    role === 'root' &&
    (user.email || '')
      .toLowerCase() !==
    ROOT_EMAIL.toLowerCase()
  ) {
    throw new Error(
      'ONLY_ONE_ROOT'
    );
  }

  db.prepareSync(`
    UPDATE users
    SET role = ?
    WHERE id = ?
  `).executeSync([
    role,
    userId,
  ]);

  if (role === 'root') {
    db.prepareSync(`
      UPDATE users
      SET role = 'user'
      WHERE role = 'root'
      AND id != ?
    `).executeSync([
      userId,
    ]);
  }

  return getUserById(userId);
};

// ============================================================
// ELIMINAR USUARIO (NUEVA - solo para Root/Admin)
// Borra el usuario y todos sus datos. Rechaza a la cuenta Root.
// Todavía no la usa ninguna pantalla.
// ============================================================

export const deleteUser = (
  userId
) => {
  if (Platform.OS === 'web') {
    const users = JSON.parse(
      localStorage.getItem('users') || '[]'
    );

    const target = users.find(
      (user) =>
        String(user.id) === String(userId)
    );

    if (!target) {
      throw new Error(
        'USER_NOT_FOUND'
      );
    }

    if (
      target.role === 'root' ||
      (target.email || '').toLowerCase() ===
        ROOT_EMAIL.toLowerCase()
    ) {
      throw new Error(
        'ROOT_PROTECTED'
      );
    }

    logAdminRequest(
      target.id,
      'Eliminación de cuenta',
      target
    );

    localStorage.setItem(
      'users',
      JSON.stringify(
        users.filter(
          (user) =>
            String(user.id) !==
            String(userId)
        )
      )
    );

    ['clothes', 'outfits', 'history', 'suitcases']
      .forEach((key) => {
        const list = JSON.parse(
          localStorage.getItem(key) || '[]'
        );

        localStorage.setItem(
          key,
          JSON.stringify(
            list.filter(
              (item) =>
                String(item.userId) !==
                String(userId)
            )
          )
        );
      });

    return {
      success: true,
    };
  }

  if (!db) {
    initDatabase();
  }

  const target =
    db.prepareSync(
      'SELECT * FROM users WHERE id = ?'
    )
      .executeSync([userId])
      .getFirstSync();

  if (!target) {
    throw new Error(
      'USER_NOT_FOUND'
    );
  }

  if (
    target.role === 'root' ||
    (target.email || '').toLowerCase() ===
      ROOT_EMAIL.toLowerCase()
  ) {
    throw new Error(
      'ROOT_PROTECTED'
    );
  }

  logAdminRequest(
    target.id,
    'Eliminación de cuenta',
    target
  );

  ['clothes', 'outfits', 'history', 'suitcases']
    .forEach((table) => {
      try {
        db.prepareSync(
          `DELETE FROM ${table} WHERE userId = ?`
        ).executeSync([userId]);
      } catch (error) {
        console.log(
          `Error al borrar datos de ${table}:`,
          error
        );
      }
    });

  db.prepareSync(
    'DELETE FROM users WHERE id = ?'
  ).executeSync([userId]);

  return {
    success: true,
  };
};

// ============================================================
// RESUMEN ADMINISTRATIVO ROOT
// ============================================================

export const getAdminSummary = () => {

  // ==========================================================
  // WEB
  // ==========================================================

  if (Platform.OS === 'web') {
    try {

      const users =
        JSON.parse(
          localStorage.getItem('users') || '[]'
        );

      const clothes =
        JSON.parse(
          localStorage.getItem('clothes') || '[]'
        );

      const outfits =
        JSON.parse(
          localStorage.getItem('outfits') || '[]'
        );

      const history =
        JSON.parse(
          localStorage.getItem('history') || '[]'
        );

      const suitcases =
        JSON.parse(
          localStorage.getItem('suitcases') || '[]'
        );

      // USOS DURANTE LOS ÚLTIMOS 7 DÍAS

      const sevenDaysAgo =
        Date.now() -
        7 * 24 * 60 * 60 * 1000;

      const usedThisWeek =
        history.filter((item) => {

          const itemDate =
            new Date(item.date).getTime();

          return (
            !Number.isNaN(itemDate) &&
            itemDate >= sevenDaysAgo
          );

        });

      // MALETAS ACTIVAS

      const activeSuitcases =
        suitcases.filter(
          (item) =>
            item.active === true ||
            item.active === 1
        );

      return {

        usersCount:
          users.length,

        clothesCount:
          clothes.length,

        outfitsCount:
          outfits.length,

        usedThisWeekCount:
          usedThisWeek.length,

        activeSuitcasesCount:
          activeSuitcases.length,

      };

    } catch (error) {

      console.log(
        'Error al obtener resumen administrativo (Web):',
        error
      );

      return {

        usersCount: 0,
        clothesCount: 0,
        outfitsCount: 0,
        usedThisWeekCount: 0,
        activeSuitcasesCount: 0,

      };

    }
  }

  // ==========================================================
  // SQLITE
  // ==========================================================

  try {

    if (!db) {
      initDatabase();
    }

    const usersResult =
      db.prepareSync(`
        SELECT COUNT(*) AS total
        FROM users
      `)
        .executeSync([])
        .getFirstSync();

    const clothesResult =
      db.prepareSync(`
        SELECT COUNT(*) AS total
        FROM clothes
      `)
        .executeSync([])
        .getFirstSync();

    const outfitsResult =
      db.prepareSync(`
        SELECT COUNT(*) AS total
        FROM outfits
      `)
        .executeSync([])
        .getFirstSync();

    // USOS DURANTE LOS ÚLTIMOS 7 DÍAS

    let usedThisWeekCount = 0;

    try {

      const historyResult =
        db.prepareSync(`
          SELECT COUNT(*) AS total
          FROM history
          WHERE julianday(date) >=
                julianday('now', '-7 days')
        `)
          .executeSync([])
          .getFirstSync();

      usedThisWeekCount =
        historyResult?.total || 0;

    } catch (error) {

      console.log(
        'Error obteniendo usos recientes del resumen administrativo:',
        error
      );

    }

    // MALETAS ACTIVAS

    let activeSuitcasesCount = 0;

    try {

      const suitcasesResult =
        db.prepareSync(`
          SELECT COUNT(*) AS total
          FROM suitcases
          WHERE active = 1
        `)
          .executeSync([])
          .getFirstSync();

      activeSuitcasesCount =
        suitcasesResult?.total || 0;

    } catch (error) {

      console.log(
        'Error obteniendo maletas activas del resumen administrativo:',
        error
      );

    }

    return {

      usersCount:
        usersResult?.total || 0,

      clothesCount:
        clothesResult?.total || 0,

      outfitsCount:
        outfitsResult?.total || 0,

      usedThisWeekCount:
        usedThisWeekCount,

      activeSuitcasesCount:
        activeSuitcasesCount,

    };

  } catch (error) {

    console.log(
      'Error al obtener resumen administrativo:',
      error
    );

    return {

      usersCount: 0,
      clothesCount: 0,
      outfitsCount: 0,
      usedThisWeekCount: 0,
      activeSuitcasesCount: 0,

    };

  }
};

// ============================================================
// SOLICITUDES ADMINISTRATIVAS
// ============================================================

export const getAdminRequests = () => {
  // Devuelve los mismos campos de siempre (id, userId, type, date,
  // status, details) y agrega userName y userEmail cuando el
  // usuario todavía existe. Si fue eliminado, quedan vacíos y la
  // pantalla puede usar "details".
  if (Platform.OS === 'web') {
    const requests =
      JSON.parse(
        localStorage.getItem(
          'adminRequests'
        ) || '[]'
      );

    const users =
      JSON.parse(
        localStorage.getItem('users') || '[]'
      );

    return requests
      .map((request) => {
        const owner = users.find(
          (user) =>
            String(user.id) ===
            String(request.userId)
        );

        return {
          ...request,
          userName: owner
            ? `${owner.name || ''} ${owner.lastname || ''}`.trim()
            : '',
          userEmail: owner
            ? owner.email || ''
            : '',
        };
      })
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      );
  }

  if (!db) {
    initDatabase();
  }

  const statement =
    db.prepareSync(`
      SELECT
        r.*,
        u.name AS ownerName,
        u.lastname AS ownerLastname,
        u.email AS userEmail
      FROM adminRequests r
      LEFT JOIN users u ON u.id = r.userId
      ORDER BY r.date DESC
    `);

  return statement
    .executeSync([])
    .getAllSync()
    .map((row) => {
      const {
        ownerName,
        ownerLastname,
        ...request
      } = row;

      return {
        ...request,
        userName:
          `${ownerName || ''} ${ownerLastname || ''}`.trim(),
        userEmail:
          row.userEmail || '',
      };
    });
};

export const addAdminRequest = (
  userId,
  type,
  status = 'pending',
  details = ''
) => {
  const date =
    new Date().toISOString();

  if (Platform.OS === 'web') {
    const requests =
      JSON.parse(
        localStorage.getItem(
          'adminRequests'
        ) || '[]'
      );

    const newRequest = {
      id: Date.now(),
      userId,
      type,
      date,
      status,
      details,
    };

    requests.push(
      newRequest
    );

    localStorage.setItem(
      'adminRequests',
      JSON.stringify(requests)
    );

    return newRequest;
  }

  if (!db) {
    initDatabase();
  }

  const statement =
    db.prepareSync(`
      INSERT INTO adminRequests
      (
        userId,
        type,
        date,
        status,
        details
      )
      VALUES (?, ?, ?, ?, ?)
    `);

  const result =
    statement.executeSync([
      userId,
      type,
      date,
      status,
      details,
    ]);

  return {
    id: result.lastInsertRowId,
    userId,
    type,
    date,
    status,
    details,
  };
};

export const updateAdminRequestStatus = (
  requestId,
  status
) => {
  if (
    status !== 'pending' &&
    status !== 'resolved'
  ) {
    throw new Error(
      'INVALID_STATUS'
    );
  }

  if (Platform.OS === 'web') {
    const requests =
      JSON.parse(
        localStorage.getItem(
          'adminRequests'
        ) || '[]'
      );

    const index =
      requests.findIndex(
        (request) =>
          String(request.id) ===
          String(requestId)
      );

    if (index === -1) {
      throw new Error(
        'REQUEST_NOT_FOUND'
      );
    }

    requests[index].status =
      status;

    localStorage.setItem(
      'adminRequests',
      JSON.stringify(requests)
    );

    return requests[index];
  }

  if (!db) {
    initDatabase();
  }

  const request =
    db.prepareSync(
      'SELECT * FROM adminRequests WHERE id = ?'
    )
      .executeSync([
        requestId,
      ])
      .getFirstSync();

  if (!request) {
    throw new Error(
      'REQUEST_NOT_FOUND'
    );
  }

  db.prepareSync(`
    UPDATE adminRequests
    SET status = ?
    WHERE id = ?
  `).executeSync([
    status,
    requestId,
  ]);

  return db.prepareSync(
    'SELECT * FROM adminRequests WHERE id = ?'
  )
    .executeSync([
      requestId,
    ])
    .getFirstSync();
};

// ============================================================
// RESUMEN DEL ARMARIO
// ============================================================

export const getArmarioSummary = (userId) => {
  if (Platform.OS === 'web') {
    try {
      const clothes = JSON.parse(
        localStorage.getItem('clothes') || '[]'
      );

      const outfits = JSON.parse(
        localStorage.getItem('outfits') || '[]'
      );

      const history = JSON.parse(
        localStorage.getItem('history') || '[]'
      );

      const suitcases = JSON.parse(
        localStorage.getItem('suitcases') || '[]'
      );

      const userClothes = clothes.filter(
        (item) =>
          String(item.userId) === String(userId)
      );

      const userOutfits = outfits.filter(
        (item) =>
          String(item.userId) === String(userId)
      );

      const sevenDaysAgo =
        Date.now() -
        7 * 24 * 60 * 60 * 1000;

      const userUsed = history.filter(
        (item) => {
          if (
            String(item.userId) !==
            String(userId)
          ) {
            return false;
          }

          const itemDate =
            new Date(item.date).getTime();

          return (
            !Number.isNaN(itemDate) &&
            itemDate >= sevenDaysAgo
          );
        }
      );

      const userSuitcases =
        suitcases.filter(
          (item) =>
            String(item.userId) ===
              String(userId) &&
            item.active !== false
        );

      return {
        clothesCount:
          userClothes.length,

        outfitsCount:
          userOutfits.length,

        usedThisWeekCount:
          userUsed.length,

        activeSuitcasesCount:
          userSuitcases.length,
      };

    } catch (error) {
      console.log(
        'Error al obtener resumen del armario (Web):',
        error
      );

      return {
        clothesCount: 0,
        outfitsCount: 0,
        usedThisWeekCount: 0,
        activeSuitcasesCount: 0,
      };
    }
  }

  try {
    if (!db) {
      initDatabase();
    }

    const clothesStmt =
      db.prepareSync(`
        SELECT COUNT(*) AS total
        FROM clothes
        WHERE userId = ?
      `);

    const clothesRes =
      clothesStmt
        .executeSync([userId])
        .getFirstSync();

    const outfitsStmt =
      db.prepareSync(`
        SELECT COUNT(*) AS total
        FROM outfits
        WHERE userId = ?
      `);

    const outfitsRes =
      outfitsStmt
        .executeSync([userId])
        .getFirstSync();

    let usedCount = 0;
    let suitcasesCount = 0;

    try {
      const usedStmt =
        db.prepareSync(`
          SELECT COUNT(*) AS total
          FROM history
          WHERE userId = ?
          AND date >= date('now', '-7 days')
        `);

      usedCount =
        usedStmt
          .executeSync([userId])
          .getFirstSync()?.total || 0;
    } catch (error) {
      console.log(
        'Error obteniendo historial del resumen:',
        error
      );
    }

    try {
      const suitcasesStmt =
        db.prepareSync(`
          SELECT COUNT(*) AS total
          FROM suitcases
          WHERE userId = ?
          AND active = 1
        `);

      suitcasesCount =
        suitcasesStmt
          .executeSync([userId])
          .getFirstSync()?.total || 0;
    } catch (error) {
      console.log(
        'Error obteniendo maletas del resumen:',
        error
      );
    }

    return {
      clothesCount:
        clothesRes?.total || 0,

      outfitsCount:
        outfitsRes?.total || 0,

      usedThisWeekCount:
        usedCount,

      activeSuitcasesCount:
        suitcasesCount,
    };

  } catch (error) {
    console.log(
      'Error al obtener resumen del armario:',
      error
    );

    return {
      clothesCount: 0,
      outfitsCount: 0,
      usedThisWeekCount: 0,
      activeSuitcasesCount: 0,
    };
  }
};

// ============================================================
// PRENDAS
// ============================================================

export const addClothingItem = async (
  clothingData
) => {
  const {
    userId,
    title,
    category,
    color,
    season,
    ocasion,
    description,
    imageUri,
  } = clothingData;

  if (Platform.OS === 'web') {
    try {
      const clothes =
        JSON.parse(
          localStorage.getItem(
            'clothes'
          ) || '[]'
        );

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
        createdAt:
          new Date().toISOString(),
      };

      clothes.push(newItem);

      localStorage.setItem(
        'clothes',
        JSON.stringify(clothes)
      );

      return {
        success: true,
        item: newItem,
      };

    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  try {
    if (!db) {
      initDatabase();
    }

    const statement =
      db.prepareSync(`
        INSERT INTO clothes
        (
          userId,
          title,
          category,
          color,
          season,
          ocasion,
          description,
          imageUri,
          createdAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

    const createdAt =
      new Date().toISOString();

    const result =
      statement.executeSync([
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
    console.log(
      'Error al guardar prenda en SQLite:',
      error
    );

    return {
      success: false,
      message: error.message,
    };
  }
};

export const updateClothingItem = async (
  clothingId,
  clothingData
) => {
  const {
    title,
    category,
    color,
    season,
    ocasion,
    description,
    imageUri,
  } = clothingData;

  if (Platform.OS === 'web') {
    try {
      const clothes =
        JSON.parse(
          localStorage.getItem(
            'clothes'
          ) || '[]'
        );

      const normalizedClothingId = Number(clothingId);

      const index =
        clothes.findIndex(
          (item) =>
            Number(item.id) === normalizedClothingId
        );

      if (index === -1) {
        return {
          success: false,
          message: 'ITEM_NOT_FOUND',
        };
      }

      clothes[index] = {
        ...clothes[index],
        title:
          title ??
          clothes[index].title,

        category:
          category ??
          clothes[index].category,

        color:
          color ??
          clothes[index].color,

        season:
          season ??
          clothes[index].season,

        ocasion:
          ocasion ??
          clothes[index].ocasion,

        description:
          description ??
          clothes[index].description,

        imageUri:
          imageUri ??
          clothes[index].imageUri,
      };

      localStorage.setItem(
        'clothes',
        JSON.stringify(clothes)
      );

      return {
        success: true,
        item: clothes[index],
      };

    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  try {
    if (!db) {
      initDatabase();
    }

    const selectStmt =
      db.prepareSync(
        'SELECT * FROM clothes WHERE id = ?'
      );

    const current =
      selectStmt
        .executeSync([clothingId])
        .getFirstSync();

    if (!current) {
      return {
        success: false,
        message: 'ITEM_NOT_FOUND',
      };
    }

    const statement =
      db.prepareSync(`
        UPDATE clothes
        SET
          title = ?,
          category = ?,
          color = ?,
          season = ?,
          ocasion = ?,
          description = ?,
          imageUri = ?
        WHERE id = ?
      `);

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

    const updated =
      selectStmt
        .executeSync([clothingId])
        .getFirstSync();

    return {
      success: true,
      item: updated,
    };

  } catch (error) {
    console.log(
      'Error al editar prenda en SQLite:',
      error
    );

    return {
      success: false,
      message: error.message,
    };
  }
};

export const deleteClothingItem = async (
  clothingId
) => {
  const normalizedClothingId = Number(clothingId);

  if (Platform.OS === 'web') {
    try {
      const clothes = JSON.parse(
        localStorage.getItem('clothes') || '[]'
      );

      const exists = clothes.some(
        (item) => Number(item.id) === normalizedClothingId
      );

      if (!exists) {
        return {
          success: false,
          message: 'ITEM_NOT_FOUND',
        };
      }

      const updatedClothes = clothes.filter(
        (item) => Number(item.id) !== normalizedClothingId
      );

      localStorage.setItem(
        'clothes',
        JSON.stringify(updatedClothes)
      );

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  try {
    if (!db) {
      initDatabase();
    }

    const statement = db.prepareSync(
      'DELETE FROM clothes WHERE id = ?'
    );

    statement.executeSync([
      normalizedClothingId,
    ]);

    return {
      success: true,
    };
  } catch (error) {
    console.log(
      'Error al eliminar prenda:',
      error
    );

    return {
      success: false,
      message: error.message,
    };
  }
};

export const getUserClothes = async (
  userId
) => {
  if (Platform.OS === 'web') {
    try {
      const clothes =
        JSON.parse(
          localStorage.getItem(
            'clothes'
          ) || '[]'
        );

      const userClothes =
        clothes.filter(
          (item) =>
            String(item.userId) ===
            String(userId)
        );

      userClothes.sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      );

      return userClothes;

    } catch (error) {
      console.log(
        'Error al obtener prendas (Web):',
        error
      );

      return [];
    }
  }

  try {
    if (!db) {
      initDatabase();
    }

    const statement =
      db.prepareSync(`
        SELECT *
        FROM clothes
        WHERE userId = ?
        ORDER BY createdAt DESC
      `);

    const result =
      statement.executeSync([
        userId,
      ]);

    return result.getAllSync();

  } catch (error) {
    console.log(
      'Error al obtener prendas (Móvil):',
      error
    );

    return [];
  }
};

export const getClothingItemById = async (
  clothingId
) => {
  if (Platform.OS === 'web') {
    try {
      const clothes =
        JSON.parse(
          localStorage.getItem(
            'clothes'
          ) || '[]'
        );

      return (
        clothes.find(
          (item) =>
            item.id === clothingId
        ) || null
      );

    } catch (error) {
      console.log(
        'Error al obtener prenda (Web):',
        error
      );

      return null;
    }
  }

  try {
    if (!db) {
      initDatabase();
    }

    const statement =
      db.prepareSync(
        'SELECT * FROM clothes WHERE id = ?'
      );

    const result =
      statement.executeSync([
        clothingId,
      ]);

    return (
      result.getFirstSync() ||
      null
    );

  } catch (error) {
    console.log(
      'Error al obtener prenda (Móvil):',
      error
    );

    return null;
  }
};

// ============================================================
// OUTFITS
// ============================================================

export const addOutfit = async (
  outfitData
) => {
  const {
    userId,
    name,
    description,
    items,
  } = outfitData;

  if (Platform.OS === 'web') {
    try {
      const outfits =
        JSON.parse(
          localStorage.getItem(
            'outfits'
          ) || '[]'
        );

      const newOutfit = {
        id: Date.now(),
        userId,
        name,
        description:
          description || '',
        items: items || {},
        createdAt:
          new Date().toISOString(),
      };

      outfits.push(newOutfit);

      localStorage.setItem(
        'outfits',
        JSON.stringify(outfits)
      );

      return {
        success: true,
        outfit: newOutfit,
      };

    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  try {
    if (!db) {
      initDatabase();
    }

    const statement =
      db.prepareSync(`
        INSERT INTO outfits
        (
          userId,
          name,
          description,
          items,
          createdAt
        )
        VALUES (?, ?, ?, ?, ?)
      `);

    const createdAt =
      new Date().toISOString();

    const result =
      statement.executeSync([
        userId,
        name,
        description || '',
        JSON.stringify(
          items || {}
        ),
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
    console.log(
      'Error al guardar outfit en SQLite:',
      error
    );

    return {
      success: false,
      message: error.message,
    };
  }
};

export const getUserOutfits = async (
  userId
) => {
  if (Platform.OS === 'web') {
    try {
      const outfits =
        JSON.parse(
          localStorage.getItem(
            'outfits'
          ) || '[]'
        );

      const userOutfits =
        outfits.filter(
          (item) =>
            String(item.userId) ===
            String(userId)
        );

      userOutfits.sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      );

      return userOutfits;

    } catch (error) {
      console.log(
        'Error al obtener outfits (Web):',
        error
      );

      return [];
    }
  }

  try {
    if (!db) {
      initDatabase();
    }

    const statement =
      db.prepareSync(`
        SELECT *
        FROM outfits
        WHERE userId = ?
        ORDER BY createdAt DESC
      `);

    const result =
      statement.executeSync([
        userId,
      ]);

    const rows =
      result.getAllSync();

    return rows.map(
      (row) => ({
        ...row,
        items: row.items
          ? JSON.parse(row.items)
          : {},
      })
    );

  } catch (error) {
    console.log(
      'Error al obtener outfits (Móvil):',
      error
    );

    return [];
  }
};

export const getOutfitById = async (
  outfitId
) => {
  if (Platform.OS === 'web') {
    try {
      const outfits =
        JSON.parse(
          localStorage.getItem(
            'outfits'
          ) || '[]'
        );

      return (
        outfits.find(
          (item) =>
            item.id === outfitId
        ) || null
      );

    } catch (error) {
      console.log(
        'Error al obtener outfit (Web):',
        error
      );

      return null;
    }
  }

  try {
    if (!db) {
      initDatabase();
    }

    const statement =
      db.prepareSync(
        'SELECT * FROM outfits WHERE id = ?'
      );

    const row =
      statement
        .executeSync([outfitId])
        .getFirstSync();

    if (!row) {
      return null;
    }

    return {
      ...row,
      items: row.items
        ? JSON.parse(row.items)
        : {},
    };

  } catch (error) {
    console.log(
      'Error al obtener outfit (Móvil):',
      error
    );

    return null;
  }
};

export const updateOutfit = async (
  outfitId,
  outfitData
) => {
  const {
    name,
    description,
    items,
  } = outfitData;

  if (Platform.OS === 'web') {
    try {
      const outfits =
        JSON.parse(
          localStorage.getItem(
            'outfits'
          ) || '[]'
        );

      const index =
        outfits.findIndex(
          (item) =>
            item.id === outfitId
        );

      if (index === -1) {
        return {
          success: false,
          message: 'OUTFIT_NOT_FOUND',
        };
      }

      outfits[index] = {
        ...outfits[index],

        name:
          name ??
          outfits[index].name,

        description:
          description ??
          outfits[index].description,

        items:
          items ??
          outfits[index].items,
      };

      localStorage.setItem(
        'outfits',
        JSON.stringify(outfits)
      );

      return {
        success: true,
        outfit: outfits[index],
      };

    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  try {
    if (!db) {
      initDatabase();
    }

    const selectStmt =
      db.prepareSync(
        'SELECT * FROM outfits WHERE id = ?'
      );

    const current =
      selectStmt
        .executeSync([outfitId])
        .getFirstSync();

    if (!current) {
      return {
        success: false,
        message: 'OUTFIT_NOT_FOUND',
      };
    }

    const currentItems =
      current.items
        ? JSON.parse(current.items)
        : {};

    const statement =
      db.prepareSync(`
        UPDATE outfits
        SET
          name = ?,
          description = ?,
          items = ?
        WHERE id = ?
      `);

    statement.executeSync([
      name ?? current.name,
      description ??
        current.description,
      JSON.stringify(
        items ?? currentItems
      ),
      outfitId,
    ]);

    const updated =
      selectStmt
        .executeSync([outfitId])
        .getFirstSync();

    return {
      success: true,
      outfit: {
        ...updated,
        items: JSON.parse(
          updated.items || '{}'
        ),
      },
    };

  } catch (error) {
    console.log(
      'Error al editar outfit en SQLite:',
      error
    );

    return {
      success: false,
      message: error.message,
    };
  }
};

export const deleteOutfit = async (
  outfitId
) => {
  if (Platform.OS === 'web') {
    try {
      const outfits =
        JSON.parse(
          localStorage.getItem(
            'outfits'
          ) || '[]'
        );

      const exists =
        outfits.some(
          (item) =>
            item.id === outfitId
        );

      if (!exists) {
        return {
          success: false,
          message: 'OUTFIT_NOT_FOUND',
        };
      }

      const updatedOutfits =
        outfits.filter(
          (item) =>
            item.id !== outfitId
        );

      localStorage.setItem(
        'outfits',
        JSON.stringify(
          updatedOutfits
        )
      );

      return {
        success: true,
      };

    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  try {
    if (!db) {
      initDatabase();
    }

    const statement =
      db.prepareSync(
        'DELETE FROM outfits WHERE id = ?'
      );

    statement.executeSync([
      outfitId,
    ]);

    return {
      success: true,
    };

  } catch (error) {
    console.log(
      'Error al eliminar outfit:',
      error
    );

    return {
      success: false,
      message: error.message,
    };
  }
};

// ============================================================
// HISTORIAL
// ============================================================

export const addHistoryEntry = async (
  historyData
) => {
  const {
    userId,
    outfitId,
    outfitName,
    imageUri,
    note,
  } = historyData;

  if (Platform.OS === 'web') {
    try {
      const history =
        JSON.parse(
          localStorage.getItem(
            'history'
          ) || '[]'
        );

      const newEntry = {
        id: Date.now(),
        userId,
        outfitId:
          outfitId ?? null,
        outfitName:
          outfitName || '',
        imageUri:
          imageUri || '',
        note:
          note || '',
        date:
          new Date().toISOString(),
      };

      history.push(newEntry);

      localStorage.setItem(
        'history',
        JSON.stringify(history)
      );

      return {
        success: true,
        entry: newEntry,
      };

    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  try {
    if (!db) {
      initDatabase();
    }

    const statement =
      db.prepareSync(`
        INSERT INTO history
        (
          userId,
          outfitId,
          outfitName,
          imageUri,
          note,
          date
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `);

    const date =
      new Date().toISOString();

    const result =
      statement.executeSync([
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
    console.log(
      'Error al guardar historial en SQLite:',
      error
    );

    return {
      success: false,
      message: error.message,
    };
  }
};

export const getUserHistory = async (
  userId
) => {
  if (Platform.OS === 'web') {
    try {
      const history =
        JSON.parse(
          localStorage.getItem(
            'history'
          ) || '[]'
        );

      const userHistory =
        history.filter(
          (item) =>
            String(item.userId) ===
            String(userId)
        );

      userHistory.sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      );

      return userHistory;

    } catch (error) {
      console.log(
        'Error al obtener historial (Web):',
        error
      );

      return [];
    }
  }

  try {
    if (!db) {
      initDatabase();
    }

    const statement =
      db.prepareSync(`
        SELECT *
        FROM history
        WHERE userId = ?
        ORDER BY date DESC
      `);

    const result =
      statement.executeSync([
        userId,
      ]);

    return result.getAllSync();

  } catch (error) {
    console.log(
      'Error al obtener historial (Móvil):',
      error
    );

    return [];
  }
};

// ============================================================
// MODO MALETA
// ============================================================

export const addSuitcase = async (
  suitcaseData
) => {
  const {
    userId,
    destino,
    fechaInicio,
    fechaFin,
    estado,
    items,
  } = suitcaseData;

  if (Platform.OS === 'web') {
    try {
      const suitcases =
        JSON.parse(
          localStorage.getItem(
            'suitcases'
          ) || '[]'
        );

      const newSuitcase = {
        id: Date.now(),
        userId,
        destino,
        fechaInicio,
        fechaFin,
        estado:
          estado || 'Planificada',
        items:
          items || [],
        active: true,
        createdAt:
          new Date().toISOString(),
      };

      suitcases.push(
        newSuitcase
      );

      localStorage.setItem(
        'suitcases',
        JSON.stringify(
          suitcases
        )
      );

      return {
        success: true,
        suitcase: newSuitcase,
      };

    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  try {
    if (!db) {
      initDatabase();
    }

    const statement =
      db.prepareSync(`
        INSERT INTO suitcases
        (
          userId,
          destino,
          fechaInicio,
          fechaFin,
          estado,
          items,
          active,
          createdAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

    const createdAt =
      new Date().toISOString();

    const result =
      statement.executeSync([
        userId,
        destino,
        fechaInicio,
        fechaFin,
        estado || 'Planificada',
        JSON.stringify(
          items || []
        ),
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
        estado:
          estado || 'Planificada',
        items:
          items || [],
        active: true,
        createdAt,
      },
    };

  } catch (error) {
    console.log(
      'Error al guardar maleta en SQLite:',
      error
    );

    return {
      success: false,
      message: error.message,
    };
  }
};

export const getUserSuitcases = async (
  userId
) => {
  if (Platform.OS === 'web') {
    try {
      const suitcases =
        JSON.parse(
          localStorage.getItem(
            'suitcases'
          ) || '[]'
        );

      const userSuitcases =
        suitcases.filter(
          (item) =>
            String(item.userId) ===
            String(userId)
        );

      userSuitcases.sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      );

      return userSuitcases;

    } catch (error) {
      console.log(
        'Error al obtener maletas (Web):',
        error
      );

      return [];
    }
  }

  try {
    if (!db) {
      initDatabase();
    }

    const statement =
      db.prepareSync(`
        SELECT *
        FROM suitcases
        WHERE userId = ?
        ORDER BY createdAt DESC
      `);

    const result =
      statement.executeSync([
        userId,
      ]);

    const rows =
      result.getAllSync();

    return rows.map(
      (row) => ({
        ...row,
        items: row.items
          ? JSON.parse(row.items)
          : [],
        active: !!row.active,
      })
    );

  } catch (error) {
    console.log(
      'Error al obtener maletas (Móvil):',
      error
    );

    return [];
  }
};

export const getSuitcaseById = async (
  suitcaseId
) => {
  if (Platform.OS === 'web') {
    try {
      const suitcases =
        JSON.parse(
          localStorage.getItem(
            'suitcases'
          ) || '[]'
        );

      return (
        suitcases.find(
          (item) =>
            item.id === suitcaseId
        ) || null
      );

    } catch (error) {
      console.log(
        'Error al obtener maleta (Web):',
        error
      );

      return null;
    }
  }

  try {
    if (!db) {
      initDatabase();
    }

    const statement =
      db.prepareSync(
        'SELECT * FROM suitcases WHERE id = ?'
      );

    const row =
      statement
        .executeSync([suitcaseId])
        .getFirstSync();

    if (!row) {
      return null;
    }

    return {
      ...row,
      items: row.items
        ? JSON.parse(row.items)
        : [],
      active: !!row.active,
    };

  } catch (error) {
    console.log(
      'Error al obtener maleta (Móvil):',
      error
    );

    return null;
  }
};

export const updateSuitcase = async (
  suitcaseId,
  updatedData
) => {
  const {
    destino,
    fechaInicio,
    fechaFin,
    estado,
    items,
    active,
  } = updatedData;

  if (Platform.OS === 'web') {
    try {
      const suitcases =
        JSON.parse(
          localStorage.getItem(
            'suitcases'
          ) || '[]'
        );

      const index =
        suitcases.findIndex(
          (item) =>
            item.id === suitcaseId
        );

      if (index === -1) {
        return {
          success: false,
          message:
            'SUITCASE_NOT_FOUND',
        };
      }

      suitcases[index] = {
        ...suitcases[index],

        destino:
          destino ??
          suitcases[index].destino,

        fechaInicio:
          fechaInicio ??
          suitcases[index]
            .fechaInicio,

        fechaFin:
          fechaFin ??
          suitcases[index]
            .fechaFin,

        estado:
          estado ??
          suitcases[index].estado,

        items:
          items ??
          suitcases[index].items,

        active:
          active ??
          suitcases[index].active,
      };

      localStorage.setItem(
        'suitcases',
        JSON.stringify(
          suitcases
        )
      );

      return {
        success: true,
        suitcase:
          suitcases[index],
      };

    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  try {
    if (!db) {
      initDatabase();
    }

    const selectStmt =
      db.prepareSync(
        'SELECT * FROM suitcases WHERE id = ?'
      );

    const current =
      selectStmt
        .executeSync([suitcaseId])
        .getFirstSync();

    if (!current) {
      return {
        success: false,
        message:
          'SUITCASE_NOT_FOUND',
      };
    }

    const currentItems =
      current.items
        ? JSON.parse(
            current.items
          )
        : [];

    const statement =
      db.prepareSync(`
        UPDATE suitcases
        SET
          destino = ?,
          fechaInicio = ?,
          fechaFin = ?,
          estado = ?,
          items = ?,
          active = ?
        WHERE id = ?
      `);

    statement.executeSync([
      destino ??
        current.destino,

      fechaInicio ??
        current.fechaInicio,

      fechaFin ??
        current.fechaFin,

      estado ??
        current.estado,

      JSON.stringify(
        items ??
          currentItems
      ),

      active !== undefined
        ? active
          ? 1
          : 0
        : current.active,

      suitcaseId,
    ]);

    const updated =
      selectStmt
        .executeSync([suitcaseId])
        .getFirstSync();

    return {
      success: true,
      suitcase: {
        ...updated,
        items: JSON.parse(
          updated.items || '[]'
        ),
        active:
          !!updated.active,
      },
    };

  } catch (error) {
    console.log(
      'Error al editar maleta en SQLite:',
      error
    );

    return {
      success: false,
      message: error.message,
    };
  }
};

export const deleteSuitcase = async (
  suitcaseId
) => {
  if (Platform.OS === 'web') {
    try {
      const suitcases =
        JSON.parse(
          localStorage.getItem(
            'suitcases'
          ) || '[]'
        );

      const exists =
        suitcases.some(
          (item) =>
            item.id === suitcaseId
        );

      if (!exists) {
        return {
          success: false,
          message:
            'SUITCASE_NOT_FOUND',
        };
      }

      const updatedSuitcases =
        suitcases.filter(
          (item) =>
            item.id !== suitcaseId
        );

      localStorage.setItem(
        'suitcases',
        JSON.stringify(
          updatedSuitcases
        )
      );

      return {
        success: true,
      };

    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  try {
    if (!db) {
      initDatabase();
    }

    const statement =
      db.prepareSync(
        'DELETE FROM suitcases WHERE id = ?'
      );

    statement.executeSync([
      suitcaseId,
    ]);

    return {
      success: true,
    };

  } catch (error) {
    console.log(
      'Error al eliminar maleta:',
      error
    );

    return {
      success: false,
      message: error.message,
    };
  }
};