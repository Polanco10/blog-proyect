import { Document } from 'mongoose';
import BaseRepository from './baseRepository';
const Article = require('../models/articleModel');
const ArticleQueryBuilder = require('../builders/articleQueryBuilder');

class ArticleRepository extends BaseRepository<Document> {
    constructor() {
        super(Article);
    }

    /**
     * Returns a fresh ArticleQueryBuilder for fluent query construction.
     * @returns {ArticleQueryBuilder}
     */
    query() {
        return new ArticleQueryBuilder();
    }

    /**
     * Find top articles by views (pre-configured alias query).
     * @param {number} limit
     * @returns {Promise<Document[]>}
     */
    async findTopByViews(limit = 5) {
        return new ArticleQueryBuilder()
            .sortByPopularity()
            .select('title', 'author', 'category', 'views')
            .paginate(1, limit)
            .build();
    }

    /**
     * Find articles by category.
     * @param {string} category
     * @param {object} queryString
     * @returns {Promise<Document[]>}
     */
    async findByCategory(category: string, queryString = {}) {
        return this.findAll({ ...queryString, category });
    }

    /**
     * Full-text search articles.
     * @param {string} text
     * @param {number} limit
     * @returns {Promise<Document[]>}
     */
    async searchByText(text: string, limit = 20) {
        return new ArticleQueryBuilder()
            .searchByText(text)
            .paginate(1, limit)
            .build();
    }

    /**
     * Find an article by its unique slug (title-based).
     * @param {string} slug
     * @returns {Promise<Document|null>}
     */
    async findByIdentifier(slug: string) {
        const bySlug = await this.Model.findOne({ slug });
        if (bySlug) return bySlug;
        // Fallback for articles without a slug field (created before the pre-save hook)
        const titlePattern = new RegExp('^' + slug.replace(/-/g, '[\\s\\-]+') + '$', 'i');
        return this.Model.findOne({ title: titlePattern });
    }

    /**
     * Update an article by slug.
     * @param {string} slug
     * @param {object} data
     * @returns {Promise<Document|null>}
     */
    async updateBySlug(slug: string, data: object) {
        return this.Model.findOneAndUpdate({ slug }, data, { new: true, runValidators: true });
    }

    async deleteBySlug(slug: string) {
        return this.Model.findOneAndDelete({ slug });
    }

    async incrementViews(slug: string) {
        return this.Model.findOneAndUpdate(
            { slug },
            { $inc: { views: 1 } },
            { new: true, select: 'views' }
        );
    }

    /**
     * Atomically increment likes for an article by slug.
     * @param {string} slug
     * @returns {Promise<Document|null>}
     */
    async incrementLikes(slug: string) {
        return this.Model.findOneAndUpdate(
            { slug },
            { $inc: { likes: 1 } },
            { new: true, select: 'likes' }
        );
    }

    /**
     * Find articles related to a given article (same category, excluding itself).
     * @param {string|ObjectId} id - current article _id (always ObjectId after resolution)
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
     * Find all draft articles (published: false) — admin only.
     * @returns {Promise<Document[]>}
     */
    async findDrafts() {
        // Use _skipPublishedFilter to bypass the pre-find hook that adds published:true
        const query = this.Model.find({ published: false });
        (query as any)._skipPublishedFilter = true;
        return query.sort('-createdAt');
    }

    /**
     * Aggregate statistics for the admin dashboard.
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
