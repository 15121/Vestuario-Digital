# Vestuario Digital

Organizá tu ropa, creá tu estilo.

## Descripción del proyecto

Vestuario Digital es una aplicación con diseño responsivo, desarrollada como Producto Mínimo Viable (MVP), que ayuda a organizar y gestionar el guardarropa personal mediante un armario digital.

Permite registrar y administrar prendas, ver y filtrar el armario, crear outfits, consultar el historial de uso, recibir recomendaciones según el clima y organizar prendas para viajes con el modo maleta.

Es un proyecto académico desarrollado durante 2026.

## Objetivo

Facilitar la organización del guardarropa personal y ayudar a elegir prendas y outfits de forma práctica, reduciendo el tiempo dedicado a decidir qué vestir.

## Integrantes y roles

| Integrante | Rol |
|---|---|
| Iara Cazón | Project Manager |
| Sabrina Arévalo | Analista Funcional |
| Kiara Soto | Analista Funcional |
| Priscila Martínez | Analista de Negocios |
| Agustina Martínez | Programadora |
| Celeste Milton | Programadora |

Los roles se rotaron periódicamente durante el desarrollo.

## Tecnologías utilizadas

**Aplicación (carpeta raíz)**
- **React Native + Expo** (JavaScript): una sola base de código para celular (Android/iOS) y web.
- **React Navigation**: navegación por pilas y pestañas.
- **expo-sqlite**: base de datos local en el celular.
- **expo-image-picker / expo-image-manipulator / expo-file-system**: fotos de las prendas.
- **AsyncStorage**: datos locales (ciudad del clima).

**Servidor (carpeta `vestuario-server`)**
- **Node.js + Express**: API usada por la versión web.
- **MySQL** (mysql2): base de datos del servidor.
- **bcrypt** (contraseñas), **JWT** (sesiones), **helmet**, **cors** y **express-rate-limit** (seguridad).

**Servicios externos**
- **OpenWeatherMap**: clima actual para las recomendaciones.
- **remove.bg**: quitar el fondo de las fotos.
- **EmailJS**: envío del código de recuperación de contraseña.
- **GitHub**: control de versiones.

## Arquitectura

- **Web (PC):** la app se comunica con el servidor (`services/api.js`), que guarda los datos en MySQL.
- **Celular:** la app guarda los datos en SQLite local, sin servidor.
- `services/database.js` ofrece las mismas funciones en ambas plataformas y decide a qué base ir.
- Los datos de la web y los del celular no se sincronizan.

## Funcionalidades del MVP

- Registro e inicio de sesión de usuarios.
- Registro, edición y eliminación de prendas (con foto, quitar fondo y selector de color).
- Visualización, búsqueda y filtrado del armario.
- Creación manual de outfits.
- Historial de outfits utilizados.
- Recomendación según el clima.
- Modo maleta para organizar prendas de viaje.
- Edición del perfil de usuario.
- Administración del sistema (cuenta Root): panel, gestión de usuarios y registro de actividad.

Las funcionalidades avanzadas, como inteligencia artificial, reconocimiento automático de prendas, colorimetría automatizada y asesoramiento avanzado de imagen, quedan fuera de esta versión.

## Estructura de carpetas

```
Vestuario-Digital/
├── App.js              # Arranque y navegación principal
├── index.js
├── app.json            # Configuración de Expo
├── assets/             # Imágenes e íconos
├── components/         # Componentes reutilizables (diálogos, menús, modales)
├── navigation/         # Navegadores de usuario (Main) y administrador (Root)
├── screens/            # Pantallas de la aplicación
├── services/           # Datos, API, clima, imágenes, sesión
├── theme/              # Colores y mensajes
├── utils/              # Recomendador de outfits, colores, fechas
└── vestuario-server/   # API Node + Express + MySQL
    └── server.js
```

## Requisitos

- Node.js 20.6 o superior.
- MySQL (por ejemplo, XAMPP).
- Expo Go en el celular, o un navegador para la versión web.

## Instalación y ejecución

### 1. Base de datos
Iniciar MySQL y crear una base llamada `vestuario` (cotejamiento `utf8mb4_general_ci`). Las tablas las crea el servidor al arrancar.

### 2. Servidor
```
cd vestuario-server
copy .env.example .env      (en Mac/Linux: cp .env.example .env)
npm install
npm start
```
Completar en `.env`: `JWT_SECRET` (mínimo 32 caracteres), `ROOT_PASSWORD` y los datos de MySQL si no son los predeterminados.
Debe mostrar: `API lista en http://localhost:3000`.

### 3. Aplicación
```
npm install
npx expo start          (o: npx expo start --web)
```
Variables del `.env` de la app:
- `EXPO_PUBLIC_API_URL`: dirección del servidor (por defecto `http://localhost:3000`).
- `EXPO_PUBLIC_OPENWEATHER_API_KEY`: clave de OpenWeather (opcional).
- `EXPO_PUBLIC_REMOVE_BG_API_KEY`: clave de remove.bg (opcional).
- `EXPO_PUBLIC_EMAILJS_SERVICE_ID`, `EXPO_PUBLIC_EMAILJS_TEMPLATE_ID`, `EXPO_PUBLIC_EMAILJS_PUBLIC_KEY`: recuperación de contraseña en el celular (opcional).

Sin las claves opcionales, el resto de la aplicación funciona igual.

## Cuenta Root (administrador)

Se crea automáticamente la primera vez que arranca el servidor, con el email y la contraseña definidos en `ROOT_EMAIL` y `ROOT_PASSWORD` del `.env` del servidor. Solo existe una cuenta Root.

## Control de versiones

Repositorio: https://github.com/15121/Vestuario-Digital

Ramas:
- `main`: versiones estables.
- `develop`: integración del desarrollo.
- `feature/USxx-nombre`: una rama por historia de usuario (por ejemplo, `feature/US01-registro`, `feature/US13-eliminar-prenda`).

Convención de commits: `feat`, `fix`, `docs`, `refactor`, `style`, `test`.

## Organización por Sprints

| Sprint | Historias de Usuario |
| --- | --- |
| Sprint 1 | US01, US02 |
| Sprint 2 | US03, US04, US05, US12, US13 |
| Sprint 3 | US06, US07, US11 |
| Sprint 4 | US08, US09, US10 |

## Estado del proyecto

MVP desarrollado: todas las funcionalidades listadas están implementadas.

Limitaciones conocidas:
- Los datos de la web y del celular no se sincronizan.
- En la web, la sesión se cierra al recargar la página.
- No hay pruebas automatizadas.
