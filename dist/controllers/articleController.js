"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminStats = exports.getDrafts = exports.getRelatedArticles = exports.likeArticle = exports.incrementViews = exports.deleteArticle = exports.searchArticles = exports.updateArticle = exports.createArticle = exports.getArticle = exports.getAllArticles = exports.aliasTopArticles = exports.setAuthor = void 0;
const articleRepository = require('../repositories/articleRepository');
const quicktipRepository = require('../repositories/quicktipRepository');
const cheatsheetRepository = require('../repositories/cheatsheetRepository');
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
// Middleware — asigna el usuario loggeado como author del artículo
const setAuthor = (req, res, next) => {
    req.body.author = req.user.id;
    next();
};
exports.setAuthor = setAuthor;
// Aliasing — pre-configura query para top artículos
const aliasTopArticles = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = 'title';
    req.query.fields = 'title,author';
    next();
};
exports.aliasTopArticles = aliasTopArticles;
exports.getAllArticles = (0, catchAsync_1.default)(async (req, res) => {
    const articles = await articleRepository.findAll(req.query);
    res.status(200).json({
        status: 'success',
        results: articles.length,
        data: { articles },
    });
});
exports.getArticle = (0, catchAsync_1.default)(async (req, res, next) => {
    const article = await articleRepository.findByIdentifier(req.params.title);
    if (!article)
        return next(new appError_1.default('No document found with that ID', 404));
    res.status(200).json({
        status: 'success',
        data: { article },
    });
});
exports.createArticle = (0, catchAsync_1.default)(async (req, res) => {
    const article = await articleRepository.create(req.body);
    res.status(201).json({
        status: 'success',
        data: { article },
    });
});
exports.updateArticle = (0, catchAsync_1.default)(async (req, res, next) => {
    const article = await articleRepository.updateBySlug(req.params.title, req.body);
    if (!article)
        return next(new appError_1.default('No document found with that ID', 404));
    res.status(200).json({
        status: 'success',
        data: { article },
    });
});
exports.searchArticles = (0, catchAsync_1.default)(async (req, res, next) => {
    const { q, limit } = req.query;
    if (!q || !q.trim()) {
        return next(new appError_1.default('Search query parameter "q" is required', 400));
    }
    const articles = await articleRepository.searchByText(q, Number(limit) || 20);
    res.status(200).json({
        status: 'success',
        results: articles.length,
        data: { articles },
    });
});
exports.deleteArticle = (0, catchAsync_1.default)(async (req, res, next) => {
    const article = await articleRepository.deleteBySlug(req.params.title);
    if (!article)
        return next(new appError_1.default('No document found with that ID', 404));
    res.status(204).json({ status: 'success', data: null });
});
// Incrementa las vistas de un artículo (llamado cuando el usuario abre el artículo)
exports.incrementViews = (0, catchAsync_1.default)(async (req, res, next) => {
    const article = await articleRepository.incrementViews(req.params.title);
    if (!article)
        return next(new appError_1.default('No document found with that ID', 404));
    res.status(200).json({ status: 'success', data: { views: article.views } });
});
// Like / reacción a un artículo (sin auth — un like por sesión se controla en frontend)
exports.likeArticle = (0, catchAsync_1.default)(async (req, res, next) => {
    const article = await articleRepository.incrementLikes(req.params.title);
    if (!article)
        return next(new appError_1.default('No document found with that ID', 404));
    res.status(200).json({ status: 'success', data: { likes: article.likes } });
});
// Artículos relacionados — mismo category, excluyendo el actual
exports.getRelatedArticles = (0, catchAsync_1.default)(async (req, res, next) => {
    const current = await articleRepository.findByIdentifier(req.params.title);
    if (!current)
        return next(new appError_1.default('No document found with that ID', 404));
    const related = await articleRepository.findRelated(current._id, current.category);
    res.status(200).json({ status: 'success', results: related.length, data: { articles: related } });
});
// Borradores — solo admin
exports.getDrafts = (0, catchAsync_1.default)(async (req, res) => {
    const articles = await articleRepository.findDrafts();
    res.status(200).json({ status: 'success', results: articles.length, data: { articles } });
});
// Estadísticas del dashboard de admin
exports.getAdminStats = (0, catchAsync_1.default)(async (req, res) => {
    const [articleStats, tipsTotal, cheatsheetsTotal, topArticles] = await Promise.all([
        articleRepository.getStats(),
        quicktipRepository.findAll({}).then((r) => r.length),
        cheatsheetRepository.findAll({}).then((r) => r.length),
        articleRepository.findTopByViews(5),
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            articles: articleStats,
            tips: { total: tipsTotal },
            cheatsheets: { total: cheatsheetsTotal },
            topArticles,
        },
    });
});
