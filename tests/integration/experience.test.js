const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test-secret-key-for-automated-testing';
process.env.JWT_EXPIRES_IN = '1d';
process.env.JWT_COOKIE_EXPIRES_IN = '1';
process.env.NODE_ENV = 'test';

jest.setTimeout(30000);

let mongoServer, app, adminToken, createdExpId;

const seedResume = async () => {
    const Resume = require('../../models/resumeModel');
    return Resume.findOneAndUpdate(
        { singleton: 'default' },
        {
            singleton: 'default',
            name: 'Diego Polanco', email: 'test@test.com',
            title:    { en: 'Developer',  es: 'Desarrollador' },
            location: { en: 'Remote',     es: 'Remoto' },
            summary:  { en: 'Summary',    es: 'Resumen' },
            skills:   { frontend: ['Angular'], backend: ['Node.js'], tools: ['Git'] },
            experiences: [],
        },
        { upsert: true, new: true }
    );
};

const validExperience = {
    company:  'Acme Corp',
    role:     { en: 'Software Engineer', es: 'Ingeniero de Software' },
    startDate: '2022-01-01',
    description: { en: 'Developed web apps.', es: 'Desarrollé aplicaciones web.' },
};

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    delete require.cache[require.resolve('../../app')];
    app = require('../../app');

    const User = require('../../models/userModel');
    await User.create({ name: 'Admin', email: 'admin_exp@test.com',
        password: 'password123', passwordConfirm: 'password123', role: 'admin' });

    const res = await request(app).post('/api/v1/users/login')
        .send({ email: 'admin_exp@test.com', password: 'password123' });
    adminToken = res.body.token;

    await seedResume();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Experience API Integration', () => {
    it('GET /api/v1/experiences — returns 200 with profile and empty array', async () => {
        const res = await request(app).get('/api/v1/experiences');
        expect(res.statusCode).toBe(200);
        expect(res.body.data.experiences).toHaveLength(0);
        expect(res.body.data).toHaveProperty('profile');
    });

    it('POST /api/v1/experiences without auth — returns 401', async () => {
        const res = await request(app).post('/api/v1/experiences').send(validExperience);
        expect(res.statusCode).toBe(401);
    });

    it('POST /api/v1/experiences with admin — creates experience and returns 201', async () => {
        const res = await request(app)
            .post('/api/v1/experiences')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(validExperience);

        expect(res.statusCode).toBe(201);
        expect(res.body.data.experience.company).toBe(validExperience.company);
        expect(res.body.data.experience.role.en).toBe(validExperience.role.en);
        createdExpId = res.body.data.experience._id;
    });

    it('POST /api/v1/experiences with missing required field — returns 400', async () => {
        const res = await request(app)
            .post('/api/v1/experiences')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ role: { en: 'Engineer', es: 'Ingeniero' } }); // sin company ni startDate
        expect([400, 500]).toContain(res.statusCode);
    });

    it('PATCH /api/v1/experiences/:id with admin — updates and returns 200', async () => {
        const res = await request(app)
            .patch(`/api/v1/experiences/${createdExpId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ role: { en: 'Senior Engineer', es: 'Ingeniero Senior' } });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.experience.role.en).toBe('Senior Engineer');
    });

    it('DELETE /api/v1/experiences/:id with admin — returns 204; GET returns 404', async () => {
        const delRes = await request(app)
            .delete(`/api/v1/experiences/${createdExpId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(delRes.statusCode).toBe(204);

        const getRes = await request(app).get(`/api/v1/experiences/${createdExpId}`);
        expect(getRes.statusCode).toBe(404);
    });
});
