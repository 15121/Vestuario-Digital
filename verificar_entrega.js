// Verificación de la entrega de Vestuario Digital.
// Uso:  node verificar_entrega.js [urlDelRepositorio] [rama] [--instalar]
// Clona la rama en una carpeta temporal VACÍA (como lo haría el docente), revisa que el
// proyecto esté completo y deja un informe con el commit exacto. No usa ni imprime claves.
const { execSync, spawnSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const INSTALAR = process.argv.includes('--instalar');
const URL = args[0] || 'https://github.com/15121/Vestuario-Digital.git';
const RAMA = args[1] || 'develop';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vd-verif-'));
const repo = path.join(tmp, 'Vestuario-Digital');
const out = [];
let fallos = 0;
const log = (m) => { console.log(m); out.push(m); };
const ok = (m) => log('  [OK]    ' + m);
const mal = (m) => { fallos++; log('  [FALLA] ' + m); };
const sh = (c, cwd) => execSync(c, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 512 * 1024 * 1024 }).trim();

log('Verificación de entrega · ' + new Date().toISOString());
log('Repositorio: ' + URL + '  Rama: ' + RAMA);
try { sh(`git clone --branch ${RAMA} ${URL} "${repo}"`, tmp); }
catch (e) { log('No se pudo clonar: ' + e.message.split('\n')[0]); process.exit(1); }

log('\nCommit verificado: ' + sh('git rev-parse HEAD', repo));
log('Fecha del commit:  ' + sh('git log -1 --format=%ci', repo));
log('Mensaje:           ' + sh('git log -1 --format=%s', repo));

const tracked = sh('git ls-files', repo).split('\n');
const has = (f) => tracked.includes(f);

log('\n1. Archivos que no deben estar versionados');
tracked.some(f => /(^|\/)\.env$/.test(f)) ? mal('hay un archivo .env versionado: ' + tracked.filter(f => /(^|\/)\.env$/.test(f)).join(', ')) : ok('no hay archivos .env versionados');
tracked.some(f => f.startsWith('node_modules/')) ? mal('node_modules está versionado') : ok('node_modules no está versionado');
tracked.some(f => f.startsWith('.expo/')) ? mal('.expo está versionado') : ok('.expo no está versionado');

log('\n2. Archivos de ejemplo y configuración');
['.env.example', 'vestuario-server/.env.example', 'package.json', 'vestuario-server/package.json', 'README.md', '.gitignore']
  .forEach(f => has(f) ? ok(f) : mal('falta ' + f));

log('\n3. Código fuente completo');
has('vestuario-server/server.js') ? ok('vestuario-server/server.js') : mal('falta vestuario-server/server.js');
const faltan = {};
for (const f of tracked.filter(f => f.endsWith('.js') && !f.startsWith('node_modules/') && !f.startsWith('.expo/') && !f.startsWith('vestuario-server/'))) {
  const src = fs.readFileSync(path.join(repo, f), 'utf8');
  for (const m of src.matchAll(/(?:from\s+|require\(\s*|import\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const p = path.posix.normalize(path.posix.join(path.posix.dirname(f), m[1]));
    if (![p, p + '.js', p + '.json', p + '/index.js'].some(c => tracked.includes(c))) (faltan[p] = faltan[p] || new Set()).add(f);
  }
}
Object.keys(faltan).length
  ? Object.keys(faltan).sort().forEach(p => mal(`falta ${p}.js (lo usan: ${[...faltan[p]].join(', ')})`))
  : ok('todos los archivos importados por la aplicación están en el repositorio');

log('\n4. Higiene del código y la documentación');
const gi = has('.gitignore') ? fs.readFileSync(path.join(repo, '.gitignore'), 'utf8') : '';
/^\*\.js\s*$/m.test(gi) ? mal('.gitignore contiene la regla *.js (ignora el código)') : ok('.gitignore no ignora archivos .js');
/^\.env\s*$|^\.env\.\*\s*$/m.test(gi) ? ok('.gitignore excluye .env') : mal('.gitignore no excluye .env');
if (has('vestuario-server/server.js')) {
  const sv = fs.readFileSync(path.join(repo, 'vestuario-server/server.js'), 'utf8');
  /DEBUG/.test(sv) ? mal('server.js contiene mensajes DEBUG temporales (uno imprime el registro de Root)') : ok('server.js sin mensajes DEBUG');
}
if (has('README.md')) {
  const rd = fs.readFileSync(path.join(repo, 'README.md'), 'utf8');
  /flutter|dart/i.test(rd) ? mal('el README menciona Flutter o Dart') : ok('el README no menciona Flutter ni Dart');
  /expo/i.test(rd) ? ok('el README menciona Expo') : mal('el README no menciona Expo');
}

if (INSTALAR) {
  log('\n5. Instalación y arranque (puede tardar varios minutos)');
  const run = (titulo, cmd, cwd) => {
    const r = spawnSync(cmd, { cwd, shell: true, encoding: 'utf8' });
    r.status === 0 ? ok(titulo) : mal(titulo + ' → ' + ((r.stderr || r.stdout || '').trim().split('\n').slice(-3).join(' | ')));
  };
  run('npm install (aplicación)', 'npm install --no-audit --no-fund', repo);
  run('la aplicación compila para web (expo export)', 'npx expo export --platform web', repo);
  if (has('vestuario-server/package.json')) {
    run('npm install (servidor)', 'npm install --no-audit --no-fund', path.join(repo, 'vestuario-server'));
    if (has('vestuario-server/server.js')) run('server.js no tiene errores de sintaxis', 'node --check server.js', path.join(repo, 'vestuario-server'));
  }
} else {
  log('\n5. Instalación y arranque: omitida (usar --instalar)');
}

log('\nRESULTADO: ' + (fallos ? fallos + ' punto(s) a corregir' : 'sin problemas detectados'));
const informe = path.join(process.cwd(), 'evidencia_verificacion.txt');
fs.writeFileSync(informe, out.join('\n') + '\n');
console.log('\nInforme guardado en ' + informe);
process.exit(fallos ? 2 : 0);
