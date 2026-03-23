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
    async findByCategory(category, queryString = {}) {
        return this.findAll({ ...queryString, category });
    }
}

module.exports = new CheatsheetRepository();
