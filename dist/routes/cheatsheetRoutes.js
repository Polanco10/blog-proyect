const express = require('express');
const cheatsheetController = require('../controllers/cheatsheetController');
const authController = require('./../controllers/authController');
const { validateCheatsheet } = require('../utils/validators');
const { ROLES } = require('../constants');
const router = express.Router();
router
    .route('/')
    .get(cheatsheetController.getAllCheatsheets)
    .post(authController.protect, authController.restrictTo(ROLES.ADMIN), validateCheatsheet, cheatsheetController.createCheatsheet);
router
    .route('/:id')
    .get(cheatsheetController.getCheatsheet)
    .patch(authController.protect, authController.restrictTo(ROLES.ADMIN), validateCheatsheet, cheatsheetController.updateCheatsheet)
    .delete(authController.protect, authController.restrictTo(ROLES.ADMIN), cheatsheetController.deleteCheatsheet);
module.exports = router;
