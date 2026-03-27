const mongoose = require('mongoose');
// ─── Experience subdocument ───────────────────────────────────────────────────
const experienceSchema = new mongoose.Schema({
    company: {
        type: String,
        required: [true, 'An experience must have a company name'],
        trim: true,
        minlength: [2, 'Company name must be at least 2 characters'],
        maxlength: [100, 'Company name must be at most 100 characters'],
    },
    role: {
        en: { type: String, trim: true, required: [true, 'English role is required'], maxlength: 100 },
        es: { type: String, trim: true, required: [true, 'Spanish role is required'], maxlength: 100 },
    },
    startDate: {
        type: Date,
        required: [true, 'An experience must have a start date'],
    },
    endDate: { type: Date },
    current: { type: Boolean, default: false },
    description: {
        en: { type: String, trim: true, maxlength: 1000 },
        es: { type: String, trim: true, maxlength: 1000 },
    },
    achievements: {
        en: [{ type: String, trim: true }],
        es: [{ type: String, trim: true }],
    },
}, { _id: true });
// ─── Education subdocument ────────────────────────────────────────────────────
const educationSchema = new mongoose.Schema({
    institution: { type: String, trim: true },
    degree: {
        en: { type: String, trim: true },
        es: { type: String, trim: true },
    },
    startDate: { type: String },
    endDate: { type: String },
}, { _id: false });
// ─── Language subdocument ─────────────────────────────────────────────────────
const languageSchema = new mongoose.Schema({
    language: {
        en: { type: String, trim: true },
        es: { type: String, trim: true },
    },
    level: {
        en: { type: String, trim: true },
        es: { type: String, trim: true },
    },
}, { _id: false });
// ─── Root Resume schema (singleton) ──────────────────────────────────────────
const resumeSchema = new mongoose.Schema({
    singleton: { type: String, default: 'default', unique: true, select: false },
    // Language-agnostic contact fields
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    website: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    // Bilingual identity fields
    title: { en: { type: String, trim: true }, es: { type: String, trim: true } },
    location: { en: { type: String, trim: true }, es: { type: String, trim: true } },
    summary: { en: { type: String, trim: true }, es: { type: String, trim: true } },
    // Skills — no translation needed
    skills: {
        frontend: [String],
        backend: [String],
        tools: [String],
    },
    education: [educationSchema],
    languages: [languageSchema],
    experiences: [experienceSchema],
    updatedAt: { type: Date, default: Date.now },
}, {
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            delete ret._id;
            delete ret.id;
            delete ret.__v;
            delete ret.singleton;
            return ret;
        },
    },
    toObject: { virtuals: true },
});
const Resume = mongoose.model('Resume', resumeSchema);
module.exports = Resume;
