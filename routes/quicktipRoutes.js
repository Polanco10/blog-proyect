const express = require('express');
const quicktipController = require('../controllers/quicktipController');
const authController = require('./../controllers/authController');
const { validateQuickTip } = require('../utils/validators');
const { ROLES } = require('../constants');

const router = express.Router();

router
    .route('/')
    .get(quicktipController.getAllQuickTips)
    .post(authController.protect, authController.restrictTo(ROLES.ADMIN), validateQuickTip, quicktipController.createQuickTip);

router
    .route('/:id')
    .get(quicktipController.getQuickTip)
    .patch(authController.protect, authController.restrictTo(ROLES.ADMIN), validateQuickTip, quicktipController.updateQuickTip)
    .delete(authController.protect, authController.restrictTo(ROLES.ADMIN), quicktipController.deleteQuickTip);

module.exports = router;
