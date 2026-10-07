# Vestuario Digital – Cómo levantar el proyecto

Proyecto académico desarrollado durante 2026.
Está formado por dos partes:

- **App** (Expo / React Native): carpeta principal. Funciona en web (PC) y en celular.
- **Servidor** (Node + Express + MySQL): carpeta `vestuario-server`. Lo usa la versión web.
  En celular la app guarda los datos en SQLite local, sin servidor.

## Requisitos

- Node 20.6 o superior (`node -v`)
- MySQL (por ejemplo XAMPP)

## 1. Base de datos

1. Activar **MySQL** (en XAMPP, también Apache si se quiere usar phpMyAdmin).
2. Crear una base llamada **vestuario** (cotejamiento `utf8mb4_general_ci`).
   Las tablas las crea el servidor solo al arrancar.

## 2. Servidor

```
cd vestuario-server
copy .env.example .env      (en Mac/Linux: cp .env.example .env)
```

Abrir el archivo `.env` y completar:

- `JWT_SECRET`: una clave larga, de mínimo 32 caracteres.
- `ROOT_PASSWORD`: la contraseña de la cuenta administradora.
- `DB_USER` / `DB_PASSWORD`: si el MySQL no usa `root` sin contraseña.

Después:

```
npm install
npm start
```

Tiene que decir: `API lista en http://localhost:3000`

### Para la prueba de carga

El `.env.example` ya trae los límites altos pensados para una prueba con muchos
usuarios simultáneos desde una misma IP:

| Variable         | Valor     | Qué controla                                  |
|------------------|-----------|-----------------------------------------------|
| `RATE_LIMIT`     | 1000000   | Pedidos por minuto permitidos por IP          |
| `LOGIN_LIMIT`    | 100000    | Intentos de login fallidos por IP (15 min)    |
| `REGISTER_LIMIT` | 100000    | Registros por IP (15 min)                     |
| `DB_POOL`        | 50        | Conexiones simultáneas a MySQL                |

Notas:

- Si estas variables se borran, el servidor usa valores por defecto más bajos
  (6000 pedidos/min y 500 registros cada 15 min) y puede responder error 429
  durante la prueba.
- `/auth/forgot-password` está limitado a 5 pedidos cada 15 minutos por IP
  (`FORGOT_LIMIT`) porque envía mails reales. Conviene no incluirlo en la prueba
  de carga, o subir ese valor.
- Comprobación rápida de que el servidor está vivo: `GET /health`
  responde `{"ok": true}`.

## 3. App

```
npm install
npx expo start --web
```

- El archivo `.env` de la app (copiar desde `.env.example`) tiene
  `EXPO_PUBLIC_API_URL`, que apunta al servidor.
  Por defecto es `http://localhost:3000`. Si el servidor corre en otra
  máquina, cambiarlo por su dirección y volver a levantar Expo.
- Las claves de clima (OpenWeather), quitar fondo (remove.bg) y mails (EmailJS)
  son opcionales: sin ellas el resto de la app funciona igual.

## Cuenta Root (administrador)

- Email: cazoncontreras.iara@tecnica7.edu.ar
- Contraseña: la que se puso en `ROOT_PASSWORD` del `.env` del servidor.

La cuenta Root se crea sola la primera vez que arranca el servidor.

## Datos de prueba

La base de datos es local de cada PC, así que los usuarios y prendas que se
creen no se ven en otras computadoras.