import { Document } from 'mongoose';
import BaseRepository from './baseRepository';
const QuickTip = require('../models/quicktipModel');

class QuickTipRepository extends BaseRepository<Document> {
    constructor() {
        super(QuickTip);
    }

    /**
     * Busca tips filtrados por lenguaje y/o nivel de seniority.
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
