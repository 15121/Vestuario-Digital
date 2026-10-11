// ============================================================
// services/database.js
// Base de datos de Vestuario Digital
//
// Web (PC)  -> servidor Node + MySQL (ver services/api.js)
// Móvil     -> SQLite local (expo-sqlite)
//
// Los nombres de las funciones y lo que devuelven son iguales
// en ambas plataformas, así las pantallas no cambian.
// ============================================================

import { Platform } from 'react-native';
import { hashPassword, verifyPassword, isHashed } from './passwordHash';
import { api, setAuthToken, isSessionExpiredError } from './api';

const IS_WEB = Platform.OS === 'web';

let db = null;

// ============================================================
// CONFIGURACIÓN ROOT (solo la usa SQLite; en web lo hace el servidor)
// ============================================================

const ROOT_EMAIL = 'cazoncontreras.iara@tecnica7.edu.ar';
// La clave inicial del Root del celular NO está en el código: se toma del .env local
// (EXPO_PUBLIC_ROOT_PASSWORD). Sin ella, el Root no se crea en SQLite.
const ROOT_INITIAL_PASSWORD = process.env.EXPO_PUBLIC_ROOT_PASSWORD || '';
const ROOT_NAME = 'Iara';
const ROOT_LASTNAME = 'Cazón';

// ============================================================
// HELPERS
// ============================================================

// Devuelve la conexión SQLite (la abre si hace falta)
const getDb = () => {
  if (!db) {
    initDatabase();
  }
  return db;
};

// Ejecuta un SELECT y devuelve la primera fila
const getFirst = (sql, params = []) =>
  getDb().prepareSync(sql).executeSync(params).getFirstSync();

// Ejecuta un SELECT y devuelve todas las filas
const getAll = (sql, params = []) =>
  getDb().prepareSync(sql).executeSync(params).getAllSync();

// Ejecuta INSERT / UPDATE / DELETE
const run = (sql, params = []) =>
  getDb().prepareSync(sql).executeSync(params);

const normalizeUser = (user) =>
  user && {
    ...user,
    role: user.role || 'user',
    status: user.status || 'active',
  };

// ------------------------------------------------------------
// Sesión vencida (web)
// api.js ya avisó al handler global (logout). Acá solo evitamos
// devolver [] / null como si el usuario no tuviera datos.
// ------------------------------------------------------------
const rethrowIfSessionExpired = (error) => {
  if (isSessionExpiredError(error)) {
    throw error;
  }
};

// ------------------------------------------------------------
// Fechas y estado de maletas
// El estado y "activa" SIEMPRE se calculan por fechas
// (misma regla que suitcasesScreen y packingModeScreen).
// activa = todavía no terminó (Planificada o En curso).
// ------------------------------------------------------------
const pad2 = (n) => String(n).padStart(2, '0');

export const todayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export const computeSuitcaseStatus = (
  fechaInicio,
  fechaFin,
  fallback = 'Planificada'
) => {
  const start = String(fechaInicio || '').slice(0, 10);
  const end = String(fechaFin || '').slice(0, 10);

  if (!DATE_ONLY_RE.test(start) || !DATE_ONLY_RE.test(end)) {
    return fallback;
  }

  const today = todayString();

  if (today < start) return 'Planificada';
  if (today > end) return 'Finalizada';
  return 'En curso';
};

// Condición SQL de "maleta activa" (parámetro: fecha de hoy YYYY-MM-DD)
const ACTIVE_SUITCASE_SQL =
  "(fechaFin IS NULL OR fechaFin = '' OR fechaFin >= ?)";

// ------------------------------------------------------------
// Referencias a prendas dentro de outfits y maletas (SQLite)
// ------------------------------------------------------------
const safeParse = (text, fallback) => {
  try {
    return text ? JSON.parse(text) : fallback;
  } catch (error) {
    return fallback;
  }
};

const sameId = (a, b) =>
  a !== null && a !== undefined && String(a) === String(b);

// Devuelve los items del outfit sin la prenda indicada
const stripClothingFromOutfitItems = (items, clothingId) => {
  const result =
    items && typeof items === 'object' && !Array.isArray(items)
      ? { ...items }
      : {};

  let changed = false;

  ['superior', 'inferior', 'calzado'].forEach((key) => {
    if (sameId(result[key], clothingId)) {
      result[key] = null;
      changed = true;
    }
  });

  if (Array.isArray(result.accesorios)) {
    const filtered = result.accesorios.filter(
      (id) => !sameId(id, clothingId)
    );

    if (filtered.length !== result.accesorios.length) {
      result.accesorios = filtered;
      changed = true;
    }
  }

  return { items: result, changed };
};

// Busca los outfits y maletas del dueño que usan la prenda
const findClothingReferences = (clothing) => {
  const outfits = [];
  const suitcases = [];

  getAll('SELECT id, name, items FROM outfits WHERE userId = ?', [
    clothing.userId,
  ]).forEach((row) => {
    const { items, changed } = stripClothingFromOutfitItems(
      safeParse(row.items, {}),
      clothing.id
    );

    if (changed) {
      outfits.push({ id: row.id, name: row.name, items });
    }
  });

  getAll('SELECT id, destino, items FROM suitcases WHERE userId = ?', [
    clothing.userId,
  ]).forEach((row) => {
    const current = safeParse(row.items, []);
    const list = Array.isArray(current) ? current : [];
    const filtered = list.filter(
      (item) => !sameId(item?.clothingId, clothing.id)
    );

    if (filtered.length !== list.length) {
      suitcases.push({ id: row.id, destino: row.destino, items: filtered });
    }
  });

  return { outfits, suitcases };
};

// El servidor devuelve { ...usuario, token }. Guardamos el token
// en api.js y devolvemos solo el usuario.
const acceptSession = (session) => {
  if (!session) return session;
  const { token, ...user } = session;
  if (token) setAuthToken(token);
  return user;
};

// Registro de actividad administrativa (solo SQLite).
// Si falla, el flujo original NO se ve afectado.
const logAdminRequest = (userId, type, user, status = 'resolved') => {
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
  // En la web la base vive en MySQL y la inicializa el servidor.
  if (IS_WEB) {
    console.log('Web: se usa el servidor MySQL (sin inicialización local).');
    return;
  }

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

    // Migraciones para instalaciones viejas
    const migrations = [
      ['users', 'role', "TEXT DEFAULT 'user'"],
      ['users', 'status', "TEXT DEFAULT 'active'"],
      ['users', 'createdAt', 'TEXT'],
      ['users', 'lastAccess', 'TEXT'],

      ['clothes', 'color', 'TEXT'],
      ['clothes', 'season', 'TEXT'],
      ['clothes', 'ocasion', 'TEXT'],
      ['clothes', 'description', 'TEXT'],
      ['clothes', 'createdAt', 'TEXT'],

      ['outfits', 'description', 'TEXT'],
      ['outfits', 'createdAt', 'TEXT'],

      ['history', 'outfitId', 'INTEGER'],
      ['history', 'outfitName', 'TEXT'],
      ['history', 'imageUri', 'TEXT'],
      ['history', 'note', 'TEXT'],
      ['history', 'date', 'TEXT'],

      ['suitcases', 'destino', 'TEXT'],
      ['suitcases', 'fechaInicio', 'TEXT'],
      ['suitcases', 'fechaFin', 'TEXT'],
      ['suitcases', 'estado', 'TEXT'],
      ['suitcases', 'items', 'TEXT'],
      ['suitcases', 'active', 'INTEGER DEFAULT 1'],
      ['suitcases', 'createdAt', 'TEXT'],
    ];

    migrations.forEach(([table, column, definition]) => {
      try {
        db.execSync(
          `ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`
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
};

// ============================================================
// ASEGURAR CUENTA ROOT (solo SQLite)
// ============================================================

export const ensureRootUser = () => {
  if (IS_WEB || !db) {
    return;
  }

  const now = new Date().toISOString();

  try {
    const root = getFirst(
      'SELECT * FROM users WHERE LOWER(email) = ?',
      [ROOT_EMAIL.toLowerCase()]
    );

    let rootId;

    if (!root && !ROOT_INITIAL_PASSWORD) {
      console.log('Root no creado en SQLite: falta EXPO_PUBLIC_ROOT_PASSWORD en el .env.');
      return;
    }

    if (!root) {
      const result = run(
        `INSERT INTO users
         (name, lastname, email, password, role, status, createdAt, lastAccess)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ROOT_NAME,
          ROOT_LASTNAME,
          ROOT_EMAIL,
          hashPassword(ROOT_INITIAL_PASSWORD),
          'root',
          'active',
          now,
          null,
        ]
      );

      rootId = result.lastInsertRowId;
    } else {
      rootId = root.id;

      run(
        `UPDATE users
         SET name = ?, lastname = ?, email = ?,
             role = 'root', status = 'active'
         WHERE id = ?`,
        [ROOT_NAME, ROOT_LASTNAME, ROOT_EMAIL, rootId]
      );
    }

    // Garantiza que no haya otro Root.
    run(
      `UPDATE users SET role = 'user' WHERE role = 'root' AND id != ?`,
      [rootId]
    );
  } catch (error) {
    console.log('Error al asegurar cuenta Root:', error);
  }
};

// ============================================================
// REGISTRAR USUARIO
// ============================================================

export const registerUser = async (name, lastname, email, password) => {
  if (IS_WEB) {
    setAuthToken(null);
    const session = await api('/auth/register', {
      method: 'POST',
      body: { name, lastname, email, password },
    });
    return acceptSession(session);
  }

  const cleanEmail = email.trim().toLowerCase();
  const now = new Date().toISOString();

  if (cleanEmail === ROOT_EMAIL.toLowerCase()) {
    throw new Error('ROOT_EMAIL_RESERVED');
  }

  try {
    const result = run(
      `INSERT INTO users
       (name, lastname, email, password, role, status, createdAt, lastAccess)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, lastname, cleanEmail, hashPassword(password), 'user', 'active', now, null]
    );

    logAdminRequest(result.lastInsertRowId, 'Registro de usuario', {
      name,
      lastname,
      email: cleanEmail,
    });

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
    console.log('--- ERROR DETALLADO EN SQLITE CELULAR ---', error);

    const errStr = String(error?.message || error);

    if (errStr.includes('UNIQUE') || errStr.includes('CONSTRAINT')) {
      throw new Error('EMAIL_EXISTS');
    }

    throw error;
  }
};

// ============================================================
// INICIAR SESIÓN
// En web devuelve una Promesa; en móvil devuelve el usuario.
// Usar siempre: await loginUser(...)
// ============================================================

export const loginUser = (email, password) => {
  if (IS_WEB) {
    setAuthToken(null);
    return api('/auth/login', {
      method: 'POST',
      body: { email, password },
    }).then(acceptSession);
  }

  const cleanEmail = email.trim().toLowerCase();
  const now = new Date().toISOString();

  const user = getFirst(
    'SELECT * FROM users WHERE LOWER(email) = ?',
    [cleanEmail]
  );

  if (!user || !verifyPassword(password, user.password)) {
    throw new Error('USER_NOT_FOUND');
  }

  // Cuentas creadas antes del hash (texto plano): se re-guardan con hash en el primer ingreso.
  if (!isHashed(user.password)) {
    run('UPDATE users SET password = ? WHERE id = ?', [
      hashPassword(password),
      user.id,
    ]);
  }

  const { password: _password, ...userWithoutPassword } = user;

  const normalizedUser = {
    ...userWithoutPassword,
    role: user.role || 'user',
    status: user.status || 'active',
    createdAt: user.createdAt || null,
    lastAccess: now,
  };

  if (normalizedUser.status !== 'active') {
    throw new Error('USER_INACTIVE');
  }

  run(
    'UPDATE users SET role = ?, status = ?, lastAccess = ? WHERE id = ?',
    [
      normalizedUser.role,
      normalizedUser.status,
      normalizedUser.lastAccess,
      normalizedUser.id,
    ]
  );

  return normalizedUser;
};

// ============================================================
// RESTABLECER CONTRASEÑA
// ============================================================

export const resetUserPassword = async (email, newPassword, currentPassword) => {
  if (IS_WEB) {
    try {
      // Cambio de clave del usuario autenticado.
      // Si entró con un código de recuperación, no hace falta la clave actual.
      const result = await api('/auth/password', {
        method: 'PUT',
        body: { newPassword, currentPassword },
      });
      if (result?.token) setAuthToken(result.token);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const user = getFirst(
      'SELECT * FROM users WHERE LOWER(email) = ?',
      [cleanEmail]
    );

    if (!user) {
      return { success: false, message: 'USER_NOT_FOUND' };
    }

    if (
      user.role === 'root' ||
      (user.email || '').toLowerCase() === ROOT_EMAIL.toLowerCase()
    ) {
      return { success: false, message: 'ROOT_PROTECTED' };
    }

    run('UPDATE users SET password = ? WHERE LOWER(email) = ?', [
      hashPassword(newPassword),
      cleanEmail,
    ]);

    logAdminRequest(user.id, 'Restablecer contraseña', user);

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ============================================================
// RECUPERAR CONTRASEÑA (web): el servidor genera el código y envía el mail
// ============================================================

export const requestPasswordReset = async (email) => {
  if (IS_WEB) {
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email } });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
  return { success: false, message: 'NOT_SUPPORTED_ON_MOBILE' };
};

// ============================================================
// ACTUALIZAR PERFIL
// Devuelve { success, error, message, user }
// ============================================================

export const updateUserProfile = async (userId, profileData) => {
  if (IS_WEB) {
    try {
      return await api(`/users/${userId}/profile`, {
        method: 'PUT',
        body: profileData,
      });
    } catch (error) {
      return { success: false, error: error.message, message: error.message };
    }
  }

  const { name, lastname, email } = profileData;

  const cleanEmail = email ? email.trim().toLowerCase() : undefined;

  const fail = (code) => ({ success: false, error: code, message: code });

  try {
    const current = getFirst('SELECT * FROM users WHERE id = ?', [userId]);

    if (!current) {
      return fail('USER_NOT_FOUND');
    }

    if (
      current.role === 'root' ||
      (current.email || '').toLowerCase() === ROOT_EMAIL.toLowerCase()
    ) {
      return fail('ROOT_PROTECTED');
    }

    const emailChanged =
      cleanEmail && cleanEmail !== (current.email || '').toLowerCase();

    if (emailChanged && cleanEmail === ROOT_EMAIL.toLowerCase()) {
      return fail('ROOT_EMAIL_RESERVED');
    }

    if (cleanEmail) {
      const collision = getFirst(
        'SELECT id FROM users WHERE LOWER(email) = ? AND id != ?',
        [cleanEmail, userId]
      );

      if (collision) {
        return fail('EMAIL_EXISTS');
      }
    }

    run('UPDATE users SET name = ?, lastname = ?, email = ? WHERE id = ?', [
      name ?? current.name,
      lastname ?? current.lastname,
      cleanEmail ?? current.email,
      userId,
    ]);

    const updatedUser = getFirst('SELECT * FROM users WHERE id = ?', [userId]);

    logAdminRequest(
      updatedUser?.id ?? userId,
      emailChanged ? 'Cambio de email' : 'Edición de datos',
      updatedUser
    );

    return { success: true, user: updatedUser };
  } catch (error) {
    console.log('Error al actualizar perfil en SQLite:', error);
    return { success: false, error: error.message, message: error.message };
  }
};

// ============================================================
// FUNCIONES PARA ROOT / ADMIN
// (en web devuelven Promesas: usar await)
// ============================================================

export const getAllUsers = () => {
  if (IS_WEB) {
    return api('/users');
  }

  return getAll(`
    SELECT id, name, lastname, email, role, status, createdAt, lastAccess
    FROM users
    ORDER BY id DESC
  `).map(normalizeUser);
};

export const getUserById = (userId) => {
  if (IS_WEB) {
    return api(`/users/${userId}`);
  }

  const user = getFirst(
    `SELECT id, name, lastname, email, role, status, createdAt, lastAccess
     FROM users WHERE id = ?`,
    [userId]
  );

  return user ? normalizeUser(user) : null;
};

export const updateUserStatus = (userId, status) => {
  if (status !== 'active' && status !== 'suspended') {
    throw new Error('INVALID_STATUS');
  }

  if (IS_WEB) {
    return api(`/users/${userId}/status`, {
      method: 'PUT',
      body: { status },
    });
  }

  const user = getFirst('SELECT * FROM users WHERE id = ?', [userId]);

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  if (user.role === 'root') {
    throw new Error('ROOT_PROTECTED');
  }

  run('UPDATE users SET status = ? WHERE id = ?', [status, userId]);

  logAdminRequest(
    user.id,
    status === 'suspended' ? 'Cuenta suspendida' : 'Cuenta reactivada',
    user
  );

  return getUserById(userId);
};

export const updateUserRole = (userId, role) => {
  if (role !== 'user' && role !== 'root') {
    throw new Error('INVALID_ROLE');
  }

  if (IS_WEB) {
    // Solo existe un Root fijo; el servidor lo gestiona.
    throw new Error('NOT_SUPPORTED_ON_WEB');
  }

  const user = getFirst('SELECT * FROM users WHERE id = ?', [userId]);

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  if (user.role === 'root' && role === 'user') {
    throw new Error('ROOT_PROTECTED');
  }

  if (
    role === 'root' &&
    (user.email || '').toLowerCase() !== ROOT_EMAIL.toLowerCase()
  ) {
    throw new Error('ONLY_ONE_ROOT');
  }

  run('UPDATE users SET role = ? WHERE id = ?', [role, userId]);

  if (role === 'root') {
    run(`UPDATE users SET role = 'user' WHERE role = 'root' AND id != ?`, [
      userId,
    ]);
  }

  return getUserById(userId);
};

export const deleteUser = (userId) => {
  if (IS_WEB) {
    return api(`/users/${userId}`, { method: 'DELETE' });
  }

  const target = getFirst('SELECT * FROM users WHERE id = ?', [userId]);

  if (!target) {
    throw new Error('USER_NOT_FOUND');
  }

  if (
    target.role === 'root' ||
    (target.email || '').toLowerCase() === ROOT_EMAIL.toLowerCase()
  ) {
    throw new Error('ROOT_PROTECTED');
  }

  logAdminRequest(target.id, 'Eliminación de cuenta', target);

  ['clothes', 'outfits', 'history', 'suitcases'].forEach((table) => {
    try {
      run(`DELETE FROM ${table} WHERE userId = ?`, [userId]);
    } catch (error) {
      console.log(`Error al borrar datos de ${table}:`, error);
    }
  });

  run('DELETE FROM users WHERE id = ?', [userId]);

  return { success: true };
};

// ============================================================
// RESUMEN ADMINISTRATIVO ROOT
// ============================================================

const EMPTY_ADMIN_SUMMARY = {
  usersCount: 0,
  clothesCount: 0,
  outfitsCount: 0,
  usedThisWeekCount: 0,
  activeSuitcasesCount: 0,
};

export const getAdminSummary = async () => {
  if (IS_WEB) {
    try {
      return await api('/admin/summary');
    } catch (error) {
      console.log('Error al obtener resumen administrativo (Web):', error);
      return EMPTY_ADMIN_SUMMARY;
    }
  }

  try {
    const total = (sql, params = []) => getFirst(sql, params)?.total || 0;

    let usedThisWeekCount = 0;
    let activeSuitcasesCount = 0;

    try {
      usedThisWeekCount = total(`
        SELECT COUNT(*) AS total FROM history
        WHERE julianday(date) >= julianday('now', '-7 days')
      `);
    } catch (error) {
      console.log('Error obteniendo usos recientes:', error);
    }

    try {
      activeSuitcasesCount = total(
        `SELECT COUNT(*) AS total FROM suitcases
         WHERE ${ACTIVE_SUITCASE_SQL}`,
        [todayString()]
      );
    } catch (error) {
      console.log('Error obteniendo maletas activas:', error);
    }

    return {
      usersCount: total('SELECT COUNT(*) AS total FROM users'),
      clothesCount: total('SELECT COUNT(*) AS total FROM clothes'),
      outfitsCount: total('SELECT COUNT(*) AS total FROM outfits'),
      usedThisWeekCount,
      activeSuitcasesCount,
    };
  } catch (error) {
    console.log('Error al obtener resumen administrativo:', error);
    return EMPTY_ADMIN_SUMMARY;
  }
};

// ============================================================
// SOLICITUDES ADMINISTRATIVAS
// ============================================================

export const getAdminRequests = () => {
  if (IS_WEB) {
    return api('/admin/requests');
  }

  return getAll(`
    SELECT
      r.*,
      u.name AS ownerName,
      u.lastname AS ownerLastname,
      u.email AS userEmail
    FROM adminRequests r
    LEFT JOIN users u ON u.id = r.userId
    ORDER BY r.date DESC
  `).map((row) => {
    const { ownerName, ownerLastname, ...request } = row;

    return {
      ...request,
      userName: `${ownerName || ''} ${ownerLastname || ''}`.trim(),
      userEmail: row.userEmail || '',
    };
  });
};

export const addAdminRequest = (
  userId,
  type,
  status = 'pending',
  details = ''
) => {
  if (IS_WEB) {
    return api('/admin/requests', {
      method: 'POST',
      body: { userId, type, status, details },
    });
  }

  const date = new Date().toISOString();

  const result = run(
    `INSERT INTO adminRequests (userId, type, date, status, details)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, type, date, status, details]
  );

  return {
    id: result.lastInsertRowId,
    userId,
    type,
    date,
    status,
    details,
  };
};

export const updateAdminRequestStatus = (requestId, status) => {
  if (status !== 'pending' && status !== 'resolved') {
    throw new Error('INVALID_STATUS');
  }

  if (IS_WEB) {
    return api(`/admin/requests/${requestId}`, {
      method: 'PUT',
      body: { status },
    });
  }

  const request = getFirst('SELECT * FROM adminRequests WHERE id = ?', [
    requestId,
  ]);

  if (!request) {
    throw new Error('REQUEST_NOT_FOUND');
  }

  run('UPDATE adminRequests SET status = ? WHERE id = ?', [status, requestId]);

  return getFirst('SELECT * FROM adminRequests WHERE id = ?', [requestId]);
};

// ============================================================
// RESUMEN DEL ARMARIO
// (en web devuelve Promesa: usar await)
// ============================================================

const EMPTY_SUMMARY = {
  clothesCount: 0,
  outfitsCount: 0,
  usedThisWeekCount: 0,
  activeSuitcasesCount: 0,
};

export const getArmarioSummary = (userId) => {
  if (IS_WEB) {
    return api(`/summary/${userId}`).catch((error) => {
      console.log('Error al obtener resumen del armario (Web):', error);
      return EMPTY_SUMMARY;
    });
  }

  try {
    const count = (sql) => getFirst(sql, [userId])?.total || 0;

    let usedCount = 0;
    let suitcasesCount = 0;

    try {
      usedCount = count(`
        SELECT COUNT(*) AS total FROM history
        WHERE userId = ? AND date >= date('now', '-7 days')
      `);
    } catch (error) {
      console.log('Error obteniendo historial del resumen:', error);
    }

    try {
      suitcasesCount =
        getFirst(
          `SELECT COUNT(*) AS total FROM suitcases
           WHERE userId = ? AND ${ACTIVE_SUITCASE_SQL}`,
          [userId, todayString()]
        )?.total || 0;
    } catch (error) {
      console.log('Error obteniendo maletas del resumen:', error);
    }

    return {
      clothesCount: count(
        'SELECT COUNT(*) AS total FROM clothes WHERE userId = ?'
      ),
      outfitsCount: count(
        'SELECT COUNT(*) AS total FROM outfits WHERE userId = ?'
      ),
      usedThisWeekCount: usedCount,
      activeSuitcasesCount: suitcasesCount,
    };
  } catch (error) {
    console.log('Error al obtener resumen del armario:', error);
    return EMPTY_SUMMARY;
  }
};

// ============================================================
// PRENDAS
// ============================================================

export const addClothingItem = async (clothingData) => {
  if (IS_WEB) {
    try {
      return await api('/clothes', { method: 'POST', body: clothingData });
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

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

  try {
    const createdAt = new Date().toISOString();

    const result = run(
      `INSERT INTO clothes
       (userId, title, category, color, season, ocasion, description, imageUri, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        title,
        category,
        color || '',
        season || '',
        ocasion || '',
        description || '',
        imageUri,
        createdAt,
      ]
    );

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
};

export const updateClothingItem = async (clothingId, clothingData) => {
  if (IS_WEB) {
    try {
      return await api(`/clothes/${clothingId}`, {
        method: 'PUT',
        body: clothingData,
      });
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  const { title, category, color, season, ocasion, description, imageUri } =
    clothingData;

  try {
    const current = getFirst('SELECT * FROM clothes WHERE id = ?', [
      clothingId,
    ]);

    if (!current) {
      return { success: false, message: 'ITEM_NOT_FOUND' };
    }

    run(
      `UPDATE clothes
       SET title = ?, category = ?, color = ?, season = ?,
           ocasion = ?, description = ?, imageUri = ?
       WHERE id = ?`,
      [
        title ?? current.title,
        category ?? current.category,
        color ?? current.color,
        season ?? current.season,
        ocasion ?? current.ocasion,
        description ?? current.description,
        imageUri ?? current.imageUri,
        clothingId,
      ]
    );

    return {
      success: true,
      item: getFirst('SELECT * FROM clothes WHERE id = ?', [clothingId]),
    };
  } catch (error) {
    console.log('Error al editar prenda en SQLite:', error);
    return { success: false, message: error.message };
  }
};

// Cuántos outfits y maletas usan la prenda (para avisar antes de borrar).
// Devuelve { outfitCount, suitcaseCount, outfitNames }
export const getClothingUsage = async (clothingId) => {
  const EMPTY = { outfitCount: 0, suitcaseCount: 0, outfitNames: [] };

  if (IS_WEB) {
    try {
      return await api(`/clothes/${clothingId}/usage`);
    } catch (error) {
      console.log('Error al obtener uso de la prenda (Web):', error);
      rethrowIfSessionExpired(error);
      return EMPTY;
    }
  }

  try {
    const clothing = getFirst('SELECT id, userId FROM clothes WHERE id = ?', [
      Number(clothingId),
    ]);

    if (!clothing) {
      return EMPTY;
    }

    const { outfits, suitcases } = findClothingReferences(clothing);

    return {
      outfitCount: outfits.length,
      suitcaseCount: suitcases.length,
      outfitNames: outfits.map((outfit) => outfit.name).filter(Boolean),
    };
  } catch (error) {
    console.log('Error al obtener uso de la prenda (Móvil):', error);
    return EMPTY;
  }
};

// Borra la prenda Y la quita de los outfits y maletas que la usan.
// Devuelve { success, affectedOutfits, affectedSuitcases }
export const deleteClothingItem = async (clothingId) => {
  if (IS_WEB) {
    try {
      return await api(`/clothes/${clothingId}`, { method: 'DELETE' });
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  try {
    const id = Number(clothingId);

    const clothing = getFirst('SELECT id, userId FROM clothes WHERE id = ?', [
      id,
    ]);

    let affectedOutfits = 0;
    let affectedSuitcases = 0;

    getDb().withTransactionSync(() => {
      if (clothing) {
        const { outfits, suitcases } = findClothingReferences(clothing);

        outfits.forEach((outfit) => {
          run('UPDATE outfits SET items = ? WHERE id = ?', [
            JSON.stringify(outfit.items),
            outfit.id,
          ]);
        });

        suitcases.forEach((suitcase) => {
          run('UPDATE suitcases SET items = ? WHERE id = ?', [
            JSON.stringify(suitcase.items),
            suitcase.id,
          ]);
        });

        affectedOutfits = outfits.length;
        affectedSuitcases = suitcases.length;
      }

      run('DELETE FROM clothes WHERE id = ?', [id]);
    });

    return { success: true, affectedOutfits, affectedSuitcases };
  } catch (error) {
    console.log('Error al eliminar prenda:', error);
    return { success: false, message: error.message };
  }
};

export const getUserClothes = async (userId) => {
  if (IS_WEB) {
    try {
      return await api(`/clothes?userId=${userId}`);
    } catch (error) {
      console.log('Error al obtener prendas (Web):', error);
      rethrowIfSessionExpired(error);
      return [];
    }
  }

  try {
    return getAll(
      'SELECT * FROM clothes WHERE userId = ? ORDER BY createdAt DESC',
      [userId]
    );
  } catch (error) {
    console.log('Error al obtener prendas (Móvil):', error);
    return [];
  }
};

export const getClothingItemById = async (clothingId) => {
  if (IS_WEB) {
    try {
      return await api(`/clothes/${clothingId}`);
    } catch (error) {
      console.log('Error al obtener prenda (Web):', error);
      rethrowIfSessionExpired(error);
      return null;
    }
  }

  try {
    return getFirst('SELECT * FROM clothes WHERE id = ?', [clothingId]) || null;
  } catch (error) {
    console.log('Error al obtener prenda (Móvil):', error);
    return null;
  }
};

// ============================================================
// OUTFITS
// ============================================================

const parseOutfitRow = (row) =>
  row && {
    ...row,
    items: row.items ? JSON.parse(row.items) : {},
  };

export const addOutfit = async (outfitData) => {
  if (IS_WEB) {
    try {
      return await api('/outfits', { method: 'POST', body: outfitData });
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  const { userId, name, description, items } = outfitData;

  try {
    const createdAt = new Date().toISOString();

    const result = run(
      `INSERT INTO outfits (userId, name, description, items, createdAt)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, name, description || '', JSON.stringify(items || {}), createdAt]
    );

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
};

export const getUserOutfits = async (userId) => {
  if (IS_WEB) {
    try {
      return await api(`/outfits?userId=${userId}`);
    } catch (error) {
      console.log('Error al obtener outfits (Web):', error);
      rethrowIfSessionExpired(error);
      return [];
    }
  }

  try {
    return getAll(
      'SELECT * FROM outfits WHERE userId = ? ORDER BY createdAt DESC',
      [userId]
    ).map(parseOutfitRow);
  } catch (error) {
    console.log('Error al obtener outfits (Móvil):', error);
    return [];
  }
};

export const getOutfitById = async (outfitId) => {
  if (IS_WEB) {
    try {
      return await api(`/outfits/${outfitId}`);
    } catch (error) {
      console.log('Error al obtener outfit (Web):', error);
      rethrowIfSessionExpired(error);
      return null;
    }
  }

  try {
    const row = getFirst('SELECT * FROM outfits WHERE id = ?', [outfitId]);
    return row ? parseOutfitRow(row) : null;
  } catch (error) {
    console.log('Error al obtener outfit (Móvil):', error);
    return null;
  }
};

export const updateOutfit = async (outfitId, outfitData) => {
  if (IS_WEB) {
    try {
      return await api(`/outfits/${outfitId}`, {
        method: 'PUT',
        body: outfitData,
      });
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  const { name, description, items } = outfitData;

  try {
    const current = getFirst('SELECT * FROM outfits WHERE id = ?', [outfitId]);

    if (!current) {
      return { success: false, message: 'OUTFIT_NOT_FOUND' };
    }

    const currentItems = current.items ? JSON.parse(current.items) : {};

    run(
      `UPDATE outfits SET name = ?, description = ?, items = ? WHERE id = ?`,
      [
        name ?? current.name,
        description ?? current.description,
        JSON.stringify(items ?? currentItems),
        outfitId,
      ]
    );

    return {
      success: true,
      outfit: parseOutfitRow(
        getFirst('SELECT * FROM outfits WHERE id = ?', [outfitId])
      ),
    };
  } catch (error) {
    console.log('Error al editar outfit en SQLite:', error);
    return { success: false, message: error.message };
  }
};

export const deleteOutfit = async (outfitId) => {
  if (IS_WEB) {
    try {
      return await api(`/outfits/${outfitId}`, { method: 'DELETE' });
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  try {
    run('DELETE FROM outfits WHERE id = ?', [outfitId]);
    return { success: true };
  } catch (error) {
    console.log('Error al eliminar outfit:', error);
    return { success: false, message: error.message };
  }
};

// ============================================================
// HISTORIAL
// ============================================================

export const addHistoryEntry = async (historyData) => {
  if (IS_WEB) {
    try {
      return await api('/history', { method: 'POST', body: historyData });
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  const { userId, outfitId, outfitName, imageUri, note } = historyData;

  try {
    const date = new Date().toISOString();

    const result = run(
      `INSERT INTO history (userId, outfitId, outfitName, imageUri, note, date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        outfitId ?? null,
        outfitName || '',
        imageUri || '',
        note || '',
        date,
      ]
    );

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
};

export const getUserHistory = async (userId) => {
  if (IS_WEB) {
    try {
      return await api(`/history?userId=${userId}`);
    } catch (error) {
      console.log('Error al obtener historial (Web):', error);
      rethrowIfSessionExpired(error);
      return [];
    }
  }

  try {
    return getAll(
      'SELECT * FROM history WHERE userId = ? ORDER BY date DESC',
      [userId]
    );
  } catch (error) {
    console.log('Error al obtener historial (Móvil):', error);
    return [];
  }
};

// ============================================================
// MODO MALETA
// ============================================================

// estado y active se recalculan SIEMPRE por fechas (no se confía en
// lo guardado, que se desactualiza cuando pasan los días).
const parseSuitcaseRow = (row) => {
  if (!row) {
    return row;
  }

  const estado = computeSuitcaseStatus(
    row.fechaInicio,
    row.fechaFin,
    row.estado || 'Planificada'
  );

  return {
    ...row,
    items: safeParse(row.items, []),
    estado,
    active: estado !== 'Finalizada',
  };
};

export const addSuitcase = async (suitcaseData) => {
  if (IS_WEB) {
    try {
      return await api('/suitcases', { method: 'POST', body: suitcaseData });
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  const { userId, destino, fechaInicio, fechaFin, estado, items } =
    suitcaseData;

  try {
    const createdAt = new Date().toISOString();

    const status = computeSuitcaseStatus(
      fechaInicio,
      fechaFin,
      estado || 'Planificada'
    );

    const isActive = status !== 'Finalizada';

    const result = run(
      `INSERT INTO suitcases
       (userId, destino, fechaInicio, fechaFin, estado, items, active, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        destino,
        fechaInicio,
        fechaFin,
        status,
        JSON.stringify(items || []),
        isActive ? 1 : 0,
        createdAt,
      ]
    );

    return {
      success: true,
      suitcase: {
        id: result.lastInsertRowId,
        userId,
        destino,
        fechaInicio,
        fechaFin,
        estado: status,
        items: items || [],
        active: isActive,
        createdAt,
      },
    };
  } catch (error) {
    console.log('Error al guardar maleta en SQLite:', error);
    return { success: false, message: error.message };
  }
};

export const getUserSuitcases = async (userId) => {
  if (IS_WEB) {
    try {
      return await api(`/suitcases?userId=${userId}`);
    } catch (error) {
      console.log('Error al obtener maletas (Web):', error);
      rethrowIfSessionExpired(error);
      return [];
    }
  }

  try {
    return getAll(
      'SELECT * FROM suitcases WHERE userId = ? ORDER BY createdAt DESC',
      [userId]
    ).map(parseSuitcaseRow);
  } catch (error) {
    console.log('Error al obtener maletas (Móvil):', error);
    return [];
  }
};

export const getSuitcaseById = async (suitcaseId) => {
  if (IS_WEB) {
    try {
      return await api(`/suitcases/${suitcaseId}`);
    } catch (error) {
      console.log('Error al obtener maleta (Web):', error);
      rethrowIfSessionExpired(error);
      return null;
    }
  }

  try {
    const row = getFirst('SELECT * FROM suitcases WHERE id = ?', [suitcaseId]);
    return row ? parseSuitcaseRow(row) : null;
  } catch (error) {
    console.log('Error al obtener maleta (Móvil):', error);
    return null;
  }
};

export const updateSuitcase = async (suitcaseId, updatedData) => {
  if (IS_WEB) {
    try {
      return await api(`/suitcases/${suitcaseId}`, {
        method: 'PUT',
        body: updatedData,
      });
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  const { destino, fechaInicio, fechaFin, estado, items } = updatedData;

  try {
    const current = getFirst('SELECT * FROM suitcases WHERE id = ?', [
      suitcaseId,
    ]);

    if (!current) {
      return { success: false, message: 'SUITCASE_NOT_FOUND' };
    }

    const currentItems = safeParse(current.items, []);

    const nextStart = fechaInicio ?? current.fechaInicio;
    const nextEnd = fechaFin ?? current.fechaFin;

    // estado y active se derivan de las fechas (ya no se confía en
    // el "active" que manda la pantalla)
    const status = computeSuitcaseStatus(
      nextStart,
      nextEnd,
      estado ?? current.estado ?? 'Planificada'
    );

    run(
      `UPDATE suitcases
       SET destino = ?, fechaInicio = ?, fechaFin = ?, estado = ?,
           items = ?, active = ?
       WHERE id = ?`,
      [
        destino ?? current.destino,
        nextStart,
        nextEnd,
        status,
        JSON.stringify(items ?? currentItems),
        status !== 'Finalizada' ? 1 : 0,
        suitcaseId,
      ]
    );

    return {
      success: true,
      suitcase: parseSuitcaseRow(
        getFirst('SELECT * FROM suitcases WHERE id = ?', [suitcaseId])
      ),
    };
  } catch (error) {
    console.log('Error al editar maleta en SQLite:', error);
    return { success: false, message: error.message };
  }
};

export const deleteSuitcase = async (suitcaseId) => {
  if (IS_WEB) {
    try {
      return await api(`/suitcases/${suitcaseId}`, { method: 'DELETE' });
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  try {
    run('DELETE FROM suitcases WHERE id = ?', [suitcaseId]);
    return { success: true };
  } catch (error) {
    console.log('Error al eliminar maleta:', error);
    return { success: false, message: error.message };
  }
};