import { Document } from 'mongoose';
import BaseRepository from './baseRepository';
const QuickTip = require('../models/quicktipModel');

class QuickTipRepository extends BaseRepository<Document> {
    constructor() {
        super(QuickTip);
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
     * Find tips filtered by language and/or seniority level.
     * @param {object} filters - { language?, seniority? }
     * @param {object} queryString
     * @returns {Promise<Document[]>}
     */
    async findByFilters({ language, seniority }: { language?: string; seniority?: string } = {}, queryString = {}) {
        const extra: Record<string, string> = {};
        if (language) extra.language = language;
        if (seniority) extra.seniority = seniority;
        return this.findAll({ ...queryString, ...extra });
    }
}

export = new QuickTipRepository();
