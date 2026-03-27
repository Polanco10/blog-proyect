"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
const apiFeatures_1 = __importDefault(require("../utils/apiFeatures"));
// Explicit singular-key map — more robust than slicing the last character.
// Add new collections here when they are served via handlerFactory.
const SINGULAR_KEY = {
    articles: 'article',
    experiences: 'experience',
    users: 'user',
    comments: 'comment',
    quicktips: 'quicktip',
    cheatsheets: 'cheatsheet',
};
/** Derive the singular response key for a collection name. */
function singularKey(collectionName) {
    return SINGULAR_KEY[collectionName] ?? collectionName.replace(/s$/, '');
}
//Factory functions - Funciones reutilizables para otros controladores
exports.deleteOne = (Model) => (0, catchAsync_1.default)(async (req, res, next) => {
    if (!mongoose_1.default.isValidObjectId(req.params.id))
        return next(new appError_1.default('No document found with that ID', 404));
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
        return next(new appError_1.default('No document found with that ID', 404));
    }
    res.status(204).json({
        status: 'success',
        data: null,
    });
});
exports.updateOne = (Model) => (0, catchAsync_1.default)(async (req, res, next) => {
    if (!mongoose_1.default.isValidObjectId(req.params.id))
        return next(new appError_1.default('No document found with that ID', 404));
    const key = singularKey(Model.collection.collectionName);
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true, // devuelve el objeto updateado
        runValidators: true, // volver a aplicar validaciones
    });
    if (!doc) {
        return next(new appError_1.default('No document found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: { [key]: doc },
    });
});
exports.createOne = (Model) => (0, catchAsync_1.default)(async (req, res) => {
    const key = singularKey(Model.collection.collectionName);
    const doc = await Model.create(req.body);
    res.status(201).json({
        status: 'success',
        data: { [key]: doc },
    });
});
exports.getOne = (Model) => (0, catchAsync_1.default)(async (req, res, next) => {
    if (!mongoose_1.default.isValidObjectId(req.params.id))
        return next(new appError_1.default('No document found with that ID', 404));
    const key = singularKey(Model.collection.collectionName);
    const doc = await Model.findById(req.params.id).select('-__v');
    if (!doc) {
        return next(new appError_1.default('No document found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: { [key]: doc },
    });
});
exports.getAll = (Model) => (0, catchAsync_1.default)(async (req, res) => {
    const collectionName = Model.collection.collectionName;
    //Ejecutando la query
    const feature = new apiFeatures_1.default(Model.find(), req.query).filter().sort().limitFields().paginate();
    const doc = await feature.query; // feature.query.explain() -> Entrega estadisticas de la query - Revisar totalDocsExamined
    //Enviando respuesta
    res.status(200).json({
        status: 'success',
        results: doc.length,
        data: { [collectionName]: doc },
    });
});
