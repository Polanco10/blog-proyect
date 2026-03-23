const express = require('express');
const experienceController = require('../controllers/experienceController');
const authController = require('./../controllers/authController');
const { ROLES } = require('../constants');

const router = express.Router();

router
    .route('/')
    .get(experienceController.getAllExperiences)
    .post(authController.protect, authController.restrictTo(ROLES.ADMIN), experienceController.createExperience);

router
    .route('/:id')
    .get(experienceController.getExperience)
    .patch(authController.protect, authController.restrictTo(ROLES.ADMIN), experienceController.updateExperience)
    .delete(authController.protect, authController.restrictTo(ROLES.ADMIN), experienceController.deleteExperience);

module.exports = router;
