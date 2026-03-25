const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test-secret-key-for-automated-testing';
process.env.JWT_EXPIRES_IN = '1d';
process.env.JWT_COOKIE_EXPIRES_IN = '1';
process.env.NODE_ENV = 'test';

jest.setTimeout(30000);

let mongoServer;
let app;

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
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

describe('Resume Controller', () => {
    describe('GET /api/v1/resume/:lang', () => {
        it('should return English resume data', async () => {
            const res = await request(app).get('/api/v1/resume/en');

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.resume).toBeDefined();
            expect(res.body.data.resume.name).toBe('Diego Polanco');
            expect(res.body.data.resume.title).toBe('Full Stack Developer');
            expect(res.body.data.resume.skills).toBeDefined();
            expect(res.body.data.resume.skills.frontend).toBeInstanceOf(Array);
        });

        it('should return Spanish resume data', async () => {
            const res = await request(app).get('/api/v1/resume/es');

            expect(res.status).toBe(200);
            expect(res.body.data.resume.name).toBe('Diego Polanco');
            expect(res.body.data.resume.title).toBe('Desarrollador Full Stack');
            expect(res.body.data.resume.summary).toMatch(/Desarrollador/);
        });

        it('should return 400 for unsupported language', async () => {
            const res = await request(app).get('/api/v1/resume/fr');

            expect(res.status).toBe(400);
            expect(res.body.status).toBe('fail');
            expect(res.body.message).toMatch(/Language must be/);
        });

        it('should include experiences from database', async () => {
            const Experience = require('../../models/experienceModel');
            await Experience.create({
                company: 'Test Corp',
                role: 'Developer',
                startDate: new Date('2023-01-01'),
                description: 'Built things',
            });

            const res = await request(app).get('/api/v1/resume/en');

            expect(res.status).toBe(200);
            expect(res.body.data.resume.experiences).toBeInstanceOf(Array);
            expect(res.body.data.resume.experiences.length).toBe(1);
            expect(res.body.data.resume.experiences[0].company).toBe('Test Corp');
        });

        it('should return resume with empty experiences when none exist', async () => {
            const res = await request(app).get('/api/v1/resume/en');

            expect(res.status).toBe(200);
            expect(res.body.data.resume.experiences).toBeInstanceOf(Array);
            expect(res.body.data.resume.experiences).toHaveLength(0);
            expect(res.body.data.resume.education).toBeInstanceOf(Array);
            expect(res.body.data.resume.languages).toBeInstanceOf(Array);
        });
    });
});
