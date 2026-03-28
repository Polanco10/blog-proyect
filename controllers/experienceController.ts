import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
const Resume = require('../models/resumeModel');

// GET /api/v1/experiences — perfil + experiencias ordenadas por fecha
exports.getAllExperiences = catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const resume = await Resume.findOne({ singleton: 'default' }).select('-updatedAt');

    const experiences = resume
        ? [...(resume.experiences ?? [])].sort(
              (a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          )
        : [];

    res.status(200).json({
        status: 'success',
        results: experiences.length,
        data: {
            profile: resume
                ? {
                      name: resume.name,
                      email: resume.email,
                      website: resume.website,
                      linkedin: resume.linkedin,
                      github: resume.github,
                      title: resume.title,
                      location: resume.location,
                      summary: resume.summary,
                      skills: resume.skills,
                      education: resume.education,
                      languages: resume.languages,
                  }
                : null,
            experiences,
        },
    });
});

// GET /api/v1/experiences/:id — una sola experiencia embebida
exports.getExperience = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const resume = await Resume.findOne({ singleton: 'default' });
    const exp = resume?.experiences?.id(req.params.id);
    if (!exp) return next(new AppError('No experience found with that ID', 404));
    res.status(200).json({ status: 'success', data: { experience: exp } });
});

// POST /api/v1/experiences — agrega una experiencia al array embebido
exports.createExperience = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const resume = await Resume.findOneAndUpdate(
        { singleton: 'default' },
        { $push: { experiences: req.body } },
        { new: true, runValidators: true, upsert: false }
    );
    if (!resume) return next(new AppError('Resume profile not found. Run the seed script first.', 404));

    const created = resume.experiences[resume.experiences.length - 1];
    res.status(201).json({ status: 'success', data: { experience: created } });
});

// PATCH /api/v1/experiences/:id — actualiza campos de una experiencia embebida
exports.updateExperience = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const resume = await Resume.findOne({ singleton: 'default' });
    if (!resume) return next(new AppError('Resume profile not found.', 404));

    const exp = resume.experiences.id(req.params.id);
    if (!exp) return next(new AppError('No experience found with that ID', 404));

    Object.assign(exp, req.body);
    await resume.save();

    res.status(200).json({ status: 'success', data: { experience: exp } });
});

// DELETE /api/v1/experiences/:id — elimina una experiencia embebida
exports.deleteExperience = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const resume = await Resume.findOne({ singleton: 'default' });
    if (!resume) return next(new AppError('Resume profile not found.', 404));

    const exp = resume.experiences.id(req.params.id);
    if (!exp) return next(new AppError('No experience found with that ID', 404));

    exp.deleteOne();
    await resume.save();

    res.status(204).json({ status: 'success', data: null });
});
