import { Response, NextFunction } from 'express';
import User from '../models/userModel';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import { AuthRequest } from '../types';
const jwtStrategy = require('../strategies/jwtStrategy');

interface JwtPayload {
    id: string;
    role: string;
    iat: number;
    exp?: number;
}

export const protect = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Delega la extracción y verificación del token a JWTStrategy
    const payload: JwtPayload | null = await jwtStrategy.authenticate(req);
    if (!payload) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    const currentUser = await User.findById(payload.id);
    if (!currentUser) {
        return next(new AppError('The user belonging to this token does not exist.', 401));
    }
    if (currentUser.changedPasswordAfter(payload.iat)) {
        return next(new AppError('User recently changed password! Please log in again.', 401));
    }
    req.user = currentUser;
    next();
});

export const restrictTo = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403)) as any;
        }
        next();
    };
};
