"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const resumeController = require('../controllers/resumeController');
const router = express_1.default.Router();
router.route('/:lang').get(resumeController.getResume);
module.exports = router;
