// services/passwordHash.js
//
// Hash de contraseñas para la base SQLite del celular (la versión web usa bcrypt en el servidor).
// Formato guardado:  pbkdf2$<iteraciones>$<sal en hex>$<hash en hex>
// - PBKDF2 con HMAC-SHA256 (node-forge, JavaScript puro: funciona en Expo Go y en la web).
// - Sal aleatoria distinta por contraseña.

import forge from 'node-forge';

const PREFIX = 'pbkdf2';
const ITERATIONS = 10000;
const KEY_BYTES = 32;
const SALT_BYTES = 16;

const derive = (password, saltBytes, iterations) =>
  forge.pkcs5.pbkdf2(String(password), saltBytes, iterations, KEY_BYTES, 'sha256');

export const isHashed = (stored) =>
  typeof stored === 'string' && stored.startsWith(`${PREFIX}$`);

export const hashPassword = (password) => {
  const salt = forge.random.getBytesSync(SALT_BYTES);
  const hash = derive(password, salt, ITERATIONS);
  return [PREFIX, ITERATIONS, forge.util.bytesToHex(salt), forge.util.bytesToHex(hash)].join('$');
};

// Compara en tiempo constante. Las contraseñas guardadas antes de este cambio
// (texto plano) se aceptan una sola vez y quien llama debe re-guardarlas con hashPassword.
export const verifyPassword = (password, stored) => {
  if (typeof stored !== 'string' || !stored) return false;

  if (!isHashed(stored)) {
    return String(password) === stored;
  }

  const [, iterations, saltHex, hashHex] = stored.split('$');
  const expected = forge.util.hexToBytes(hashHex || '');
  const actual = derive(password, forge.util.hexToBytes(saltHex || ''), Number(iterations) || ITERATIONS);

  if (expected.length !== actual.length) return false;

  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  }
  return diff === 0;
};
