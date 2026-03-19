const express = require('express');
const experienceController = require('../controllers/experienceController');
const authController = require('./../controllers/authController');

const router = express.Router();

router
    .route('/')
    .get(experienceController.getAllExperiences)
    .post(authController.protect, authController.restrictTo('admin'), experienceController.createExperience);

router
    .route('/:id')
    .get(experienceController.getExperience)
    .patch(authController.protect, authController.restrictTo('admin'), experienceController.updateExperience)
    .delete(authController.protect, authController.restrictTo('admin'), experienceController.deleteExperience);

module.exports = router;
