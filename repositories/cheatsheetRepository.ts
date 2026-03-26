import { Document } from 'mongoose';
import BaseRepository from './baseRepository';
const Cheatsheet = require('../models/cheatsheetModel');

class CheatsheetRepository extends BaseRepository<Document> {
    constructor() {
        super(Cheatsheet);
    }

    async findBySlug(slug: string) {
        return this.Model.findOne({ slug });
    }

    async updateBySlug(slug: string, data: object) {
        return this.Model.findOneAndUpdate({ slug }, data, { new: true, runValidators: true });
    }

    async deleteBySlug(slug: string) {
        return this.Model.findOneAndDelete({ slug });
    }

    /**
     * Find cheatsheets by category.
     * @param {string} category
     * @param {object} queryString
     * @returns {Promise<Document[]>}
     */
    async findByCategory(category: string, queryString = {}) {
        return this.findAll({ ...queryString, category });
    }
}

export = new CheatsheetRepository();
