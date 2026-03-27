"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const cheatsheetController = require('../controllers/cheatsheetController');
const authController = require('./../controllers/authController');
const { validateCheatsheet, validateCheatsheetPatch } = require('../utils/validators');
const { ROLES } = require('../constants');
const router = express_1.default.Router();
router
    .route('/')
    .get(cheatsheetController.getAllCheatsheets)
    .post(authController.protect, authController.restrictTo(ROLES.ADMIN), validateCheatsheet, cheatsheetController.createCheatsheet);
router
    .route('/:id')
    .get(cheatsheetController.getCheatsheet)
    .patch(authController.protect, authController.restrictTo(ROLES.ADMIN), validateCheatsheetPatch, cheatsheetController.updateCheatsheet)
    .delete(authController.protect, authController.restrictTo(ROLES.ADMIN), cheatsheetController.deleteCheatsheet);
module.exports = router;
