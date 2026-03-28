import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/userModel';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import sendEmail from '../utils/email';
import { addToBlacklist } from '../utils/tokenBlacklist';
const jwtStrategy = require('../strategies/jwtStrategy');
const localStrategy = require('../strategies/localStrategy');

interface JwtPayload {
    id: string;
    role: string;
    iat: number;
    exp?: number;
}

const signToken = (id: string, role: string): string => {
    return jwt.sign(
        { id, role },
        process.env.JWT_SECRET as string,
        {
            expiresIn: process.env.JWT_EXPIRES_IN,
        } as jwt.SignOptions
    );
};

const createSendToken = (user: any, statusCode: number, req: Request, res: Response): void => {
    const token = signToken(user._id, user.role);
    const cookieOptions = {
        expires: new Date(Date.now() + Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
        sameSite: 'strict' as const,
    };

    res.cookie('jwt', token, cookieOptions);
    user.password = undefined; // no devolver la password en el response
    res.status(statusCode).json({
        status: 'success',
        token,
        data: { user },
    });
};

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
    // Delega la verificación de credenciales a LocalStrategy
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

export const logout = (req: Request, res: Response): void => {
    // Blacklist the Bearer token so it can't be reused even before it expires
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

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Delega la extracción y verificación del token a JWTStrategy
    const payload: JwtPayload | null = await jwtStrategy.authenticate(req);
    if (!payload) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    const currentUser = await User.findById(payload.id);
    if (!currentUser) {
        return next(new AppError('The user belonging to this token does not exist.', 401));
    }
    if ((currentUser as any).changedPasswordAfter(payload.iat)) {
        return next(new AppError('User recently changed password! Please log in again.', 401));
    }
    (req as any).user = currentUser;
    next();
});

export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!roles.includes((req as any).user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403)) as any;
        }
        next();
    };
};

export const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with email address', 404));
    }
    const resetToken = (user as any).createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message,
        });
        res.status(200).json({ status: 'success', message: 'Token sent to email' });
    } catch (_err) {
        (user as any).passwordResetToken = undefined;
        (user as any).passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError('There was an error sending the email. Try again later!', 500));
    }
});

export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token as string)
        .digest('hex');
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
        return next(new AppError('Token is invalid or has expired!', 400));
    }
    (user as any).password = req.body.password;
    (user as any).passwordConfirm = req.body.passwordConfirm;
    (user as any).passwordResetToken = undefined;
    (user as any).passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, req, res);
});

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

    // Reject if token expired more than 7 days ago — prevents infinite refresh with stolen tokens
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

export const updatePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById((req as any).user.id).select('+password');
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    if (!(await (user as any).correctPassword(req.body.passwordCurrent, (user as any).password))) {
        return next(new AppError('Your current password is wrong', 401));
    }
    (user as any).password = req.body.password;
    (user as any).passwordConfirm = req.body.passwordConfirm;
    await user.save();

    createSendToken(user, 200, req, res);
});
