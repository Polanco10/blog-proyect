/**
 * Auth Controller — barrel module.
 *
 * Split into focused modules for SRP:
 *  - authMiddleware.ts  → protect, restrictTo
 *  - tokenService.ts    → signToken, createSendToken, logout, refreshToken
 *  - passwordController.ts → forgotPassword, resetPassword, updatePassword
 *
 * This file re-exports everything so existing route imports remain unchanged.
 */

import { Request, Response, NextFunction } from 'express';
import User from '../models/userModel';
import catchAsync from '../utils/catchAsync';
import { createSendToken } from './tokenService';
const localStrategy = require('../strategies/localStrategy');
import AppError from '../utils/appError';

// Re-export middleware
export { protect, restrictTo } from './authMiddleware';

// Re-export token operations
export { logout, refreshToken } from './tokenService';

// Re-export password operations
export { forgotPassword, resetPassword, updatePassword } from './passwordController';

// --- Auth handlers (signup, login) live here ---

interface JwtPayload {
    id: string;
    role: string;
    iat: number;
    exp?: number;
}

export const signup = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
    });
    createSendToken(newUser, 201, req, res);
});

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const payload: JwtPayload | null = await localStrategy.authenticate(req);
    if (!payload) {
        return next(new AppError('Incorrect email or password', 401));
    }
    const user = await User.findById(payload.id);
    if (!user) {
        return next(new AppError('Incorrect email or password', 401));
    }
    createSendToken(user, 200, req, res);
});
