import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import APIFeatures from '../utils/apiFeatures';

// Explicit singular-key map — more robust than slicing the last character.
// Add new collections here when they are served via handlerFactory.
const SINGULAR_KEY: Record<string, string> = {
    articles: 'article',
    experiences: 'experience',
    users: 'user',
    comments: 'comment',
    quicktips: 'quicktip',
    cheatsheets: 'cheatsheet',
};

/** Derive the singular response key for a collection name. */
function singularKey(collectionName: string): string {
    return SINGULAR_KEY[collectionName] ?? collectionName.replace(/s$/, '');
}

//Factory functions - Funciones reutilizables para otros controladores
exports.deleteOne = (Model: mongoose.Model<any>) =>
    catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        if (!mongoose.isValidObjectId(req.params.id)) return next(new AppError('No document found with that ID', 404));
        const doc = await Model.findByIdAndDelete(req.params.id);
        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }
        res.status(204).json({
            status: 'success',
            data: null,
        });
    });

exports.updateOne = (Model: mongoose.Model<any>) =>
    catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        if (!mongoose.isValidObjectId(req.params.id)) return next(new AppError('No document found with that ID', 404));
        const key = singularKey(Model.collection.collectionName);

        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // devuelve el objeto updateado
            runValidators: true, // volver a aplicar validaciones
        });
        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }
        res.status(200).json({
            status: 'success',
            data: { [key]: doc },
        });
    });

exports.createOne = (Model: mongoose.Model<any>) =>
    catchAsync(async (req: Request, res: Response) => {
        const key = singularKey(Model.collection.collectionName);
        const doc = await Model.create(req.body);
        res.status(201).json({
            status: 'success',
            data: { [key]: doc },
        });
    });

exports.getOne = (Model: mongoose.Model<any>) =>
    catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        if (!mongoose.isValidObjectId(req.params.id)) return next(new AppError('No document found with that ID', 404));
        const key = singularKey(Model.collection.collectionName);
        const doc = await Model.findById(req.params.id).select('-__v');
        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }
        res.status(200).json({
            status: 'success',
            data: { [key]: doc },
        });
    });

exports.getAll = (Model: mongoose.Model<any>) =>
    catchAsync(async (req: Request, res: Response) => {
        const collectionName = Model.collection.collectionName;
        //Ejecutando la query
        const feature = new APIFeatures(Model.find(), req.query).filter().sort().limitFields().paginate();
        const doc = await feature.query; // feature.query.explain() -> Entrega estadisticas de la query - Revisar totalDocsExamined

        //Enviando respuesta
        res.status(200).json({
            status: 'success',
            results: doc.length,
            data: { [collectionName]: doc },
        });
    });
