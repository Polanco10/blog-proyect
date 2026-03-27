"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const baseRepository_1 = __importDefault(require("./baseRepository"));
const QuickTip = require('../models/quicktipModel');
class QuickTipRepository extends baseRepository_1.default {
    constructor() {
        super(QuickTip);
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
     * Find tips filtered by language and/or seniority level.
     * @param {object} filters - { language?, seniority? }
     * @param {object} queryString
     * @returns {Promise<Document[]>}
     */
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
