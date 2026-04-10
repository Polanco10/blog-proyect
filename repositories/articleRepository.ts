import { Document } from 'mongoose';
import BaseRepository from './baseRepository';
const Article = require('../models/articleModel');

class ArticleRepository extends BaseRepository<Document> {
    constructor() {
        super(Article);
    }

    /**
     * Busca los artículos más vistos.
     */
    async findTopByViews(limit = 5) {
        return this.Model.find({ published: true })
            .sort('-views -createdAt')
            .select('title author category views')
            .limit(limit);
    }

    /**
     * Búsqueda de texto completo en artículos.
     */
    async searchByText(text: string, limit = 20) {
        return this.Model.find({ $text: { $search: text }, published: true })
            .sort('-createdAt')
            .select('-__v')
            .limit(limit);
    }

    /**
     * Busca un artículo por su slug único (basado en título).
     * @param {string} slug
     * @returns {Promise<Document|null>}
     */
    async findByIdentifier(slug: string) {
        const bySlug = await this.Model.findOne({ slug });
        if (bySlug) return bySlug;
        // Fallback para artículos sin campo slug (creados antes del hook pre-save)
        const titlePattern = new RegExp('^' + slug.replace(/-/g, '[\\s\\-]+') + '$', 'i');
        return this.Model.findOne({ title: titlePattern });
    }

    async incrementViews(slug: string) {
        return this.Model.findOneAndUpdate({ slug }, { $inc: { views: 1 } }, { new: true, select: 'views' });
    }

    /**
     * Incrementa atómicamente los likes de un artículo por slug.
     * @param {string} slug
     * @returns {Promise<Document|null>}
     */
    async incrementLikes(slug: string) {
        return this.Model.findOneAndUpdate({ slug }, { $inc: { likes: 1 } }, { new: true, select: 'likes' });
    }

    /**
     * Busca artículos relacionados (misma categoría, excluyendo el actual).
     * @param {string|ObjectId} id - _id del artículo actual (siempre ObjectId tras resolución)
     * @param {string} category
     * @param {number} limit
     * @returns {Promise<Document[]>}
     */
    async findRelated(id: unknown, category: string, limit = 4) {
        return this.Model.find({ _id: { $ne: id }, category, published: true })
            .sort('-views -createdAt')
            .limit(limit)
            .select('title description imageCover category createdAt views slug');
    }

    /**
     * Busca todos los artículos en borrador (published: false) — solo admin.
     * @returns {Promise<Document[]>}
     */
    async findDrafts() {
        return this.Model.find({ published: false }).sort('-createdAt');
    }

    /**
     * Agrega estadísticas para el panel de administración.
     * @returns {Promise<object>}
     */
    async getStats() {
        const [totalPublished, totalDrafts, totalViews, totalLikes] = await Promise.all([
            this.Model.countDocuments({ published: true }),
            this.Model.countDocuments({ published: false }),
            this.Model.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
            this.Model.aggregate([{ $group: { _id: null, total: { $sum: '$likes' } } }]),
        ]);
        return {
            totalPublished,
            totalDrafts,
            totalViews: (totalViews[0] as any)?.total || 0,
            totalLikes: (totalLikes[0] as any)?.total || 0,
        };
    }
}

export = new ArticleRepository();
