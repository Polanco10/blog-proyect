const cheatsheetRepository = require('../repositories/cheatsheetRepository');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllCheatsheets = catchAsync(async (req, res) => {
    const cheatsheets = await cheatsheetRepository.findAll(req.query);
    res.status(200).json({
        status: 'success',
        results: cheatsheets.length,
        data: { cheatsheets },
    });
});

exports.getCheatsheet = catchAsync(async (req, res, next) => {
    const cheatsheet = await cheatsheetRepository.findById(req.params.id);
    if (!cheatsheet) return next(new AppError('No document found with that ID', 404));
    res.status(200).json({
        status: 'success',
        data: { cheatsheet },
    });
});

exports.createCheatsheet = catchAsync(async (req, res) => {
    const cheatsheet = await cheatsheetRepository.create(req.body);
    res.status(201).json({
        status: 'success',
        data: { cheatsheet },
    });
});

exports.updateCheatsheet = catchAsync(async (req, res, next) => {
    const cheatsheet = await cheatsheetRepository.updateById(req.params.id, req.body);
    if (!cheatsheet) return next(new AppError('No document found with that ID', 404));
    res.status(200).json({
        status: 'success',
        data: { cheatsheet },
    });
});

exports.deleteCheatsheet = catchAsync(async (req, res, next) => {
    const cheatsheet = await cheatsheetRepository.deleteById(req.params.id);
    if (!cheatsheet) return next(new AppError('No document found with that ID', 404));
    res.status(204).json({
        status: 'success',
        data: null,
    });
});
