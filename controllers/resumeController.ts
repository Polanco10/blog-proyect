import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
const Resume = require('../models/resumeModel');

type Lang = 'en' | 'es';

function pick<T>(obj: { en: T; es: T } | undefined, lang: Lang): T | undefined {
    return obj?.[lang];
}

exports.getResume = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const lang = req.params.lang as Lang;

    if (!['en', 'es'].includes(lang)) {
        return next(new AppError('Language must be "en" or "es"', 400));
    }

    const doc = await Resume.findOne({ singleton: 'default' });
    if (!doc) return next(new AppError('Resume not found. Run the seed script first.', 404));

    const sorted = [...(doc.experiences ?? [])].sort(
        (a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    const resume = {
        name:     doc.name,
        email:    doc.email,
        website:  doc.website,
        linkedin: doc.linkedin,
        github:   doc.github,
        title:    pick(doc.title, lang),
        location: pick(doc.location, lang),
        summary:  pick(doc.summary, lang),
        skills:   doc.skills,          // sin traducción
        education: (doc.education ?? []).map((edu: any) => ({
            institution: edu.institution,
            degree:      pick(edu.degree, lang),
            startDate:   edu.startDate,
            endDate:     edu.endDate,
        })),
        languages: (doc.languages ?? []).map((l: any) => ({
            language: pick(l.language, lang),
            level:    pick(l.level, lang),
        })),
        experiences: sorted.map((exp: any) => ({
            company:      exp.company,
            role:         pick(exp.role, lang),
            startDate:    exp.startDate,
            endDate:      exp.endDate,
            current:      exp.current,
            description:  pick(exp.description, lang),
            achievements: pick(exp.achievements, lang) ?? [],
        })),
    };

    res.status(200).json({ status: 'success', data: { resume } });
});

// PATCH /api/v1/resume — replace the singleton resume document (admin only)
exports.updateResume = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // findOneAndUpdate with upsert keeps the singleton pattern intact
    const doc = await Resume.findOneAndUpdate(
        { singleton: 'default' },
        { ...req.body, updatedAt: new Date() },
        { new: true, runValidators: true, upsert: true }
    );
    res.status(200).json({ status: 'success', data: { resume: doc } });
});
