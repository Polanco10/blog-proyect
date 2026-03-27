"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const apiFeatures_1 = __importDefault(require("../utils/apiFeatures"));
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
     * @param queryString - req.query object
     */
    async findAll(queryString = {}) {
        const feature = new apiFeatures_1.default(this.Model.find(), queryString)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        return feature.query;
    }
    /**
     * Find a single document by ID.
     */
    async findById(id) {
        return this.Model.findById(id).select('-__v');
    }
    /**
     * Create a new document.
     */
    async create(data) {
        return this.Model.create(data);
    }
    /**
     * Update a document by ID and return the updated version.
     */
    async updateById(id, data) {
        return this.Model.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        });
    }
    /**
     * Delete a document by ID.
     */
    async deleteById(id) {
        return this.Model.findByIdAndDelete(id);
    }
}
module.exports = BaseRepository;
