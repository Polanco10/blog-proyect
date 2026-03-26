import validateFunction from './validate';
const { CATEGORIES } = require('../constants');

// Schemas de validación por recurso
exports.validateArticle = validateFunction({
    title: { required: true, type: 'string', minlength: 10, maxlength: 40 },
    description: { required: true, type: 'string', minlength: 10, maxlength: 500 },
    category: { required: true, type: 'string', enum: [CATEGORIES.PROGRAMACION, CATEGORIES.IDIOMA] },
});

// Para PATCH — sin required, solo valida los campos presentes
exports.validateArticlePatch = validateFunction({
    title: { type: 'string', minlength: 10, maxlength: 40 },
    description: { type: 'string', minlength: 10, maxlength: 500 },
    category: { type: 'string', enum: [CATEGORIES.PROGRAMACION, CATEGORIES.IDIOMA] },
});

exports.validateQuickTip = validateFunction({
    title: { required: true, type: 'string', minlength: 5 },
    language: { required: true, type: 'string', minlength: 1 },
    codeSnippet: { required: true, type: 'string', minlength: 1 },
    seniority: { type: 'string', enum: ['Junior', 'Semi-Senior', 'Senior'] },
});

// Para PATCH — sin required, solo valida los campos presentes
exports.validateQuickTipPatch = validateFunction({
    title: { type: 'string', minlength: 5 },
    language: { type: 'string', minlength: 1 },
    codeSnippet: { type: 'string', minlength: 1 },
    seniority: { type: 'string', enum: ['Junior', 'Semi-Senior', 'Senior'] },
});

exports.validateCheatsheet = validateFunction({
    title: { required: true, type: 'string', minlength: 3 },
    description: { required: true, type: 'string', minlength: 10 },
    fileUrl: { required: true, type: 'string', minlength: 5 },
});

// Para PATCH — sin required, solo valida los campos presentes
exports.validateCheatsheetPatch = validateFunction({
    title: { type: 'string', minlength: 3 },
    description: { type: 'string', minlength: 10 },
    fileUrl: { type: 'string', minlength: 5 },
});

exports.validateSignup = validateFunction({
    name: { required: true, type: 'string', minlength: 2, maxlength: 50 },
    email: { required: true, isEmail: true },
    password: { required: true, type: 'string', minlength: 8 },
    passwordConfirm: { required: true, type: 'string', minlength: 8 },
});

exports.validateExperience = validateFunction({
    company: { required: true, type: 'string', minlength: 2, maxlength: 100 },
    role: { required: true, type: 'string', minlength: 2, maxlength: 100 },
});

// Para PATCH — sin required, solo valida los campos presentes
exports.validateExperiencePatch = validateFunction({
    company: { type: 'string', minlength: 2, maxlength: 100 },
    role: { type: 'string', minlength: 2, maxlength: 100 },
});

exports.validateContact = validateFunction({
    name: { required: true, type: 'string', minlength: 2 },
    email: { required: true, isEmail: true },
    subject: { required: true, type: 'string', minlength: 3 },
    message: { required: true, type: 'string', minlength: 10 },
});

exports.validateComment = validateFunction({
    author: { required: true, type: 'string', minlength: 2, maxlength: 60 },
    email: { required: true, isEmail: true },
    body: { required: true, type: 'string', minlength: 3, maxlength: 2000 },
});
