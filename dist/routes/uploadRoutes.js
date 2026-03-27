"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const rateLimit = require('express-rate-limit');
const { upload, resizeArticleImage, resizeUserPhoto } = require('../utils/upload');
const authController = require('../controllers/authController');
const { ROLES } = require('../constants');
const router = express_1.default.Router();
// Rate limiter para uploads — previene abusos de almacenamiento
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 20,
    message: 'Too many upload requests. Try again in 1 hour.',
});
// POST /api/v1/upload/article-image
// Admin only — upload and resize an article cover image
router.post('/article-image', uploadLimiter, authController.protect, authController.restrictTo(ROLES.ADMIN), upload.single('image'), resizeArticleImage, (req, res) => {
    res.status(200).json({
        status: 'success',
        data: { url: req.body.imageCover }
    });
});
// POST /api/v1/upload/user-photo
// Authenticated users can upload their own avatar
router.post('/user-photo', uploadLimiter, authController.protect, upload.single('photo'), resizeUserPhoto, (req, res) => {
    res.status(200).json({
        status: 'success',
        data: { url: req.body.photo }
    });
});
module.exports = router;
