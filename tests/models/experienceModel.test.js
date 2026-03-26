const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Resume = require('../../models/resumeModel');

let mongoServer;

const baseProfile = {
    singleton: 'default',
    name: 'Diego Polanco',
    email: 'test@test.com',
    title:    { en: 'Developer', es: 'Desarrollador' },
    location: { en: 'Remote',   es: 'Remoto' },
    summary:  { en: 'Summary',  es: 'Resumen' },
    skills:   { frontend: ['Angular'], backend: ['Node.js'], tools: ['Git'] },
};

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Resume.deleteMany({});
});

describe('Experience (embedded in Resume)', () => {
    const validExp = {
        company:  'Google',
        role:     { en: 'Software Engineer', es: 'Ingeniero de Software' },
        startDate: new Date('2024-01-01'),
        description: { en: 'AI projects', es: 'Proyectos de IA' },
        achievements: {
            en: ['Scalable API', 'DB optimisation'],
            es: ['API escalable', 'Optimización de BD'],
        },
    };

    it('should embed a valid experience in the Resume document', async () => {
        const doc = await Resume.create({ ...baseProfile, experiences: [validExp] });
        expect(doc.experiences).toHaveLength(1);
        expect(doc.experiences[0].company).toBe('Google');
        expect(doc.experiences[0].role.en).toBe('Software Engineer');
        expect(doc.experiences[0].achievements.en).toHaveLength(2);
    });

    it('should fail without company name', async () => {
        const bad = { ...validExp, company: undefined };
        await expect(Resume.create({ ...baseProfile, experiences: [bad] }))
            .rejects.toThrow(/company name/);
    });

    it('should fail without role', async () => {
        const bad = { ...validExp, role: undefined };
        await expect(Resume.create({ ...baseProfile, experiences: [bad] }))
            .rejects.toThrow(/required/);
    });

    it('should fail without startDate', async () => {
        const bad = { ...validExp, startDate: undefined };
        await expect(Resume.create({ ...baseProfile, experiences: [bad] }))
            .rejects.toThrow(/start date/);
    });

    it('should allow experience without description or achievements', async () => {
        const minimal = {
            company:  'Twitter',
            role:     { en: 'Staff Engineer', es: 'Ingeniero Principal' },
            startDate: new Date('2023-01-01'),
        };
        const doc = await Resume.create({ ...baseProfile, experiences: [minimal] });
        expect(doc.experiences[0].achievements.en).toHaveLength(0);
    });

    it('should handle endDate', async () => {
        const endDate = new Date('2024-12-31');
        const doc = await Resume.create({ ...baseProfile, experiences: [{ ...validExp, endDate }] });
        expect(doc.experiences[0].endDate.toISOString()).toBe(endDate.toISOString());
    });
});
