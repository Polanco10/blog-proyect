import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as articleController from '../controllers/articleController';
import * as authController from '../controllers/authController';
const { validateArticle, validateArticlePatch } = require('../utils/validators');
const { upload, resizeArticleImage } = require('../utils/upload');
const { ROLES } = require('../constants');

const router = Router();

// 1 view increment per IP per article per 10 minutes
const viewLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 1,
    keyGenerator: req => `view:${req.ip}:${req.params.title}`,
    // Return 200 silently — the frontend doesn't need an error, just no double-count
    handler: (_req, res) => res.status(200).json({ status: 'success', data: { views: null } }),
    skip: () => process.env.NODE_ENV === 'test',
});

// 1 like per IP per article per 24 hours
const likeLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 1,
    keyGenerator: req => `like:${req.ip}:${req.params.title}`,
    handler: (_req, res) => res.status(200).json({ status: 'success', data: { likes: null } }),
    skip: () => process.env.NODE_ENV === 'test',
});

// Aliased / special routes (before /:id to avoid conflicts)
router.route('/top-5').get(articleController.aliasTopArticles, articleController.getAllArticles);
router.route('/search').get(articleController.searchArticles);
router
    .route('/drafts')
    .get(authController.protect, authController.restrictTo(ROLES.ADMIN), articleController.getDrafts);
router
    .route('/admin/stats')
    .get(authController.protect, authController.restrictTo(ROLES.ADMIN), articleController.getAdminStats);

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
        articleController.createArticle
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
        articleController.updateArticle
    )
    .delete(authController.protect, authController.restrictTo(ROLES.ADMIN), articleController.deleteArticle);

// Article sub-actions — rate limited to prevent metric gaming
router
    .route('/:title/view')
    .patch(
        authController.protect,
        authController.restrictTo(ROLES.ADMIN),
        viewLimiter,
        articleController.incrementViews
    );
router
    .route('/:title/like')
    .patch(authController.protect, authController.restrictTo(ROLES.ADMIN), likeLimiter, articleController.likeArticle);
router.route('/:title/related').get(articleController.getRelatedArticles);

module.exports = router;
