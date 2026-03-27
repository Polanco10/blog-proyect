"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validate_1 = __importDefault(require("./validate"));
const { CATEGORIES } = require('../constants');
// Schemas de validación por recurso
exports.validateArticle = (0, validate_1.default)({
    title: { required: true, type: 'string', minlength: 10, maxlength: 40 },
    description: { required: true, type: 'string', minlength: 10, maxlength: 500 },
    category: { required: true, type: 'string', enum: [CATEGORIES.PROGRAMACION, CATEGORIES.IDIOMA] },
});
// Para PATCH — sin required, solo valida los campos presentes
exports.validateArticlePatch = (0, validate_1.default)({
    title: { type: 'string', minlength: 10, maxlength: 40 },
    description: { type: 'string', minlength: 10, maxlength: 500 },
    category: { type: 'string', enum: [CATEGORIES.PROGRAMACION, CATEGORIES.IDIOMA] },
});
exports.validateQuickTip = (0, validate_1.default)({
    title: { required: true, type: 'string', minlength: 5 },
    language: { required: true, type: 'string', minlength: 1 },
    codeSnippet: { required: true, type: 'string', minlength: 1 },
    seniority: { type: 'string', enum: ['Junior', 'Semi-Senior', 'Senior'] },
});
// Para PATCH — sin required, solo valida los campos presentes
exports.validateQuickTipPatch = (0, validate_1.default)({
    title: { type: 'string', minlength: 5 },
    language: { type: 'string', minlength: 1 },
    codeSnippet: { type: 'string', minlength: 1 },
    seniority: { type: 'string', enum: ['Junior', 'Semi-Senior', 'Senior'] },
});
exports.validateCheatsheet = (0, validate_1.default)({
    title: { required: true, type: 'string', minlength: 3 },
    description: { required: true, type: 'string', minlength: 10 },
    fileUrl: { required: true, type: 'string', minlength: 5 },
});
// Para PATCH — sin required, solo valida los campos presentes
exports.validateCheatsheetPatch = (0, validate_1.default)({
    title: { type: 'string', minlength: 3 },
    description: { type: 'string', minlength: 10 },
    fileUrl: { type: 'string', minlength: 5 },
});
exports.validateSignup = (0, validate_1.default)({
    name: { required: true, type: 'string', minlength: 2, maxlength: 50 },
    email: { required: true, isEmail: true },
    password: { required: true, type: 'string', minlength: 8 },
    passwordConfirm: { required: true, type: 'string', minlength: 8 },
});
// Validación personalizada para Experience — role/description son objetos { en, es }
function validateI18nString(field, value, required, errors) {
    if (required && (!value || (!value.en && !value.es))) {
        errors.push(`${field}.en and ${field}.es are required`);
        return;
    }
    if (!value)
        return;
    if (value.en !== undefined && typeof value.en !== 'string')
        errors.push(`${field}.en must be a string`);
    if (value.es !== undefined && typeof value.es !== 'string')
        errors.push(`${field}.es must be a string`);
}
exports.validateExperience = (req, _res, next) => {
    const errors = [];
    const { company, role, startDate } = req.body;
    if (!company || typeof company !== 'string' || company.trim().length < 2)
        errors.push('company is required and must be at least 2 characters');
    validateI18nString('role', role, true, errors);
    if (!startDate)
        errors.push('startDate is required');
    if (errors.length > 0) {
        const AppErrorClass = require('./appError').default || require('./appError');
        return next(new AppErrorClass(errors.join('. '), 400));
    }
    next();
};
// PATCH — todos los campos son opcionales
exports.validateExperiencePatch = (req, _res, next) => {
    const errors = [];
    const { company, role } = req.body;
    if (company !== undefined && (typeof company !== 'string' || company.trim().length < 2))
        errors.push('company must be at least 2 characters');
    if (role !== undefined)
        validateI18nString('role', role, false, errors);
    if (errors.length > 0) {
        const AppErrorClass = require('./appError').default || require('./appError');
        return next(new AppErrorClass(errors.join('. '), 400));
    }
    next();
};
exports.validateContact = (0, validate_1.default)({
    name: { required: true, type: 'string', minlength: 2 },
    email: { required: true, isEmail: true },
    subject: { required: true, type: 'string', minlength: 3 },
    message: { required: true, type: 'string', minlength: 10 },
});
exports.validateComment = (0, validate_1.default)({
    author: { required: true, type: 'string', minlength: 2, maxlength: 60 },
    email: { required: true, isEmail: true },
    body: { required: true, type: 'string', minlength: 3, maxlength: 2000 },
});
