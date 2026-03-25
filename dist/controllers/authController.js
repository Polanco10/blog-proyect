"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.refreshToken = exports.resetPassword = exports.forgotPassword = exports.restrictTo = exports.protect = exports.logout = exports.login = exports.signup = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = __importDefault(require("../models/userModel"));
const appError_1 = __importDefault(require("../utils/appError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const email_1 = __importDefault(require("../utils/email"));
const jwtStrategy = require('../strategies/jwtStrategy');
const localStrategy = require('../strategies/localStrategy');
const signToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};
const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    };
    res.cookie('jwt', token, cookieOptions);
    user.password = undefined; // no devolver la password en el response
    res.status(statusCode).json({
        status: 'success',
        token,
        data: { user },
    });
};
exports.signup = (0, catchAsync_1.default)(async (req, res, next) => {
    const newUser = await userModel_1.default.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
    });
    createSendToken(newUser, 201, req, res);
});
exports.login = (0, catchAsync_1.default)(async (req, res, next) => {
    // Delega la verificación de credenciales a LocalStrategy
    const payload = await localStrategy.authenticate(req);
    if (!payload) {
        return next(new appError_1.default('Incorrect email or password', 401));
    }
    const user = await userModel_1.default.findById(payload.id);
    if (!user) {
        return next(new appError_1.default('Incorrect email or password', 401));
    }
    createSendToken(user, 200, req, res);
});
const logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({ status: 'success' });
};
exports.logout = logout;
exports.protect = (0, catchAsync_1.default)(async (req, res, next) => {
    // Delega la extracción y verificación del token a JWTStrategy
    const payload = await jwtStrategy.authenticate(req);
    if (!payload) {
        return next(new appError_1.default('You are not logged in! Please log in to get access.', 401));
    }
    const currentUser = await userModel_1.default.findById(payload.id);
    if (!currentUser) {
        return next(new appError_1.default('The user belonging to this token does not exist.', 401));
    }
    if (currentUser.changedPasswordAfter(payload.iat)) {
        return next(new appError_1.default('User recently changed password! Please log in again.', 401));
    }
    req.user = currentUser;
    next();
});
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new appError_1.default('You do not have permission to perform this action', 403));
        }
        next();
    };
};
exports.restrictTo = restrictTo;
exports.forgotPassword = (0, catchAsync_1.default)(async (req, res, next) => {
    const user = await userModel_1.default.findOne({ email: req.body.email });
    if (!user) {
        return next(new appError_1.default('There is no user with email address', 404));
    }
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
    try {
        await (0, email_1.default)({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message,
        });
        res.status(200).json({ status: 'success', message: 'Token sent to email' });
    }
    catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new appError_1.default('There was an error sending the email. Try again later!', 500));
    }
});
exports.resetPassword = (0, catchAsync_1.default)(async (req, res, next) => {
    const hashedToken = crypto_1.default.createHash('sha256').update(req.params.token).digest('hex');
    const user = await userModel_1.default.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
        return next(new appError_1.default('Token is invalid or has expired!', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    createSendToken(user, 200, req, res);
});
exports.refreshToken = (0, catchAsync_1.default)(async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(new appError_1.default('No token provided', 401));
    }
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    }
    catch {
        return next(new appError_1.default('Invalid token', 401));
    }
    const user = await userModel_1.default.findById(decoded.id);
    if (!user) {
        return next(new appError_1.default('User no longer exists', 401));
    }
    createSendToken(user, 200, req, res);
});
exports.updatePassword = (0, catchAsync_1.default)(async (req, res, next) => {
    const user = await userModel_1.default.findById(req.user.id).select('+password');
    if (!user) {
        return next(new appError_1.default('User not found', 404));
    }
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new appError_1.default('Your current password is wrong', 401));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    createSendToken(user, 200, req, res);
});
