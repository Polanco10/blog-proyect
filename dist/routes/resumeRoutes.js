const express = require('express');
const resumeController = require('../controllers/resumeController');
const router = express.Router();
router.route('/:lang').get(resumeController.getResume);
module.exports = router;
