const express = require('express');
const quicktipController = require('../controllers/quicktipController');
const authController = require('./../controllers/authController');

const router = express.Router();

router
    .route('/')
    .get(quicktipController.getAllQuickTips)
    .post(authController.protect, authController.restrictTo('admin'), quicktipController.createQuickTip);

router
    .route('/:id')
    .get(quicktipController.getQuickTip)
    .patch(authController.protect, authController.restrictTo('admin'), quicktipController.updateQuickTip)
    .delete(authController.protect, authController.restrictTo('admin'), quicktipController.deleteQuickTip);

module.exports = router;
