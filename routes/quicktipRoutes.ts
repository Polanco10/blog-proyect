import express, { Router } from 'express';
const quicktipController = require('../controllers/quicktipController');
const authController = require('./../controllers/authController');
const { validateQuickTip, validateQuickTipPatch } = require('../utils/validators');
const { ROLES } = require('../constants');

const router: Router = express.Router();

router
    .route('/')
    .get(quicktipController.getAllQuickTips)
    .post(
        authController.protect,
        authController.restrictTo(ROLES.ADMIN),
        validateQuickTip,
        quicktipController.createQuickTip
    );

router
    .route('/:id')
    .get(quicktipController.getQuickTip)
    .patch(
        authController.protect,
        authController.restrictTo(ROLES.ADMIN),
        validateQuickTipPatch,
        quicktipController.updateQuickTip
    )
    .delete(authController.protect, authController.restrictTo(ROLES.ADMIN), quicktipController.deleteQuickTip);

export = router;
