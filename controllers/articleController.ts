import { Request, Response, NextFunction } from 'express';
const articleRepository = require('../repositories/articleRepository');
const quicktipRepository = require('../repositories/quicktipRepository');
const cheatsheetRepository = require('../repositories/cheatsheetRepository');
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';

// Middleware — asigna el usuario loggeado como author del artículo
export const setAuthor = (req: Request, res: Response, next: NextFunction): void => {
    req.body.author = (req as any).user.id;
    next();
};

// Aliasing — pre-configura query para top artículos
export const aliasTopArticles = (req: Request, res: Response, next: NextFunction): void => {
    req.query.limit = '5';
    req.query.sort = 'title';
    req.query.fields = 'title,author';
    next();
};

export const getAllArticles = catchAsync(async (req: Request, res: Response) => {
    const articles = await articleRepository.findAll(req.query);
    res.status(200).json({
        status: 'success',
        results: articles.length,
        data: { articles },
    });
});

export const getArticle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const article = await articleRepository.findById(req.params.id);
    if (!article) return next(new AppError('No document found with that ID', 404));
    res.status(200).json({
        status: 'success',
        data: { article },
    });
});

export const createArticle = catchAsync(async (req: Request, res: Response) => {
    const article = await articleRepository.create(req.body);
    res.status(201).json({
        status: 'success',
        data: { article },
    });
});

export const updateArticle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const article = await articleRepository.updateById(req.params.id, req.body);
    if (!article) return next(new AppError('No document found with that ID', 404));
    res.status(200).json({
        status: 'success',
        data: { article },
    });
});

export const searchArticles = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { q, limit } = req.query as { q?: string; limit?: string };
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

export const deleteArticle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const article = await articleRepository.deleteById(req.params.id);
    if (!article) return next(new AppError('No document found with that ID', 404));
    res.status(204).json({ status: 'success', data: null });
});

// Incrementa las vistas de un artículo (llamado cuando el usuario abre el artículo)
export const incrementViews = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const article = await articleRepository.incrementViews(req.params.id);
    if (!article) return next(new AppError('No document found with that ID', 404));
    res.status(200).json({ status: 'success', data: { views: article.views } });
});

// Like / reacción a un artículo (sin auth — un like por sesión se controla en frontend)
export const likeArticle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const article = await articleRepository.incrementLikes(req.params.id);
    if (!article) return next(new AppError('No document found with that ID', 404));
    res.status(200).json({ status: 'success', data: { likes: article.likes } });
});

// Artículos relacionados — mismo category, excluyendo el actual
export const getRelatedArticles = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const current = await articleRepository.findById(req.params.id);
    if (!current) return next(new AppError('No document found with that ID', 404));
    const related = await articleRepository.findRelated(req.params.id, current.category);
    res.status(200).json({ status: 'success', results: related.length, data: { articles: related } });
});

// Borradores — solo admin
export const getDrafts = catchAsync(async (req: Request, res: Response) => {
    const articles = await articleRepository.findDrafts();
    res.status(200).json({ status: 'success', results: articles.length, data: { articles } });
});

// Estadísticas del dashboard de admin
export const getAdminStats = catchAsync(async (req: Request, res: Response) => {
    const [articleStats, tipsTotal, cheatsheetsTotal, topArticles] = await Promise.all([
        articleRepository.getStats(),
        quicktipRepository.findAll({}).then((r: any[]) => r.length),
        cheatsheetRepository.findAll({}).then((r: any[]) => r.length),
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
