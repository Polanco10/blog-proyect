const mongoose = require('mongoose');
const Comment = require('../models/commentModel');
const articleRepository = require('../repositories/articleRepository');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
// Resolve articleId param: accepts MongoDB ObjectId or slug/title
async function resolveArticleId(param, next) {
    if (mongoose.isValidObjectId(param)) return param;
    const article = await articleRepository.findByIdentifier(param);
    if (!article) { next(new AppError('No article found', 404)); return null; }
    return article._id;
}
// Obtener comentarios aprobados de un artículo
exports.getCommentsByArticle = catchAsync(async (req, res, next) => {
    const articleId = await resolveArticleId(req.params.articleId, next);
    if (!articleId) return;
    const comments = await Comment.find({
        article: articleId,
        approved: true,
    }).sort('-createdAt').select('-email -__v');
    res.status(200).json({
        status: 'success',
        results: comments.length,
        data: { comments },
    });
});
// Publicar un comentario (requiere aprobación de admin)
exports.createComment = catchAsync(async (req, res, next) => {
    const articleId = await resolveArticleId(req.params.articleId, next);
    if (!articleId) return;
    const { author, email, body } = req.body;
    const comment = await Comment.create({
        article: articleId,
        author,
        email,
        body,
    });
    logger.info('New comment pending approval', { articleId, author });
    res.status(201).json({
        status: 'success',
        message: 'Comment submitted and pending approval.',
        data: { comment },
    });
});
// Obtener todos los comentarios pendientes — admin
exports.getPendingComments = catchAsync(async (req, res) => {
    const comments = await Comment.find({ approved: false })
        .sort('createdAt')
        .populate({ path: 'article', select: 'title' });
    res.status(200).json({
        status: 'success',
        results: comments.length,
        data: { comments },
    });
});
// Aprobar un comentario — admin
exports.approveComment = catchAsync(async (req, res, next) => {
    const comment = await Comment.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    if (!comment)
        return next(new AppError('No comment found with that ID', 404));
    res.status(200).json({ status: 'success', data: { comment } });
});
// Eliminar un comentario — admin
exports.deleteComment = catchAsync(async (req, res, next) => {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment)
        return next(new AppError('No comment found with that ID', 404));
    res.status(204).json({ status: 'success', data: null });
});
