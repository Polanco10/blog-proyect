const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test-secret-key-for-automated-testing';
process.env.JWT_EXPIRES_IN = '1d';
process.env.JWT_COOKIE_EXPIRES_IN = '1';
process.env.NODE_ENV = 'test';

jest.setTimeout(30000);

let mongoServer, app;

const seedResume = async (extraExperiences = []) => {
    const Resume = require('../../models/resumeModel');
    await Resume.deleteMany({});
    return Resume.create({
        singleton: 'default',
        name: 'Diego Polanco',
        email: 'diego@test.com',
        website: 'polanco.dev',
        linkedin: 'linkedin.com/in/diego',
        github: 'github.com/diego',
        title: { en: 'Full Stack Developer', es: 'Desarrollador Full Stack' },
        location: { en: 'Latin America (Remote)', es: 'Latinoamérica (Remoto)' },
        summary: { en: 'Full Stack Developer.', es: 'Desarrollador Full Stack.' },
        education: [
            {
                institution: 'Universidad Placeholder',
                degree: { en: "Bachelor's in CS", es: 'Licenciatura en Computación' },
                startDate: '2018',
                endDate: '2022',
            },
        ],
        languages: [
            { language: { en: 'Spanish', es: 'Español' }, level: { en: 'Native', es: 'Nativo' } },
            { language: { en: 'English', es: 'Inglés' }, level: { en: 'Professional', es: 'Profesional' } },
        ],
        experiences: extraExperiences,
    });
};

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    delete require.cache[require.resolve('../../app')];
    app = require('../../app');
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await mongoose.connection.collections['resumes']?.deleteMany({});
});

describe('Resume Controller', () => {
    describe('GET /api/v1/resume/:lang', () => {
        it('should return English resume with per-experience skills', async () => {
            await seedResume([
                {
                    company: 'Test Corp',
                    role: { en: 'Developer', es: 'Desarrollador' },
                    startDate: new Date('2023-01-01'),
                    skills: { frontend: ['Angular', 'TypeScript'], backend: ['Node.js'], tools: ['Git'] },
                },
            ]);
            const res = await request(app).get('/api/v1/resume/en');
            expect(res.status).toBe(200);
            expect(res.body.data.resume.name).toBe('Diego Polanco');
            expect(res.body.data.resume.title).toBe('Full Stack Developer');
            expect(Array.isArray(res.body.data.resume.experiences[0].skills.frontend)).toBe(true);
            expect(res.body.data.resume.experiences[0].skills.frontend).toContain('Angular');
        });

        it('should return Spanish resume data', async () => {
            await seedResume();
            const res = await request(app).get('/api/v1/resume/es');
            expect(res.status).toBe(200);
            expect(res.body.data.resume.title).toBe('Desarrollador Full Stack');
            expect(res.body.data.resume.summary).toMatch(/Desarrollador/);
        });

        it('should return 400 for unsupported language', async () => {
            const res = await request(app).get('/api/v1/resume/fr');
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Language must be/);
        });

        it('should include embedded experiences', async () => {
            await seedResume([
                {
                    company: 'Test Corp',
                    role: { en: 'Developer', es: 'Desarrollador' },
                    startDate: new Date('2023-01-01'),
                    description: { en: 'Built things', es: 'Construí cosas' },
                },
            ]);
            const res = await request(app).get('/api/v1/resume/en');
            expect(res.status).toBe(200);
            expect(res.body.data.resume.experiences).toHaveLength(1);
            expect(res.body.data.resume.experiences[0].company).toBe('Test Corp');
            expect(res.body.data.resume.experiences[0].role).toBe('Developer');
        });

        it('should return empty experiences array when none exist', async () => {
            await seedResume();
            const res = await request(app).get('/api/v1/resume/en');
            expect(res.status).toBe(200);
            expect(res.body.data.resume.experiences).toHaveLength(0);
            expect(res.body.data.resume.education).toBeInstanceOf(Array);
            expect(res.body.data.resume.languages).toBeInstanceOf(Array);
        });
    });
});
