# Vestuario Digital
*Organizá tu ropa, creá tu estilo.*

---

## Descripción del proyecto
Vestuario Digital es una aplicación con diseño responsivo, desarrollada como Producto Mínimo Viable (MVP), que facilita la organización del guardarropa personal mediante un armario digital.

Permite registrar y administrar prendas, visualizar y filtrar el armario, crear outfits, consultar el historial de uso, recibir recomendaciones básicas según el clima, organizar prendas para viajes con el Modo Maleta y editar el perfil. La cuenta de administración (Root) gestiona las cuentas de usuario desde un panel propio.

El proyecto se desarrolla con un alcance adecuado al contexto académico: una solución simple, organizada y funcional.

---

## Objetivo
Facilitar la organización del guardarropa personal y ayudar al usuario a elegir sus prendas y outfits de manera práctica, reduciendo el tiempo que lleva decidir qué vestir.

---

## Integrantes y roles

| Integrante | Rol |
| :--- | :--- |
| Iara Cazón | Project Manager |
| Sabrina Arévalo | Analista Funcional |
| Kiara Soto | Analista Funcional |
| Priscila Martínez | Analista de Negocio |
| Agustina Martínez | Programadora |
| Celeste Milton | Programadora |

> Los roles se rotaron periódicamente durante el desarrollo, para que todos los integrantes adquirieran experiencia en las distintas áreas.

---

## Tecnologías utilizadas
El proyecto está escrito íntegramente en JavaScript (React Native con Expo para la aplicación y Node.js para el servidor).

| Componente | Tecnología |
| :--- | :--- |
| Aplicación móvil | React Native con Expo SDK 57 (Expo Go) y JavaScript. Datos locales en SQLite (`expo-sqlite`). |
| Versión web | Cliente web de Expo + servidor Node.js con Express (carpeta `vestuario-server`). Base de datos MySQL. |
| Servicios externos | OpenWeatherMap (clima), remove.bg (quitar fondo de fotos) y EmailJS (correos de recuperación). |
| Control de versiones | Git y GitHub. |

> La versión móvil y la versión web son independientes: no comparten datos ni se sincronizan.

---

## Funcionalidades del MVP
* Registro e inicio de sesión de usuarios, y recuperación de contraseña.
* Registro, visualización, filtrado, modificación y eliminación de prendas.
* Creación manual de outfits, con detalle y eliminación.
* Historial de outfits usados.
* Recomendación climática básica.
* Modo Maleta.
* Edición del perfil.
* Administración de usuarios por la cuenta Root: listado, búsqueda, edición, suspensión, reactivación y eliminación, con registro de actividad.

> Quedan fuera del MVP: inteligencia artificial, reconocimiento automático de prendas, colorimetría automatizada, cambio de roles, solicitudes pendientes de usuarios y sincronización entre la versión web y la móvil.

---

## Requisitos
* Node.js 20.6 o superior.
* Aplicación **Expo Go** en el celular (Android/iOS), para la versión móvil.
* MySQL (por ejemplo XAMPP), solo para la versión web con servidor.
* Editor de código (se recomienda Visual Studio Code).

---

## Instalación y ejecución

### Aplicación (móvil y cliente web)
1. Clonar el repositorio y entrar a la carpeta:
   ```
   git clone https://github.com/15121/Vestuario-Digital.git
   cd Vestuario-Digital
   git checkout develop
   ```
2. Instalar las dependencias:
   ```
   npm install
   ```
3. Crear el archivo `.env` en la raíz con las variables que se listan abajo.
4. Ejecutar:
   ```
   npx expo start -c
   ```
5. En el celular, escanear el código QR con **Expo Go**. Para la versión web, abrir la dirección que indica Expo.

### Servidor (versión web)
Las instrucciones completas están en `vestuario-server/README_EQUIPO.md`. En resumen: crear la base de datos `vestuario` en MySQL, copiar `vestuario-server/.env.example` a `vestuario-server/.env`, completarlo y ejecutar `npm install` y `npm start` dentro de `vestuario-server`.

### Variables de entorno
Cada integrante crea su propio archivo `.env`. **No se suben al repositorio ni se comparten sus valores.**

* Aplicación (`.env` en la raíz): `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_OPENWEATHER_API_KEY`, `EXPO_PUBLIC_REMOVE_BG_API_KEY`, `EXPO_PUBLIC_EMAILJS_SERVICE_ID`, `EXPO_PUBLIC_EMAILJS_TEMPLATE_ID`, `EXPO_PUBLIC_EMAILJS_PUBLIC_KEY` y, solo si se quiere la cuenta Root en el celular, `EXPO_PUBLIC_ROOT_PASSWORD`.
* Servidor (`vestuario-server/.env`): `PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `WEB_ORIGIN`, `ROOT_EMAIL`, `ROOT_PASSWORD`, `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY`.

---

## Estructura de carpetas

    Vestuario-Digital/
    ├── assets/            Imágenes e íconos
    ├── components/        Componentes reutilizables
    ├── navigation/        Navegación por pestañas y menú lateral
    ├── screens/           Pantallas de la aplicación
    ├── services/          Base de datos, clima, correo y eliminación de fondo
    ├── theme/             Colores y mensajes
    ├── vestuario-server/  Servidor Node.js/Express para la versión web
    ├── App.js
    ├── app.json
    ├── index.js
    └── package.json

---

## Control de versiones

### Ramas
* **main:** versión estable anterior del proyecto.
* **develop:** rama de integración; contiene el MVP y es la que se ejecuta y presenta.
* **feature/USxx-nombre:** una rama por historia de usuario (por ejemplo `feature/US03-registrar-prenda`).

### Convención de commits
* **feat:** nueva funcionalidad.
* **fix:** corrección de errores.
* **docs:** documentación.
* **refactor:** reorganización del código sin cambiar su comportamiento.
* **style:** cambios de formato o estilos.
* **test:** pruebas.

Ejemplo: `feat: registrar prenda con foto, color y validaciones (US03)`

---

## Documentación
La documentación del proyecto (Etapas 1 a 20) se entregó en archivos aparte: alcance y MVP, requerimientos, historias de usuario, product backlog, modelo de datos, arquitectura, testing y manual de usuario.
