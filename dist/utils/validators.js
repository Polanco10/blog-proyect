const validate = require('./validate');
const { CATEGORIES } = require('../constants');
// Schemas de validación por recurso
exports.validateArticle = validate({
    title: { required: true, type: 'string', minlength: 10, maxlength: 40 },
    description: { required: true, type: 'string', minlength: 10, maxlength: 500 },
    category: { required: true, type: 'string', enum: [CATEGORIES.PROGRAMACION, CATEGORIES.IDIOMA] },
});
// Para PATCH — sin required, solo valida los campos presentes
exports.validateArticlePatch = validate({
    title: { type: 'string', minlength: 10, maxlength: 40 },
    description: { type: 'string', minlength: 10, maxlength: 500 },
    category: { type: 'string', enum: [CATEGORIES.PROGRAMACION, CATEGORIES.IDIOMA] },
});
exports.validateQuickTip = validate({
    title: { required: true, type: 'string', minlength: 5 },
    language: { required: true, type: 'string', minlength: 1 },
    codeSnippet: { required: true, type: 'string', minlength: 1 },
    seniority: { type: 'string', enum: ['Junior', 'Semi-Senior', 'Senior'] },
});
exports.validateCheatsheet = validate({
    title: { required: true, type: 'string', minlength: 3 },
    description: { required: true, type: 'string', minlength: 10 },
    fileUrl: { required: true, type: 'string', minlength: 5 },
});
exports.validateContact = validate({
    name: { required: true, type: 'string', minlength: 2 },
    email: { required: true, isEmail: true },
    subject: { required: true, type: 'string', minlength: 3 },
    message: { required: true, type: 'string', minlength: 10 },
});
exports.validateComment = validate({
    author: { required: true, type: 'string', minlength: 2, maxlength: 60 },
    email: { required: true, isEmail: true },
    body: { required: true, type: 'string', minlength: 3, maxlength: 2000 },
});
