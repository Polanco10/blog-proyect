const mongoose = require('mongoose');
// para conectar e interactuar con la bd
const dotenv = require('dotenv');

process.on('uncaughtException', err => { //se define un listener para manejar excepciones - ej:uso de variable sin declarar
    console.log('UNCAUGHT EXCEPTION!');
    console.log(err.name, err.message);
    process.exit(1); //se cierra la aplicacion
});

//lee las variables de entorno de config.env y las guarda en las variables de entorno de nodejs
dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD); //se reemplaza la palabra por la password real de .config.env

mongoose
    .connect(process.env.DATABASE_LOCAL)
    // .connect(DB, {
    //     useNewUrlParser: true,
    //     useCreateIndex: true,
    //     useFindAndModify: false,
    //     useUnifiedTopology: true
    // }).then(() => {
    .then(() => {
        console.log('DB connection successful!');
    })

const app = require('./app');

//start server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}`);
});

process.on('unhandledRejection', err => { //se define un listener para manejar las promesas que envien un rejection - ej:conexion con la bd
    console.log('UNHANDLER REJECTION!');
    console.log(err.name, err.message);
    server.close(() => { //se cierran primero las request que esten pendientes
        process.exit(1); //se cierra la aplicacion
    });
});

process.on('SIGTERM', () => { //Cerrar el proceso cuando Heroku reinicie las app.
    console.log('SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
        console.log('Process terminated!')
    })
})

