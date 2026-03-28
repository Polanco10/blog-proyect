import express, { Router } from 'express';
const commentController = require('../controllers/commentController');
const authController = require('../controllers/authController');
const { validateComment } = require('../utils/validators');
const { ROLES } = require('../constants');

// mergeParams: true allows access to :articleId from parent router
const router: Router = express.Router({ mergeParams: true });

// Public
router.route('/').get(commentController.getCommentsByArticle);

// Admin
router.use(authController.protect, authController.restrictTo(ROLES.ADMIN));
router.route('/').post(validateComment, commentController.createComment);
router.route('/pending').get(commentController.getPendingComments);
router.route('/:id/approve').patch(commentController.approveComment);
router.route('/:id').delete(commentController.deleteComment);

export = router;
