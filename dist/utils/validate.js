"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const appError_1 = __importDefault(require("./appError"));
// Devuelve un middleware que valida req.body contra un schema de reglas
const validate = (schema) => (req, res, next) => {
    const errors = [];
    for (const [field, rules] of Object.entries(schema)) {
        const value = req.body[field];
        if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push(`${field} is required`);
            continue;
        }
        if (value === undefined || value === null || value === '')
            continue;
        if (rules.type === 'string') {
            if (typeof value !== 'string') {
                errors.push(`${field} must be a string`);
                continue;
            }
            const trimmed = value.trim();
            if (rules.minlength && trimmed.length < rules.minlength) {
                errors.push(`${field} must be at least ${rules.minlength} characters`);
            }
            if (rules.maxlength && trimmed.length > rules.maxlength) {
                errors.push(`${field} must be at most ${rules.maxlength} characters`);
            }
            if (rules.enum && !rules.enum.includes(trimmed)) {
                errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
            }
        }
        if (rules.type === 'number') {
            const num = Number(value);
            if (isNaN(num))
                errors.push(`${field} must be a number`);
            if (rules.min !== undefined && num < rules.min)
                errors.push(`${field} must be at least ${rules.min}`);
        }
        if (rules.isEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value))
                errors.push(`${field} must be a valid email address`);
        }
    }
    if (errors.length > 0) {
        return next(new appError_1.default(errors.join('. '), 400));
    }
    next();
};
exports.default = validate;
