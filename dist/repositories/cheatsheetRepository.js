"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const baseRepository_1 = __importDefault(require("./baseRepository"));
const Cheatsheet = require('../models/cheatsheetModel');
class CheatsheetRepository extends baseRepository_1.default {
    constructor() {
        super(Cheatsheet);
    }
    async findBySlug(slug) {
        return this.Model.findOne({ slug });
    }
    async updateBySlug(slug, data) {
        return this.Model.findOneAndUpdate({ slug }, data, { new: true, runValidators: true });
    }
    async deleteBySlug(slug) {
        return this.Model.findOneAndDelete({ slug });
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
