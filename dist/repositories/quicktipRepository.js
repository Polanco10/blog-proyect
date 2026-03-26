const BaseRepository = require('./baseRepository');
const QuickTip = require('../models/quicktipModel');
class QuickTipRepository extends BaseRepository {
    constructor() {
        super(QuickTip);
    }
    /**
     * Find tips filtered by language and/or seniority level.
     * @param {object} filters - { language?, seniority? }
     * @param {object} queryString
     * @returns {Promise<Document[]>}
     */
    async findBySlug(slug) {
        return this.Model.findOne({ slug });
    }
    async updateBySlug(slug, data) {
        return this.Model.findOneAndUpdate({ slug }, data, { new: true, runValidators: true });
    }
    async deleteBySlug(slug) {
        return this.Model.findOneAndDelete({ slug });
    }
    async findByFilters({ language, seniority } = {}, queryString = {}) {
        const extra = {};
        if (language)
            extra.language = language;
        if (seniority)
            extra.seniority = seniority;
        return this.findAll({ ...queryString, ...extra });
    }
}
module.exports = new QuickTipRepository();
