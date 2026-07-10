import express, { Router } from 'express';
const quicktipController = require('../controllers/quicktipController');
const authController = require('./../controllers/authController');
const { validateQuickTip, validateQuickTipPatch } = require('../utils/validators');
const { ROLES } = require('../constants');
const { stripPublishedFilter, includeDrafts } = require('../utils/visibility');

const router: Router = express.Router();

// Listado admin: incluye borradores (debe ir antes de /:id)
router
    .route('/admin/all')
    .get(
        authController.protect,
        authController.restrictTo(ROLES.ADMIN),
        includeDrafts,
        quicktipController.getAllQuickTips
    );

router
    .route('/')
    .get(stripPublishedFilter, quicktipController.getAllQuickTips)
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
