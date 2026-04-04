# Polanco.dev — Backend API

La API RESTful que alimenta **Polanco.dev** — un blog técnico, repositorio de trucos rápidos, biblioteca de cheatsheets y portafolio profesional. Construida con **Node.js**, **Express** y **MongoDB** (Mongoose), siguiendo los patrones **MVC + Factory + Repository + Strategy**.

---

## Características Principales

- **CRUD Completo** para Artículos, Trucos Rápidos, Cheatsheets, Experiencias y Comentarios
- **Modelo Resume Singleton Bilingüe** — Un único documento MongoDB contiene el perfil completo + las experiencias embebidas como subdocumentos. Los campos de texto (`role`, `description`, `achievements`) se almacenan con estructura `{ en, es }` y se resuelven al idioma solicitado en tiempo de petición
- **Autenticación JWT** con control de acceso basado en roles (`admin` / `user`)
- **Patrón Strategy** — Estrategias de autenticación intercambiables (`JWTStrategy`, `LocalStrategy`) que extienden una clase base `AuthStrategy`
- **Patrón Factory** — `handlerFactory.js` genera controladores CRUD reutilizables para cualquier modelo Mongoose
- **Patrón Repository** — Capa de acceso a datos (`BaseRepository` → `ArticleRepository`, etc.) que desacopla los controladores de Mongoose
- **Arquitectura Modular de Controladores** — `authController.ts` actúa como barrel que re-exporta desde módulos enfocados: `authMiddleware.ts` (protect, restrictTo), `tokenService.ts` (JWT, logout, refresh), `passwordController.ts` (forgot, reset, update)
- **Endpoint de CV/Resume** — `GET /api/v1/resume/:lang` resuelve el documento singleton de Resume al idioma solicitado (`en` / `es`) y devuelve perfil + experiencias con todos los campos ya traducidos
- **Subida de Imágenes** — `multer` (almacenamiento en memoria) + `sharp` para redimensionado a WebP (1200x630 artículos, 200x200 avatares)
- **Sistema de Comentarios** — Creación y moderación exclusiva para admin (crear, aprobar, eliminar) con rutas anidadas por artículo
- **Seguridad Avanzada** — Helmet, rate limiting (100 req/hr + limitadores específicos para login, vistas, likes), sanitización contra inyección NoSQL, protección XSS, HPP, cookies `sameSite: strict`, verificación de algoritmo JWT (`HS256`), blacklist de tokens al logout
- **Características de Consulta API** — Filtrado, ordenamiento, selección de campos y paginación mediante la clase `APIFeatures`
- **Swagger UI** — Documentación interactiva de la API en `/api-docs`
- **Logging Estructurado** — Winston con transportes de archivo y consola
- **Email** — Integración con Nodemailer para mensajes del formulario de contacto

---

## Requisitos Previos

- **Node.js** v18+ (se recomienda v20 LTS)
- **MongoDB** — Instancia local o clúster en MongoDB Atlas
- **npm** (incluido con Node.js)

---

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Crear config.env (ver sección de variables de entorno)
cp config.env.example config.env

# Iniciar en modo desarrollo (nodemon + tsx)
npm run dev
```

El servidor inicia en `http://localhost:3000`. Documentación Swagger en `http://localhost:3000/api-docs`.

---

## Variables de Entorno

Crea un archivo `config.env` en la raíz del proyecto:

```env
NODE_ENV=development
PORT=3000

# Base de datos
DATABASE_LOCAL=mongodb://localhost:27017/tech-blog-db
DATABASE=mongodb+srv://<USUARIO>:<CONTRASEÑA>@cluster0...
DATABASE_PASSWORD=<CONTRASEÑA>

# JWT
JWT_SECRET=tu-clave-secreta
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

# Email (Nodemailer)
EMAIL_USERNAME=tu-usuario
EMAIL_PASSWORD=tu-contraseña
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=25

# CORS (producción)
ALLOWED_ORIGINS=https://tu-frontend.vercel.app

# Cloudinary (almacenamiento de imágenes en producción)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## Scripts Disponibles

| Comando                     | Descripción                                                           |
| --------------------------- | --------------------------------------------------------------------- |
| `npm run dev`               | Servidor de desarrollo con nodemon + tsx (auto-reload)                |
| `npm start`                 | Inicio estándar desde build compilado (`dist/server.js`)              |
| `npm run prod`              | Modo producción con tsx (`NODE_ENV=production`)                       |
| `npm run build`             | Verificación de tipos TypeScript (`tsc --noEmit`)                     |
| `npm run debug`             | Depuración con ndb                                                    |
| `npm test`                  | Ejecutar pruebas Jest (MongoDB Memory Server)                         |
| `npm run test:verbose`      | Salida detallada de pruebas                                           |
| `npm run seed:resume`       | Poblar el documento singleton de Resume (perfil + experiencias EN/ES) |
| `npm run seed:resume:reset` | Eliminar y re-sembrar el documento de Resume desde cero               |

---

## Estructura del Proyecto

```
blog-proyect/
├── models/                     # Esquemas Mongoose (TypeScript)
│   ├── articleModel.ts         # Artículos (con hook de populate para author)
│   ├── userModel.ts            # Usuarios (hashing de contraseña, métodos JWT)
│   ├── commentModel.ts         # Comentarios (flujo de aprobación)
│   ├── cheatsheetModel.ts
│   ├── quicktipModel.ts
│   └── resumeModel.ts          # Documento singleton con perfil bilingüe + experiencias embebidas
├── controllers/                # TypeScript
│   ├── handlerFactory.ts       # Fábrica CRUD genérica (getAll, getOne, create, update, delete)
│   ├── articleController.ts    # Lógica específica de artículos (vistas, likes, relacionados, borradores)
│   ├── authController.ts       # Barrel: re-exporta desde authMiddleware, tokenService, passwordController
│   ├── authMiddleware.ts       # protect + restrictTo (middleware de autenticación/autorización)
│   ├── tokenService.ts         # signToken, createSendToken, logout, refreshToken
│   ├── passwordController.ts   # forgotPassword, resetPassword, updatePassword
│   ├── commentController.ts    # Crear, aprobar, listar pendientes/aprobados
│   ├── experienceController.ts # CRUD de experiencias embebidas (subdocumentos Mongoose)
│   ├── resumeController.ts     # Resuelve el documento Resume al idioma solicitado (EN/ES)
│   ├── errorController.ts      # Manejador global de errores (modos dev/prod)
│   ├── contactController.ts
│   ├── userController.ts
│   └── ...
├── routes/                     # TypeScript
│   ├── articleRoutes.ts        # /api/v1/articles (+ rutas anidadas de comentarios)
│   ├── commentRoutes.ts        # /api/v1/articles/:articleId/comments
│   ├── experienceRoutes.ts     # /api/v1/experiences (GET lista; POST/PATCH/:id/DELETE/:id)
│   ├── resumeRoutes.ts         # /api/v1/resume/:lang
│   ├── uploadRoutes.ts         # /api/v1/upload (imágenes de artículos, fotos de usuario)
│   ├── userRoutes.ts           # /api/v1/users (auth + CRUD)
│   ├── contactRoutes.ts        # /api/v1/contact
│   ├── feedRoutes.ts           # Feed RSS/Atom
│   └── ...
├── strategies/                 # Estrategias de autenticación (patrón Strategy)
│   ├── authStrategy.js         # Clase base
│   ├── jwtStrategy.js          # Verificación de token JWT
│   └── localStrategy.js        # Login con email + contraseña
├── repositories/               # Capa de acceso a datos (patrón Repository)
│   ├── baseRepository.ts       # CRUD genérico + findBySlug/updateBySlug/deleteBySlug
│   ├── articleRepository.ts
│   ├── cheatsheetRepository.ts
│   └── quicktipRepository.ts
├── utils/
│   ├── apiFeatures.ts          # Filtrado, ordenamiento y paginación de consultas
│   ├── appError.ts             # Clase de error personalizada (statusCode, isOperational)
│   ├── catchAsync.ts           # Wrapper para errores asíncronos
│   ├── slugPlugin.ts           # Plugin de Mongoose para generar slug desde título
│   ├── schemaOptions.ts        # Opciones reutilizables de serialización JSON para schemas
│   ├── tokenBlacklist.ts       # In-memory JWT blacklist con auto-purge
│   ├── upload.js               # Procesamiento de imágenes con Multer + Sharp
│   ├── email.js                # Transporte Nodemailer
│   ├── logger.ts               # Logging con Winston
│   └── validators.ts           # Middleware de validación de entrada (express-validator)
├── data/
│   └── seed-resume.js          # Script de seed: pobla el documento singleton de Resume (perfil + experiencias EN/ES)
├── tests/
│   ├── integration/            # Pruebas completas de petición/respuesta
│   │   ├── article.test.js
│   │   ├── article-extended.test.js  # Vistas, likes, borradores, búsqueda, relacionados
│   │   ├── auth.test.js
│   │   ├── comments.test.js          # Ciclo de vida completo de comentarios
│   │   ├── experience.test.js        # CRUD de experiencias embebidas (bilingüe)
│   │   ├── quicktip.test.js
│   │   ├── cheatsheet.test.js
│   │   └── resume.test.js            # Endpoint de CV (EN/ES, validación de idioma, experiencias)
│   ├── models/                 # Pruebas de validación de esquemas
│   │   ├── articleModel.test.js
│   │   ├── userModel.test.js
│   │   └── ...
│   ├── unit/                   # Pruebas de utilidades y controladores
│   │   ├── apiFeatures.test.js
│   │   ├── appError.test.js
│   │   ├── email.test.js             # Configuración de transporte y envío Nodemailer
│   │   ├── contactController.test.js # Validación, envío y manejo de errores del formulario
│   │   ├── handlerFactory.test.js    # Fábrica CRUD (mocks de Mongoose, sin BD)
│   │   ├── errorController.test.js
│   │   └── upload.test.js
│   └── setup.js                # Configuración/limpieza de MongoDB Memory Server
├── types/                      # Definiciones de tipos TypeScript
├── app.js                      # Stack de middlewares Express + montaje de rutas
├── server.js                   # Conexión a BD + inicio del servidor HTTP
├── swagger.json                # Especificación OpenAPI 3.0
└── jest.config.js              # Configuración de pruebas
```

---

## Endpoints de la API

Todas las rutas tienen el prefijo `/api/v1/`.

### Públicos (solo lectura + contacto)

| Método | Ruta                     | Descripción                                                 |
| ------ | ------------------------ | ----------------------------------------------------------- |
| `GET`  | `/articles`              | Listar artículos (soporta filtro, ordenamiento, paginación) |
| `GET`  | `/articles/:id`          | Obtener artículo individual                                 |
| `GET`  | `/articles/:id/related`  | Artículos relacionados (misma categoría)                    |
| `GET`  | `/articles/:id/comments` | Obtener comentarios aprobados                               |
| `GET`  | `/quicktips`             | Listar trucos rápidos                                       |
| `GET`  | `/cheatsheets`           | Listar cheatsheets                                          |
| `GET`  | `/experiences`           | Perfil bilingüe + lista de experiencias                     |
| `GET`  | `/resume/:lang`          | Obtener datos del CV en `en` o `es` (perfil + experiencias) |
| `POST` | `/users/signup`          | Registro de usuario                                         |
| `POST` | `/users/login`           | Inicio de sesión (devuelve JWT)                             |
| `POST` | `/contact`               | Enviar mensaje de contacto                                  |

### Protegidos (JWT + Admin)

| Método   | Ruta                                        | Descripción                                |
| -------- | ------------------------------------------- | ------------------------------------------ |
| `GET`    | `/users/logout`                             | Cerrar sesión (blacklist del token)        |
| `POST`   | `/users/refresh-token`                      | Refrescar token JWT                        |
| `POST`   | `/articles`                                 | Crear artículo                             |
| `PATCH`  | `/articles/:id`                             | Actualizar artículo                        |
| `DELETE` | `/articles/:id`                             | Eliminar artículo                          |
| `PATCH`  | `/articles/:id/view`                        | Incrementar vistas (rate limited)          |
| `PATCH`  | `/articles/:id/like`                        | Dar like (rate limited)                    |
| `POST`   | `/articles/:id/comments`                    | Crear comentario (pendiente de aprobación) |
| `PATCH`  | `/articles/:id/comments/:commentId/approve` | Aprobar comentario                         |
| `GET`    | `/articles/:id/comments/pending`            | Listar comentarios pendientes              |
| `POST`   | `/upload/article-image`                     | Subir + redimensionar portada de artículo  |
| `POST`   | `/upload/user-photo`                        | Subir + redimensionar avatar de usuario    |

**Ejemplos de consultas:**

```
GET /api/v1/articles?category=Programacion&sort=-createdAt&fields=title,description&page=1&limit=10
GET /api/v1/articles?views[gte]=100&tags=Angular,TypeScript
GET /api/v1/resume/en
GET /api/v1/resume/es
```

Documentación interactiva completa en `/api-docs` (Swagger UI).

---

## Pruebas

Las pruebas usan **Jest** con **MongoDB Memory Server** — no se requiere base de datos externa.

```bash
# Ejecutar todas las pruebas
npm test

# Salida detallada
npm run test:verbose
```

**Cobertura:** 30+ archivos de prueba entre integración, modelos y unitarias — **145 tests pasando**.

---

## Patrones de Diseño

| Patrón         | Implementación                   | Propósito                                        |
| -------------- | -------------------------------- | ------------------------------------------------ |
| **MVC**        | models/ → controllers/ → routes/ | Separación de responsabilidades                  |
| **Factory**    | `handlerFactory.ts`              | CRUD reutilizable para cualquier modelo          |
| **Repository** | `repositories/`                  | Desacopla el acceso a datos de los controladores |
| **Strategy**   | `strategies/`                    | Métodos de autenticación intercambiables         |
| **Plugin**     | `utils/slugPlugin.ts`            | Generación de slug reutilizable entre modelos    |

---

## Tecnologías Utilizadas

| Tecnología                   | Propósito                          |
| ---------------------------- | ---------------------------------- |
| Node.js + Express            | Servidor HTTP y enrutamiento       |
| MongoDB + Mongoose           | Base de datos y ODM                |
| JWT (jsonwebtoken)           | Autenticación basada en tokens     |
| Multer + Sharp               | Subida y procesamiento de imágenes |
| Winston                      | Logging estructurado               |
| Nodemailer                   | Envío de emails                    |
| Helmet                       | Cabeceras de seguridad             |
| express-rate-limit           | Limitación de peticiones           |
| xss-clean + mongo-sanitize   | Sanitización de entrada            |
| Swagger UI                   | Documentación de la API            |
| Jest + mongodb-memory-server | Pruebas                            |

---

## Autor

**Diego Polanco** — [Polanco.dev](https://polanco.dev)
