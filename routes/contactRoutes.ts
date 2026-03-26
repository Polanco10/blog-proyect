import express, { Router } from 'express';
const rateLimit = require('express-rate-limit');
const contactController = require('../controllers/contactController');
const { validateContact } = require('../utils/validators');

const router: Router = express.Router();

// Rate limiter para el formulario de contacto — previene spam
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10,
    message: 'Too many contact requests. Try again in 1 hour.',
});

router.post('/', contactLimiter, validateContact, contactController.sendContactMessage);

export = router;
