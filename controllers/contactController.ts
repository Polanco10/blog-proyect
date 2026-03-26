import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
const sendEmail = require('../utils/email');

exports.sendContactMessage = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return next(new AppError('Please provide name, email, subject, and message', 400));
    }

    if (message.length < 10) {
        return next(new AppError('Message must be at least 10 characters', 400));
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return next(new AppError('Please provide a valid email address', 400));
    }

    await sendEmail({
        email: process.env.CONTACT_EMAIL || 'diego.polancob@gmail.com',
        subject: `[Polanco.dev Contact] ${subject}`,
        message: `New contact form submission:\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
    });

    res.status(200).json({
        status: 'success',
        message: 'Your message has been sent successfully!',
    });
});
