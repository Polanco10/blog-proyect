"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
const Comment = require('../models/commentModel');
const articleRepository = require('../repositories/articleRepository');
const logger = require('../utils/logger');
// Resolve articleId param: accepts MongoDB ObjectId or slug/title
async function resolveArticleId(param, next) {
    if (mongoose_1.default.isValidObjectId(param))
        return param;
    const article = await articleRepository.findByIdentifier(param);
    if (!article) {
        next(new appError_1.default('No article found', 404));
        return null;
    }
    return article._id;
}
// Obtener comentarios aprobados de un artículo
exports.getCommentsByArticle = (0, catchAsync_1.default)(async (req, res, next) => {
    const articleId = await resolveArticleId(req.params.articleId, next);
    if (!articleId)
        return;
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
exports.createComment = (0, catchAsync_1.default)(async (req, res, next) => {
    const articleId = await resolveArticleId(req.params.articleId, next);
    if (!articleId)
        return;
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
exports.getPendingComments = (0, catchAsync_1.default)(async (req, res) => {
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
exports.approveComment = (0, catchAsync_1.default)(async (req, res, next) => {
    const comment = await Comment.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    if (!comment)
        return next(new appError_1.default('No comment found with that ID', 404));
    res.status(200).json({ status: 'success', data: { comment } });
});
// Eliminar un comentario — admin
exports.deleteComment = (0, catchAsync_1.default)(async (req, res, next) => {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment)
        return next(new appError_1.default('No comment found with that ID', 404));
    res.status(204).json({ status: 'success', data: null });
});
