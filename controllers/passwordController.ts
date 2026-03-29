import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import User from '../models/userModel';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import sendEmail from '../utils/email';
import { createSendToken } from './tokenService';

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
