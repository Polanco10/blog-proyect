const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp')
const compression = require('compression');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const articleRouter = require('./routes/articleRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

//app.enable('trust proxy');
//global middlewares
//middlewares -> en la mitad entre el req y el res
app.use(cors()); //agrega algunos headers al response

app.options('*', cors()); //Habilitar cors para todos los http methods

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
app.use('/api', limiter); //middleware - afecta a todas las rutas que empiecen con /api

// permite ver properties del objeto express (ej:res,req), leer elemento del .body
app.use(express.json({ limit: '10kb' })); //limita el tamaño del .body req a 10kb

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

// date middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// app.get('/api/v1/articles', getAllArticles);
// app.post('/api/v1/articles', createArticle);
//PATCH para modificaciones parciales
// app.get('/api/v1/articles/:id', getArticle);
// app.patch('/api/v1/articles/:id', updateArticle);
// app.delete('/api/v1/articles/:id', deleteArticle);

//routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/v1/articles', articleRouter); //middleware -> mounting multiple routers
app.use('/api/v1/users', userRouter); //middleware -> mounting multiple routers
app.all('*', (req, res, next) => { // Unhandled routes - rutas no definidas
    next(new AppError(` Can't find ${req.originalUrl} on this server`, 404)); //se salta el resto de los middleware 
})

app.use(globalErrorHandler); // Error middleware

module.exports = app;
