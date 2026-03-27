const BaseQueryBuilder = require('./baseQueryBuilder');
const Article = require('../models/articleModel');
class ArticleQueryBuilder extends BaseQueryBuilder {
    constructor() {
        super(Article);
    }
    withCategory(category) {
        return this.where('category', category);
    }
    withTags(tags) {
        return this.in('tags', tags);
    }
    withAuthor(authorId) {
        return this.where('author', authorId);
    }
    minViews(views) {
        return this.gte('views', views);
    }
    searchByText(text) {
        return this.search(text);
    }
    sortByRecent() {
        return this.sort('-createdAt');
    }
    sortByPopularity() {
        return this.sort('-views', '-createdAt');
    }
}
module.exports = ArticleQueryBuilder;
