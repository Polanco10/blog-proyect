const express = require('express');
const cheatsheetController = require('../controllers/cheatsheetController');
const authController = require('./../controllers/authController');
const { validateCheatsheet } = require('../utils/validators');

const router = express.Router();

router
    .route('/')
    .get(cheatsheetController.getAllCheatsheets)
    .post(authController.protect, authController.restrictTo('admin'), validateCheatsheet, cheatsheetController.createCheatsheet);

router
    .route('/:id')
    .get(cheatsheetController.getCheatsheet)
    .patch(authController.protect, authController.restrictTo('admin'), validateCheatsheet, cheatsheetController.updateCheatsheet)
    .delete(authController.protect, authController.restrictTo('admin'), cheatsheetController.deleteCheatsheet);

module.exports = router;
