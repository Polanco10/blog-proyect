const BaseRepository = require('./baseRepository');
const Article = require('../models/articleModel');
const ArticleQueryBuilder = require('../builders/articleQueryBuilder');
class ArticleRepository extends BaseRepository {
    constructor() {
        super(Article);
    }
    query() {
        return new ArticleQueryBuilder();
    }
    async findTopByViews(limit = 5) {
        return new ArticleQueryBuilder()
            .sortByPopularity()
            .select('title', 'author', 'category', 'views')
            .paginate(1, limit)
            .build();
    }
    async findByCategory(category, queryString = {}) {
        return this.findAll({ ...queryString, category });
    }
    async searchByText(text, limit = 20) {
        return new ArticleQueryBuilder()
            .searchByText(text)
            .paginate(1, limit)
            .build();
    }
    async findByIdentifier(slug) {
        const bySlug = await this.Model.findOne({ slug });
        if (bySlug) return bySlug;
        // Fallback for articles without a slug field (created before the pre-save hook)
        const titlePattern = new RegExp('^' + slug.replace(/-/g, '[\\s\\-]+') + '$', 'i');
        return this.Model.findOne({ title: titlePattern });
    }
    async updateBySlug(slug, data) {
        return this.Model.findOneAndUpdate({ slug }, data, { new: true, runValidators: true });
    }
    async deleteBySlug(slug) {
        return this.Model.findOneAndDelete({ slug });
    }
    async incrementViews(slug) {
        return this.Model.findOneAndUpdate(
            { slug },
            { $inc: { views: 1 } },
            { new: true, select: 'views' }
        );
    }
    async incrementLikes(slug) {
        return this.Model.findOneAndUpdate(
            { slug },
            { $inc: { likes: 1 } },
            { new: true, select: 'likes' }
        );
    }
    async findRelated(id, category, limit = 4) {
        return this.Model.find({ _id: { $ne: id }, category, published: true })
            .sort('-views -createdAt')
            .limit(limit)
            .select('title description imageCover category createdAt views slug');
    }
    async findDrafts() {
        const query = this.Model.find({ published: false });
        query._skipPublishedFilter = true;
        return query.sort('-createdAt');
    }
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
