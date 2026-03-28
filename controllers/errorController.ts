import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/appError';
import logger from '../utils/logger';

interface MongooseError extends Error {
    path?: string;
    value?: unknown;
    errmsg?: string;
    errors?: Record<string, { message: string }>;
    code?: number;
}

const handleCastErrorDB = (err: MongooseError): AppError => {
    //manejar errores provinientes de la base de datos - ej: id no existe
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: MongooseError): AppError => {
    // duplicate key - ese valor ya existe en la base de datos
    const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0] ?? 'unknown';
    const message = `Duplicate field value: ${value}. Please use another value.`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err: MongooseError): AppError => {
    // error provocado por la validacion del modelo
    const errors = Object.values(err.errors ?? {}).map(el => el.message); //arreglo de todos los mensajes de error de validacion
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const sendErrorDev = (err: AppError, res: Response): void => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorProd = (err: AppError, req: Request, res: Response): void => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        logger.error('Unexpected error', {
            requestId: (req as any).requestId,
            name: err.name,
            message: err.message,
            stack: err.stack,
        }); //Log error

        res.status(500).json({
            //Enviar un mensaje generico
            status: 'error',
            message: 'Something is wrong!',
        });
    }
};

const handleJWTError = (): AppError => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = (): AppError => new AppError('Your token has expired! Please log in again.', 401);

module.exports = (err: MongooseError & AppError, req: Request, res: Response, _next: NextFunction): void => {
    //Error handling middleware - maneja errores operacionales y errores inesperados
    (err as any).statusCode = (err as any).statusCode || 500;
    (err as any).status = (err as any).status || 'error';

    // Transformar errores de Mongoose/JWT a AppError con código correcto (todos los entornos)
    let error: AppError = Object.assign(err) as AppError;
    if (error.name === 'CastError') error = handleCastErrorDB(err);
    if ((err as any).code === 11000) error = handleDuplicateFieldsDB(err);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        sendErrorDev(error, res);
    } else if (process.env.NODE_ENV === 'production') {
        sendErrorProd(error, req, res);
    }
};
