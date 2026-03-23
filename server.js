const mongoose = require('mongoose');
// para conectar e interactuar con la bd
const dotenv = require('dotenv');

// Cargar env antes que el logger para que NODE_ENV esté disponible
dotenv.config({ path: './config.env' });

const logger = require('./utils/logger');

process.on('uncaughtException', err => { //se define un listener para manejar excepciones - ej:uso de variable sin declarar
    logger.error('UNCAUGHT EXCEPTION!', { name: err.name, message: err.message, stack: err.stack });
    process.exit(1); //se cierra la aplicacion
});

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD); //se reemplaza la palabra por la password real de .config.env

mongoose
    .connect(process.env.DATABASE_LOCAL)
    .then(() => {
        logger.info('DB connection successful!');
    })

const app = require('./app');

//start server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    logger.info(`App running on port ${port}`, { env: process.env.NODE_ENV });
});

process.on('unhandledRejection', err => { //se define un listener para manejar las promesas que envien un rejection - ej:conexion con la bd
    logger.error('UNHANDLED REJECTION!', { name: err.name, message: err.message });
    server.close(() => { //se cierran primero las request que esten pendientes
        process.exit(1); //se cierra la aplicacion
    });
});

process.on('SIGTERM', () => { //Cerrar el proceso cuando Heroku reinicie las app.
    logger.info('SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated!');
    });
});

