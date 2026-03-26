import { Model, Document, Query } from 'mongoose';
import APIFeatures from '../utils/apiFeatures';

/**
 * BaseRepository — generic data access layer wrapping Mongoose operations.
 * Resource-specific repositories extend this class and can override methods
 * to add model-specific query logic (e.g. population, projections).
 */
class BaseRepository<T extends Document = Document> {
    protected Model: Model<T>;

    constructor(Model: Model<T>) {
        this.Model = Model;
    }

    /**
     * Find all documents, applying APIFeatures (filter, sort, fields, paginate).
     * @param queryString - req.query object
     */
    async findAll(queryString: Record<string, unknown> = {}): Promise<T[]> {
        const feature = new APIFeatures(this.Model.find() as unknown as Query<T[], T>, queryString)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        return feature.query as unknown as Promise<T[]>;
    }

    /**
     * Find a single document by ID.
     */
    async findById(id: string): Promise<T | null> {
        return this.Model.findById(id).select('-__v') as Promise<T | null>;
    }

    /**
     * Create a new document.
     */
    async create(data: Partial<T>): Promise<T> {
        return this.Model.create(data) as Promise<T>;
    }

    /**
     * Update a document by ID and return the updated version.
     */
    async updateById(id: string, data: Partial<T>): Promise<T | null> {
        return this.Model.findByIdAndUpdate(id, data as any, {
            new: true,
            runValidators: true,
        }) as Promise<T | null>;
    }

    /**
     * Delete a document by ID.
     */
    async deleteById(id: string): Promise<T | null> {
        return this.Model.findByIdAndDelete(id) as Promise<T | null>;
    }
}

export = BaseRepository;
