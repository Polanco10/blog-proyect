"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const appError_1 = __importDefault(require("../utils/appError"));
const logger_1 = __importDefault(require("../utils/logger"));
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new appError_1.default(message, 400);
};
const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0] ?? 'unknown';
    const message = `Duplicate field value: ${value}. Please use another value.`;
    return new appError_1.default(message, 400);
};
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors ?? {}).map(el => el.message); //arreglo de todos los mensajes de error de validacion
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new appError_1.default(message, 400);
};
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};
const sendErrorProd = (err, req, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    else {
        logger_1.default.error('Unexpected error', { requestId: req.requestId, name: err.name, message: err.message, stack: err.stack }); //Log error
        res.status(500).json({
            status: 'error',
            message: 'Something is wrong!',
        });
    }
};
const handleJWTError = () => new appError_1.default('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new appError_1.default('Your token has expired! Please log in again.', 401);
module.exports = (err, req, res, _next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    // Transformar errores de Mongoose/JWT a AppError con código correcto (todos los entornos)
    let error = Object.assign(err);
    if (error.name === 'CastError')
        error = handleCastErrorDB(err);
    if (err.code === 11000)
        error = handleDuplicateFieldsDB(err);
    if (error.name === 'ValidationError')
        error = handleValidationErrorDB(err);
    if (error.name === 'JsonWebTokenError')
        error = handleJWTError();
    if (error.name === 'TokenExpiredError')
        error = handleJWTExpiredError();
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        sendErrorDev(error, res);
    }
    else if (process.env.NODE_ENV === 'production') {
        sendErrorProd(error, req, res);
    }
};
