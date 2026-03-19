# DevBlog - Backend API (Node.js & Express)

Este repositorio contiene la **API RESTful** que alimenta toda la plataforma de DevBlog: un Blog de Tecnología personal, Portafolio Profesional (Experiencias), Guías Rápidas (Cheatsheets) y Consejos Técnicos (Quick Tips). Construido sobre **Node.js**, **Express** y **MongoDB** (a través de Mongoose), siguiendo una arquitectura escalable basada en los patrones **MVC** (Modelo-Vista-Controlador) y **Factory**.

---

## ✨ Características Principales

- **Endpoints CRUD Completos**: Para `Artículos`, `Experiencias Profesionales`, `Cheatsheets` y `Quick Tips`.
- **Autenticación y Autorización**: Protección de rutas administrativas mediante **JWT** (JSON Web Tokens) con control de roles (`admin`, `user`).
- **Seguridad Avanzada**: Incluye limitación de peticiones (Rate Limiting), protección contra contaminación de parámetros HTTP (HPP), sanitización de datos contra inyecciones NoSQL y ataques XSS, y cabeceras de seguridad mediante **Helmet**.
- **Modelado de Datos con Mongoose**: Esquemas extensibles con hooks pre/post para lógica de negocio automatizada.
- **Sistema de Contacto por Email**: Integración con **Nodemailer** para recibir mensajes directamente desde el formulario de contacto del Frontend.
- **Documentación Interactiva**: Integración de **Swagger UI** para explorar, probar y documentar todos los endpoints de la API de forma visual.

---

## 🛠️ Requisitos Previos

- **Node.js**: v18.0.0 o superior (se recomienda usar versiones LTS como v20 o v22).
- **MongoDB**: Una instancia local de base de datos corriendo (`mongod`) o un clúster remoto en **MongoDB Atlas**.
- **NPM**: Administrador de paquetes de Node (incluido con Node.js).

---

## ⚙️ Configuración e Instalación Local

1.  **Clona el repositorio**:
    Navega hacia tu carpeta de trabajo local y clona este proyecto:
    ```bash
    git clone <url-del-repositorio>
    cd blog-proyect
    ```

2.  **Instala las dependencias**:
    ```bash
    npm install
    ```
    *Nota: Esto instalará Express, Mongoose, Swagger-UI-Express, Nodemailer, y todos los middlewares de seguridad necesarios.*

3.  **Configuración del archivo de entorno**:
    La aplicación requiere un archivo de configuración para conectarse a la base de datos, firmar los tokens JWT y enviar correos. Asegúrate de tener un archivo `config.env` en la raíz del proyecto con la siguiente estructura:
    ```env
    NODE_ENV=development
    PORT=3000

    # Conexión a Base de Datos Local
    DATABASE_LOCAL=mongodb://localhost:27017/tech-blog-db

    # Base de Datos Remota (Opcional para Producción)
    DATABASE=mongodb+srv://<USUARIO>:<CONTRASEÑA>@cluster0...

    # Configuración de JWT
    JWT_SECRET=cadena-secreta-para-encriptar-la-firma
    JWT_EXPIRES_IN=90d
    JWT_COOKIE_EXPIRES_IN=90

    # Configuración de Email (Nodemailer vía Mailtrap/SMTP)
    EMAIL_USERNAME=tu_usuario
    EMAIL_PASSWORD=tu_contraseña
    EMAIL_HOST=smtp.mailtrap.io
    EMAIL_PORT=25
    ```

4.  **Inicia la aplicación**:
    Para desarrollo activo (con `nodemon` para recargas automáticas al guardar cambios):
    ```bash
    npm run dev
    ```
    Para un inicio estándar:
    ```bash
    npm start
    ```

5.  **Verifica la instalación**:
    Una vez que el servidor inicie y la consola muestre el mensaje `DB connection successful!`, abre tu navegador para explorar la documentación interactiva de la API:
    - 👉 **Swagger Docs**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## 📂 Estructura del Proyecto

| Carpeta / Archivo | Descripción |
|---|---|
| `models/` | Esquemas de Mongoose (`Article`, `User`, `Experience`, `Cheatsheet`, `QuickTip`). |
| `controllers/` | Manejadores de peticiones HTTP y la fábrica genérica `handlerFactory` para operaciones CRUD reutilizables. |
| `routes/` | Enrutadores de Express que aíslan y organizan los endpoints por recurso. |
| `utils/` | Manejo global de errores (`AppError`), wrapper asíncrono (`catchAsync`) y lógica avanzada de consultas (`APIFeatures`). |
| `server.js` | Carga de variables de entorno, conexión a MongoDB e instanciación del servidor HTTP. |
| `app.js` | Pila de middlewares de Express (seguridad, CORS, compresión) y montaje de rutas. |
| `swagger.json` | Especificación OpenAPI completa con todos los endpoints, esquemas y ejemplos de la API. |
| `config.env` | Variables de entorno sensibles (no versionado en Git). |

---

## 🔐 Endpoints Principales de la API

| Método | Ruta | Descripción | Protección |
|---|---|---|---|
| `POST` | `/api/v1/users/signup` | Registro de un nuevo usuario | Pública |
| `POST` | `/api/v1/users/login` | Inicio de sesión (devuelve JWT) | Pública |
| `GET` | `/api/v1/articles` | Obtener todos los artículos | Pública |
| `POST` | `/api/v1/articles` | Crear un nuevo artículo | Admin (JWT) |
| `GET` | `/api/v1/quicktips` | Obtener todos los Quick Tips | Pública |
| `POST` | `/api/v1/quicktips` | Crear un nuevo Quick Tip | Admin (JWT) |
| `GET` | `/api/v1/cheatsheets` | Obtener todos los Cheatsheets | Pública |
| `POST` | `/api/v1/cheatsheets` | Crear un nuevo Cheatsheet | Admin (JWT) |
| `GET` | `/api/v1/experiences` | Obtener todas las experiencias | Pública |
| `POST` | `/api/v1/experiences` | Crear una nueva experiencia | Admin (JWT) |
| `POST` | `/api/v1/contact` | Enviar un mensaje de contacto | Pública |

> 📘 Para consultar **todos** los endpoints disponibles (incluyendo `PATCH`, `DELETE`, filtros avanzados y más), visita la documentación interactiva en **Swagger UI**: `http://localhost:3000/api-docs`

---

## 🧰 Tecnologías Utilizadas

| Tecnología | Propósito |
|---|---|
| **Node.js** | Entorno de ejecución del servidor |
| **Express** | Framework web para el manejo de rutas y middlewares |
| **MongoDB + Mongoose** | Base de datos NoSQL y modelado de datos con ODM |
| **JWT (jsonwebtoken)** | Autenticación basada en tokens |
| **Nodemailer** | Envío de correos electrónicos desde el formulario de contacto |
| **Helmet** | Cabeceras HTTP de seguridad |
| **Express Rate Limit** | Limitación de peticiones por IP |
| **XSS-Clean + Mongo-Sanitize** | Sanitización de datos de entrada |
| **Swagger UI** | Documentación interactiva de la API |
| **ESLint + Prettier** | Análisis estático de código y formateo consistente |
