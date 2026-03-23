const quicktipRepository = require('../repositories/quicktipRepository');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllQuickTips = catchAsync(async (req, res) => {
    const quicktips = await quicktipRepository.findAll(req.query);
    res.status(200).json({
        status: 'success',
        results: quicktips.length,
        data: { tips: quicktips },
    });
});

exports.getQuickTip = catchAsync(async (req, res, next) => {
    const quicktip = await quicktipRepository.findById(req.params.id);
    if (!quicktip) return next(new AppError('No document found with that ID', 404));
    res.status(200).json({
        status: 'success',
        data: { quicktip },
    });
});

exports.createQuickTip = catchAsync(async (req, res) => {
    const quicktip = await quicktipRepository.create(req.body);
    res.status(201).json({
        status: 'success',
        data: { quicktip },
    });
});

exports.updateQuickTip = catchAsync(async (req, res, next) => {
    const quicktip = await quicktipRepository.updateById(req.params.id, req.body);
    if (!quicktip) return next(new AppError('No document found with that ID', 404));
    res.status(200).json({
        status: 'success',
        data: { quicktip },
    });
});

exports.deleteQuickTip = catchAsync(async (req, res, next) => {
    const quicktip = await quicktipRepository.deleteById(req.params.id);
    if (!quicktip) return next(new AppError('No document found with that ID', 404));
    res.status(204).json({
        status: 'success',
        data: null,
    });
});
