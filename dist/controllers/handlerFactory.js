const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
//Factory functions - Funciones reutilizables para otros controladores
exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    }
    res.status(204).json({
        status: 'success',
        data: null
    });
});
exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const responseName = Model.collection.collectionName.slice(0, -1);
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true, // devuelve el objeto updateado
        runValidators: true // volver a aplicar validaciones
    });
    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            [responseName]: doc
        }
    });
});
exports.createOne = Model => catchAsync(async (req, res) => {
    const responseName = Model.collection.collectionName.slice(0, -1);
    const doc = await Model.create(req.body); //promise
    // const newArticle = new Article({});
    // newArticle.save()
    res.status(201).json({
        status: 'success',
        data: {
            [responseName]: doc
        }
    });
});
exports.getOne = Model => catchAsync(async (req, res, next) => {
    const responseName = Model.collection.collectionName.slice(0, -1);
    const doc = await Model.findById(req.params.id).select('-__v');
    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            [responseName]: doc
        }
    });
});
exports.getAll = Model => catchAsync(async (req, res) => {
    const responseName = Model.collection.collectionName;
    //Ejecutando la query
    const feature = new APIFeatures(Model.find(), req.query).filter().sort().limitFields().paginate();
    const doc = await feature.query; // feature.query.explain() -> Entrega estadisticas de la query - Revisar totalDocsExamined
    //Enviando respuesta
    res.status(200).json({
        status: 'success',
        results: doc.length,
        data: {
            [responseName]: doc
        }
    });
});
