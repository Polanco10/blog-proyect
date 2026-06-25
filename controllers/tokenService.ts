import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/userModel';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import { addToBlacklist } from '../utils/tokenBlacklist';
import { IUser } from '../types';

interface JwtPayload {
    id: string;
    role: string;
    iat: number;
    exp?: number;
}

export const signToken = (id: string, role: string): string => {
    return jwt.sign(
        { id, role },
        process.env.JWT_SECRET as string,
        {
            expiresIn: process.env.JWT_EXPIRES_IN,
        } as jwt.SignOptions
    );
};

export const createSendToken = (user: IUser, statusCode: number, req: Request, res: Response): void => {
    const token = signToken(user._id.toString(), user.role);
    const cookieOptions = {
        expires: new Date(Date.now() + Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
        sameSite: 'strict' as const,
    };

    res.cookie('jwt', token, cookieOptions);
    (user as { password?: string }).password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: { user },
    });
};

export const logout = (req: Request, res: Response): void => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.decode(token) as JwtPayload | null;
        if (decoded?.exp) {
            addToBlacklist(token, decoded.exp * 1000);
        }
    }

    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        sameSite: 'strict' as const,
    });
    res.status(200).json({ status: 'success' });
};

export const refreshToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(new AppError('No token provided', 401));
    }

    let decoded: JwtPayload;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET as string, {
            ignoreExpiration: true,
            algorithms: ['HS256'],
        }) as JwtPayload;
    } catch {
        return next(new AppError('Invalid token', 401));
    }

    // Rechazar si el token expiró hace más de 7 días
    const sevenDaysSeconds = 7 * 24 * 60 * 60;
    if (decoded.exp && Math.floor(Date.now() / 1000) - decoded.exp > sevenDaysSeconds) {
        return next(new AppError('Session expired — please log in again', 401));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
        return next(new AppError('User no longer exists', 401));
    }

    createSendToken(user, 200, req, res);
});
