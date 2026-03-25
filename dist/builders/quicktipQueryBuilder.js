const BaseQueryBuilder = require('./baseQueryBuilder');
const QuickTip = require('../models/quicktipModel');
class QuickTipQueryBuilder extends BaseQueryBuilder {
    constructor() {
        super(QuickTip);
    }
    withLanguage(language) {
        return this.where('language', language);
    }
    withSeniority(seniority) {
        return this.where('seniority', seniority);
    }
}
module.exports = QuickTipQueryBuilder;
