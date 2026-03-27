/**
 * seed-resume.js
 * Crea o reemplaza el documento singleton Resume en la DB.
 *
 * Usage:
 *   node data/seed-resume.js          # upsert
 *   node data/seed-resume.js --reset  # borra y recrea el documento
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../config.env') });
const resumeData = require('./resume.json');
const Resume = require('../models/resumeModel');
const RESET = process.argv.includes('--reset');
const en = resumeData.en;
const es = resumeData.es;
const resumeSeed = {
    singleton: 'default',
    // Contact (language-agnostic)
    name: en.name,
    email: en.email,
    website: en.website,
    linkedin: en.linkedin,
    github: en.github,
    // Bilingual identity
    title: { en: en.title, es: es.title },
    location: { en: en.location, es: es.location },
    summary: { en: en.summary, es: es.summary },
    // Skills — no translation
    skills: {
        frontend: en.skills.frontend,
        backend: en.skills.backend,
        tools: en.skills.tools,
    },
    education: en.education.map((edu, i) => ({
        institution: edu.institution,
        degree: { en: edu.degree, es: es.education[i]?.degree ?? edu.degree },
        startDate: edu.startDate,
        endDate: edu.endDate,
    })),
    languages: en.languages.map((l, i) => ({
        language: { en: l.language, es: es.languages[i]?.language ?? l.language },
        level: { en: l.level, es: es.languages[i]?.level ?? l.level },
    })),
    // Experiences embedded in the document
    experiences: [
        {
            company: 'Freelance',
            role: { en: 'Full Stack Developer', es: 'Desarrollador Full Stack' },
            startDate: new Date('2022-01-01'),
            current: true,
            description: {
                en: 'Design and development of web applications for clients across multiple industries using Angular, Node.js, and MongoDB.',
                es: 'Diseño y desarrollo de aplicaciones web para clientes de múltiples industrias usando Angular, Node.js y MongoDB.',
            },
            achievements: {
                en: [
                    'Built a full-stack blog platform with JWT authentication and role-based access control',
                    'Implemented CI/CD pipelines with GitHub Actions and AWS deployments',
                    'Reduced API response times by 40% through query optimisation and caching strategies',
                ],
                es: [
                    'Desarrollé una plataforma de blog full-stack con autenticación JWT y control de acceso por roles',
                    'Implementé pipelines CI/CD con GitHub Actions y despliegues en AWS',
                    'Reduje los tiempos de respuesta de la API en un 40% mediante optimización de consultas y estrategias de caché',
                ],
            },
        },
    ],
    updatedAt: new Date(),
};
async function seed() {
    const DB = process.env.DATABASE_LOCAL || process.env.DATABASE;
    await mongoose.connect(DB);
    console.log('✅ Connected to MongoDB');
    if (RESET) {
        await Resume.deleteOne({ singleton: 'default' });
        console.log('🗑  Cleared resume document');
    }
    await Resume.findOneAndUpdate({ singleton: 'default' }, resumeSeed, { upsert: true, new: true, runValidators: true });
    console.log('✅ Resume document upserted');
    console.log(`   Profile: ${resumeSeed.name}`);
    console.log(`   Experiences: ${resumeSeed.experiences.length}`);
    console.log('\n🎉 Seed complete');
    await mongoose.disconnect();
}
seed().catch(err => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
