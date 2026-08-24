import * as SQLite from 'expo-sqlite';

// Abre o crea la base de datos local en el dispositivo del usuario
const db = SQLite.openDatabaseSync('vestuario_digital.db');

export const initDatabase = () => {
  try {
    // 1. Activar soporte de Claves Foráneas en SQLite
    db.execSync('PRAGMA foreign_keys = ON;');

    // 2. Crear las 7 tablas según el Diccionario de Datos de la Etapa 13
    db.execSync(`
      -- Tabla 1: USUARIO
      CREATE TABLE IF NOT EXISTS usuario (
        id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        contraseña TEXT NOT NULL,
        rol TEXT CHECK(rol IN ('USUARIO', 'ADMIN')) DEFAULT 'USUARIO',
        estado TEXT CHECK(estado IN ('ACTIVO', 'SUSPENDIDO')) DEFAULT 'ACTIVO',
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla 2: PRENDA
      CREATE TABLE IF NOT EXISTS prenda (
        id_prenda INTEGER PRIMARY KEY AUTOINCREMENT,
        id_usuario INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        categoria TEXT NOT NULL,
        color TEXT,
        temporada TEXT CHECK(temporada IN ('VERANO', 'INVIERNO', 'ENTRETIEMPO', 'TODAS')),
        ocasion TEXT,
        descripcion TEXT,
        foto TEXT,
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
      );

      -- Tabla 3: OUTFIT
      CREATE TABLE IF NOT EXISTS outfit (
        id_outfit INTEGER PRIMARY KEY AUTOINCREMENT,
        id_usuario INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
      );

      -- Tabla 4: OUTFIT_PRENDA (Intermedia N:M)
      CREATE TABLE IF NOT EXISTS outfit_prenda (
        id_outfit_prenda INTEGER PRIMARY KEY AUTOINCREMENT,
        id_outfit INTEGER NOT NULL,
        id_prenda INTEGER NOT NULL,
        tipo TEXT CHECK(tipo IN ('SUPERIOR', 'INFERIOR', 'CALZADO', 'ACCESORIO')),
        orden INTEGER,
        FOREIGN KEY (id_outfit) REFERENCES outfit(id_outfit) ON DELETE CASCADE,
        FOREIGN KEY (id_prenda) REFERENCES prenda(id_prenda) ON DELETE CASCADE
      );

      -- Tabla 5: HISTORIAL_USO
      CREATE TABLE IF NOT EXISTS historial_uso (
        id_historial INTEGER PRIMARY KEY AUTOINCREMENT,
        id_usuario INTEGER NOT NULL,
        id_outfit INTEGER NOT NULL,
        fecha_uso TEXT DEFAULT CURRENT_TIMESTAMP,
        notas TEXT,
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY (id_outfit) REFERENCES outfit(id_outfit) ON DELETE CASCADE
      );

      -- Tabla 6: MALETA
      CREATE TABLE IF NOT EXISTS maleta (
        id_maleta INTEGER PRIMARY KEY AUTOINCREMENT,
        id_usuario INTEGER NOT NULL,
        destino TEXT NOT NULL,
        fecha_inicio TEXT,
        fecha_fin TEXT,
        estado TEXT CHECK(estado IN ('PLANIFICADA', 'EN CURSO', 'FINALIZADA', 'CANCELADA')) DEFAULT 'PLANIFICADA',
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
      );

      -- Tabla 7: MALETA_PRENDA (Intermedia N:M)
      CREATE TABLE IF NOT EXISTS maleta_prenda (
        id_maleta_prenda INTEGER PRIMARY KEY AUTOINCREMENT,
        id_maleta INTEGER NOT NULL,
        id_prenda INTEGER NOT NULL,
        empacada INTEGER DEFAULT 0, -- 0 = False, 1 = True
        orden INTEGER,
        notas TEXT,
        FOREIGN KEY (id_maleta) REFERENCES maleta(id_maleta) ON DELETE CASCADE,
        FOREIGN KEY (id_prenda) REFERENCES prenda(id_prenda) ON DELETE CASCADE
      );
    `);

    console.log('✅ Base de datos de Vestuario Digital inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
  }
};

export default db;