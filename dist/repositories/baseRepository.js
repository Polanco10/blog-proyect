const APIFeatures = require('../utils/apiFeatures');
/**
 * BaseRepository — generic data access layer wrapping Mongoose operations.
 * Resource-specific repositories extend this class and can override methods
 * to add model-specific query logic (e.g. population, projections).
 */
class BaseRepository {
    constructor(Model) {
        this.Model = Model;
    }
    /**
     * Find all documents, applying APIFeatures (filter, sort, fields, paginate).
     * @param {object} queryString - req.query object
     * @returns {Promise<Document[]>}
     */
    async findAll(queryString = {}) {
        const feature = new APIFeatures(this.Model.find(), queryString)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        return feature.query;
    }
    /**
     * Find a single document by ID.
     * @param {string} id
     * @returns {Promise<Document|null>}
     */
    async findById(id) {
        return this.Model.findById(id).select('-__v');
    }
    /**
     * Create a new document.
     * @param {object} data
     * @returns {Promise<Document>}
     */
    async create(data) {
        return this.Model.create(data);
    }
    /**
     * Update a document by ID and return the updated version.
     * @param {string} id
     * @param {object} data
     * @returns {Promise<Document|null>}
     */
    async updateById(id, data) {
        return this.Model.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        });
    }
    /**
     * Delete a document by ID.
     * @param {string} id
     * @returns {Promise<Document|null>}
     */
    async deleteById(id) {
        return this.Model.findByIdAndDelete(id);
    }
}
module.exports = BaseRepository;
