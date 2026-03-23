const BaseRepository = require('./baseRepository');
const Article = require('../models/articleModel');
const ArticleQueryBuilder = require('../builders/articleQueryBuilder');

class ArticleRepository extends BaseRepository {
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
    async findByCategory(category, queryString = {}) {
        return this.findAll({ ...queryString, category });
    }

    /**
     * Full-text search articles.
     * @param {string} text
     * @param {number} limit
     * @returns {Promise<Document[]>}
     */
    async searchByText(text, limit = 20) {
        return new ArticleQueryBuilder()
            .searchByText(text)
            .paginate(1, limit)
            .build();
    }

    /**
     * Atomically increment views for an article.
     * @param {string} id
     * @returns {Promise<Document|null>}
     */
    async incrementViews(id) {
        return this.Model.findByIdAndUpdate(
            id,
            { $inc: { views: 1 } },
            { new: true, select: 'views' }
        );
    }

    /**
     * Atomically increment likes for an article.
     * @param {string} id
     * @returns {Promise<Document|null>}
     */
    async incrementLikes(id) {
        return this.Model.findByIdAndUpdate(
            id,
            { $inc: { likes: 1 } },
            { new: true, select: 'likes' }
        );
    }

    /**
     * Find articles related to a given article (same category, excluding itself).
     * @param {string} id - current article _id
     * @param {string} category
     * @param {number} limit
     * @returns {Promise<Document[]>}
     */
    async findRelated(id, category, limit = 4) {
        return this.Model.find({ _id: { $ne: id }, category, published: true })
            .sort('-views -createdAt')
            .limit(limit)
            .select('title description imageCover category createdAt views');
    }

    /**
     * Find all draft articles (published: false) — admin only.
     * @returns {Promise<Document[]>}
     */
    async findDrafts() {
        // Use _skipPublishedFilter to bypass the pre-find hook that adds published:true
        const query = this.Model.find({ published: false });
        query._skipPublishedFilter = true;
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
            totalViews: totalViews[0]?.total || 0,
            totalLikes: totalLikes[0]?.total || 0,
        };
    }
}

module.exports = new ArticleRepository();
