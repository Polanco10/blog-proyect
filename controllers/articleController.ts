import { Request, Response, NextFunction } from 'express';
const articleRepository = require('../repositories/articleRepository');
const quicktipRepository = require('../repositories/quicktipRepository');
const cheatsheetRepository = require('../repositories/cheatsheetRepository');
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import slugify from '../utils/slugify';
import { AuthRequest } from '../types';

// Middleware — asigna el usuario loggeado como author del artículo
export const setAuthor = (req: AuthRequest, res: Response, next: NextFunction): void => {
    req.body.author = req.user!.id;
    next();
};

// Aliasing — pre-configura query para top artículos
export const aliasTopArticles = (req: Request, res: Response, next: NextFunction): void => {
    req.query.limit = '5';
    req.query.sort = 'title';
    req.query.fields = 'title,author';
    next();
};

export const getAllArticles = catchAsync(async (req: AuthRequest, res: Response) => {
    const { data: articles, total } = await articleRepository.findAllPaginated(req.query as Record<string, unknown>);
    res.status(200).json({
        status: 'success',
        results: articles.length,
        total,
        data: { articles },
    });
});

export const getArticle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const article = await articleRepository.findByIdentifier(req.params.title);
    if (!article) return next(new AppError('Article not found.', 404));
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
    // If the title is changing, regenerate the slug and check for conflicts
    if (req.body.title) {
        const newSlug = slugify(req.body.title);
        // A conflict exists when another article already holds the new slug
        const existing: { slug?: string } | null = await articleRepository.Model.findOne({ slug: newSlug }).lean();
        if (existing && existing.slug !== req.params.title) {
            return next(new AppError('An article with this title already exists.', 409));
        }
        req.body.slug = newSlug;
    }

    const article = await articleRepository.updateBySlug(req.params.title, req.body);
    if (!article) return next(new AppError('Article not found.', 404));
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
    const article = await articleRepository.deleteBySlug(req.params.title);
    if (!article) return next(new AppError('Article not found.', 404));
    res.status(204).json({ status: 'success', data: null });
});

// Incrementa las vistas de un artículo (llamado cuando el usuario abre el artículo)
export const incrementViews = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const article = await articleRepository.incrementViews(req.params.title);
    if (!article) return next(new AppError('Article not found.', 404));
    res.status(200).json({ status: 'success', data: { views: article.views } });
});

// Like / reacción a un artículo (sin auth — un like por sesión se controla en frontend)
export const likeArticle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const article = await articleRepository.incrementLikes(req.params.title);
    if (!article) return next(new AppError('Article not found.', 404));
    res.status(200).json({ status: 'success', data: { likes: article.likes } });
});

// Artículos relacionados — mismo category, excluyendo el actual
export const getRelatedArticles = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const current = await articleRepository.findByIdentifier(req.params.title);
    if (!current) return next(new AppError('Article not found.', 404));
    const related = await articleRepository.findRelated(current._id, current.category);
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
        quicktipRepository.findAll({}).then((r: unknown[]) => r.length),
        cheatsheetRepository.findAll({}).then((r: unknown[]) => r.length),
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
