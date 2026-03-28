import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync';
const sendEmail = require('../utils/email');

exports.sendContactMessage = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { name, email, subject, message } = req.body;

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
