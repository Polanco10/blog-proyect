/**
 * BaseQueryBuilder — fluent interface for building Mongoose queries.
 * Resource-specific builders extend this and add model-specific methods.
 */
class BaseQueryBuilder {
    constructor(Model) {
        this.Model = Model;
        this.query = Model.find();
        this._sort = '-createdAt';
        this._fields = '-__v';
        this._page = 1;
        this._limit = 100;
    }
    /** Filter by an exact field value */
    where(field, value) {
        if (value !== undefined && value !== null && value !== '') {
            this.query = this.query.where(field).equals(value);
        }
        return this;
    }
    /** Filter field >= value */
    gte(field, value) {
        if (value !== undefined) {
            this.query = this.query.where(field).gte(value);
        }
        return this;
    }
    /** Filter field <= value */
    lte(field, value) {
        if (value !== undefined) {
            this.query = this.query.where(field).lte(value);
        }
        return this;
    }
    /** Filter field in array */
    in(field, values) {
        if (values && values.length > 0) {
            const arr = Array.isArray(values) ? values : [values];
            this.query = this.query.where(field).in(arr);
        }
        return this;
    }
    /** MongoDB full-text search (requires text index on the model) */
    search(text) {
        if (text && text.trim()) {
            this.query = this.query.where({ $text: { $search: text.trim() } });
        }
        return this;
    }
    /** Sort by one or more fields. Prefix with '-' for descending. */
    sort(...fields) {
        if (fields.length > 0) {
            this._sort = fields.join(' ');
        }
        return this;
    }
    /** Select specific fields. Prefix with '-' to exclude. */
    select(...fields) {
        if (fields.length > 0) {
            this._fields = fields.join(' ');
        }
        return this;
    }
    /** Paginate results */
    paginate(page = 1, limit = 100) {
        this._page = page * 1 || 1;
        this._limit = limit * 1 || 100;
        return this;
    }
    /** Apply sort, field projection, and pagination, then execute */
    async build() {
        const skip = (this._page - 1) * this._limit;
        this.query = this.query.sort(this._sort).select(this._fields).skip(skip).limit(this._limit);
        return this.query;
    }
}
module.exports = BaseQueryBuilder;
