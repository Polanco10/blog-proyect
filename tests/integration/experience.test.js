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
let adminToken;
let createdId;

const validExperience = {
  company: 'Acme Corp',
  role: 'Software Engineer',
  startDate: '2022-01-01',
  description: 'Developed and maintained web applications.',
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  delete require.cache[require.resolve('../../app')];
  app = require('../../app');

  const User = require('../../models/userModel');
  await User.create({
    name: 'Admin User',
    email: 'admin_exp@test.com',
    password: 'password123',
    passwordConfirm: 'password123',
    role: 'admin',
  });

  const res = await request(app)
    .post('/api/v1/users/login')
    .send({ email: 'admin_exp@test.com', password: 'password123' });
  adminToken = res.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Experience API Integration', () => {
  it('GET /api/v1/experiences — empty collection returns 200 with empty array', async () => {
    const res = await request(app).get('/api/v1/experiences');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.experiences).toHaveLength(0);
  });

  it('POST /api/v1/experiences without auth — returns 401', async () => {
    const res = await request(app).post('/api/v1/experiences').send(validExperience);
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/v1/experiences with admin token — creates experience and returns 201', async () => {
    const res = await request(app)
      .post('/api/v1/experiences')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validExperience);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.experience.company).toBe(validExperience.company);
    expect(res.body.data.experience.role).toBe(validExperience.role);

    // Experiences use MongoDB _id (no slug), but toJSON hides _id — use GET all to find id
    const listRes = await request(app).get('/api/v1/experiences');
    // The virtual 'id' field is deleted by toJSON transform, so use the raw model
    const Experience = require('../../models/experienceModel');
    const doc = await Experience.findOne({ company: validExperience.company });
    createdId = doc._id.toString();
  });

  it('POST /api/v1/experiences with missing required field — returns 400 or 500', async () => {
    const res = await request(app)
      .post('/api/v1/experiences')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'Engineer' }); // missing company and startDate

    // Mongoose validation error returns 400 (AppError wraps CastError/ValidationError)
    expect([400, 500]).toContain(res.statusCode);
  });

  it('PATCH /api/v1/experiences/:id with admin — updates and returns 200', async () => {
    const res = await request(app)
      .patch(`/api/v1/experiences/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'Senior Software Engineer' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.experience.role).toBe('Senior Software Engineer');
  });

  it('DELETE /api/v1/experiences/:id with admin — returns 204; subsequent GET returns 404', async () => {
    const delRes = await request(app)
      .delete(`/api/v1/experiences/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(delRes.statusCode).toBe(204);

    const getRes = await request(app).get(`/api/v1/experiences/${createdId}`);
    expect(getRes.statusCode).toBe(404);
  });
});
