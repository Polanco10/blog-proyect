import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
const cheatsheetRepository = require('../repositories/cheatsheetRepository');

exports.getAllCheatsheets = catchAsync(async (req: Request, res: Response) => {
    const cheatsheets = await cheatsheetRepository.findAll(req.query);
    res.status(200).json({
        status: 'success',
        results: cheatsheets.length,
        data: { cheatsheets },
    });
});

exports.getCheatsheet = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const cheatsheet = await cheatsheetRepository.findBySlug(req.params.id);
    if (!cheatsheet) return next(new AppError('No document found with that ID', 404));
    res.status(200).json({
        status: 'success',
        data: { cheatsheet },
    });
});

exports.createCheatsheet = catchAsync(async (req: Request, res: Response) => {
    const cheatsheet = await cheatsheetRepository.create(req.body);
    res.status(201).json({
        status: 'success',
        data: { cheatsheet },
    });
});

exports.updateCheatsheet = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const cheatsheet = await cheatsheetRepository.updateBySlug(req.params.id, req.body);
    if (!cheatsheet) return next(new AppError('No document found with that ID', 404));
    res.status(200).json({
        status: 'success',
        data: { cheatsheet },
    });
});

exports.deleteCheatsheet = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const cheatsheet = await cheatsheetRepository.deleteBySlug(req.params.id);
    if (!cheatsheet) return next(new AppError('No document found with that ID', 404));
    res.status(204).json({
        status: 'success',
        data: null,
    });
});
