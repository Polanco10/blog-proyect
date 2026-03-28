const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp')
const compression = require('compression');
const cors = require('cors');
const { randomUUID } = require('crypto');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const logger = require('./utils/logger');
const articleRouter = require('./routes/articleRoutes');
const userRouter = require('./routes/userRoutes');
const experienceRouter = require('./routes/experienceRoutes');
const cheatsheetRouter = require('./routes/cheatsheetRoutes');
const quicktipRouter = require('./routes/quicktipRoutes');
const contactRouter = require('./routes/contactRoutes');
const commentRouter = require('./routes/commentRoutes');
const feedRouter = require('./routes/feedRoutes');
const resumeRouter = require('./routes/resumeRoutes');
const uploadRouter = require('./routes/uploadRoutes');

const app = express();

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // Necesario detrás del proxy de Railway/Nginx
}
//global middlewares
//middlewares -> en la mitad entre el req y el res

// Restringir CORS a orígenes permitidos en producción
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:4200'];

const corsOptions = {
    origin: (origin, callback) => {
        // Permitir requests sin origen (curl, Postman, SSR)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
    credentials: true,
};

app.use(cors(corsOptions)); //agrega algunos headers al response

app.options('*', cors(corsOptions)); //Habilitar cors para todos los http methods

app.use(helmet()); // Se agregan headers de seguridad http 

//morgan -> logger middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
const limiter = rateLimit({ // Requests validas por IP - max: 100 -> 100 request / windowMs -> 3600.000ms = 1hr
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: ' Too many request from this IP, please try again in an hour'
});
if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
    app.use('/api', limiter); //middleware - afecta a todas las rutas que empiecen con /api
}

// permite ver properties del objeto express (ej:res,req), leer elemento del .body
app.use(express.json({ limit: '10kb' })); //limita el tamaño del .body req a 10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//permite abrir por url archivos estaticos desde la carpeta sin necesidad de un route
app.use(express.static(`${__dirname}/public`));

//Sanitizacion de data  contra NoSQL query injection - Revisa el req.body, req.query req.params y saca los $ . etc
app.use(mongoSanitize());

//Sanitizacion de data contra XSS - Evita que se ingrese codigo html/js en algun input
app.use(xss());

//Prevenir parameter pollution - Evita que se repitan parametros en los filtros (ej: sort=description&sort=title) /  whitelist -> excepcion de parametros
app.use(hpp({
    whitelist: ['title', 'author']
}));

app.use(compression()) //comprimir texto enviado a los clients

// Correlation ID middleware — propaga X-Request-ID en request y response
app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
});

// date middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// structured request logging (skip in test to keep output clean)
if (process.env.NODE_ENV !== 'test') {
    app.use((req, res, next) => {
        res.on('finish', () => {
            logger.info('HTTP request', {
                requestId: req.requestId,
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                ip: req.ip,
            });
        });
        next();
    });
}

// app.get('/api/v1/articles', getAllArticles);
// app.post('/api/v1/articles', createArticle);
//PATCH para modificaciones parciales
// app.get('/api/v1/articles/:id', getArticle);
// app.patch('/api/v1/articles/:id', updateArticle);
// app.delete('/api/v1/articles/:id', deleteArticle);

// Cache-Control for public read-only GET responses (1 hour).
// Only applied to GET; mutations (POST/PATCH/DELETE) get no-store via the else branch.
const publicCache = (req, res, next) => {
    if (req.method === 'GET') {
        res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=60');
    } else {
        res.set('Cache-Control', 'no-store');
    }
    next();
};

//routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/v1/articles', publicCache, articleRouter); //middleware -> mounting multiple routers
app.use('/api/v1/users', userRouter); //middleware -> mounting multiple routers
app.use('/api/v1/experiences', publicCache, experienceRouter);
app.use('/api/v1/cheatsheets', publicCache, cheatsheetRouter);
app.use('/api/v1/quicktips', publicCache, quicktipRouter);
app.use('/api/v1/contact', contactRouter);
app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/resume', resumeRouter);
app.use('/api/v1/articles/:articleId/comments', commentRouter);
app.use('/api/v1/comments', commentRouter); // admin-only top-level access (no articleId needed)
app.use('/api', feedRouter);
app.all('*', (req, res, next) => { // Unhandled routes - rutas no definidas
    next(new AppError(` Can't find ${req.originalUrl} on this server`, 404)); //se salta el resto de los middleware 
})

app.use(globalErrorHandler); // Error middleware

module.exports = app;
