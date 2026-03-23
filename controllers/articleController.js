const articleRepository = require('../repositories/articleRepository');
const quicktipRepository = require('../repositories/quicktipRepository');
const cheatsheetRepository = require('../repositories/cheatsheetRepository');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Middleware — asigna el usuario loggeado como author del artículo
exports.setAuthor = (req, res, next) => {
    req.body.author = req.user.id;
    next();
};

// Aliasing — pre-configura query para top artículos
exports.aliasTopArticles = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = 'title';
    req.query.fields = 'title,author';
    next();
};

exports.getAllArticles = catchAsync(async (req, res) => {
    const articles = await articleRepository.findAll(req.query);
    res.status(200).json({
        status: 'success',
        results: articles.length,
        data: { articles },
    });
});

exports.getArticle = catchAsync(async (req, res, next) => {
    const article = await articleRepository.findById(req.params.id);
    if (!article) return next(new AppError('No document found with that ID', 404));
    res.status(200).json({
        status: 'success',
        data: { article },
    });
});

exports.createArticle = catchAsync(async (req, res) => {
    const article = await articleRepository.create(req.body);
    res.status(201).json({
        status: 'success',
        data: { article },
    });
});

exports.updateArticle = catchAsync(async (req, res, next) => {
    const article = await articleRepository.updateById(req.params.id, req.body);
    if (!article) return next(new AppError('No document found with that ID', 404));
    res.status(200).json({
        status: 'success',
        data: { article },
    });
});

exports.searchArticles = catchAsync(async (req, res, next) => {
    const { q, limit } = req.query;
    if (!q || !q.trim()) {
        return next(new AppError('Search query parameter "q" is required', 400));
    }
    const articles = await articleRepository.searchByText(q, Number(limit) || 20);
    res.status(200).json({
        status: 'success',
        results: articles.length,
        data: { articles },
    });
});

exports.deleteArticle = catchAsync(async (req, res, next) => {
    const article = await articleRepository.deleteById(req.params.id);
    if (!article) return next(new AppError('No document found with that ID', 404));
    res.status(204).json({ status: 'success', data: null });
});

// Incrementa las vistas de un artículo (llamado cuando el usuario abre el artículo)
exports.incrementViews = catchAsync(async (req, res, next) => {
    const article = await articleRepository.incrementViews(req.params.id);
    if (!article) return next(new AppError('No document found with that ID', 404));
    res.status(200).json({ status: 'success', data: { views: article.views } });
});

// Like / reacción a un artículo (sin auth — un like por sesión se controla en frontend)
exports.likeArticle = catchAsync(async (req, res, next) => {
    const article = await articleRepository.incrementLikes(req.params.id);
    if (!article) return next(new AppError('No document found with that ID', 404));
    res.status(200).json({ status: 'success', data: { likes: article.likes } });
});

// Artículos relacionados — mismo category, excluyendo el actual
exports.getRelatedArticles = catchAsync(async (req, res, next) => {
    const current = await articleRepository.findById(req.params.id);
    if (!current) return next(new AppError('No document found with that ID', 404));
    const related = await articleRepository.findRelated(req.params.id, current.category);
    res.status(200).json({ status: 'success', results: related.length, data: { articles: related } });
});

// Borradores — solo admin
exports.getDrafts = catchAsync(async (req, res) => {
    const articles = await articleRepository.findDrafts();
    res.status(200).json({ status: 'success', results: articles.length, data: { articles } });
});

// Estadísticas del dashboard de admin
exports.getAdminStats = catchAsync(async (req, res) => {
    const [articleStats, tipsTotal, cheatsheetsTotal, topArticles] = await Promise.all([
        articleRepository.getStats(),
        quicktipRepository.findAll({}).then(r => r.length),
        cheatsheetRepository.findAll({}).then(r => r.length),
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
