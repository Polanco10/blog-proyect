const express = require('express');

const router = express.Router();

router.post('/', async (req, res, next) => {
    // TODO: Map to actual Nodemailer configuration
    res.status(200).json({
        status: 'success',
        message: 'Your email has been successfully sent!'
    });
});

module.exports = router;
