'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mysql = require('mysql2/promise');

// ============================================================
// CONFIGURACIÓN (todo desde .env)
// ============================================================
const {
  PORT = 3000,
  DB_HOST = 'localhost',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'vestuario',
  JWT_SECRET,
  WEB_ORIGIN,
  ROOT_EMAIL: ROOT_EMAIL_ENV,
  ROOT_PASSWORD,
  RESET_ROOT_PASSWORD,
  EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID,
  EMAILJS_PUBLIC_KEY,
  EMAILJS_PRIVATE_KEY,
  // Ajustes de carga (opcionales). Si no están en el .env se usan los valores por defecto.
  DB_POOL,
  RATE_LIMIT,
  LOGIN_LIMIT,
  REGISTER_LIMIT,
  FORGOT_LIMIT,
} = process.env;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('Falta JWT_SECRET en .env (mínimo 32 caracteres).');
  process.exit(1);
}

// Número positivo desde .env, o el valor por defecto
const num = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
};

const ROOT_EMAIL = (ROOT_EMAIL_ENV || 'cazoncontreras.iara@tecnica7.edu.ar').toLowerCase();

// 10 rondas: sigue siendo seguro y es ~4 veces más rápido que 12.
// (bcryptjs es JavaScript puro y bloquea el servidor mientras calcula.)
const BCRYPT_ROUNDS = 10;
const RESET_TTL_MS = 15 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pool de conexiones más grande y con cola, para que los picos de
// usuarios simultáneos esperen su turno en vez de fallar.
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,

  connectionLimit: num(DB_POOL, 30),
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
});

// ============================================================
// HELPERS
// ============================================================
const now = () => new Date().toISOString();
const q = async (sql, params = []) => (await pool.query(sql, params))[0];
const one = async (sql, params = []) => (await q(sql, params))[0] || null;

const safeUser = (u) => {
  if (!u) return null;
  const { password, resetHash, resetExpires, ...rest } = u;
  return rest;
};

// Recorta texto al largo de la columna
const s = (v, max) => String(v ?? '').trim().slice(0, max);
const normEmail = (v) => String(v ?? '').trim().toLowerCase();

const safeJson = (text, fallback) => {
  try {
    return text ? JSON.parse(text) : fallback;
  } catch {
    return fallback;
  }
};

const DUMMY_HASH = bcrypt.hashSync('dummy-password', BCRYPT_ROUNDS);

// ------------------------------------------------------------
// Caché corta del usuario autenticado (id, rol, estado).
// Evita una consulta a MySQL en CADA pedido. Dura pocos segundos
// y se borra al suspender / reactivar / eliminar una cuenta.
// ------------------------------------------------------------
const AUTH_CACHE_MS = 15 * 1000;
const AUTH_CACHE_MAX = 5000;
const authCache = new Map();

const getAuthUser = async (id) => {
  const key = String(id);
  const t = Date.now();
  const hit = authCache.get(key);

  if (hit && hit.exp > t) return hit.u;

  const u = await one('SELECT id, role, status FROM users WHERE id=?', [id]);

  if (u) {
    if (authCache.size >= AUTH_CACHE_MAX) authCache.clear();
    authCache.set(key, { u, exp: t + AUTH_CACHE_MS });
  } else {
    authCache.delete(key);
  }

  return u;
};

const invalidateAuth = (id) => authCache.delete(String(id));

// ------------------------------------------------------------
// Maletas: estado y "activa" SIEMPRE por fechas (YYYY-MM-DD).
// Activa = todavía no terminó (Planificada o En curso).
// ------------------------------------------------------------
const pad2 = (n) => String(n).padStart(2, '0');
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const suitcaseStatus = (inicio, fin, fallback = 'Planificada') => {
  const a = String(inicio || '').slice(0, 10);
  const b = String(fin || '').slice(0, 10);
  if (!DATE_RE.test(a) || !DATE_RE.test(b)) return fallback;
  const t = todayStr();
  if (t < a) return 'Planificada';
  if (t > b) return 'Finalizada';
  return 'En curso';
};

// Condición SQL de "maleta activa" (parámetro: todayStr())
const ACTIVE_SUITCASE_SQL = "(fechaFin IS NULL OR fechaFin='' OR fechaFin>=?)";

// ------------------------------------------------------------
// Referencias a una prenda dentro de outfits y maletas
// ------------------------------------------------------------
const sameId = (a, b) => a != null && String(a) === String(b);

const stripClothingFromOutfitItems = (items, clothingId) => {
  const out =
    items && typeof items === 'object' && !Array.isArray(items) ? { ...items } : {};
  let changed = false;

  for (const key of ['superior', 'inferior', 'calzado']) {
    if (sameId(out[key], clothingId)) {
      out[key] = null;
      changed = true;
    }
  }

  if (Array.isArray(out.accesorios)) {
    const filtered = out.accesorios.filter((id) => !sameId(id, clothingId));
    if (filtered.length !== out.accesorios.length) {
      out.accesorios = filtered;
      changed = true;
    }
  }

  return { items: out, changed };
};

// exec(sql, params) -> filas (sirve tanto con el pool como con una transacción)
const findClothingReferences = async (exec, clothing) => {
  const outfits = [];
  const suitcases = [];

  for (const row of await exec('SELECT id,name,items FROM outfits WHERE userId=?', [clothing.userId])) {
    const { items, changed } = stripClothingFromOutfitItems(safeJson(row.items, {}), clothing.id);
    if (changed) outfits.push({ id: row.id, name: row.name, items });
  }

  for (const row of await exec('SELECT id,destino,items FROM suitcases WHERE userId=?', [clothing.userId])) {
    const parsed = safeJson(row.items, []);
    const list = Array.isArray(parsed) ? parsed : [];
    const filtered = list.filter((i) => !sameId(i?.clothingId, clothing.id));
    if (filtered.length !== list.length) suitcases.push({ id: row.id, destino: row.destino, items: filtered });
  }

  return { outfits, suitcases };
};

const signToken = (user, mustChange = false) =>
  jwt.sign({ id: user.id, role: user.role, mc: mustChange }, JWT_SECRET, {
    expiresIn: mustChange ? '30m' : '12h',
  });

async function addColumn(table, definition) {
  try {
    await q(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  } catch (e) {
    if (e.errno !== 1060) throw e; // 1060 = la columna ya existe
  }
}

async function sendResetEmail(to, code) {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY || !EMAILJS_PRIVATE_KEY) {
    console.warn('EmailJS no está configurado: no se envió el mail de recuperación.');
    return;
  }
  const r = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY,
      template_params: { to_email: to, email: to, temp_password: code },
    }),
  });
  if (!r.ok) throw new Error(`EmailJS ${r.status}: ${await r.text()}`);
}

async function logAdmin(userId, type, user, status = 'resolved') {
  try {
    const full = `${user?.name || ''} ${user?.lastname || ''}`.trim();
    const details = user?.email ? `${full || 'Sin nombre'} (${user.email})` : full;
    await q(
      'INSERT INTO adminRequests (userId,type,date,status,details) VALUES (?,?,?,?,?)',
      [userId, type, now(), status, details]
    );
  } catch (e) {
    console.log('logAdmin:', e.message);
  }
}

// ============================================================
// ESQUEMA
// ============================================================
async function init() {
  await q(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), lastname VARCHAR(100),
    email VARCHAR(190) UNIQUE, password VARCHAR(255), role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active', createdAt VARCHAR(40), lastAccess VARCHAR(40))`);
  await q(`CREATE TABLE IF NOT EXISTS clothes (
    id INT AUTO_INCREMENT PRIMARY KEY, userId INT, title VARCHAR(200), category VARCHAR(100),
    imageUri LONGTEXT, color VARCHAR(50), season VARCHAR(50), ocasion VARCHAR(50),
    description TEXT, createdAt VARCHAR(40), INDEX(userId))`);
  await q(`CREATE TABLE IF NOT EXISTS outfits (
    id INT AUTO_INCREMENT PRIMARY KEY, userId INT, name VARCHAR(200),
    description TEXT, items TEXT, createdAt VARCHAR(40), INDEX(userId))`);
  await q(`CREATE TABLE IF NOT EXISTS history (
    id INT AUTO_INCREMENT PRIMARY KEY, userId INT, outfitId INT, outfitName VARCHAR(200),
    imageUri LONGTEXT, note TEXT, date VARCHAR(40), INDEX(userId))`);
  await q(`CREATE TABLE IF NOT EXISTS suitcases (
    id INT AUTO_INCREMENT PRIMARY KEY, userId INT, destino VARCHAR(200), fechaInicio VARCHAR(20),
    fechaFin VARCHAR(20), estado VARCHAR(30), items LONGTEXT, active TINYINT DEFAULT 1,
    createdAt VARCHAR(40), INDEX(userId))`);
  await q(`CREATE TABLE IF NOT EXISTS adminRequests (
    id INT AUTO_INCREMENT PRIMARY KEY, userId INT, type VARCHAR(100),
    date VARCHAR(40), status VARCHAR(20), details TEXT)`);

  // Columnas para el código de recuperación (no pisa la contraseña real)
  await addColumn('users', 'resetHash VARCHAR(100) NULL');
  await addColumn('users', 'resetExpires BIGINT NULL');

  // Migración: hashear contraseñas que seguían en texto plano
  const legacy = await q(
    "SELECT id, password FROM users WHERE password IS NOT NULL AND password NOT LIKE '$2%'"
  );
  for (const u of legacy) {
    await q('UPDATE users SET password=? WHERE id=?', [
      await bcrypt.hash(u.password, BCRYPT_ROUNDS),
      u.id,
    ]);
  }
  if (legacy.length) console.log(`Contraseñas migradas a bcrypt: ${legacy.length}`);

  // Cuenta Root
  const root = await one('SELECT * FROM users WHERE email=?', [ROOT_EMAIL]);
  if (!root) {
    if (!ROOT_PASSWORD) throw new Error('Falta ROOT_PASSWORD en .env para crear la cuenta Root.');
    await q(
      `INSERT INTO users (name,lastname,email,password,role,status,createdAt)
       VALUES ('Iara','Cazón',?,?,'root','active',?)`,
      [ROOT_EMAIL, await bcrypt.hash(ROOT_PASSWORD, BCRYPT_ROUNDS), now()]
    );
  } else if (RESET_ROOT_PASSWORD === 'true') {
    if (!ROOT_PASSWORD) throw new Error('RESET_ROOT_PASSWORD requiere ROOT_PASSWORD.');
    await q(
      `UPDATE users SET role='root', status='active', password=?, resetHash=NULL, resetExpires=NULL WHERE id=?`,
      [await bcrypt.hash(ROOT_PASSWORD, BCRYPT_ROUNDS), root.id]
    );
    console.log('Contraseña Root actualizada. Quitá RESET_ROOT_PASSWORD del .env.');
  } else {
    await q(`UPDATE users SET role='root', status='active' WHERE id=?`, [root.id]);
  }
  await q(`UPDATE users SET role='user' WHERE role='root' AND email<>?`, [ROOT_EMAIL]);
}

// ============================================================
// MIDDLEWARES
// ============================================================
const auth = async (req, res, next) => {
  if (req.user) return next();
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const payload = jwt.verify(token, JWT_SECRET);
    const u = await getAuthUser(payload.id);
    if (!u || (u.status || 'active') !== 'active') {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }
    req.user = { id: u.id, role: u.role, mc: !!payload.mc };
    next();
  } catch {
    res.status(401).json({ error: 'UNAUTHORIZED' });
  }
};

const adminOnly = (req, res, next) =>
  req.user.role === 'root' ? next() : res.status(403).json({ error: 'FORBIDDEN' });

const ownerOrAdmin = (getId) => (req, res, next) =>
  req.user.role === 'root' || String(req.user.id) === String(getId(req))
    ? next()
    : res.status(403).json({ error: 'FORBIDDEN' });

// Carga una fila y verifica que pertenezca al usuario (o sea Root)
const loadOwned = async (table, req, res) => {
  const row = await one(`SELECT * FROM ${table} WHERE id=?`, [req.params.id]);
  if (!row) {
    res.status(404).json({ error: 'NOT_FOUND' });
    return null;
  }
  if (req.user.role !== 'root' && String(row.userId) !== String(req.user.id)) {
    res.status(403).json({ error: 'FORBIDDEN' });
    return null;
  }
  return row;
};

const h = (fn) => (req, res) =>
  fn(req, res).catch((e) => {
    if (e?.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'EMAIL_EXISTS' });
    console.error(e);
    res.status(500).json({ error: 'SERVER_ERROR' });
  });

// ============================================================
// APP
// ============================================================
const app = express();

app.use(helmet());

const allowedOrigins = (WEB_ORIGIN || 'http://localhost:8081,http://localhost:19006')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  })
);

// Límite general por IP. Antes eran 300 pedidos/min: una prueba de carga
// (que sale de una sola IP) lo superaba en segundos. Se puede ajustar con
// RATE_LIMIT en el .env.
app.use(rateLimit({ windowMs: 60 * 1000, limit: num(RATE_LIMIT, 6000) }));

// Login y registro tienen cupos separados.
// Login solo cuenta los intentos FALLIDOS (skipSuccessfulRequests),
// así que el uso normal no se bloquea.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: num(LOGIN_LIMIT, 100),
  skipSuccessfulRequests: true,
  message: { error: 'TOO_MANY_REQUESTS' },
});
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: num(REGISTER_LIMIT, 500),
  message: { error: 'TOO_MANY_REQUESTS' },
});
// Recuperación de contraseña: se mantiene estricto (dispara mails).
const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: num(FORGOT_LIMIT, 5),
  message: { error: 'TOO_MANY_REQUESTS' },
});

// Límite de body: 100 kb por defecto, 15 MB solo donde viajan imágenes.
// En esas rutas se exige token ANTES de leer el body.
const smallJson = express.json({ limit: '100kb' });
const bigJson = express.json({ limit: '15mb' });
const BIG_BODY_PATHS = /^\/(clothes|history)(\/|$)/;

app.use((req, res, next) => {
  if (BIG_BODY_PATHS.test(req.path)) {
    return auth(req, res, (err) => (err ? next(err) : bigJson(req, res, next)));
  }
  return smallJson(req, res, next);
});

app.get('/health', (req, res) => res.json({ ok: true }));

// ============================================================
// AUTH
// ============================================================
app.post('/auth/register', registerLimiter, h(async (req, res) => {
  const { name, lastname, email, password } = req.body ?? {};
  const clean = normEmail(email);
  const n = s(name, 100);
  const l = s(lastname, 100);

  if (!n || !l) return res.status(400).json({ error: 'REQUIRED_FIELDS' });
  if (!EMAIL_RE.test(clean) || clean.length > 190) return res.status(400).json({ error: 'INVALID_EMAIL' });
  if (typeof password !== 'string' || password.length < 6 || password.length > 100)
    return res.status(400).json({ error: 'INVALID_PASSWORD' });
  if (clean === ROOT_EMAIL) return res.status(400).json({ error: 'ROOT_EMAIL_RESERVED' });

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const r = await q(
    `INSERT INTO users (name,lastname,email,password,role,status,createdAt)
     VALUES (?,?,?,?,'user','active',?)`,
    [n, l, clean, hash, now()]
  ); // si el mail ya existe, ER_DUP_ENTRY -> 409 (lo maneja h)

  const user = await one('SELECT * FROM users WHERE id=?', [r.insertId]);
  await logAdmin(user.id, 'Registro de usuario', user);
  res.json({ ...safeUser(user), token: signToken(user) });
}));

app.post('/auth/login', loginLimiter, h(async (req, res) => {
  const email = normEmail(req.body?.email);
  const password = String(req.body?.password ?? '');

  // email=? usa el índice UNIQUE (LOWER(email) obligaba a leer toda la tabla).
  // Los mails se guardan siempre en minúscula.
  const u = email ? await one('SELECT * FROM users WHERE email=?', [email]) : null;

  // Siempre se hace un bcrypt.compare para no revelar si el mail existe por tiempo de respuesta
  let ok = await bcrypt.compare(password, u?.password || DUMMY_HASH);
  let usedResetCode = false;

  if (!ok && u?.resetHash && Number(u.resetExpires) > Date.now()) {
    ok = await bcrypt.compare(password, u.resetHash);
    usedResetCode = ok;
  }

  if (!u || !ok) return res.status(401).json({ error: 'USER_NOT_FOUND' });
  if ((u.status || 'active') !== 'active') return res.status(403).json({ error: 'USER_INACTIVE' });

  const t = now();
  if (usedResetCode) {
    // el código es de un solo uso
    await q('UPDATE users SET lastAccess=?, resetHash=NULL, resetExpires=NULL WHERE id=?', [t, u.id]);
  } else {
    await q('UPDATE users SET lastAccess=? WHERE id=?', [t, u.id]);
  }

  res.json({
    ...safeUser({ ...u, lastAccess: t }),
    mustChangePassword: usedResetCode,
    token: signToken(u, usedResetCode),
  });

  // Cuentas viejas guardadas con 12 rondas: se re-hashean a 10 una sola vez,
  // después de responder, para que los próximos logins sean más rápidos.
  if (!usedResetCode && u.password) {
    let rounds = 0;
    try {
      rounds = bcrypt.getRounds(u.password);
    } catch {
      rounds = 0;
    }
    if (rounds > BCRYPT_ROUNDS) {
      bcrypt
        .hash(password, BCRYPT_ROUNDS)
        .then((newHash) => q('UPDATE users SET password=? WHERE id=?', [newHash, u.id]))
        .catch((e) => console.log('Re-hash:', e.message));
    }
  }
}));

// Recuperación: el servidor genera el código y lo manda por mail.
// La respuesta es siempre la misma exista o no la cuenta.
app.post('/auth/forgot-password', forgotLimiter, h(async (req, res) => {
  const email = normEmail(req.body?.email);

  if (EMAIL_RE.test(email)) {
    const u = await one('SELECT * FROM users WHERE email=?', [email]);
    if (u && u.role !== 'root' && (u.status || 'active') === 'active') {
      const code = `Vestuario-${crypto.randomInt(10000000, 100000000)}`;
      await q('UPDATE users SET resetHash=?, resetExpires=? WHERE id=?', [
        await bcrypt.hash(code, 10),
        Date.now() + RESET_TTL_MS,
        u.id,
      ]);
      sendResetEmail(email, code).catch((e) => console.error('Mail de recuperación:', e.message));
      await logAdmin(u.id, 'Restablecer contraseña', u);
    }
  }
  res.json({ success: true });
}));

// Cambio de contraseña del usuario autenticado
app.put('/auth/password', auth, h(async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};

  if (typeof newPassword !== 'string' || newPassword.length < 6 || newPassword.length > 100)
    return res.status(400).json({ error: 'INVALID_PASSWORD' });

  const u = await one('SELECT * FROM users WHERE id=?', [req.user.id]);
  if (!u) return res.status(404).json({ error: 'USER_NOT_FOUND' });

  // Si entró con un código de recuperación (mc), no pide la clave actual
  if (!req.user.mc) {
    const ok = await bcrypt.compare(String(currentPassword ?? ''), u.password || DUMMY_HASH);
    if (!ok) return res.status(403).json({ error: 'INVALID_CURRENT_PASSWORD' });
  }

  await q('UPDATE users SET password=?, resetHash=NULL, resetExpires=NULL WHERE id=?', [
    await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
    u.id,
  ]);
  res.json({ success: true, token: signToken(u, false) });
}));

// ============================================================
// USUARIOS
// ============================================================
app.get('/users', auth, adminOnly, h(async (req, res) =>
  res.json((await q('SELECT * FROM users ORDER BY id DESC')).map(safeUser))));

app.get('/users/:id', auth, ownerOrAdmin((r) => r.params.id), h(async (req, res) =>
  res.json(safeUser(await one('SELECT * FROM users WHERE id=?', [req.params.id])))));

app.put('/users/:id/profile', auth, ownerOrAdmin((r) => r.params.id), h(async (req, res) => {
  const cur = await one('SELECT * FROM users WHERE id=?', [req.params.id]);
  if (!cur) return res.json({ success: false, error: 'USER_NOT_FOUND', message: 'USER_NOT_FOUND' });
  if (cur.role === 'root')
    return res.json({ success: false, error: 'ROOT_PROTECTED', message: 'ROOT_PROTECTED' });

  const { name, lastname, email } = req.body ?? {};
  const clean = email ? normEmail(email) : (cur.email || '').toLowerCase();

  if (!EMAIL_RE.test(clean) || clean.length > 190)
    return res.json({ success: false, error: 'INVALID_EMAIL', message: 'INVALID_EMAIL' });

  const changed = clean !== (cur.email || '').toLowerCase();
  if (changed) {
    if (clean === ROOT_EMAIL)
      return res.json({ success: false, error: 'ROOT_EMAIL_RESERVED', message: 'ROOT_EMAIL_RESERVED' });
    if (await one('SELECT id FROM users WHERE email=? AND id<>?', [clean, cur.id]))
      return res.json({ success: false, error: 'EMAIL_EXISTS', message: 'EMAIL_EXISTS' });
  }

  await q('UPDATE users SET name=?, lastname=?, email=? WHERE id=?', [
    name != null ? s(name, 100) || cur.name : cur.name,
    lastname != null ? s(lastname, 100) || cur.lastname : cur.lastname,
    clean,
    cur.id,
  ]);
  const updated = await one('SELECT * FROM users WHERE id=?', [cur.id]);
  await logAdmin(cur.id, changed ? 'Cambio de email' : 'Edición de datos', updated);
  res.json({ success: true, user: safeUser(updated) });
}));

app.put('/users/:id/status', auth, adminOnly, h(async (req, res) => {
  const { status } = req.body ?? {};
  if (!['active', 'suspended'].includes(status)) return res.status(400).json({ error: 'INVALID_STATUS' });
  const u = await one('SELECT * FROM users WHERE id=?', [req.params.id]);
  if (!u) return res.status(404).json({ error: 'USER_NOT_FOUND' });
  if (u.role === 'root') return res.status(403).json({ error: 'ROOT_PROTECTED' });
  await q('UPDATE users SET status=? WHERE id=?', [status, u.id]);
  invalidateAuth(u.id); // la suspensión se aplica de inmediato
  await logAdmin(u.id, status === 'suspended' ? 'Cuenta suspendida' : 'Cuenta reactivada', u);
  res.json(safeUser(await one('SELECT * FROM users WHERE id=?', [u.id])));
}));

app.delete('/users/:id', auth, adminOnly, h(async (req, res) => {
  const u = await one('SELECT * FROM users WHERE id=?', [req.params.id]);
  if (!u) return res.status(404).json({ error: 'USER_NOT_FOUND' });
  if (u.role === 'root') return res.status(403).json({ error: 'ROOT_PROTECTED' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const t of ['clothes', 'outfits', 'history', 'suitcases'])
      await conn.query(`DELETE FROM ${t} WHERE userId=?`, [u.id]);
    await conn.query('DELETE FROM users WHERE id=?', [u.id]);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  invalidateAuth(u.id);
  await logAdmin(u.id, 'Eliminación de cuenta', u);
  res.json({ success: true });
}));

// ============================================================
// PRENDAS
// (ORDER BY id DESC en vez de createdAt: mismo orden, pero evita
// ordenar filas con fotos pesadas y es mucho más rápido)
// ============================================================
const clothesFields = (c) => ({
  title: s(c.title, 200),
  category: s(c.category, 100),
  color: s(c.color, 50),
  season: s(c.season, 50),
  ocasion: s(c.ocasion, 50),
  description: s(c.description, 1000),
  imageUri: typeof c.imageUri === 'string' ? c.imageUri : '',
});

app.get('/clothes', auth, ownerOrAdmin((r) => r.query.userId), h(async (req, res) =>
  res.json(await q('SELECT * FROM clothes WHERE userId=? ORDER BY id DESC', [req.query.userId]))));

app.get('/clothes/:id', auth, h(async (req, res) => {
  const row = await loadOwned('clothes', req, res);
  if (row) res.json(row);
}));

app.post('/clothes', auth, h(async (req, res) => {
  const c = clothesFields(req.body ?? {});
  if (!c.title || !c.category) return res.status(400).json({ error: 'REQUIRED_FIELDS' });
  const r = await q(
    `INSERT INTO clothes (userId,title,category,color,season,ocasion,description,imageUri,createdAt)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [req.user.id, c.title, c.category, c.color, c.season, c.ocasion, c.description, c.imageUri, now()]
  );
  res.json({ success: true, item: await one('SELECT * FROM clothes WHERE id=?', [r.insertId]) });
}));

app.put('/clothes/:id', auth, h(async (req, res) => {
  const cur = await loadOwned('clothes', req, res);
  if (!cur) return;
  const c = clothesFields({ ...cur, ...(req.body ?? {}) });
  if (!c.title || !c.category) return res.status(400).json({ error: 'REQUIRED_FIELDS' });
  await q(
    `UPDATE clothes SET title=?,category=?,color=?,season=?,ocasion=?,description=?,imageUri=? WHERE id=?`,
    [c.title, c.category, c.color, c.season, c.ocasion, c.description, c.imageUri, cur.id]
  );
  res.json({ success: true, item: await one('SELECT * FROM clothes WHERE id=?', [cur.id]) });
}));

// Cuántos outfits y maletas usan la prenda (para avisar antes de borrar)
app.get('/clothes/:id/usage', auth, h(async (req, res) => {
  const cur = await loadOwned('clothes', req, res);
  if (!cur) return;
  const { outfits, suitcases } = await findClothingReferences(q, cur);
  res.json({
    outfitCount: outfits.length,
    suitcaseCount: suitcases.length,
    outfitNames: outfits.map((o) => o.name).filter(Boolean),
  });
}));

// Borra la prenda y la quita de los outfits y maletas que la usan (transacción)
app.delete('/clothes/:id', auth, h(async (req, res) => {
  const cur = await loadOwned('clothes', req, res);
  if (!cur) return;

  const conn = await pool.getConnection();
  const exec = async (sql, params = []) => (await conn.query(sql, params))[0];
  let refs;

  try {
    await conn.beginTransaction();
    refs = await findClothingReferences(exec, cur);

    for (const o of refs.outfits)
      await conn.query('UPDATE outfits SET items=? WHERE id=?', [JSON.stringify(o.items), o.id]);
    for (const sc of refs.suitcases)
      await conn.query('UPDATE suitcases SET items=? WHERE id=?', [JSON.stringify(sc.items), sc.id]);

    await conn.query('DELETE FROM clothes WHERE id=?', [cur.id]);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  res.json({
    success: true,
    affectedOutfits: refs.outfits.length,
    affectedSuitcases: refs.suitcases.length,
  });
}));

// ============================================================
// OUTFITS
// ============================================================
const parseOutfit = (r) => r && { ...r, items: safeJson(r.items, {}) };
const cleanItems = (items) =>
  items && typeof items === 'object' && !Array.isArray(items) ? items : {};

app.get('/outfits', auth, ownerOrAdmin((r) => r.query.userId), h(async (req, res) =>
  res.json((await q('SELECT * FROM outfits WHERE userId=? ORDER BY id DESC', [req.query.userId])).map(parseOutfit))));

app.get('/outfits/:id', auth, h(async (req, res) => {
  const row = await loadOwned('outfits', req, res);
  if (row) res.json(parseOutfit(row));
}));

app.post('/outfits', auth, h(async (req, res) => {
  const { name, description, items } = req.body ?? {};
  if (!s(name, 200)) return res.status(400).json({ error: 'REQUIRED_FIELDS' });
  const r = await q(
    'INSERT INTO outfits (userId,name,description,items,createdAt) VALUES (?,?,?,?,?)',
    [req.user.id, s(name, 200), s(description, 1000), JSON.stringify(cleanItems(items)), now()]
  );
  res.json({ success: true, outfit: parseOutfit(await one('SELECT * FROM outfits WHERE id=?', [r.insertId])) });
}));

app.put('/outfits/:id', auth, h(async (req, res) => {
  const cur = await loadOwned('outfits', req, res);
  if (!cur) return;
  const body = req.body ?? {};
  await q('UPDATE outfits SET name=?,description=?,items=? WHERE id=?', [
    s(body.name ?? cur.name, 200),
    s(body.description ?? cur.description, 1000),
    JSON.stringify(cleanItems(body.items ?? safeJson(cur.items, {}))),
    cur.id,
  ]);
  res.json({ success: true, outfit: parseOutfit(await one('SELECT * FROM outfits WHERE id=?', [cur.id])) });
}));

app.delete('/outfits/:id', auth, h(async (req, res) => {
  const cur = await loadOwned('outfits', req, res);
  if (!cur) return;
  await q('DELETE FROM outfits WHERE id=?', [cur.id]);
  res.json({ success: true });
}));

// ============================================================
// HISTORIAL
// ============================================================
app.get('/history', auth, ownerOrAdmin((r) => r.query.userId), h(async (req, res) =>
  res.json(await q('SELECT * FROM history WHERE userId=? ORDER BY id DESC', [req.query.userId]))));

app.post('/history', auth, h(async (req, res) => {
  const x = req.body ?? {};

  // null / undefined / '' => null (antes Number(null) daba 0)
  let outfitId = null;
  if (x.outfitId !== null && x.outfitId !== undefined && x.outfitId !== '') {
    const n = Number(x.outfitId);
    if (!Number.isInteger(n) || n <= 0) return res.status(400).json({ error: 'INVALID_OUTFIT_ID' });
    const outfit = await one('SELECT userId FROM outfits WHERE id=?', [n]);
    if (!outfit || String(outfit.userId) !== String(req.user.id))
      return res.status(400).json({ error: 'INVALID_OUTFIT_ID' });
    outfitId = n;
  }
  const r = await q(
    'INSERT INTO history (userId,outfitId,outfitName,imageUri,note,date) VALUES (?,?,?,?,?,?)',
    [
      req.user.id,
      outfitId,
      s(x.outfitName, 200),
      typeof x.imageUri === 'string' ? x.imageUri : '',
      s(x.note, 1000),
      now(),
    ]
  );
  res.json({ success: true, entry: await one('SELECT * FROM history WHERE id=?', [r.insertId]) });
}));

// ============================================================
// MALETAS
// ============================================================
// estado y active se recalculan SIEMPRE por fechas al leer
const parseSuitcase = (r) => {
  if (!r) return r;
  const estado = suitcaseStatus(r.fechaInicio, r.fechaFin, r.estado || 'Planificada');
  return { ...r, items: safeJson(r.items, []), estado, active: estado !== 'Finalizada' };
};

app.get('/suitcases', auth, ownerOrAdmin((r) => r.query.userId), h(async (req, res) =>
  res.json((await q('SELECT * FROM suitcases WHERE userId=? ORDER BY id DESC', [req.query.userId])).map(parseSuitcase))));

app.get('/suitcases/:id', auth, h(async (req, res) => {
  const row = await loadOwned('suitcases', req, res);
  if (row) res.json(parseSuitcase(row));
}));

app.post('/suitcases', auth, h(async (req, res) => {
  const b = req.body ?? {};
  if (!s(b.destino, 200)) return res.status(400).json({ error: 'REQUIRED_FIELDS' });

  const start = s(b.fechaInicio, 20);
  const end = s(b.fechaFin, 20);
  if ((start && !DATE_RE.test(start)) || (end && !DATE_RE.test(end)))
    return res.status(400).json({ error: 'INVALID_DATE' });

  const estado = suitcaseStatus(start, end, s(b.estado || 'Planificada', 30));
  const r = await q(
    `INSERT INTO suitcases (userId,destino,fechaInicio,fechaFin,estado,items,active,createdAt)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      req.user.id,
      s(b.destino, 200),
      start,
      end,
      estado,
      JSON.stringify(Array.isArray(b.items) ? b.items : []),
      estado !== 'Finalizada' ? 1 : 0,
      now(),
    ]
  );
  res.json({ success: true, suitcase: parseSuitcase(await one('SELECT * FROM suitcases WHERE id=?', [r.insertId])) });
}));

app.put('/suitcases/:id', auth, h(async (req, res) => {
  const cur = await loadOwned('suitcases', req, res);
  if (!cur) return;
  const b = req.body ?? {};
  const curItems = safeJson(cur.items, []);

  const start = s(b.fechaInicio ?? cur.fechaInicio, 20);
  const end = s(b.fechaFin ?? cur.fechaFin, 20);
  if ((start && !DATE_RE.test(start)) || (end && !DATE_RE.test(end)))
    return res.status(400).json({ error: 'INVALID_DATE' });

  // estado y active se derivan de las fechas (se ignora el "active" del cliente)
  const estado = suitcaseStatus(start, end, s(b.estado ?? cur.estado, 30) || 'Planificada');

  await q(
    'UPDATE suitcases SET destino=?,fechaInicio=?,fechaFin=?,estado=?,items=?,active=? WHERE id=?',
    [
      s(b.destino ?? cur.destino, 200),
      start,
      end,
      estado,
      JSON.stringify(Array.isArray(b.items) ? b.items : curItems),
      estado !== 'Finalizada' ? 1 : 0,
      cur.id,
    ]
  );
  res.json({ success: true, suitcase: parseSuitcase(await one('SELECT * FROM suitcases WHERE id=?', [cur.id])) });
}));

app.delete('/suitcases/:id', auth, h(async (req, res) => {
  const cur = await loadOwned('suitcases', req, res);
  if (!cur) return;
  await q('DELETE FROM suitcases WHERE id=?', [cur.id]);
  res.json({ success: true });
}));

// ============================================================
// RESÚMENES
// ============================================================
const weekAgo = () => new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
const total = async (sql, p = []) => (await one(sql, p)).total;

// Las 4 cuentas del resumen se ejecutan en paralelo (antes eran una tras otra)
app.get('/summary/:userId', auth, ownerOrAdmin((r) => r.params.userId), h(async (req, res) => {
  const id = req.params.userId;
  const [clothesCount, outfitsCount, usedThisWeekCount, activeSuitcasesCount] = await Promise.all([
    total('SELECT COUNT(*) total FROM clothes WHERE userId=?', [id]),
    total('SELECT COUNT(*) total FROM outfits WHERE userId=?', [id]),
    total('SELECT COUNT(*) total FROM history WHERE userId=? AND date>=?', [id, weekAgo()]),
    total(`SELECT COUNT(*) total FROM suitcases WHERE userId=? AND ${ACTIVE_SUITCASE_SQL}`, [id, todayStr()]),
  ]);
  res.json({ clothesCount, outfitsCount, usedThisWeekCount, activeSuitcasesCount });
}));

app.get('/admin/summary', auth, adminOnly, h(async (req, res) => {
  const [usersCount, clothesCount, outfitsCount, usedThisWeekCount, activeSuitcasesCount] = await Promise.all([
    total('SELECT COUNT(*) total FROM users'),
    total('SELECT COUNT(*) total FROM clothes'),
    total('SELECT COUNT(*) total FROM outfits'),
    total('SELECT COUNT(*) total FROM history WHERE date>=?', [weekAgo()]),
    total(`SELECT COUNT(*) total FROM suitcases WHERE ${ACTIVE_SUITCASE_SQL}`, [todayStr()]),
  ]);
  res.json({ usersCount, clothesCount, outfitsCount, usedThisWeekCount, activeSuitcasesCount });
}));

app.get('/admin/requests', auth, adminOnly, h(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 500);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  const rows = await q(
    `SELECT r.*, u.name ownerName, u.lastname ownerLastname, u.email userEmail
     FROM adminRequests r LEFT JOIN users u ON u.id=r.userId
     ORDER BY r.id DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  res.json(rows.map(({ ownerName, ownerLastname, ...r }) => ({
    ...r,
    userName: `${ownerName || ''} ${ownerLastname || ''}`.trim(),
    userEmail: r.userEmail || '',
  })));
}));

app.post('/admin/requests', auth, adminOnly, h(async (req, res) => {
  const { userId, type, status = 'pending', details = '' } = req.body ?? {};
  if (!['pending', 'resolved'].includes(status)) return res.status(400).json({ error: 'INVALID_STATUS' });
  const r = await q(
    'INSERT INTO adminRequests (userId,type,date,status,details) VALUES (?,?,?,?,?)',
    [userId, s(type, 100), now(), status, s(details, 2000)]
  );
  res.json(await one('SELECT * FROM adminRequests WHERE id=?', [r.insertId]));
}));

app.put('/admin/requests/:id', auth, adminOnly, h(async (req, res) => {
  const { status } = req.body ?? {};
  if (!['pending', 'resolved'].includes(status)) return res.status(400).json({ error: 'INVALID_STATUS' });
  await q('UPDATE adminRequests SET status=? WHERE id=?', [status, req.params.id]);
  res.json(await one('SELECT * FROM adminRequests WHERE id=?', [req.params.id]));
}));

// ============================================================
// ERRORES GLOBALES (JSON inválido, body muy grande, etc.)
// ============================================================
app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'PAYLOAD_TOO_LARGE' });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'INVALID_JSON' });
  console.error(err);
  res.status(500).json({ error: 'SERVER_ERROR' });
});

// ============================================================
// ARRANQUE
// ============================================================
init()
  .then(() => {
    const server = app.listen(PORT, () => console.log(`API lista en http://localhost:${PORT}`));

    // Más margen para muchas conexiones simultáneas
    server.keepAliveTimeout = 65 * 1000;
    server.headersTimeout = 66 * 1000;

    const shutdown = () => server.close(() => pool.end().then(() => process.exit(0)));
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  })
  .catch((e) => {
    console.error('No se pudo iniciar el servidor:', e.message);
    process.exit(1);
  });
