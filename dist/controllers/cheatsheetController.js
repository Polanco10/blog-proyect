"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
const cheatsheetRepository = require('../repositories/cheatsheetRepository');
exports.getAllCheatsheets = (0, catchAsync_1.default)(async (req, res) => {
    const cheatsheets = await cheatsheetRepository.findAll(req.query);
    res.status(200).json({
        status: 'success',
        results: cheatsheets.length,
        data: { cheatsheets },
    });
});
exports.getCheatsheet = (0, catchAsync_1.default)(async (req, res, next) => {
    const cheatsheet = await cheatsheetRepository.findBySlug(req.params.id);
    if (!cheatsheet)
        return next(new appError_1.default('No document found with that ID', 404));
    res.status(200).json({
        status: 'success',
        data: { cheatsheet },
    });
});
exports.createCheatsheet = (0, catchAsync_1.default)(async (req, res) => {
    const cheatsheet = await cheatsheetRepository.create(req.body);
    res.status(201).json({
        status: 'success',
        data: { cheatsheet },
    });
});
exports.updateCheatsheet = (0, catchAsync_1.default)(async (req, res, next) => {
    const cheatsheet = await cheatsheetRepository.updateBySlug(req.params.id, req.body);
    if (!cheatsheet)
        return next(new appError_1.default('No document found with that ID', 404));
    res.status(200).json({
        status: 'success',
        data: { cheatsheet },
    });
});
exports.deleteCheatsheet = (0, catchAsync_1.default)(async (req, res, next) => {
    const cheatsheet = await cheatsheetRepository.deleteBySlug(req.params.id);
    if (!cheatsheet)
        return next(new appError_1.default('No document found with that ID', 404));
    res.status(204).json({
        status: 'success',
        data: null,
    });
});
