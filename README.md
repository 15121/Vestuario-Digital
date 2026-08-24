# Vestuario Digital
*Organizá tu ropa, creá tu estilo.*

---

## Descripción del proyecto
Vestuario Digital es una aplicación móvil con diseño responsivo desarrollada como Producto Mínimo Viable (MVP), orientada a facilitar la organización y gestión del guardarropa personal mediante un armario digital.

La aplicación permite registrar y administrar prendas, visualizar y filtrar el armario, crear outfits, consultar el historial de uso, recibir recomendaciones básicas según el clima y organizar prendas para viajes mediante el modo maleta.

El proyecto se desarrolla considerando un alcance adecuado para el contexto académico y priorizando una solución simple, organizada y funcional.

---

## Objetivo
El objetivo de Vestuario Digital es facilitar la organización del guardarropa personal y ayudar al usuario a seleccionar sus prendas y outfits de manera práctica, reduciendo el tiempo destinado a elegir qué vestir y favoreciendo una mejor organización de la ropa.

---

## Integrantes y roles

| Integrante | Rol |
| :--- | :--- |
| Iara Cazón | Project Manager |
| Sabrina Arévalo | Analista Funcional |
| Kiara Soto | Analista Funcional |
| Priscila Martínez | Analista de Negocios |
| Agustina Martínez | Programadora |
| Celeste Milton | Programadora |

> Los roles se rotarán periódicamente durante el desarrollo del proyecto, permitiendo que los integrantes adquieran conocimientos y experiencia en las distintas áreas involucradas.

---

## Tecnologías utilizadas
* **React Native (con Expo SDK 54):** Framework principal para el desarrollo de la aplicación móvil.
* **JavaScript / Node.js:** Lenguaje de programación y entorno de ejecución.
* **API externa de clima:** Utilizada para obtener información meteorológica necesaria para las recomendaciones básicas.
* **GitHub:** Plataforma utilizada para el control de versiones y el trabajo colaborativo.

---

## Funcionalidades principales del MVP
* Registro e inicio de sesión de usuarios.
* Registro y administración de prendas.
* Visualización del armario digital.
* Filtrado de prendas.
* Creación manual de outfits.
* Consulta del historial de outfits utilizados.
* Recomendación climática básica.
* Modo maleta para la organización de prendas para viajes.
* Edición del perfil de usuario.
* Administración del sistema.

> Las funcionalidades avanzadas, como inteligencia artificial, reconocimiento automático de prendas, colorimetría automatizada y asesoramiento avanzado de imagen, quedan fuera del alcance de esta primera versión.

---

## Requisitos para ejecutar el proyecto
* Node.js instalado en la computadora.
* Aplicación **Expo Go** instalada en el dispositivo móvil (Android/iOS).
* Editor de código (Visual Studio Code recomendado).

---

## Instalación y ejecución

1. **Clonar el repositorio:**
   git clone https://github.com/15121/Vestuario-Digital.git

2. **Ingresar a la carpeta del proyecto:**
   cd Vestuario-Digital

3. **Instalar las dependencias:**
   npm install

4. **Ejecutar la aplicación:**
   npx expo start -c

5. **Visualizar en el celular:** Escanear el código QR resultante desde la aplicación **Expo Go**.

---

## Estructura de carpetas
Vestuario-Digital/
├── assets/
├── App.js
├── app.json
├── package.json
└── README.md

---

## Control de versiones
El proyecto utilizará GitHub para organizar el desarrollo colaborativo y controlar las diferentes versiones del código.

### Ramas principales
* **main:** Contiene las versiones estables del proyecto.
* **develop:** Rama destinada a integrar los desarrollos realizados.
* **feature/nombre-funcionalidad:** Ramas destinadas al desarrollo de funcionalidades específicas.

**Ejemplos de ramas:**
* feature/us01-registro
* feature/us02-login
* feature/us03-registrar-prenda

---

## Convención de commits
Los commits seguirán una nomenclatura clara para identificar el tipo de modificación realizada:

* **feat:** Nueva funcionalidad.
* **fix:** Corrección de errores.
* **docs:** Modificación de documentación.
* **refactor:** Reorganización del código sin alterar su comportamiento.
* **style:** Cambios de formato o estilos.
* **test:** Incorporación o modificación de pruebas.

**Ejemplos:**
* feat: add login screen
* fix: correct form validation
* docs: update README
* test: add login validation tests

---

## Issues
Los Issues se utilizarán para registrar y realizar el seguimiento de las tareas del proyecto. Cada Issue podrá relacionarse con:
* Historia de Usuario.
* Requerimiento Funcional.
* Sprint correspondiente.
* Tarea del Product Backlog.

**Ejemplo de Issue:**
Issue: US03 - Registrar prenda
Requerimiento: RF03
Sprint: Sprint 2
Prioridad: Alta

---

## Organización por Sprints

| Sprint | Historias de Usuario |
| :--- | :--- |
| **Sprint 1** | US01, US02 |
| **Sprint 2** | US03, US04, US05, US12, US13 |
| **Sprint 3** | US06, US07, US11 |
| **Sprint 4** | US08, US09, US10 |

---

## Estado del proyecto
**Estado actual:** En planificación y preparación para el desarrollo del MVP.

El repositorio se actualizará progresivamente durante el desarrollo, incorporando el código fuente, documentación, Issues, ramas, commits y demás elementos correspondientes al avance del proyecto.
