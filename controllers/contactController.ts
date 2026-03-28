import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
const sendEmail = require('../utils/email');

exports.sendContactMessage = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, subject, message } = req.body;

    // Required fields
    if (!name || !email || !subject || !message) {
        return next(new AppError('Name, email, subject, and message are required.', 400));
    }

    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
        return next(new AppError('Name must be between 2 and 100 characters.', 400));
    }
    if (!validator.isEmail(String(email))) {
        return next(new AppError('Please provide a valid email address.', 400));
    }
    if (typeof subject !== 'string' || subject.trim().length < 2 || subject.trim().length > 200) {
        return next(new AppError('Subject must be between 2 and 200 characters.', 400));
    }
    if (typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 5000) {
        return next(new AppError('Message must be between 10 and 5000 characters.', 400));
    }

    await sendEmail({
        email: process.env.CONTACT_EMAIL || 'diego.polancob@gmail.com',
        subject: `[Polanco.dev Contact] ${subject.trim()}`,
        message: `New contact form submission:\n\nName: ${name.trim()}\nEmail: ${email}\nSubject: ${subject.trim()}\n\nMessage:\n${message.trim()}`,
    });

    res.status(200).json({
        status: 'success',
        message: 'Your message has been sent successfully!',
    });
});
