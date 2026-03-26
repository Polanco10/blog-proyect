import express, { Router } from 'express';
const resumeController = require('../controllers/resumeController');

const router: Router = express.Router();

router.route('/:lang').get(resumeController.getResume);

export = router;
