// Constantes centralizadas — reemplazar strings mágicos en todo el proyecto
exports.ROLES = Object.freeze({
    USER: 'user',
    ADMIN: 'admin',
});
exports.CATEGORIES = Object.freeze({
    PROGRAMACION: 'Programacion',
    IDIOMA: 'Idioma',
});
exports.ARTICLE_STATUS = Object.freeze({
    DRAFT: 'draft',
    PUBLISHED: 'published',
});
exports.COMMENT_STATUS = Object.freeze({
    PENDING: 'pending',
    APPROVED: 'approved',
});
