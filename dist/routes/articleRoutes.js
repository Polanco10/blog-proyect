"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const articleController = __importStar(require("../controllers/articleController"));
const authController = __importStar(require("../controllers/authController"));
const { validateArticle, validateArticlePatch } = require('../utils/validators');
const { upload, resizeArticleImage } = require('../utils/upload');
const { ROLES } = require('../constants');
const router = (0, express_1.Router)();
// Aliased / special routes (before /:id to avoid conflicts)
router.route('/top-5').get(articleController.aliasTopArticles, articleController.getAllArticles);
router.route('/search').get(articleController.searchArticles);
router.route('/drafts').get(authController.protect, authController.restrictTo(ROLES.ADMIN), articleController.getDrafts);
router.route('/admin/stats').get(authController.protect, authController.restrictTo(ROLES.ADMIN), articleController.getAdminStats);
router
    .route('/')
    .get(articleController.getAllArticles)
    .post(authController.protect, authController.restrictTo(ROLES.ADMIN), upload.single('imageCover'), resizeArticleImage, validateArticle, articleController.setAuthor, articleController.createArticle);
router
    .route('/:title')
    .get(articleController.getArticle)
    .patch(authController.protect, authController.restrictTo(ROLES.ADMIN), upload.single('imageCover'), resizeArticleImage, validateArticlePatch, articleController.updateArticle)
    .delete(authController.protect, authController.restrictTo(ROLES.ADMIN), articleController.deleteArticle);
// Article sub-actions
router.route('/:title/view').patch(articleController.incrementViews);
router.route('/:title/like').patch(articleController.likeArticle);
router.route('/:title/related').get(articleController.getRelatedArticles);
module.exports = router;
