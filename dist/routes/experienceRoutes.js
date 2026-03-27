"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const experienceController = require('../controllers/experienceController');
const authController = require('./../controllers/authController');
const { validateExperience, validateExperiencePatch } = require('../utils/validators');
const { ROLES } = require('../constants');
const router = express_1.default.Router();
router
    .route('/')
    .get(experienceController.getAllExperiences)
    .post(authController.protect, authController.restrictTo(ROLES.ADMIN), validateExperience, experienceController.createExperience);
router
    .route('/:id')
    .get(experienceController.getExperience)
    .patch(authController.protect, authController.restrictTo(ROLES.ADMIN), validateExperiencePatch, experienceController.updateExperience)
    .delete(authController.protect, authController.restrictTo(ROLES.ADMIN), experienceController.deleteExperience);
module.exports = router;
