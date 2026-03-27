const mongoose = require('mongoose');
// para conectar e interactuar con la bd
const dotenv = require('dotenv');
// Cargar env antes que el logger para que NODE_ENV esté disponible
dotenv.config({ path: './config.env' });
const logger = require('./utils/logger');
process.on('uncaughtException', err => {
    logger.error('UNCAUGHT EXCEPTION!', { name: err.name, message: err.message, stack: err.stack });
    process.exit(1); //se cierra la aplicacion
});
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD); //se reemplaza la palabra por la password real de .config.env
const connectionString = process.env.NODE_ENV === 'production' ? DB : process.env.DATABASE_LOCAL;
mongoose
    .connect(connectionString)
    .then(() => {
    logger.info('DB connection successful!', { env: process.env.NODE_ENV });
});
const app = require('./app');
//start server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    logger.info(`App running on port ${port}`, { env: process.env.NODE_ENV });
});
process.on('unhandledRejection', err => {
    logger.error('UNHANDLED REJECTION!', { name: err.name, message: err.message });
    server.close(() => {
        process.exit(1); //se cierra la aplicacion
    });
});
process.on('SIGTERM', () => {
    logger.info('SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated!');
    });
});
