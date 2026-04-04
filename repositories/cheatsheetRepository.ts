import { Document } from 'mongoose';
import BaseRepository from './baseRepository';
const Cheatsheet = require('../models/cheatsheetModel');

class CheatsheetRepository extends BaseRepository<Document> {
    constructor() {
        super(Cheatsheet);
    }

    /**
     * Busca cheatsheets por categoría.
     * @param {string} category
     * @param {object} queryString
     * @returns {Promise<Document[]>}
     */
    async findByCategory(category: string, queryString = {}) {
        return this.findAll({ ...queryString, category });
    }
}

export = new CheatsheetRepository();
