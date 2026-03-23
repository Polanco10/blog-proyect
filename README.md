# Polanco.dev — Backend API

La API RESTful que alimenta **Polanco.dev** — un blog técnico, repositorio de trucos rápidos, biblioteca de cheatsheets y portafolio profesional. Construida con **Node.js**, **Express** y **MongoDB** (Mongoose), siguiendo los patrones **MVC + Factory + Repository + Strategy**.

---

## Características Principales

- **CRUD Completo** para Artículos, Trucos Rápidos, Cheatsheets, Experiencias y Comentarios
- **Autenticación JWT** con control de acceso basado en roles (`admin` / `user`)
- **Patrón Strategy** — Estrategias de autenticación intercambiables (`JWTStrategy`, `LocalStrategy`) que extienden una clase base `AuthStrategy`
- **Patrón Factory** — `handlerFactory.js` genera controladores CRUD reutilizables para cualquier modelo Mongoose
- **Patrón Repository** — Capa de acceso a datos (`BaseRepository` → `ArticleRepository`, etc.) que desacopla los controladores de Mongoose
- **Patrón Builder** — `ArticleQueryBuilder` / `QuicktipQueryBuilder` para construcción composable de consultas
- **Subida de Imágenes** — `multer` (almacenamiento en memoria) + `sharp` para redimensionado a WebP (1200x630 artículos, 200x200 avatares)
- **Sistema de Comentarios** — Flujo de envío público → aprobación por administrador con rutas anidadas por artículo
- **Seguridad Avanzada** — Helmet, rate limiting (100 req/hr), sanitización contra inyección NoSQL, protección XSS, HPP
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

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con nodemon + tsx |
| `npm start` | Inicio estándar (sin recarga automática) |
| `npm run prod` | Modo producción (`NODE_ENV=production`) |
| `npm run build` | Verificación de tipos TypeScript (`tsc --noEmit`) |
| `npm test` | Ejecutar pruebas Jest (MongoDB Memory Server) |
| `npm run test:verbose` | Salida detallada de pruebas |

---

## Estructura del Proyecto

```
blog-proyect/
├── models/                     # Esquemas Mongoose
│   ├── articleModel.js         # Artículos (con hook de populate para author)
│   ├── userModel.js            # Usuarios (hashing de contraseña, métodos JWT)
│   ├── commentModel.js         # Comentarios (flujo de aprobación)
│   ├── cheatsheetModel.js
│   ├── quicktipModel.js
│   └── experienceModel.js
├── controllers/
│   ├── handlerFactory.js       # Fábrica CRUD genérica (getAll, getOne, create, update, delete)
│   ├── articleController.js    # Lógica específica de artículos (vistas, likes, relacionados, borradores)
│   ├── authController.js       # Login, signup, protect, restrictTo
│   ├── commentController.js    # Crear, aprobar, listar pendientes/aprobados
│   ├── errorController.js      # Manejador global de errores (modos dev/prod)
│   ├── contactController.js
│   ├── userController.js
│   └── ...
├── routes/
│   ├── articleRoutes.js        # /api/v1/articles (+ rutas anidadas de comentarios)
│   ├── commentRoutes.js        # /api/v1/articles/:articleId/comments
│   ├── uploadRoutes.js         # /api/v1/upload (imágenes de artículos, fotos de usuario)
│   ├── userRoutes.js           # /api/v1/users (auth + CRUD)
│   ├── feedRoutes.js           # Feed RSS/Atom
│   └── ...
├── strategies/                 # Estrategias de autenticación (patrón Strategy)
│   ├── authStrategy.js         # Clase base
│   ├── jwtStrategy.js          # Verificación de token JWT
│   └── localStrategy.js        # Login con email + contraseña
├── repositories/               # Capa de acceso a datos (patrón Repository)
│   ├── baseRepository.js
│   ├── articleRepository.js
│   ├── cheatsheetRepository.js
│   └── quicktipRepository.js
├── builders/                   # Constructores de consultas (patrón Builder)
│   ├── baseQueryBuilder.js
│   ├── articleQueryBuilder.js
│   └── quicktipQueryBuilder.js
├── utils/
│   ├── apiFeatures.ts          # Filtrado, ordenamiento y paginación de consultas
│   ├── appError.ts             # Clase de error personalizada (statusCode, isOperational)
│   ├── catchAsync.js           # Wrapper para errores asíncronos
│   ├── upload.js               # Procesamiento de imágenes con Multer + Sharp
│   ├── email.js                # Transporte Nodemailer
│   ├── logger.js               # Logging con Winston
│   └── validate.js             # Helpers de validación de entrada
├── tests/
│   ├── integration/            # Pruebas completas de petición/respuesta
│   │   ├── article.test.js
│   │   ├── article-extended.test.js  # Vistas, likes, borradores, búsqueda, relacionados
│   │   ├── auth.test.js
│   │   └── comments.test.js          # Ciclo de vida completo de comentarios
│   ├── models/                 # Pruebas de validación de esquemas
│   │   ├── articleModel.test.js
│   │   ├── userModel.test.js
│   │   └── ...
│   ├── unit/                   # Pruebas de utilidades
│   │   ├── apiFeatures.test.js
│   │   └── appError.test.js
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

### Públicos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/articles` | Listar artículos (soporta filtro, ordenamiento, paginación) |
| `GET` | `/articles/:id` | Obtener artículo individual |
| `GET` | `/articles/:id/comments` | Obtener comentarios aprobados |
| `GET` | `/quicktips` | Listar trucos rápidos |
| `GET` | `/cheatsheets` | Listar cheatsheets |
| `GET` | `/experiences` | Listar experiencias |
| `POST` | `/users/signup` | Registro de usuario |
| `POST` | `/users/login` | Inicio de sesión (devuelve JWT) |
| `POST` | `/articles/:id/comments` | Enviar comentario (pendiente de aprobación) |
| `POST` | `/contact` | Enviar mensaje de contacto |

### Protegidos (JWT + Admin)

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/articles` | Crear artículo |
| `PATCH` | `/articles/:id` | Actualizar artículo |
| `DELETE` | `/articles/:id` | Eliminar artículo |
| `PATCH` | `/articles/:id/comments/:commentId/approve` | Aprobar comentario |
| `GET` | `/articles/:id/comments/pending` | Listar comentarios pendientes |
| `POST` | `/upload/article-image` | Subir + redimensionar portada de artículo |
| `POST` | `/upload/user-photo` | Subir + redimensionar avatar de usuario |

**Ejemplos de consultas:**
```
GET /api/v1/articles?category=Programacion&sort=-createdAt&fields=title,description&page=1&limit=10
GET /api/v1/articles?views[gte]=100&tags=Angular,TypeScript
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

**Cobertura:** 23 archivos de prueba entre integración, modelos y unitarias.

---

## Patrones de Diseño

| Patrón | Implementación | Propósito |
|---|---|---|
| **MVC** | models/ → controllers/ → routes/ | Separación de responsabilidades |
| **Factory** | `handlerFactory.js` | CRUD reutilizable para cualquier modelo |
| **Repository** | `repositories/` | Desacopla el acceso a datos de los controladores |
| **Builder** | `builders/` | Construcción composable de consultas |
| **Strategy** | `strategies/` | Métodos de autenticación intercambiables |

---

## Tecnologías Utilizadas

| Tecnología | Propósito |
|---|---|
| Node.js + Express | Servidor HTTP y enrutamiento |
| MongoDB + Mongoose | Base de datos y ODM |
| JWT (jsonwebtoken) | Autenticación basada en tokens |
| Multer + Sharp | Subida y procesamiento de imágenes |
| Winston | Logging estructurado |
| Nodemailer | Envío de emails |
| Helmet | Cabeceras de seguridad |
| express-rate-limit | Limitación de peticiones |
| xss-clean + mongo-sanitize | Sanitización de entrada |
| Swagger UI | Documentación de la API |
| Jest + mongodb-memory-server | Pruebas |

---

## Autor

**Diego Polanco** — [Polanco.dev](https://polanco.dev)
