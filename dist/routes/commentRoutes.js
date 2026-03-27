"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const commentController = require('../controllers/commentController');
const authController = require('../controllers/authController');
const { validateComment } = require('../utils/validators');
const { ROLES } = require('../constants');
// mergeParams: true allows access to :articleId from parent router
const router = express_1.default.Router({ mergeParams: true });
// Public
router.route('/')
    .get(commentController.getCommentsByArticle)
    .post(validateComment, commentController.createComment);
// Admin
router.use(authController.protect, authController.restrictTo(ROLES.ADMIN));
router.route('/pending').get(commentController.getPendingComments);
router.route('/:id/approve').patch(commentController.approveComment);
router.route('/:id').delete(commentController.deleteComment);
module.exports = router;
