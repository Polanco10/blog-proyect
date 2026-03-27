"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const quicktipController = require('../controllers/quicktipController');
const authController = require('./../controllers/authController');
const { validateQuickTip, validateQuickTipPatch } = require('../utils/validators');
const { ROLES } = require('../constants');
const router = express_1.default.Router();
router
    .route('/')
    .get(quicktipController.getAllQuickTips)
    .post(authController.protect, authController.restrictTo(ROLES.ADMIN), validateQuickTip, quicktipController.createQuickTip);
router
    .route('/:id')
    .get(quicktipController.getQuickTip)
    .patch(authController.protect, authController.restrictTo(ROLES.ADMIN), validateQuickTipPatch, quicktipController.updateQuickTip)
    .delete(authController.protect, authController.restrictTo(ROLES.ADMIN), quicktipController.deleteQuickTip);
module.exports = router;
