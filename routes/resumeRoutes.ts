import express, { Router } from 'express';
import * as authController from '../controllers/authController';
const resumeController = require('../controllers/resumeController');
const { ROLES } = require('../constants');

const router: Router = express.Router();

router.route('/:lang').get(resumeController.getResume);

// Admin-only: update the singleton resume document
router.route('/').patch(authController.protect, authController.restrictTo(ROLES.ADMIN), resumeController.updateResume);

export = router;
