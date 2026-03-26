import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
const quicktipRepository = require('../repositories/quicktipRepository');

exports.getAllQuickTips = catchAsync(async (req: Request, res: Response) => {
    const quicktips = await quicktipRepository.findAll(req.query);
    res.status(200).json({
        status: 'success',
        results: quicktips.length,
        data: { quicktips },
    });
});

exports.getQuickTip = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const quicktip = await quicktipRepository.findBySlug(req.params.id);
    if (!quicktip) return next(new AppError('No document found with that ID', 404));
    res.status(200).json({
        status: 'success',
        data: { quicktip },
    });
});

exports.createQuickTip = catchAsync(async (req: Request, res: Response) => {
    const quicktip = await quicktipRepository.create(req.body);
    res.status(201).json({
        status: 'success',
        data: { quicktip },
    });
});

exports.updateQuickTip = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const quicktip = await quicktipRepository.updateBySlug(req.params.id, req.body);
    if (!quicktip) return next(new AppError('No document found with that ID', 404));
    res.status(200).json({
        status: 'success',
        data: { quicktip },
    });
});

exports.deleteQuickTip = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const quicktip = await quicktipRepository.deleteBySlug(req.params.id);
    if (!quicktip) return next(new AppError('No document found with that ID', 404));
    res.status(204).json({
        status: 'success',
        data: null,
    });
});
