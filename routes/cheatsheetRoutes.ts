import express, { Router } from 'express';
const cheatsheetController = require('../controllers/cheatsheetController');
const authController = require('./../controllers/authController');
const { validateCheatsheet, validateCheatsheetPatch } = require('../utils/validators');
const { ROLES } = require('../constants');

const router: Router = express.Router();

router
    .route('/')
    .get(cheatsheetController.getAllCheatsheets)
    .post(authController.protect, authController.restrictTo(ROLES.ADMIN), validateCheatsheet, cheatsheetController.createCheatsheet);

router
    .route('/:id')
    .get(cheatsheetController.getCheatsheet)
    .patch(authController.protect, authController.restrictTo(ROLES.ADMIN), validateCheatsheetPatch, cheatsheetController.updateCheatsheet)
    .delete(authController.protect, authController.restrictTo(ROLES.ADMIN), cheatsheetController.deleteCheatsheet);

export = router;
