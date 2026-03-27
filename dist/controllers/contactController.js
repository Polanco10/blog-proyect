"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
const sendEmail = require('../utils/email');
exports.sendContactMessage = (0, catchAsync_1.default)(async (req, res, next) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
        return next(new appError_1.default('Please provide name, email, subject, and message', 400));
    }
    if (message.length < 10) {
        return next(new appError_1.default('Message must be at least 10 characters', 400));
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return next(new appError_1.default('Please provide a valid email address', 400));
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
