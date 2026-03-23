const express = require('express');
const path = require('path');
const { upload, resizeArticleImage, resizeUserPhoto } = require('../utils/upload');
const authController = require('../controllers/authController');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

// POST /api/v1/upload/article-image
// Admin only — upload and resize an article cover image
router.post(
    '/article-image',
    authController.protect,
    authController.restrictTo('admin'),
    upload.single('image'),
    resizeArticleImage,
    (req, res) => {
        res.status(200).json({
            status: 'success',
            data: { url: req.body.imageCover }
        });
    }
);

// POST /api/v1/upload/user-photo
// Authenticated users can upload their own avatar
router.post(
    '/user-photo',
    authController.protect,
    upload.single('photo'),
    resizeUserPhoto,
    (req, res) => {
        res.status(200).json({
            status: 'success',
            data: { url: req.body.photo }
        });
    }
);

module.exports = router;
