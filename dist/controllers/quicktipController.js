"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
const quicktipRepository = require('../repositories/quicktipRepository');
exports.getAllQuickTips = (0, catchAsync_1.default)(async (req, res) => {
    const quicktips = await quicktipRepository.findAll(req.query);
    res.status(200).json({
        status: 'success',
        results: quicktips.length,
        data: { quicktips },
    });
});
exports.getQuickTip = (0, catchAsync_1.default)(async (req, res, next) => {
    const quicktip = await quicktipRepository.findBySlug(req.params.id);
    if (!quicktip)
        return next(new appError_1.default('No document found with that ID', 404));
    res.status(200).json({
        status: 'success',
        data: { quicktip },
    });
});
exports.createQuickTip = (0, catchAsync_1.default)(async (req, res) => {
    const quicktip = await quicktipRepository.create(req.body);
    res.status(201).json({
        status: 'success',
        data: { quicktip },
    });
});
exports.updateQuickTip = (0, catchAsync_1.default)(async (req, res, next) => {
    const quicktip = await quicktipRepository.updateBySlug(req.params.id, req.body);
    if (!quicktip)
        return next(new appError_1.default('No document found with that ID', 404));
    res.status(200).json({
        status: 'success',
        data: { quicktip },
    });
});
exports.deleteQuickTip = (0, catchAsync_1.default)(async (req, res, next) => {
    const quicktip = await quicktipRepository.deleteBySlug(req.params.id);
    if (!quicktip)
        return next(new appError_1.default('No document found with that ID', 404));
    res.status(204).json({
        status: 'success',
        data: null,
    });
});
