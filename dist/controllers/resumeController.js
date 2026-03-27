"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
const Resume = require('../models/resumeModel');
function pick(obj, lang) {
    return obj?.[lang];
}
exports.getResume = (0, catchAsync_1.default)(async (req, res, next) => {
    const lang = req.params.lang;
    if (!['en', 'es'].includes(lang)) {
        return next(new appError_1.default('Language must be "en" or "es"', 400));
    }
    const doc = await Resume.findOne({ singleton: 'default' });
    if (!doc)
        return next(new appError_1.default('Resume not found. Run the seed script first.', 404));
    const sorted = [...(doc.experiences ?? [])].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    const resume = {
        name: doc.name,
        email: doc.email,
        website: doc.website,
        linkedin: doc.linkedin,
        github: doc.github,
        title: pick(doc.title, lang),
        location: pick(doc.location, lang),
        summary: pick(doc.summary, lang),
        skills: doc.skills, // sin traducción
        education: (doc.education ?? []).map((edu) => ({
            institution: edu.institution,
            degree: pick(edu.degree, lang),
            startDate: edu.startDate,
            endDate: edu.endDate,
        })),
        languages: (doc.languages ?? []).map((l) => ({
            language: pick(l.language, lang),
            level: pick(l.level, lang),
        })),
        experiences: sorted.map((exp) => ({
            company: exp.company,
            role: pick(exp.role, lang),
            startDate: exp.startDate,
            endDate: exp.endDate,
            current: exp.current,
            description: pick(exp.description, lang),
            achievements: pick(exp.achievements, lang) ?? [],
        })),
    };
    res.status(200).json({ status: 'success', data: { resume } });
});
