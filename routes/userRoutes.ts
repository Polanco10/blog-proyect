import express, { Router } from 'express';
const rateLimit = require('express-rate-limit');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const { validateSignup } = require('../utils/validators');
const { ROLES } = require('../constants');

const router: Router = express.Router(); //  middleware function

// Rate limiter específico para forgotPassword — previene enumeración de emails
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5,
    message: 'Too many password reset requests. Try again in 1 hour.',
});

// Rate limiter para login — previene fuerza bruta
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10,
    message: 'Too many login attempts. Try again in 15 minutes.',
});

//routes
router.post('/signup', validateSignup, authController.signup);
router.post('/login', loginLimiter, authController.login);
router.post('/forgotPassword', forgotPasswordLimiter, authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect); //Aplica authControler.protect para todas las routes definidas bajo esta linea
router.get('/logout', authController.restrictTo(ROLES.ADMIN), authController.logout);
router.post('/refresh-token', authController.restrictTo(ROLES.ADMIN), authController.refreshToken);
router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo(ROLES.ADMIN)); //Aplica authControler.restrictTo para todas las routes definidas bajo esta linea
router.route('/').get(userController.getAllUsers);
router.route('/:id').get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser);

export = router;
