import { Router } from 'express';
import * as articleController from '../controllers/articleController';
import * as authController from '../controllers/authController';
const { validateArticle, validateArticlePatch } = require('../utils/validators');
const { upload, resizeArticleImage } = require('../utils/upload');
const { ROLES } = require('../constants');

const router = Router();

// Aliased / special routes (before /:id to avoid conflicts)
router.route('/top-5').get(articleController.aliasTopArticles, articleController.getAllArticles);
router.route('/search').get(articleController.searchArticles);
router.route('/drafts').get(authController.protect, authController.restrictTo(ROLES.ADMIN), articleController.getDrafts);
router.route('/admin/stats').get(authController.protect, authController.restrictTo(ROLES.ADMIN), articleController.getAdminStats);

router
    .route('/')
    .get(articleController.getAllArticles)
    .post(
        authController.protect,
        authController.restrictTo(ROLES.ADMIN),
        upload.single('imageCover'),
        resizeArticleImage,
        validateArticle,
        articleController.setAuthor,
        articleController.createArticle,
    );

router
    .route('/:title')
    .get(articleController.getArticle)
    .patch(
        authController.protect,
        authController.restrictTo(ROLES.ADMIN),
        upload.single('imageCover'),
        resizeArticleImage,
        validateArticlePatch,
        articleController.updateArticle,
    )
    .delete(authController.protect, authController.restrictTo(ROLES.ADMIN), articleController.deleteArticle);

// Article sub-actions
router.route('/:title/view').patch(articleController.incrementViews);
router.route('/:title/like').patch(articleController.likeArticle);
router.route('/:title/related').get(articleController.getRelatedArticles);

module.exports = router;
