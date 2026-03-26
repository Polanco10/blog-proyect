const BaseRepository = require('./baseRepository');
const Cheatsheet = require('../models/cheatsheetModel');
class CheatsheetRepository extends BaseRepository {
    constructor() {
        super(Cheatsheet);
    }
    /**
     * Find cheatsheets by category.
     * @param {string} category
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
    async findByCategory(category, queryString = {}) {
        return this.findAll({ ...queryString, category });
    }
}
module.exports = new CheatsheetRepository();
