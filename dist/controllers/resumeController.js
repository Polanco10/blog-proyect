const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Experience = require('../models/experienceModel');
const resumeData = require('../data/resume.json');
exports.getResume = catchAsync(async (req, res, next) => {
    const lang = req.params.lang;
    if (!['en', 'es'].includes(lang)) {
        return next(new AppError('Language must be "en" or "es"', 400));
    }
    const profile = resumeData[lang];
    if (!profile) {
        return next(new AppError('Resume data not found for this language', 404));
    }
    const experiences = await Experience.find()
        .sort('-startDate')
        .select('-__v -createdAt');
    res.status(200).json({
        status: 'success',
        data: {
            resume: {
                ...profile,
                experiences,
            },
        },
    });
});
