const express = require('express');
const commentController = require('../controllers/commentController');
const authController = require('../controllers/authController');
const { validateComment } = require('../utils/validators');

// mergeParams: true allows access to :articleId from parent router
const router = express.Router({ mergeParams: true });

// Public
router.route('/')
    .get(commentController.getCommentsByArticle)
    .post(validateComment, commentController.createComment);

// Admin
router.use(authController.protect, authController.restrictTo('admin'));
router.route('/pending').get(commentController.getPendingComments);
router.route('/:id/approve').patch(commentController.approveComment);
router.route('/:id').delete(commentController.deleteComment);

module.exports = router;
