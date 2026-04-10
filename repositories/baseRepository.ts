import { Model, Document, Query } from 'mongoose';
import APIFeatures from '../utils/apiFeatures';

/**
 * BaseRepository — capa de acceso a datos genérica sobre operaciones de Mongoose.
 * Los repositorios específicos extienden esta clase y pueden sobrescribir métodos
 * para agregar lógica de consulta propia del modelo (ej. population, proyecciones).
 */
class BaseRepository<T extends Document = Document> {
    protected Model: Model<T>;

    constructor(Model: Model<T>) {
        this.Model = Model;
    }

    /**
     * Busca todos los documentos, aplicando APIFeatures (filtro, orden, campos, paginación).
     * @param queryString - objeto req.query
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
     * Igual que findAll pero también devuelve el total de documentos sin paginación.
     * Útil para construir controles de paginación en el cliente.
     * @param queryString - objeto req.query
     */
    async findAllPaginated(queryString: Record<string, unknown> = {}): Promise<{ data: T[]; total: number }> {
        // Conteo con los mismos filtros pero sin skip/limit
        const countFeature = new APIFeatures(this.Model.find() as unknown as Query<T[], T>, queryString).filter();
        const total = await (countFeature.query as unknown as { countDocuments(): Promise<number> }).countDocuments();

        // Datos con paginación completa
        const dataFeature = new APIFeatures(this.Model.find() as unknown as Query<T[], T>, queryString)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        const data = await (dataFeature.query as unknown as Promise<T[]>);

        return { data, total };
    }

    /**
     * Busca un documento por ID.
     */
    async findById(id: string): Promise<T | null> {
        return this.Model.findById(id).select('-__v') as Promise<T | null>;
    }

    /**
     * Crea un nuevo documento.
     */
    async create(data: Partial<T>): Promise<T> {
        return this.Model.create(data) as Promise<T>;
    }

    /**
     * Actualiza un documento por ID y retorna la versión actualizada.
     */
    async updateById(id: string, data: Partial<T>): Promise<T | null> {
        return this.Model.findByIdAndUpdate(id, data as any, {
            new: true,
            runValidators: true,
        }) as Promise<T | null>;
    }

    /**
     * Elimina un documento por ID.
     */
    async deleteById(id: string): Promise<T | null> {
        return this.Model.findByIdAndDelete(id) as Promise<T | null>;
    }

    /**
     * Busca un documento por slug.
     */
    async findBySlug(slug: string): Promise<T | null> {
        return this.Model.findOne({ slug } as any) as Promise<T | null>;
    }

    /**
     * Actualiza un documento por slug y retorna la versión actualizada.
     */
    async updateBySlug(slug: string, data: Partial<T>): Promise<T | null> {
        return this.Model.findOneAndUpdate({ slug } as any, data as any, {
            new: true,
            runValidators: true,
        }) as Promise<T | null>;
    }

    /**
     * Elimina un documento por slug.
     */
    async deleteBySlug(slug: string): Promise<T | null> {
        return this.Model.findOneAndDelete({ slug } as any) as Promise<T | null>;
    }
}

export = BaseRepository;
