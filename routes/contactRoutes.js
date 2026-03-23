const express = require('express');
const contactController = require('../controllers/contactController');
const { validateContact } = require('../utils/validators');

const router = express.Router();

router.post('/', validateContact, contactController.sendContactMessage);

module.exports = router;
